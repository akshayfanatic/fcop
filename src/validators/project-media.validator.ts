import { z } from 'zod';
import { paginationQuerySchema } from '../utils/pagination.js';

export const projectMediaParamsSchema = z.object({
  projectId: z.string().trim().min(1)
});

export const projectMediaItemParamsSchema = projectMediaParamsSchema.extend({
  mediaId: z.string().trim().min(1)
});

export const projectMediaFiltersSchema = paginationQuerySchema;

export type ProjectMediaFiltersInput = z.infer<typeof projectMediaFiltersSchema>;
