import { z } from 'zod';
import { paginationQuerySchema } from '../utils/pagination.js';

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(191)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens.');

const tiptapDocumentSchema = z
  .record(z.string(), z.json())
  .refine((value) => value.type === 'doc' && (value.content === undefined || Array.isArray(value.content)), 'Content must be a Tiptap document.');

const taxonomyIdsSchema = z.array(z.string().trim().min(1)).max(100);

const blogSeoSchema = z
  .object({
    metaTitle: z.string().trim().min(1).max(255),
    metaDescription: z.string().trim().min(1).max(1000)
  })
  .strict();

export const createBlogSchema = z
  .object({
    title: z.string().trim().min(1).max(255),
    content: tiptapDocumentSchema,
    slug: slugSchema,
    featureImage: z.url().max(2048).nullable().optional(),
    excerpt: z.string().trim().max(1000).nullable().optional(),
    blogSeo: blogSeoSchema.optional(),
    isPublished: z.boolean().optional().default(false)
  })
  .strict();

export const updateBlogSchema = createBlogSchema
  .omit({ isPublished: true })
  .partial()
  .extend({ isPublished: z.boolean().optional(), blogSeo: blogSeoSchema.nullable().optional(), categoryIds: taxonomyIdsSchema.optional(), tagIds: taxonomyIdsSchema.optional() })
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required.');

export const blogIdParamsSchema = z.object({ id: z.string().trim().min(1) });
export const blogSlugParamsSchema = z.object({ slug: slugSchema });

export const publishedBlogFiltersSchema = paginationQuerySchema;
export const blogFiltersSchema = paginationQuerySchema.extend({
  isPublished: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional()
});

export type CreateBlogInput = z.infer<typeof createBlogSchema>;
export type UpdateBlogInput = z.infer<typeof updateBlogSchema>;
export type BlogFiltersInput = z.infer<typeof blogFiltersSchema>;
export type PublishedBlogFiltersInput = z.infer<typeof publishedBlogFiltersSchema>;
