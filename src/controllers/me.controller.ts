import type { RequestHandler } from 'express';
import { meService } from '../services/me.service.js';
import { ApiResponse, HttpStatus } from '../utils/api-response.js';

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
  }) satisfies RequestHandler
};
