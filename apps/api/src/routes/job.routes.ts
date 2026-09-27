import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { jobController } from '../controllers/job.controller.js';

export const jobRouter = Router();

jobRouter.use(requireAuth);
jobRouter.get('/:id', asyncHandler(jobController.get));
jobRouter.post('/:id/cancel', asyncHandler(jobController.cancel));