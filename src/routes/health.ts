import { Router } from 'express';
import { ApiResponse, HttpStatus } from '../utils/api-response.js';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.status(HttpStatus.OK).json(
    ApiResponse({
      success: true,
      status: HttpStatus.OK,
      message: 'Health check passed.',
      data: {
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    })
  );
});
