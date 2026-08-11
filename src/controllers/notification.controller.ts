import type { RequestHandler } from 'express';
import { z } from 'zod';
import { notificationService } from '../services/notification.service.js';
import { ApiResponse, HttpStatus } from '../utils/api-response.js';
import { sendValidationError } from '../utils/http-error.js';
import { notificationIdParamsSchema, notificationListQuerySchema } from '../validators/notification.validator.js';

export const notificationController = {
  getNotifications: (async (req, res, next) => {
    try {
      const query = notificationListQuerySchema.parse(req.query);
      const notifications = await notificationService.getNotifications(query, req.headers);

      res.status(HttpStatus.OK).json(
        ApiResponse({
          success: true,
          status: HttpStatus.OK,
          message: 'Notifications fetched successfully.',
          data: notifications
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

  markAsRead: (async (req, res, next) => {
    try {
      const { notificationId } = notificationIdParamsSchema.parse(req.params);
      const notification = await notificationService.markAsRead(notificationId, req.headers);

      res.status(HttpStatus.OK).json(
        ApiResponse({
          success: true,
          status: HttpStatus.OK,
          message: 'Notification marked as read.',
          data: notification
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

  markAllAsRead: (async (req, res, next) => {
    try {
      const result = await notificationService.markAllAsRead(req.headers);

      res.status(HttpStatus.OK).json(
        ApiResponse({
          success: true,
          status: HttpStatus.OK,
          message: 'All notifications marked as read.',
          data: result
        })
      );
    } catch (error) {
      next(error);
    }
  }) satisfies RequestHandler
};
