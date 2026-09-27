import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { usageController } from '../controllers/usage.controller.js';

export const usageRouter = Router();

usageRouter.use(requireAuth);
usageRouter.get('/', asyncHandler(usageController.get));