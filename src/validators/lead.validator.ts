import { z } from 'zod';
import { ServiceInterest } from '../generated/prisma/client.js';

const optionalText = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .optional()
  .transform((value) => value ?? null);

export const createPublicLeadSchema = z.object({
  name: z.string().trim().min(2).max(255),
  email: z.string().trim().toLowerCase().email().max(255),
  companyName: optionalText,
  serviceInterest: z.enum(ServiceInterest),
  budgetRange: optionalText
});

export type CreatePublicLeadInput = z.infer<typeof createPublicLeadSchema>;
