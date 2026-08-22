import { z } from 'zod';
import { TaskPriority, TaskStatus } from '../generated/prisma/client.js';

const optionalDateSchema = z.coerce.date().optional();
const optionalHoursSchema = z.coerce.number().nonnegative().max(9999.99).optional();
const assigneeIdsSchema = z.array(z.string().trim().min(1)).max(20);
const addOnTasksSchema = z.array(z.object({ name: z.string().trim().min(1).max(255) })).max(5);

export const projectTaskParamsSchema = z.object({
  projectId: z.string().trim().min(1)
});

export const taskIdParamsSchema = z.object({
  taskId: z.string().trim().min(1)
});

export const addOnTaskParamsSchema = taskIdParamsSchema.extend({
  addOnTaskId: z.string().trim().min(1)
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(10000).nullable().optional(),
  status: z.enum(TaskStatus).optional(),
  priority: z.enum(TaskPriority).optional(),
  dueDate: optionalDateSchema,
  estimatedHours: optionalHoursSchema,
  assigneeMemberIds: assigneeIdsSchema.optional().default([]),
  addOnTasks: addOnTasksSchema.optional().default([])
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    description: z.string().trim().max(10000).nullable().optional(),
    status: z.enum(TaskStatus).optional(),
    priority: z.enum(TaskPriority).optional(),
    dueDate: optionalDateSchema.nullable(),
    estimatedHours: optionalHoursSchema.nullable(),
    assigneeMemberIds: assigneeIdsSchema.optional()
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required.'
  });

export const updateAddOnTaskSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    isCompleted: z.boolean().optional()
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required.'
  });

export const createAddOnTaskSchema = z.object({
  name: z.string().trim().min(1).max(255)
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type ProjectTaskParamsInput = z.infer<typeof projectTaskParamsSchema>;
export type TaskIdParamsInput = z.infer<typeof taskIdParamsSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateAddOnTaskInput = z.infer<typeof updateAddOnTaskSchema>;
export type CreateAddOnTaskInput = z.infer<typeof createAddOnTaskSchema>;
