import type { RequestHandler } from 'express';
import { z } from 'zod';
import { serviceRequestService } from '../services/service-request.service.js';
import { ApiResponse, HttpStatus } from '../utils/api-response.js';
import { sendValidationError } from '../utils/http-error.js';
import { createServiceRequestSchema, serviceRequestFiltersSchema, serviceRequestIdParamsSchema, updateServiceRequestSchema } from '../validators/service-request.validator.js';

export const serviceRequestController = {
  createServiceRequest: (async (req, res, next) => {
    try {
      const payload = createServiceRequestSchema.parse(req.body);
      const request = await serviceRequestService.createServiceRequest(payload, req.headers);

      res.status(HttpStatus.CREATED).json(
        ApiResponse({
          success: true,
          status: HttpStatus.CREATED,
          message: 'Service request created successfully.',
          data: request
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

  getServiceRequests: (async (req, res, next) => {
    try {
      const filters = serviceRequestFiltersSchema.parse(req.query);
      const requests = await serviceRequestService.getServiceRequests(filters, req.headers);

      res.status(HttpStatus.OK).json(
        ApiResponse({
          success: true,
          status: HttpStatus.OK,
          message: 'Service requests fetched successfully.',
          data: requests
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

  getServiceRequestById: (async (req, res, next) => {
    try {
      const { id } = serviceRequestIdParamsSchema.parse(req.params);
      const request = await serviceRequestService.getServiceRequestById(id, req.headers);

      res.status(HttpStatus.OK).json(
        ApiResponse({
          success: true,
          status: HttpStatus.OK,
          message: 'Service request fetched successfully.',
          data: request
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

  updateServiceRequestById: (async (req, res, next) => {
    try {
      const { id } = serviceRequestIdParamsSchema.parse(req.params);
      const payload = updateServiceRequestSchema.parse(req.body);
      const request = await serviceRequestService.updateServiceRequestById(id, payload, req.headers);

      res.status(HttpStatus.OK).json(
        ApiResponse({
          success: true,
          status: HttpStatus.OK,
          message: 'Service request updated successfully.',
          data: request
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

  deleteServiceRequestById: (async (req, res, next) => {
    try {
      const { id } = serviceRequestIdParamsSchema.parse(req.params);
      const request = await serviceRequestService.deleteServiceRequestById(id, req.headers);

      res.status(HttpStatus.OK).json(
        ApiResponse({
          success: true,
          status: HttpStatus.OK,
          message: 'Service request deleted successfully.',
          data: request
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
