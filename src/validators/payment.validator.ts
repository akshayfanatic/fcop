import { z } from 'zod';
import { ProposalPaymentStatus } from '../generated/prisma/client.js';
import { paginationQuerySchema } from '../utils/pagination.js';

export const paymentFiltersSchema = paginationQuerySchema.extend({
  status: z.enum(ProposalPaymentStatus).optional(),
  search: z.string().trim().min(1).max(255).optional()
});

export type PaymentFiltersInput = z.infer<typeof paymentFiltersSchema>;
