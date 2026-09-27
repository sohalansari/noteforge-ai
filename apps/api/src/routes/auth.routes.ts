import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authController } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';
import {
    ChangePasswordSchema,
    ForgotSchema,
    LoginSchema,
    RegisterSchema,
    ResetSchema,
    VerifyEmailSchema,
} from '../validators/auth.validator.js';

export const authRouter = Router();

authRouter.post('/register', authLimiter, validate({ body: RegisterSchema }), asyncHandler(authController.register));
authRouter.post('/login', authLimiter, validate({ body: LoginSchema }), asyncHandler(authController.login));
authRouter.post('/refresh', asyncHandler(authController.refresh));
authRouter.post('/logout', asyncHandler(authController.logout));
authRouter.post('/forgot-password', authLimiter, validate({ body: ForgotSchema }), asyncHandler(authController.forgotPassword));
authRouter.post('/reset-password', authLimiter, validate({ body: ResetSchema }), asyncHandler(authController.resetPassword));
authRouter.post('/verify-email', validate({ body: VerifyEmailSchema }), asyncHandler(authController.verifyEmail));
authRouter.post('/change-password', requireAuth, validate({ body: ChangePasswordSchema }), asyncHandler(authController.changePassword));
authRouter.delete('/account', requireAuth, asyncHandler(authController.deleteAccount));