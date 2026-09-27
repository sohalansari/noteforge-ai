import type { Request, Response } from 'express';
import { usageService } from '../services/usage.service.js';
import { ok } from '@noteforge/shared';

export const usageController = {
    async get(req: Request, res: Response) {
        const summary = await usageService.getSummary(req.user!.id.toString());
        res.json(ok(summary));
    },
};