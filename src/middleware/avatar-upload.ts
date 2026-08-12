import type { RequestHandler } from 'express';
import multer from 'multer';
import { HttpStatus } from '../utils/api-response.js';
import { createHttpError } from '../utils/http-error.js';

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
const AVATAR_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_AVATAR_SIZE_BYTES,
    files: 1
  },
  fileFilter: (_req, file, callback) => {
    if (!AVATAR_MIME_TYPES.has(file.mimetype)) {
      callback(createHttpError(HttpStatus.BAD_REQUEST, 'Profile image must be a JPG, PNG, or WebP file.', 'AVATAR_TYPE_INVALID'));
      return;
    }

    callback(null, true);
  }
}).single('image');

export const parseAvatarUpload: RequestHandler = (req, res, next) => {
  avatarUpload(req, res, (error) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      next(createHttpError(HttpStatus.BAD_REQUEST, 'Profile image must not exceed 5 MB.', 'AVATAR_TOO_LARGE'));
      return;
    }

    if (error) {
      next(error);
      return;
    }

    next();
  });
};
