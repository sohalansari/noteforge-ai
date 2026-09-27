import type { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { ok } from '@noteforge/shared';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';
const isProd = env.NODE_ENV === 'production';

function setAuthCookies(res: Response, access: string, refresh: string): void {
    res.cookie(ACCESS_COOKIE, access, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
    });
    res.cookie(REFRESH_COOKIE, refresh, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
}

function clearAuthCookies(res: Response): void {
    res.clearCookie(ACCESS_COOKIE);
    res.clearCookie(REFRESH_COOKIE);
}

function publicUser(u: any) {
    return {
        id: String(u._id),
        name: u.name,
        email: u.email,
        role: u.role,
        avatar: u.avatar,
        emailVerified: u.emailVerified,
        preferences: u.preferences,
        createdAt: u.createdAt,
    };
}

export const authController = {
    async register(req: Request, res: Response) {
        const { user, accessToken, refreshToken } = await authService.register(req.body);
        setAuthCookies(res, accessToken, refreshToken);
        res.status(201).json(ok({ user: publicUser(user), accessToken }, 'Account created'));
    },

    async login(req: Request, res: Response) {
        const { user, accessToken, refreshToken } = await authService.login(req.body, {
            userAgent: req.headers['user-agent'] ?? null,
            ip: req.ip ?? null,
        });
        setAuthCookies(res, accessToken, refreshToken);
        res.json(ok({ user: publicUser(user), accessToken }, 'Logged in'));
    },

    async refresh(req: Request, res: Response) {
        const raw = req.cookies?.[REFRESH_COOKIE];
        if (!raw) throw ApiError.unauthorized('NO_REFRESH_TOKEN', 'No refresh token');
        const { user, accessToken, refreshToken } = await authService.refresh(raw, {
            userAgent: req.headers['user-agent'] ?? null,
            ip: req.ip ?? null,
        });
        setAuthCookies(res, accessToken, refreshToken);
        res.json(ok({ user: publicUser(user), accessToken }, 'Refreshed'));
    },

    async logout(req: Request, res: Response) {
        await authService.logout(req.cookies?.[REFRESH_COOKIE]);
        clearAuthCookies(res);
        res.json(ok({}, 'Logged out'));
    },

    async forgotPassword(req: Request, res: Response) {
        await authService.forgotPassword(req.body.email);
        res.json(ok({}, 'If the email exists, a reset link was sent'));
    },

    async resetPassword(req: Request, res: Response) {
        await authService.resetPassword(req.body.token, req.body.password);
        res.json(ok({}, 'Password reset. Please log in.'));
    },

    async verifyEmail(req: Request, res: Response) {
        await authService.verifyEmail(req.body.token);
        res.json(ok({}, 'Email verified'));
    },

    async changePassword(req: Request, res: Response) {
        await authService.changePassword(req.user!.id.toString(), req.body.currentPassword, req.body.newPassword);
        clearAuthCookies(res);
        res.json(ok({}, 'Password changed. Please log in again.'));
    },

    async deleteAccount(req: Request, res: Response) {
        await authService.deleteAccount(req.user!.id.toString());
        clearAuthCookies(res);
        res.json(ok({}, 'Account scheduled for deletion'));
    },
};