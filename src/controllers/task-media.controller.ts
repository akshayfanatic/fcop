import type { RequestHandler } from 'express';
import { z } from 'zod';
import { taskMediaService } from '../services/task-media.service.js';
import { ApiResponse, HttpStatus } from '../utils/api-response.js';
import { sendValidationError } from '../utils/http-error.js';
import { taskMediaFiltersSchema, taskMediaItemParamsSchema, taskMediaParamsSchema } from '../validators/task-media.validator.js';

export const taskMediaController = {
  uploadTaskMedia: (async (req, res, next) => {
    try {
      const { taskId } = taskMediaParamsSchema.parse(req.params);
      const media = await taskMediaService.uploadTaskMedia(taskId, req.file, req.headers);

      res.status(HttpStatus.CREATED).json(ApiResponse({ success: true, status: HttpStatus.CREATED, message: 'Task attachment uploaded successfully.', data: media }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }
      next(error);
    }
  }) satisfies RequestHandler,

  getTaskMedia: (async (req, res, next) => {
    try {
      const { taskId } = taskMediaParamsSchema.parse(req.params);
      const filters = taskMediaFiltersSchema.parse(req.query);
      const media = await taskMediaService.getTaskMedia(taskId, filters, req.headers);

      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Task attachments fetched successfully.', data: media }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }
      next(error);
    }
  }) satisfies RequestHandler,

  deleteTaskMedia: (async (req, res, next) => {
    try {
      const { taskId, mediaId } = taskMediaItemParamsSchema.parse(req.params);
      const media = await taskMediaService.deleteTaskMedia(taskId, mediaId, req.headers);

      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Task attachment deleted successfully.', data: media }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }
      next(error);
    }
  }) satisfies RequestHandler
};
