import type { RequestHandler } from 'express';
import { z } from 'zod';
import { newsletterService } from '../services/newsletter.service.js';
import { ApiResponse, HttpStatus } from '../utils/api-response.js';
import { sendValidationError } from '../utils/http-error.js';
import { createNewsletterSubscriptionSchema } from '../validators/newsletter.validator.js';

export const newsletterController = {
  createSubscription: (async (req, res, next) => {
    try {
      const payload = createNewsletterSubscriptionSchema.parse(req.body);
      const result = await newsletterService.createSubscription(payload);

      res.setHeader('Cache-Control', 'no-store');
      res.status(HttpStatus.CREATED).json(
        ApiResponse({
          success: true,
          status: HttpStatus.CREATED,
          message: 'Subscription received.',
          data: result
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
