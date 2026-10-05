import { z } from 'zod';

export const createNewsletterSubscriptionSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(255),
    website: z.string().trim().max(255).optional().default('')
  })
  .strict();

export type CreateNewsletterSubscriptionInput = z.infer<typeof createNewsletterSubscriptionSchema>;
