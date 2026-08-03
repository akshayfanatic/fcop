import { z } from 'zod';
import { ProjectCurrency, ProposalStatus } from '../generated/prisma/client.js';

export const serviceRequestProposalParamsSchema = z.object({
  serviceRequestId: z.string().trim().min(1)
});

export const createProposalSchema = z.object({
  description: z.string().trim().min(1).max(10000),
  amount: z.coerce.number().positive(),
  currency: z.string().trim().toUpperCase().pipe(z.enum(ProjectCurrency))
});

export const updateProposalSchema = createProposalSchema
  .partial()
  .extend({
    status: z.enum(ProposalStatus).optional()
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required.'
  });

export type CreateProposalInput = z.infer<typeof createProposalSchema>;
export type UpdateProposalInput = z.infer<typeof updateProposalSchema>;
