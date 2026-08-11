import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';
import { requireOrgPermission } from '../middleware/require-org-permission.js';

export const notificationRouter = Router();

notificationRouter.get('/', requireOrgPermission({ notification: ['read'] }), notificationController.getNotifications);
notificationRouter.patch('/read-all', requireOrgPermission({ notification: ['update'] }), notificationController.markAllAsRead);
notificationRouter.patch('/:notificationId/read', requireOrgPermission({ notification: ['update'] }), notificationController.markAsRead);
