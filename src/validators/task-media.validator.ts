import { z } from 'zod';
import { paginationQuerySchema } from '../utils/pagination.js';

export const taskMediaParamsSchema = z.object({
  taskId: z.string().trim().min(1)
});

export const taskMediaItemParamsSchema = taskMediaParamsSchema.extend({
  mediaId: z.string().trim().min(1)
});

export const taskMediaFiltersSchema = paginationQuerySchema;

export type TaskMediaFiltersInput = z.infer<typeof taskMediaFiltersSchema>;
