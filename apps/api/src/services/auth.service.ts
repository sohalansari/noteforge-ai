import argon2 from 'argon2';
import crypto from 'node:crypto';
import { UserModel, type UserDoc } from '../models/User.model.js';
import { RefreshTokenModel } from '../models/RefreshToken.model.js';
import { PasswordResetTokenModel } from '../models/PasswordResetToken.model.js';
import { EmailVerificationTokenModel } from '../models/EmailVerificationToken.model.js';
import { ApiError } from '../utils/ApiError.js';
import { sha256 } from '../utils/tokens.js';
import {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
} from './token.service.js';
import { consoleEmail } from '../email/ConsoleEmailProvider.js';
import { env } from '../config/env.js';

const RESET_TTL_MS = 30 * 60 * 1000;
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

export class AuthService {
    async register(input: { name: string; email: string; password: string }): Promise<{
        user: UserDoc;
        accessToken: string;
        refreshToken: string;
    }> {
        const existing = await UserModel.findOne({ email: input.email.toLowerCase() });
        if (existing) throw ApiError.conflict('EMAIL_TAKEN', 'Email is already registered');

        const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
        const user = await UserModel.create({
            name: input.name,
            email: input.email.toLowerCase(),
            passwordHash,
        });

        await this.sendVerification(user);

        const tokens = await this.issueTokens(user, { userAgent: null, ip: null });
        return { user, ...tokens };
    }

    async login(
        input: { email: string; password: string },
        meta: { userAgent?: string | null; ip?: string | null },
    ): Promise<{ user: UserDoc; accessToken: string; refreshToken: string }> {
        const user = await UserModel.findOne({ email: input.email.toLowerCase(), isDeleted: false });
        if (!user) throw ApiError.unauthorized('INVALID_CREDENTIALS', 'Invalid email or password');

        const ok = await argon2.verify(user.passwordHash, input.password);
        if (!ok) throw ApiError.unauthorized('INVALID_CREDENTIALS', 'Invalid email or password');

        const tokens = await this.issueTokens(user, meta);
        return { user, ...tokens };
    }

    async refresh(
        rawRefresh: string,
        meta: { userAgent?: string | null; ip?: string | null },
    ): Promise<{ user: UserDoc; accessToken: string; refreshToken: string }> {
        let payload: { sub: string; family: string };
        try {
            payload = verifyRefreshToken(rawRefresh);
        } catch {
            throw ApiError.unauthorized('INVALID_REFRESH_TOKEN', 'Refresh token invalid or expired');
        }

        const hash = sha256(rawRefresh);
        const stored = await RefreshTokenModel.findOne({ tokenHash: hash });
        if (!stored || stored.revokedAt) {
            // Reuse detected → revoke whole family
            await RefreshTokenModel.updateMany({ family: payload.family }, { revokedAt: new Date() });
            throw ApiError.unauthorized('REFRESH_REUSE', 'Refresh token reuse detected');
        }

        const user = await UserModel.findById(payload.sub);
        if (!user || user.isDeleted) throw ApiError.unauthorized('USER_NOT_FOUND', 'User not found');

        // Rotate
        const newRaw = signRefreshToken(String(user._id), payload.family);
        stored.revokedAt = new Date();
        stored.replacedBy = sha256(newRaw);
        await stored.save();

        await RefreshTokenModel.create({
            userId: user._id,
            tokenHash: sha256(newRaw),
            family: payload.family,
            userAgent: meta.userAgent ?? null,
            ip: meta.ip ?? null,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        const accessToken = signAccessToken({
            sub: String(user._id),
            email: user.email,
            role: user.role as 'user' | 'admin',
        });
        return { user, accessToken, refreshToken: newRaw };
    }

    async logout(rawRefresh: string | undefined): Promise<void> {
        if (!rawRefresh) return;
        try {
            const payload = verifyRefreshToken(rawRefresh);
            await RefreshTokenModel.updateMany({ family: payload.family }, { revokedAt: new Date() });
        } catch {
            // already invalid — ignore
        }
    }

    async forgotPassword(email: string): Promise<void> {
        const user = await UserModel.findOne({ email: email.toLowerCase(), isDeleted: false });
        if (!user) return; // do not reveal

        const raw = crypto.randomBytes(32).toString('hex');
        await PasswordResetTokenModel.create({
            userId: user._id,
            tokenHash: sha256(raw),
            expiresAt: new Date(Date.now() + RESET_TTL_MS),
        });

        const link = `${env.CLIENT_URL}/reset-password/${raw}`;
        await consoleEmail.send(
            user.email,
            'Reset your NoteForge AI password',
            `Reset link (valid 30 min): ${link}`,
        );
    }

    async resetPassword(rawToken: string, newPassword: string): Promise<void> {
        const hash = sha256(rawToken);
        const token = await PasswordResetTokenModel.findOne({
            tokenHash: hash,
            usedAt: null,
            expiresAt: { $gt: new Date() },
        });
        if (!token) throw ApiError.badRequest('INVALID_TOKEN', 'Reset token invalid or expired');

        const user = await UserModel.findById(token.userId);
        if (!user) throw ApiError.badRequest('INVALID_TOKEN', 'Reset token invalid or expired');

        user.passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id });
        await user.save();

        token.usedAt = new Date();
        await token.save();

        // Revoke all sessions
        await RefreshTokenModel.updateMany({ userId: user._id }, { revokedAt: new Date() });
    }

