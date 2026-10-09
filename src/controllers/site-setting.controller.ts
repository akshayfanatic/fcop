import type { RequestHandler } from 'express';
import { z } from 'zod';
import { siteSettingService } from '../services/site-setting.service.js';
import { ApiResponse, HttpStatus } from '../utils/api-response.js';
import { sendValidationError } from '../utils/http-error.js';
import { updateSiteSettingSchema } from '../validators/site-setting.validator.js';

export const siteSettingController = {
  getSiteSetting: (async (_req, res, next) => {
    try {
      const setting = await siteSettingService.getSiteSetting();
      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Site settings fetched successfully.', data: setting }));
    } catch (error) {
      next(error);
    }
  }) satisfies RequestHandler,

  updateSiteSetting: (async (req, res, next) => {
    try {
      const payload = updateSiteSettingSchema.parse(req.body);
      const setting = await siteSettingService.updateSiteSetting(payload);
      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Site settings updated successfully.', data: setting }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }
      next(error);
    }
  }) satisfies RequestHandler
};
