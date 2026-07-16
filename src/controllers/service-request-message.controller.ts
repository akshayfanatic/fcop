import type { RequestHandler } from 'express';
import { z } from 'zod';
import { serviceRequestMessageService } from '../services/service-request-message.service.js';
import { ApiResponse, HttpStatus } from '../utils/api-response.js';
import { sendValidationError } from '../utils/http-error.js';
import { createServiceRequestMessageSchema, serviceRequestMessageParamsSchema } from '../validators/service-request-message.validator.js';

export const serviceRequestMessageController = {
  createServiceRequestMessage: (async (req, res, next) => {
    try {
      const { serviceRequestId } = serviceRequestMessageParamsSchema.parse(req.params);
      const payload = createServiceRequestMessageSchema.parse(req.body);
      const message = await serviceRequestMessageService.createServiceRequestMessage(serviceRequestId, payload, req.headers);

      res.status(HttpStatus.CREATED).json(
        ApiResponse({
          success: true,
          status: HttpStatus.CREATED,
          message: 'Service request message created successfully.',
          data: message
        })
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }

      next(error);
    }
  }) satisfies RequestHandler,

  getServiceRequestMessages: (async (req, res, next) => {
    try {
      const { serviceRequestId } = serviceRequestMessageParamsSchema.parse(req.params);
      const messages = await serviceRequestMessageService.getServiceRequestMessages(serviceRequestId, req.headers);

      res.status(HttpStatus.OK).json(
        ApiResponse({
          success: true,
          status: HttpStatus.OK,
          message: 'Service request messages fetched successfully.',
          data: messages
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
