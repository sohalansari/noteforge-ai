import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export type AccessPayload = { sub: string; email: string; role: 'user' | 'admin' };

export function signAccessToken(payload: AccessPayload): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN as any });
}

export function signRefreshToken(userId: string, family: string): string {
    return jwt.sign({ sub: userId, family }, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
    });
}

export function verifyAccessToken(token: string): AccessPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
}

export function verifyRefreshToken(token: string): { sub: string; family: string } {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string; family: string };
}