import { z } from 'zod';

export const serviceRequestMessageParamsSchema = z.object({
  serviceRequestId: z.string().trim().min(1)
});

export const createServiceRequestMessageSchema = z.object({
  body: z.string().trim().min(1).max(10_000),
  isInternal: z.boolean().optional().default(false)
});

export type CreateServiceRequestMessageInput = z.infer<typeof createServiceRequestMessageSchema>;
