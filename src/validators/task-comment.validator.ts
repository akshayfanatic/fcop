import { z } from 'zod';
import { paginationQuerySchema } from '../utils/pagination.js';

const commentContentSchema = z.string().trim().min(1).max(5000);

export const taskCommentParamsSchema = z.object({
  taskId: z.string().trim().min(1)
});

export const taskCommentItemParamsSchema = taskCommentParamsSchema.extend({
  commentId: z.string().trim().min(1)
});

export const taskCommentListQuerySchema = paginationQuerySchema;

export const createTaskCommentSchema = z.object({
  content: commentContentSchema
});

export const updateTaskCommentSchema = z.object({
  content: commentContentSchema
});

export type TaskCommentListQueryInput = z.infer<typeof taskCommentListQuerySchema>;
export type CreateTaskCommentInput = z.infer<typeof createTaskCommentSchema>;
export type UpdateTaskCommentInput = z.infer<typeof updateTaskCommentSchema>;
