import type { RequestHandler } from 'express';
import { z } from 'zod';
import { taskService } from '../services/task.service.js';
import { ApiResponse, HttpStatus } from '../utils/api-response.js';
import { sendValidationError } from '../utils/http-error.js';
import {
  addOnTaskParamsSchema,
  createAddOnTaskSchema,
  createTaskSchema,
  projectTaskParamsSchema,
  taskIdParamsSchema,
  taskMemberParamsSchema,
  updateAddOnTaskSchema,
  updateTaskSchema
} from '../validators/task.validator.js';

export const taskController = {
  getTasks: (async (req, res, next) => {
    try {
      const tasks = await taskService.getTasks(req.headers);

      res.status(HttpStatus.OK).json(
        ApiResponse({
          success: true,
          status: HttpStatus.OK,
          message: 'Tasks fetched successfully.',
          data: tasks
        })
      );
    } catch (error) {
      next(error);
    }
  }) satisfies RequestHandler,

  getTasksByMemberId: (async (req, res, next) => {
    try {
      const { memberId } = taskMemberParamsSchema.parse(req.params);
      const tasks = await taskService.getTasksByMemberId(memberId, req.headers);

      res.status(HttpStatus.OK).json(
        ApiResponse({
          success: true,
          status: HttpStatus.OK,
          message: 'Member tasks fetched successfully.',
          data: tasks
        })
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }

      next(error);
    }
  }) satisfies RequestHandler,

  getTaskStatsByMemberId: (async (req, res, next) => {
    try {
      const { memberId } = taskMemberParamsSchema.parse(req.params);
      const stats = await taskService.getTaskStatsByMemberId(memberId, req.headers);

      res.status(HttpStatus.OK).json(
        ApiResponse({
          success: true,
          status: HttpStatus.OK,
          message: 'Member task statistics fetched successfully.',
          data: stats
        })
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }

      next(error);
    }
  }) satisfies RequestHandler,

  createTask: (async (req, res, next) => {
    try {
      const { projectId } = projectTaskParamsSchema.parse(req.params);
      const payload = createTaskSchema.parse(req.body);
      const task = await taskService.createTask(projectId, payload, req.headers);

      res.status(HttpStatus.CREATED).json(
        ApiResponse({
          success: true,
          status: HttpStatus.CREATED,
          message: 'Task created successfully.',
          data: task
        })
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }

      next(error);
    }
  }) satisfies RequestHandler,

  getProjectTasks: (async (req, res, next) => {
    try {
      const { projectId } = projectTaskParamsSchema.parse(req.params);
      const tasks = await taskService.getProjectTasks(projectId, req.headers);

      res.status(HttpStatus.OK).json(
        ApiResponse({
          success: true,
          status: HttpStatus.OK,
          message: 'Tasks fetched successfully.',
          data: tasks
        })
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }

      next(error);
    }
  }) satisfies RequestHandler,

  updateTaskById: (async (req, res, next) => {
    try {
      const { taskId } = taskIdParamsSchema.parse(req.params);
      const payload = updateTaskSchema.parse(req.body);
      const task = await taskService.updateTaskById(taskId, payload, req.headers);

      res.status(HttpStatus.OK).json(
        ApiResponse({
          success: true,
          status: HttpStatus.OK,
          message: 'Task updated successfully.',
          data: task
        })
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }

      next(error);
    }
  }) satisfies RequestHandler,

  updateAddOnTaskById: (async (req, res, next) => {
    try {
      const { taskId, addOnTaskId } = addOnTaskParamsSchema.parse(req.params);
      const payload = updateAddOnTaskSchema.parse(req.body);
      const addOnTask = await taskService.updateAddOnTaskById(taskId, addOnTaskId, payload, req.headers);

      res.status(HttpStatus.OK).json(
        ApiResponse({
          success: true,
          status: HttpStatus.OK,
          message: 'Add-on task updated successfully.',
          data: addOnTask
        })
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }

      next(error);
    }
  }) satisfies RequestHandler,

  createAddOnTask: (async (req, res, next) => {
    try {
      const { taskId } = taskIdParamsSchema.parse(req.params);
      const payload = createAddOnTaskSchema.parse(req.body);
      const addOnTask = await taskService.createAddOnTask(taskId, payload, req.headers);

      res.status(HttpStatus.CREATED).json(
        ApiResponse({
          success: true,
          status: HttpStatus.CREATED,
          message: 'Add-on task created successfully.',
          data: addOnTask
        })
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }

      next(error);
    }
  }) satisfies RequestHandler,

  deleteAddOnTaskById: (async (req, res, next) => {
    try {
      const { taskId, addOnTaskId } = addOnTaskParamsSchema.parse(req.params);
      const addOnTask = await taskService.deleteAddOnTaskById(taskId, addOnTaskId, req.headers);

      res.status(HttpStatus.OK).json(
        ApiResponse({
          success: true,
          status: HttpStatus.OK,
          message: 'Add-on task deleted successfully.',
          data: addOnTask
        })
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }

      next(error);
    }
  }) satisfies RequestHandler,

  deleteTaskById: (async (req, res, next) => {
    try {
      const { taskId } = taskIdParamsSchema.parse(req.params);
      const task = await taskService.deleteTaskById(taskId, req.headers);

      res.status(HttpStatus.OK).json(
        ApiResponse({
          success: true,
          status: HttpStatus.OK,
          message: 'Task deleted successfully.',
          data: task
        })
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }

      next(error);
    }
  }) satisfies RequestHandler
};
