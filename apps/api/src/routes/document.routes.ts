import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { uploadLimiter } from '../middleware/rateLimit.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { documentController } from '../controllers/document.controller.js';
import { notesController } from '../controllers/notes.controller.js';
import {
    IdParamSchema,
    ListDocumentsQuerySchema,
    RenameDocumentSchema,
    UploadDocumentSchema,
} from '../validators/document.validator.js';

export const documentRouter = Router();

documentRouter.use(requireAuth);

documentRouter.get(
    '/',
    validate({ query: ListDocumentsQuerySchema }),
    asyncHandler(documentController.list),
);

documentRouter.post(
    '/',
    uploadLimiter,
    upload.single('file'),
    validate({ body: UploadDocumentSchema }),
    asyncHandler(documentController.upload),
);

documentRouter.get('/:id', validate({ params: IdParamSchema }), asyncHandler(documentController.get));
documentRouter.get('/:id/status', validate({ params: IdParamSchema }), asyncHandler(documentController.status));
documentRouter.get('/:id/events', validate({ params: IdParamSchema }), asyncHandler(documentController.events));

// ⬅️ NEW — notes endpoint
documentRouter.get(
    '/:id/notes',
    validate({ params: IdParamSchema }),
    asyncHandler(notesController.getByDocument),
);

documentRouter.patch(
    '/:id/favorite',
    validate({ params: IdParamSchema }),
    asyncHandler(documentController.toggleFavorite),
);
documentRouter.patch(
    '/:id/rename',
    validate({ params: IdParamSchema, body: RenameDocumentSchema }),
    asyncHandler(documentController.rename),
);
documentRouter.delete('/:id', validate({ params: IdParamSchema }), asyncHandler(documentController.remove));