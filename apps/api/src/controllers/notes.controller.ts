import type { Request, Response } from 'express';
import { notesService } from '../services/notes.service.js';
import { SummaryModel } from '../models/Summary.model.js';
import { ok } from '@noteforge/shared';
import { Types } from 'mongoose';
import { ApiError } from '../utils/ApiError.js';

export const notesController = {
    async getByDocument(req: Request, res: Response) {
        const documentId = req.params.id!;
        const userId = req.user!.id.toString();

        const note = await notesService.getByDocument(documentId, userId);
        const summary = await SummaryModel.findOne({
            documentId: new Types.ObjectId(documentId),
            userId: new Types.ObjectId(userId),
        }).lean();

        res.json(ok({ note, summary }));
    },

    async toggleFavorite(req: Request, res: Response) {
        const isFavorite = await notesService.toggleFavorite(
            req.params.id!,
            req.user!.id.toString(),
        );
        res.json(
            ok(
                { isFavorite },
                isFavorite ? 'Added to favorites' : 'Removed from favorites',
            ),
        );
    },

    async list(req: Request, res: Response) {
        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 20);
        const { items, total } = await notesService.listByUser(req.user!.id.toString(), {
            limit,
            skip: (page - 1) * limit,
            favorite: req.query.favorite === 'true',
            mode: req.query.mode as string | undefined,
        });
        res.json(ok({ items, total, page, limit }));
    },
};