import type { RequestHandler } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { auth } from '../lib/auth/auth.js';
import { ApiResponse, HttpStatus } from '../utils/api-response.js';
import { sendValidationError } from '../utils/http-error.js';
import { requestPasswordResetSchema } from '../validators/auth.validator.js';

export const authController = {
  requestPasswordReset: (async (req, res, next) => {
    try {
      const payload = requestPasswordResetSchema.parse(req.body);

      await auth.api.requestPasswordReset({
        body: {
          email: payload.email,
          redirectTo: payload.redirectTo ?? `${env.frontendUrl}/reset-password`
        }
      });

      res.status(HttpStatus.OK).json(
        ApiResponse({
          success: true,
          status: HttpStatus.OK,
          message: 'If an account exists for this email, a password reset link has been sent.'
        })
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }

      next(error);
    }
  }) satisfies RequestHandler
};
