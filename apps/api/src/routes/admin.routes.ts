import { Router } from 'express';
import { z } from 'zod';
import { adminController } from '../controllers/admin.controller.js';
import { requireAdmin } from '../middleware/admin.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { PROCESSING_STAGES } from '../config/constants.js';
import { JOB_STATUSES } from '../models/ProcessingJob.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.middleware.js';

const ListSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(200).optional(),
    status: z.string().optional(),
});

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);
adminRouter.get('/overview', asyncHandler(adminController.overview));
adminRouter.get('/users', validate({ query: ListSchema.omit({ status: true }) }), asyncHandler(adminController.users));
adminRouter.get('/documents', validate({
    query: ListSchema.extend({ status: z.enum(PROCESSING_STAGES).optional() }),
}), asyncHandler(adminController.documents));
adminRouter.get('/jobs', validate({
    query: ListSchema.omit({ search: true }).extend({ status: z.enum(JOB_STATUSES).optional() }),
}), asyncHandler(adminController.jobs));
