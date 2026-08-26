import type { RequestHandler } from 'express';
import { z } from 'zod';
import { taskCommentService } from '../services/task-comment.service.js';
import { ApiResponse, HttpStatus } from '../utils/api-response.js';
import { sendValidationError } from '../utils/http-error.js';
import { createTaskCommentSchema, taskCommentItemParamsSchema, taskCommentListQuerySchema, taskCommentParamsSchema, updateTaskCommentSchema } from '../validators/task-comment.validator.js';

export const taskCommentController = {
  createTaskComment: (async (req, res, next) => {
    try {
      const { taskId } = taskCommentParamsSchema.parse(req.params);
      const payload = createTaskCommentSchema.parse(req.body);
      const comment = await taskCommentService.createTaskComment(taskId, payload, req.headers);

      res.status(HttpStatus.CREATED).json(ApiResponse({ success: true, status: HttpStatus.CREATED, message: 'Task comment created successfully.', data: comment }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }

      next(error);
    }
  }) satisfies RequestHandler,

  getTaskComments: (async (req, res, next) => {
    try {
      const { taskId } = taskCommentParamsSchema.parse(req.params);
      const query = taskCommentListQuerySchema.parse(req.query);
      const comments = await taskCommentService.getTaskComments(taskId, query, req.headers);

      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Task comments fetched successfully.', data: comments }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }

      next(error);
    }
  }) satisfies RequestHandler,

  updateTaskComment: (async (req, res, next) => {
    try {
      const { taskId, commentId } = taskCommentItemParamsSchema.parse(req.params);
      const payload = updateTaskCommentSchema.parse(req.body);
      const comment = await taskCommentService.updateTaskComment(taskId, commentId, payload, req.headers);

      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Task comment updated successfully.', data: comment }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }

      next(error);
    }
  }) satisfies RequestHandler,

  deleteTaskComment: (async (req, res, next) => {
    try {
      const { taskId, commentId } = taskCommentItemParamsSchema.parse(req.params);
      const comment = await taskCommentService.deleteTaskComment(taskId, commentId, req.headers);

      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Task comment deleted successfully.', data: comment }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }

      next(error);
    }
  }) satisfies RequestHandler
};
