import { z } from 'zod';
import { paginationQuerySchema } from '../utils/pagination.js';

export const notificationListQuerySchema = paginationQuerySchema.extend({
  unreadOnly: z.stringbool().default(false)
});

export const notificationIdParamsSchema = z.object({
  notificationId: z.string().trim().min(1)
});

export type NotificationListQueryInput = z.infer<typeof notificationListQuerySchema>;
