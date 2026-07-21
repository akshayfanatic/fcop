import { z } from 'zod';
import { ProjectCurrency, ProjectStatus, ServiceInterest } from '../generated/prisma/client.js';

const optionalDateSchema = z.coerce.date().optional();
const optionalMoneySchema = z.coerce.number().nonnegative().optional();
const currencySchema = z.string().trim().toUpperCase().pipe(z.enum(ProjectCurrency)).optional();

export const projectIdParamsSchema = z.object({
  id: z.string().trim().min(1)
});

export const serviceRequestProjectParamsSchema = z.object({
  serviceRequestId: z.string().trim().min(1)
});

const createProjectBaseSchema = z.object({
  clientId: z.string().trim().min(1),
  serviceRequestId: z.string().trim().min(1).optional(),
  managerMemberId: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(10000).optional(),
  service: z.enum(ServiceInterest),
  status: z.enum(ProjectStatus).optional(),
  startDate: optionalDateSchema,
  endDate: optionalDateSchema,
  budgetAmount: optionalMoneySchema,
  currency: currencySchema
});

export const createProjectSchema = createProjectBaseSchema.refine((payload) => !payload.startDate || !payload.endDate || payload.endDate >= payload.startDate, {
  message: 'endDate must be after startDate.',
  path: ['endDate']
});

export const createProjectFromServiceRequestSchema = createProjectBaseSchema
  .omit({
    clientId: true,
    serviceRequestId: true,
    service: true
  })
  .partial({
    name: true
  })
  .refine((payload) => !payload.startDate || !payload.endDate || payload.endDate >= payload.startDate, {
    message: 'endDate must be after startDate.',
    path: ['endDate']
  });

export const updateProjectSchema = z
  .object({
    managerMemberId: z.string().trim().min(1).nullable().optional(),
    name: z.string().trim().min(1).max(255).optional(),
    description: z.string().trim().max(10000).nullable().optional(),
    status: z.enum(ProjectStatus).optional(),
    startDate: optionalDateSchema.nullable(),
    endDate: optionalDateSchema.nullable(),
    budgetAmount: optionalMoneySchema.nullable(),
    currency: currencySchema
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required.'
  })
  .refine((payload) => !payload.startDate || !payload.endDate || payload.endDate >= payload.startDate, {
    message: 'endDate must be after startDate.',
    path: ['endDate']
  });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateProjectFromServiceRequestInput = z.infer<typeof createProjectFromServiceRequestSchema>;
export type ProjectIdParamsInput = z.infer<typeof projectIdParamsSchema>;
export type ServiceRequestProjectParamsInput = z.infer<typeof serviceRequestProjectParamsSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
