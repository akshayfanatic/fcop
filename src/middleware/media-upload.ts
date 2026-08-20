import type { RequestHandler } from 'express';
import multer from 'multer';
import { HttpStatus } from '../utils/api-response.js';
import { createHttpError } from '../utils/http-error.js';

const MAX_MEDIA_SIZE_BYTES = 5 * 1024 * 1024;
const MEDIA_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']);

const mediaUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_MEDIA_SIZE_BYTES,
    files: 1
  },
  fileFilter: (_req, file, callback) => {
    if (!MEDIA_MIME_TYPES.has(file.mimetype)) {
      callback(createHttpError(HttpStatus.BAD_REQUEST, 'Media must be a supported image or PDF file.', 'MEDIA_TYPE_INVALID'));
      return;
    }

    callback(null, true);
  }
}).single('media');

export const parseMediaUpload: RequestHandler = (req, res, next) => {
  mediaUpload(req, res, (error) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      next(createHttpError(HttpStatus.BAD_REQUEST, 'Media must not exceed 5 MB.', 'MEDIA_TOO_LARGE'));
      return;
    }

    if (error) {
      next(error);
      return;
    }

    next();
  });
};
