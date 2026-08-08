import type { RequestHandler } from 'express';
import { z } from 'zod';
import { paymentService } from '../services/payment.service.js';
import { ApiResponse, HttpStatus } from '../utils/api-response.js';
import { sendValidationError } from '../utils/http-error.js';
import { paymentFiltersSchema } from '../validators/payment.validator.js';

export const paymentController = {
  getPayments: (async (req, res, next) => {
    try {
      const filters = paymentFiltersSchema.parse(req.query);
      const payments = await paymentService.getPayments(filters, req.headers);

      res.status(HttpStatus.OK).json(
        ApiResponse({
          success: true,
          status: HttpStatus.OK,
          message: 'Payments fetched successfully.',
          data: payments
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