    async verifyEmail(rawToken: string): Promise<void> {
        const hash = sha256(rawToken);
        const token = await EmailVerificationTokenModel.findOne({
            tokenHash: hash,
            usedAt: null,
            expiresAt: { $gt: new Date() },
        });
        if (!token) throw ApiError.badRequest('INVALID_TOKEN', 'Verification token invalid or expired');

        await UserModel.updateOne({ _id: token.userId }, { emailVerified: true });
        token.usedAt = new Date();
        await token.save();
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
        const user = await UserModel.findById(userId);
        if (!user) throw ApiError.notFound('USER_NOT_FOUND', 'User not found');

        const ok = await argon2.verify(user.passwordHash, currentPassword);
        if (!ok) throw ApiError.badRequest('INVALID_PASSWORD', 'Current password is incorrect');

        user.passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id });
        await user.save();

        await RefreshTokenModel.updateMany({ userId: user._id }, { revokedAt: new Date() });
    }

    async deleteAccount(userId: string): Promise<void> {
        await UserModel.updateOne(
            { _id: userId },
            { isDeleted: true, deletedAt: new Date() },
        );
        await RefreshTokenModel.updateMany({ userId }, { revokedAt: new Date() });
    }

    private async sendVerification(user: UserDoc): Promise<void> {
        const raw = crypto.randomBytes(32).toString('hex');
        await EmailVerificationTokenModel.create({
            userId: user._id,
            tokenHash: sha256(raw),
            expiresAt: new Date(Date.now() + VERIFY_TTL_MS),
        });
        const link = `${env.CLIENT_URL}/verify-email?token=${raw}`;
        await consoleEmail.send(user.email, 'Verify your NoteForge AI email', `Verification link: ${link}`);
    }

    private async issueTokens(
        user: UserDoc,
        meta: { userAgent?: string | null; ip?: string | null },
    ) {
        const family = crypto.randomBytes(16).toString('hex');
        const refreshToken = signRefreshToken(String(user._id), family);
        await RefreshTokenModel.create({
            userId: user._id,
            tokenHash: sha256(refreshToken),
            family,
            userAgent: meta.userAgent ?? null,
            ip: meta.ip ?? null,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        const accessToken = signAccessToken({
            sub: String(user._id),
            email: user.email,
            role: user.role as 'user' | 'admin',
        });
        return { accessToken, refreshToken };
    }
}

export const authService = new AuthService();