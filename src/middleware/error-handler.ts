import type { ErrorRequestHandler } from 'express';
import { env } from '../config/env.js';
import { ApiResponse, HttpStatus } from '../utils/api-response.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const statusCode =
    typeof err.statusCode === 'number' && err.statusCode >= 400
      ? err.statusCode
      : HttpStatus.INTERNAL_ERROR;

  res.status(statusCode).json(
    ApiResponse({
      success: false,
      status: statusCode,
      message: err.message ?? 'Internal server error',
      error: {
        code: statusCode === HttpStatus.INTERNAL_ERROR ? 'INTERNAL_ERROR' : 'REQUEST_ERROR',
        ...(env.nodeEnv === 'development' && { details: err.stack })
      }
    })
  );
};
