import multer from 'multer';
import { env } from '../config/env.js';
import { ALLOWED_EXTENSIONS } from '../config/constants.js';
import { getExtension } from '../utils/sanitizeFilename.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';

const maxBytes = env.MAX_FILE_SIZE_MB * 1024 * 1024;

export const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: maxBytes,
        files: 1,
        fields: 10,
    },
    fileFilter: (_req, file, cb) => {
        const ext = getExtension(file.originalname);
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            logger.warn(
                { filename: file.originalname, ext, mimetype: file.mimetype },
                'Rejected: unsupported file extension',
            );
            return cb(
                ApiError.unsupported(
                    'UNSUPPORTED_FILE_TYPE',
                    `File type ".${ext || 'unknown'}" is not supported. Supported: ${ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(', ')}`,
                ) as any,
            );
        }
        cb(null, true);
    },
});

export function multerErrorHandler(err: unknown): ApiError {
    if (err instanceof multer.MulterError) {
        logger.warn({ code: err.code, field: err.field, message: err.message }, 'Multer error');
        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                return ApiError.tooLarge(
                    'FILE_TOO_LARGE',
                    `File is too large. Maximum size is ${env.MAX_FILE_SIZE_MB} MB.`,
                );
            case 'LIMIT_FILE_COUNT':
                return ApiError.badRequest('TOO_MANY_FILES', 'Only one file can be uploaded at a time.');
            case 'LIMIT_UNEXPECTED_FILE':
                return ApiError.badRequest(
                    'UNEXPECTED_FIELD',
                    `Unexpected file field "${err.field}". Use "file" as the field name.`,
                );
            case 'LIMIT_PART_COUNT':
            case 'LIMIT_FIELD_COUNT':
            case 'LIMIT_FIELD_KEY':
            case 'LIMIT_FIELD_VALUE':
                return ApiError.badRequest('UPLOAD_LIMIT', 'Upload payload exceeds limits.');
            default:
                return ApiError.badRequest('UPLOAD_ERROR', err.message || 'Upload error');
        }
    }
    if (err instanceof ApiError) return err;
    if (err instanceof Error) {
        logger.error({ err: err.message, stack: err.stack?.split('\n').slice(0, 3) }, 'Upload unknown error');
        return ApiError.internal('UPLOAD_FAILED', err.message || 'Upload failed');
    }
    return ApiError.internal('UPLOAD_FAILED', 'Upload failed');
}