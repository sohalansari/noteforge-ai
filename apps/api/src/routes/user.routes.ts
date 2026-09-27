import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { userController, UpdateMeSchema } from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

export const userRouter = Router();

userRouter.get('/me', requireAuth, asyncHandler(userController.me));
userRouter.patch('/me', requireAuth, validate({ body: UpdateMeSchema }), asyncHandler(userController.updateMe));