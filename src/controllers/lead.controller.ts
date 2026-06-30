import type { RequestHandler } from 'express';
import { z } from 'zod';
import { leadService } from '../services/lead.service.js';
import { ApiResponse, HttpStatus } from '../utils/api-response.js';
import { sendValidationError } from '../utils/http-error.js';
import { createPublicLeadSchema } from '../validators/lead.validator.js';

export const leadController = {
  createPublicLead: (async (req, res, next) => {
    try {
      const payload = createPublicLeadSchema.parse(req.body);
      const lead = await leadService.createPublicLead(payload);
      const response = ApiResponse({
        success: true,
        status: HttpStatus.CREATED,
        message: 'Lead captured successfully.',
        data: lead
      });

      res.status(HttpStatus.CREATED).json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }

      next(error);
    }
  }) satisfies RequestHandler
};
