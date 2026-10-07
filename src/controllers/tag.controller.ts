import type { RequestHandler } from 'express';
import { z } from 'zod';
import { tagService } from '../services/tag.service.js';
import { ApiResponse, HttpStatus } from '../utils/api-response.js';
import { sendValidationError } from '../utils/http-error.js';
import { createTagSchema, tagFiltersSchema, tagIdParamsSchema, updateTagSchema } from '../validators/tag.validator.js';

export const tagController = {
  createTag: (async (req, res, next) => {
    try {
      const payload = createTagSchema.parse(req.body);
      const tag = await tagService.createTag(payload);
      res.status(HttpStatus.CREATED).json(ApiResponse({ success: true, status: HttpStatus.CREATED, message: 'Tag created successfully.', data: tag }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }
      next(error);
    }
  }) satisfies RequestHandler,

  getTags: (async (req, res, next) => {
    try {
      const filters = tagFiltersSchema.parse(req.query);
      const tags = await tagService.getTags(filters);
      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Tags fetched successfully.', data: tags }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }
      next(error);
    }
  }) satisfies RequestHandler,

  getTagById: (async (req, res, next) => {
    try {
      const { id } = tagIdParamsSchema.parse(req.params);
      const tag = await tagService.getTagById(id);
      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Tag fetched successfully.', data: tag }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }
      next(error);
    }
  }) satisfies RequestHandler,

  updateTagById: (async (req, res, next) => {
    try {
      const { id } = tagIdParamsSchema.parse(req.params);
      const payload = updateTagSchema.parse(req.body);
      const tag = await tagService.updateTagById(id, payload);
      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Tag updated successfully.', data: tag }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }
      next(error);
    }
  }) satisfies RequestHandler,

  deleteTagById: (async (req, res, next) => {
    try {
      const { id } = tagIdParamsSchema.parse(req.params);
      const tag = await tagService.deleteTagById(id);
      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Tag deleted successfully.', data: tag }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }
      next(error);
    }
  }) satisfies RequestHandler
};
