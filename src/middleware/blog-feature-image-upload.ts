import type { RequestHandler } from 'express';
import multer from 'multer';
import { HttpStatus } from '../utils/api-response.js';
import { createHttpError } from '../utils/http-error.js';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!IMAGE_MIME_TYPES.has(file.mimetype)) {
      callback(createHttpError(HttpStatus.BAD_REQUEST, 'Feature image must be a JPG, PNG, or WebP file.', 'BLOG_IMAGE_TYPE_INVALID'));
      return;
    }
    callback(null, true);
  }
}).single('image');

export const parseBlogFeatureImageUpload: RequestHandler = (req, res, next) => {
  imageUpload(req, res, (error) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      next(createHttpError(HttpStatus.BAD_REQUEST, 'Feature image must not exceed 5 MB.', 'BLOG_IMAGE_TOO_LARGE'));
      return;
    }
    if (error) {
      next(error);
      return;
    }
    next();
  });
};
