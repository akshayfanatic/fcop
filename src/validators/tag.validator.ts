import { z } from 'zod';
import { paginationQuerySchema } from '../utils/pagination.js';

export const createTagSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(191)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens.')
  })
  .strict();

export const updateTagSchema = createTagSchema.partial().refine((value) => Object.keys(value).length > 0, 'At least one field is required.');
export const tagIdParamsSchema = z.object({ id: z.string().trim().min(1) });
export const tagFiltersSchema = paginationQuerySchema;

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type TagFiltersInput = z.infer<typeof tagFiltersSchema>;
