import type { RequestHandler } from 'express';
import { z } from 'zod';
import { projectMediaService } from '../services/project-media.service.js';
import { ApiResponse, HttpStatus } from '../utils/api-response.js';
import { sendValidationError } from '../utils/http-error.js';
import { projectMediaFiltersSchema, projectMediaItemParamsSchema, projectMediaParamsSchema } from '../validators/project-media.validator.js';

export const projectMediaController = {
  uploadProjectMedia: (async (req, res, next) => {
    try {
      const { projectId } = projectMediaParamsSchema.parse(req.params);
      const media = await projectMediaService.uploadProjectMedia(projectId, req.file, req.headers);

      res.status(HttpStatus.CREATED).json(
        ApiResponse({
          success: true,
          status: HttpStatus.CREATED,
          message: 'Project media uploaded successfully.',
          data: media
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

  getProjectMedia: (async (req, res, next) => {
    try {
      const { projectId } = projectMediaParamsSchema.parse(req.params);
      const filters = projectMediaFiltersSchema.parse(req.query);
      const media = await projectMediaService.getProjectMedia(projectId, filters, req.headers);

      res.status(HttpStatus.OK).json(
        ApiResponse({
          success: true,
          status: HttpStatus.OK,
          message: 'Project media fetched successfully.',
          data: media
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

  deleteProjectMedia: (async (req, res, next) => {
    try {
      const { projectId, mediaId } = projectMediaItemParamsSchema.parse(req.params);
      const media = await projectMediaService.deleteProjectMedia(projectId, mediaId, req.headers);

      res.status(HttpStatus.OK).json(
        ApiResponse({
          success: true,
          status: HttpStatus.OK,
          message: 'Project media deleted successfully.',
          data: media
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
