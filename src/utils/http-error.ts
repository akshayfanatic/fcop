import type { Response } from 'express';
import { z } from 'zod';
import { ApiResponse, HttpStatus } from './api-response.js';

export type HttpError = Error & {
  statusCode: number;
  code: string;
};

export const createHttpError = (
  statusCode: number,
  message: string,
  code = 'REQUEST_ERROR'
): HttpError =>
  Object.assign(new Error(message), {
    statusCode,
    code
  });

export const sendValidationError = (res: Response, error: z.ZodError) => {
  res.status(HttpStatus.BAD_REQUEST).json(
    ApiResponse({
      success: false,
      status: HttpStatus.BAD_REQUEST,
      message: 'Invalid request payload.',
      error: {
        code: 'VALIDATION_ERROR',
        details: z.prettifyError(error)
      }
    })
  );
};
