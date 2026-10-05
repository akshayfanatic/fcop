import { z } from 'zod';
import { paginationQuerySchema } from '../utils/pagination.js';

export const createNewsletterSubscriptionSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(255),
    website: z.string().trim().max(255).optional().default('')
  })
  .strict();

export const newsletterSubscriptionFiltersSchema = paginationQuerySchema.extend({
  email: z.string().trim().toLowerCase().min(1).max(255).optional()
});

export type CreateNewsletterSubscriptionInput = z.infer<typeof createNewsletterSubscriptionSchema>;
export type NewsletterSubscriptionFiltersInput = z.infer<typeof newsletterSubscriptionFiltersSchema>;
