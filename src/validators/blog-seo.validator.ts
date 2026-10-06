import { z } from 'zod';

export const upsertBlogSeoSchema = z
  .object({
    metaTitle: z.string().trim().min(1).max(255),
    metaDescription: z.string().trim().min(1).max(1000)
  })
  .strict();

export type UpsertBlogSeoInput = z.infer<typeof upsertBlogSeoSchema>;
