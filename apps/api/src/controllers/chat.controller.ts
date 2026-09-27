import type { Request, Response } from 'express';
import { ok } from '@noteforge/shared';
import { chatService } from '../services/chat.service.js';

export const chatController = {
    async askDocument(req: Request, res: Response) {
        const result = await chatService.askDocument(
            req.params.id!,
            req.user!.id.toString(),
            req.body.question,
        );
        res.json(ok(result));
    },
};
