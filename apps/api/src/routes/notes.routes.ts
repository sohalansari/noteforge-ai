import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { notesController } from '../controllers/notes.controller.js';

export const notesRouter = Router();

notesRouter.use(requireAuth);
notesRouter.get('/', asyncHandler(notesController.list));
notesRouter.patch('/:id/favorite', asyncHandler(notesController.toggleFavorite));