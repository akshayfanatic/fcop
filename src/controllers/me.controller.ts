import type { RequestHandler } from 'express';
import { meService } from '../services/me.service.js';
import { ApiResponse, HttpStatus } from '../utils/api-response.js';
import { createHttpError } from '../utils/http-error.js';

export const meController = {
  getMe: (async (req, res, next) => {
    try {
      const me = await meService.getMe(req.headers);
      const response = ApiResponse({
        success: true,
        status: HttpStatus.OK,
        message: 'Current user fetched successfully.',
        data: me
      });

      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      next(error);
    }
  }) satisfies RequestHandler,

  updateAvatar: (async (req, res, next) => {
    try {
      if (!req.file) {
        throw createHttpError(HttpStatus.BAD_REQUEST, 'Profile image is required.', 'AVATAR_REQUIRED');
      }

      const user = await meService.updateAvatar(req.file, req.headers);
      const response = ApiResponse({
        success: true,
        status: HttpStatus.OK,
        message: 'Profile image updated successfully.',
        data: user
      });

      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      next(error);
    }
  }) satisfies RequestHandler,

  deleteAvatar: (async (req, res, next) => {
    try {
      const user = await meService.deleteAvatar(req.headers);
      const response = ApiResponse({
        success: true,
        status: HttpStatus.OK,
        message: 'Profile image deleted successfully.',
        data: user
      });

      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      next(error);
    }
  }) satisfies RequestHandler
};
