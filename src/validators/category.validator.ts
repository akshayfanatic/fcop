import { z } from 'zod';
import { paginationQuerySchema } from '../utils/pagination.js';

export const createCategorySchema = z
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

export const updateCategorySchema = createCategorySchema.partial().refine((value) => Object.keys(value).length > 0, 'At least one field is required.');
export const categoryIdParamsSchema = z.object({ id: z.string().trim().min(1) });
export const categoryFiltersSchema = paginationQuerySchema;

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryFiltersInput = z.infer<typeof categoryFiltersSchema>;
