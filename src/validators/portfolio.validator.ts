import { z } from 'zod';
import { paginationQuerySchema } from '../utils/pagination.js';

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(191)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens.');
const textSchema = z.string().trim().min(1).max(255);
const optionalTextSchema = z.string().trim().max(255).nullable().optional();
const imageUrlSchema = z.url().max(2048).nullable().optional();
const labelsSchema = z.array(z.string().trim().min(1).max(100)).max(30);

const stepCardSchema = z.object({ title: textSchema, duration: z.string().trim().max(100), desc: z.string().trim().min(1).max(2000) }).strict();
const metricCardSchema = z.object({ label: textSchema, value: textSchema, caption: optionalTextSchema }).strict();

export const portfolioAddonSchema = z
  .object({
    type: z.enum(['CHALLENGE', 'APPROACH', 'DELIVERY', 'RESULTS']),
    title: textSchema,
    content: z.string().trim().max(10000).nullable().optional(),
    imageUrl: imageUrlSchema,
    cards: z.array(z.record(z.string(), z.json())).max(30).optional()
  })
  .strict()
  .superRefine((addon, context) => {
    const cardSchema = addon.type === 'DELIVERY' ? stepCardSchema : addon.type === 'RESULTS' ? metricCardSchema : null;
    if (cardSchema) {
      const cards = z
        .array(cardSchema)
        .max(30)
        .safeParse(addon.cards ?? []);
      if (!cards.success) context.addIssue({ code: 'custom', path: ['cards'], message: z.prettifyError(cards.error) });
    } else if (addon.cards?.length) {
      context.addIssue({ code: 'custom', path: ['cards'], message: 'Cards are only supported for Delivery and Results sections.' });
    }

    if (['CHALLENGE', 'APPROACH'].includes(addon.type) && !addon.content?.trim()) {
      context.addIssue({ code: 'custom', path: ['content'], message: 'Content is required for this section.' });
    }
  });

const portfolioFieldsSchema = z
  .object({
    slug: slugSchema,
    title: textSchema,
    description: z.string().trim().min(1).max(2000),
    overview: z.string().trim().max(10000).nullable().optional(),
    imageUrl: imageUrlSchema,
    client: optionalTextSchema,
    year: z
      .string()
      .regex(/^\d{4}$/)
      .nullable()
      .optional(),
    industry: z.string().trim().max(100).nullable().optional(),
    duration: z.string().trim().max(100).nullable().optional(),
    tags: labelsSchema,
    services: labelsSchema.optional(),
    tech: labelsSchema.optional(),
    isPublished: z.boolean(),
    isFeatured: z.boolean(),
    sortOrder: z.number().int().min(0),
    addons: z.array(portfolioAddonSchema).max(30)
  })
  .strict();

export const createPortfolioSchema = portfolioFieldsSchema.extend({
  tags: labelsSchema.default([]),
  services: labelsSchema.default([]),
  tech: labelsSchema.default([]),
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
  addons: z.array(portfolioAddonSchema).max(30).default([])
});

export const updatePortfolioSchema = portfolioFieldsSchema.partial().refine((value) => Object.keys(value).length > 0, 'At least one field is required.');
export const portfolioIdParamsSchema = z.object({ id: z.string().trim().min(1) });
export const portfolioAddonParamsSchema = portfolioIdParamsSchema.extend({ addonId: z.string().trim().min(1) });
export const portfolioSlugParamsSchema = z.object({ slug: slugSchema });
export const publishedPortfolioFiltersSchema = paginationQuerySchema;
export const portfolioFiltersSchema = paginationQuerySchema.extend({
  title: z.string().trim().min(1).max(255).optional(),
  isPublished: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional()
});

export type CreatePortfolioInput = z.infer<typeof createPortfolioSchema>;
export type UpdatePortfolioInput = z.infer<typeof updatePortfolioSchema>;
export type PortfolioSectionInput = z.infer<typeof portfolioAddonSchema>;
export type PortfolioFiltersInput = z.infer<typeof portfolioFiltersSchema>;
export type PublishedPortfolioFiltersInput = z.infer<typeof publishedPortfolioFiltersSchema>;
