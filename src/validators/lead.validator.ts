import { z } from 'zod';
import { LeadStatus, ServiceInterest } from '../generated/prisma/client.js';
import { paginationQuerySchema } from '../utils/pagination.js';

const optionalText = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .optional()
  .transform((value) => value ?? null);

export const createLeadSchema = z.object({
  name: z.string().trim().min(2).max(255),
  email: z.string().trim().toLowerCase().email().max(255),
  companyName: optionalText,
  serviceInterest: z.enum(ServiceInterest),
  budgetRange: optionalText
});

export const leadIdParamsSchema = z.object({
  id: z.string().trim().min(1)
});

export const leadFiltersSchema = paginationQuerySchema.extend({
  email: z.string().trim().toLowerCase().min(1).max(255).optional(),
  status: z.enum(LeadStatus).optional(),
  serviceType: z.enum(ServiceInterest).optional()
});

export const updateLeadSchema = createLeadSchema
  .extend({
    status: z.enum(LeadStatus).optional()
  })
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required.'
  });

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type LeadFiltersInput = z.infer<typeof leadFiltersSchema>;
export type LeadIdParamsInput = z.infer<typeof leadIdParamsSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
