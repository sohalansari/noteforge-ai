import type { Request, Response } from 'express';
import { UserModel } from '../models/User.model.js';
import { ok } from '@noteforge/shared';
import { ApiError } from '../utils/ApiError.js';
import { z } from 'zod';

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

export const UpdateMeSchema = z.object({
    name: z.string().min(1).max(80).optional(),
    avatar: z.string().url().nullable().optional(),
    preferences: z
        .object({
            theme: z.enum(['light', 'dark', 'system']).optional(),
            defaultSummaryMode: z.string().optional(),
            defaultLength: z.enum(['short', 'medium', 'detailed']).optional(),
            defaultLanguage: z.string().optional(),
            emailNotifications: z.boolean().optional(),
        })
        .optional(),
});

export const userController = {
    async me(req: Request, res: Response) {
        const user = await UserModel.findById(req.user!.id);
        if (!user) throw ApiError.notFound('USER_NOT_FOUND', 'User not found');
        res.json(ok({ user: publicUser(user) }));
    },

    async updateMe(req: Request, res: Response) {
        const user = await UserModel.findById(req.user!.id);
        if (!user) throw ApiError.notFound('USER_NOT_FOUND', 'User not found');

        if (req.body.name !== undefined) user.name = req.body.name;
        if (req.body.avatar !== undefined) user.avatar = req.body.avatar;
        if (req.body.preferences) {
            user.preferences = { ...(user.preferences as any), ...req.body.preferences };
        }
        await user.save();
        res.json(ok({ user: publicUser(user) }, 'Profile updated'));
    },
};