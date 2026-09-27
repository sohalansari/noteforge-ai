import { Router } from 'express';
import { chatController } from '../controllers/chat.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { IdParamSchema } from '../validators/document.validator.js';
import { AskDocumentSchema } from '../validators/chat.validator.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const chatRouter = Router();

chatRouter.use(requireAuth);
chatRouter.post(
    '/documents/:id/ask',
    validate({ params: IdParamSchema, body: AskDocumentSchema }),
    asyncHandler(chatController.askDocument),
);
