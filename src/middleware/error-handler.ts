import type { ErrorRequestHandler } from 'express';
import { Prisma } from '../generated/prisma/client.js';
import { env } from '../config/env.js';
import { ApiResponse, HttpStatus } from '../utils/api-response.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const statusCode = err.code === 'P2002' ? HttpStatus.CONFLICT : HttpStatus.INTERNAL_ERROR;

    res.status(statusCode).json(
      ApiResponse({
        success: false,
        status: statusCode,
        message: err.code === 'P2002' ? 'Resource already exists.' : 'Database operation failed.',
        error: {
          code: err.code === 'P2002' ? 'CONFLICT' : 'DATABASE_ERROR',
          ...(env.nodeEnv === 'development' && { details: err.message })
        }
      })
    );
    return;
  }

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
