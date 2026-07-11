import type { RequestHandler } from 'express';
import { z } from 'zod';
import { leadService } from '../services/lead.service.js';
import { ApiResponse, HttpStatus } from '../utils/api-response.js';
import { sendValidationError } from '../utils/http-error.js';
import { createLeadSchema, leadIdParamsSchema, updateLeadSchema } from '../validators/lead.validator.js';

export const leadController = {
  getLeads: (async (_req, res, next) => {
    try {
      const leads = await leadService.getLeads();
      const response = ApiResponse({
        success: true,
        status: HttpStatus.OK,
        message: 'Leads fetched successfully.',
        data: leads
      });

      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      next(error);
    }
  }) satisfies RequestHandler,

  getLeadById: (async (req, res, next) => {
    try {
      const { id } = leadIdParamsSchema.parse(req.params);
      const lead = await leadService.getLeadById(id);
      const response = ApiResponse({
        success: true,
        status: HttpStatus.OK,
        message: 'Lead fetched successfully.',
        data: lead
      });

      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }

      next(error);
    }
  }) satisfies RequestHandler,

  createLead: (async (req, res, next) => {
    try {
      const payload = createLeadSchema.parse(req.body);
      const lead = await leadService.createLead(payload);
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
  }) satisfies RequestHandler,

  updateLeadById: (async (req, res, next) => {
    try {
      const { id } = leadIdParamsSchema.parse(req.params);
      const payload = updateLeadSchema.parse(req.body);
      const lead = await leadService.updateLeadById(id, payload);
      const response = ApiResponse({
        success: true,
        status: HttpStatus.OK,
        message: 'Lead updated successfully.',
        data: lead
      });

      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }

      next(error);
    }
  }) satisfies RequestHandler,

  deleteLeadById: (async (req, res, next) => {
    try {
      const { id } = leadIdParamsSchema.parse(req.params);
      const lead = await leadService.deleteLeadById(id);
      const response = ApiResponse({
        success: true,
        status: HttpStatus.OK,
        message: 'Lead deleted successfully.',
        data: lead
      });

      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }

      next(error);
    }
  }) satisfies RequestHandler
};
