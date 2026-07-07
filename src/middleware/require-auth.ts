import type { RequestHandler } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/auth/auth.js';
import { ApiResponse, HttpStatus } from '../utils/api-response.js';

export const requireAuth = (): RequestHandler => async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });

    if (!session) {
      res.status(HttpStatus.UNAUTHORIZED).json(
        ApiResponse({
          success: false,
          status: HttpStatus.UNAUTHORIZED,
          message: 'Authentication required.',
          error: {
            code: 'UNAUTHORIZED'
          }
        })
      );
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};
