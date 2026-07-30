import type { RequestHandler } from 'express';
import { stripeWebhookService } from '../services/stripe-webhook.service.js';
import { ApiResponse, HttpStatus } from '../utils/api-response.js';
import { createHttpError } from '../utils/http-error.js';

export const stripeWebhookController = {
  handleWebhook: ((req, res, next) => {
    try {
      const signature = req.header('stripe-signature');

      if (!signature) {
        throw createHttpError(HttpStatus.BAD_REQUEST, 'Stripe signature header is required.', 'STRIPE_SIGNATURE_REQUIRED');
      }

      if (!Buffer.isBuffer(req.body)) {
        throw createHttpError(HttpStatus.BAD_REQUEST, 'Stripe webhook body must be raw.', 'STRIPE_RAW_BODY_REQUIRED');
      }

      const eventId = stripeWebhookService.handleEvent(req.body, signature);

      res.status(HttpStatus.OK).json(
        ApiResponse({
          success: true,
          status: HttpStatus.OK,
          message: 'Stripe webhook received.',
          data: {
            eventId
          }
        })
      );
    } catch (error) {
      next(error);
    }
  }) satisfies RequestHandler
};
