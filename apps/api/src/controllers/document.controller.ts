import type { Request, Response } from 'express';
import { documentService } from '../services/document.service.js';
import { ok } from '@noteforge/shared';
import { ApiError } from '../utils/ApiError.js';
import { multerErrorHandler } from '../middleware/upload.middleware.js';
import { logger } from '../config/logger.js';

export const documentController = {
    async upload(req: Request, res: Response) {
        try {
            const file = req.file;
            const userId = req.user?.id?.toString();

            logger.info(
                {
                    requestId: req.requestId,
                    userId,
                    hasFile: !!file,
                    filename: file?.originalname,
                    size: file?.size,
                    mime: file?.mimetype,
                    body: req.body,
                },
                'Upload request received',
            );

            if (!userId) {
                throw ApiError.unauthorized('NO_USER', 'Authentication required');
            }

            if (!file) {
                throw ApiError.badRequest('NO_FILE', 'No file uploaded. Please select a document.');
            }

            const { document, jobId } = await documentService.createAndEnqueue({
                userId,
                originalName: file.originalname,
                mimeType: file.mimetype,
                buffer: file.buffer,
                summaryMode: req.body.summaryMode,
                targetLength: req.body.targetLength,
                targetLanguage: req.body.targetLanguage,
            });

            logger.info(
                { requestId: req.requestId, documentId: String(document._id), jobId },
                'Upload accepted',
            );

            res.status(202).json(
                ok(
                    {
                        document: {
                            id: String(document._id),
                            originalName: document.originalName,
                            extension: document.extension,
                            size: document.size,
                            status: document.status,
                            summaryMode: document.summaryMode,
                        },
                        jobId,
                    },
                    'Upload accepted. Processing will begin shortly.',
                ),
            );
        } catch (err) {
            logger.error(
                {
                    requestId: req.requestId,
                    err: (err as Error).message,
                    stack: (err as Error).stack?.split('\n').slice(0, 5).join('\n'),
                },
                'Upload failed',
            );
            throw multerErrorHandler(err);
        }
    },

    async list(req: Request, res: Response) {
        const q = req.query as any;
        const page = q.page ?? 1;
        const limit = q.limit ?? 20;
        const { items, total } = await documentService.list(req.user!.id.toString(), {
            limit,
            skip: (page - 1) * limit,
            search: q.search,
            status: q.status,
            extension: q.extension,
            favorite: q.favorite,
            sort: q.sort,
        });
        res.json(
            ok({
                items: items.map((d) => ({
                    id: String(d._id),
                    originalName: d.originalName,
                    extension: d.extension,
                    size: d.size,
                    status: d.status,
                    stage: d.processingStage,
                    progress: d.processingProgress,
                    isFavorite: d.isFavorite,
                    pageCount: d.pageCount,
                    wordCount: d.wordCount,
                    createdAt: d.createdAt,
                    errorCode: d.errorCode,
                })),
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            }),
        );
    },

    async get(req: Request, res: Response) {
        const doc = await documentService.getById(req.params.id!, req.user!.id.toString());
        res.json(ok({ document: doc }));
    },

    async status(req: Request, res: Response) {
        const status = await documentService.getStatus(req.params.id!, req.user!.id.toString());
        res.json(ok(status));
    },

    async events(req: Request, res: Response) {
        const userId = req.user!.id.toString();
        const documentId = req.params.id!;

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders?.();

        let closed = false;
        req.on('close', () => {
            closed = true;
        });

        const send = (data: unknown) => {
            if (closed) return;
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        let lastKey = '';
        const tick = async () => {
            if (closed) return;
            try {
                const s = await documentService.getStatus(documentId, userId);
                const key = `${s.status}|${s.progress}|${s.stage}`;
                if (key !== lastKey) {
                    lastKey = key;
                    send(s);
                }
                if (s.status === 'COMPLETED' || s.status === 'FAILED' || s.status === 'CANCELLED') {
                    send({ ...s, done: true });
                    closed = true;
                    res.end();
                    return;
                }
            } catch (err) {
                send({ error: (err as Error).message });
                closed = true;
                res.end();
                return;
            }
            setTimeout(tick, 1500);
        };
        void tick();
    },

    async toggleFavorite(req: Request, res: Response) {
        const doc = await documentService.toggleFavorite(req.params.id!, req.user!.id.toString());
        res.json(
            ok(
                { isFavorite: doc.isFavorite },
                doc.isFavorite ? 'Added to favorites' : 'Removed from favorites',
            ),
        );
    },

    async rename(req: Request, res: Response) {
        const doc = await documentService.rename(req.params.id!, req.user!.id.toString(), req.body.name);
        res.json(ok({ id: String(doc._id), originalName: doc.originalName }, 'Renamed'));
    },

    async remove(req: Request, res: Response) {
        await documentService.softDelete(req.params.id!, req.user!.id.toString());
        res.json(ok({}, 'Document deleted'));
    },
};