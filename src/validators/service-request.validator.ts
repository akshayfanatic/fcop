import { z } from 'zod';
import { ServiceInterest, ServiceRequestStatus } from '../generated/prisma/client.js';

const requestDataSchema = z.record(z.string(), z.unknown()).optional().default({});

export const serviceRequestIdParamsSchema = z.object({
  id: z.string().trim().min(1)
});

export const createServiceRequestSchema = z.object({
  service: z.enum(ServiceInterest),
  data: requestDataSchema
});

export const updateServiceRequestSchema = z
  .object({
    status: z.enum(ServiceRequestStatus).optional(),
    data: requestDataSchema.optional()
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required.'
  });

export type CreateServiceRequestInput = z.infer<typeof createServiceRequestSchema>;
export type ServiceRequestIdParamsInput = z.infer<typeof serviceRequestIdParamsSchema>;
export type UpdateServiceRequestInput = z.infer<typeof updateServiceRequestSchema>;
