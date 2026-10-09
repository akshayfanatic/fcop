import { z } from 'zod';

const optionalText = (maxLength: number) => z.string().trim().min(1).max(maxLength).nullable().optional();
const optionalUrl = z
  .url()
  .max(2048)
  .refine((value) => /^https?:\/\//i.test(value), 'Use an HTTP(S) URL.')
  .nullable()
  .optional();

export const updateSiteSettingSchema = z
  .object({
    contactEmail: z.string().trim().toLowerCase().email().max(320),
    phone: optionalText(30),
    whatsapp: optionalText(30),
    address: optionalText(5000),
    businessHours: optionalText(2000),
    facebookUrl: optionalUrl,
    twitterUrl: optionalUrl,
    instagramUrl: optionalUrl,
    linkedinUrl: optionalUrl,
    githubUrl: optionalUrl
  })
  .strict();

export type UpdateSiteSettingInput = z.infer<typeof updateSiteSettingSchema>;
