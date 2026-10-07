import type { RequestHandler } from 'express';
import multer from 'multer';
import { HttpStatus } from '../utils/api-response.js';
import { createHttpError } from '../utils/http-error.js';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function createImageUploadParser(label: string, errorCodePrefix: string): RequestHandler {
  const imageUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_IMAGE_SIZE_BYTES, files: 1 },
    fileFilter: (_req, file, callback) => {
      if (!IMAGE_MIME_TYPES.has(file.mimetype)) {
        callback(createHttpError(HttpStatus.BAD_REQUEST, `${label} must be a JPG, PNG, or WebP file.`, `${errorCodePrefix}_TYPE_INVALID`));
        return;
      }
      callback(null, true);
    }
  }).single('image');

  return (req, res, next) => {
    imageUpload(req, res, (error) => {
      if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        next(createHttpError(HttpStatus.BAD_REQUEST, `${label} must not exceed 5 MB.`, `${errorCodePrefix}_TOO_LARGE`));
        return;
      }
      if (error) {
        next(error);
        return;
      }
      next();
    });
  };
}

export const parseBlogFeatureImageUpload = createImageUploadParser('Feature image', 'BLOG_IMAGE');
export const parsePortfolioCoverImageUpload = createImageUploadParser('Cover image', 'PORTFOLIO_IMAGE');
export const parseAvatarUpload = createImageUploadParser('Profile image', 'AVATAR');
