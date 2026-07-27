import type { RequestHandler } from 'express';
import { z } from 'zod';
import { projectService } from '../services/project.service.js';
import { ApiResponse, HttpStatus } from '../utils/api-response.js';
import { sendValidationError } from '../utils/http-error.js';
import { createProjectFromServiceRequestSchema, createProjectSchema, projectIdParamsSchema, serviceRequestProjectParamsSchema, updateProjectSchema } from '../validators/project.validator.js';

export const projectController = {
  createProject: (async (req, res, next) => {
    try {
      const payload = createProjectSchema.parse(req.body);
      const project = await projectService.createProject(payload, req.headers);

      res.status(HttpStatus.CREATED).json(
        ApiResponse({
          success: true,
          status: HttpStatus.CREATED,
          message: 'Project created successfully.',
          data: project
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

  createProjectFromServiceRequest: (async (req, res, next) => {
    try {
      const { serviceRequestId } = serviceRequestProjectParamsSchema.parse(req.params);
      const payload = createProjectFromServiceRequestSchema.parse(req.body);
      const project = await projectService.createProjectFromServiceRequest(serviceRequestId, payload, req.headers);

      res.status(HttpStatus.CREATED).json(
        ApiResponse({
          success: true,
          status: HttpStatus.CREATED,
          message: 'Project created from service request successfully.',
          data: project
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

  getProjects: (async (req, res, next) => {
    try {
      const projects = await projectService.getProjects(req.headers);

      res.status(HttpStatus.OK).json(
        ApiResponse({
          success: true,
          status: HttpStatus.OK,
          message: 'Projects fetched successfully.',
          data: projects
        })
      );
    } catch (error) {
      next(error);
    }
  }) satisfies RequestHandler,

  getProjectById: (async (req, res, next) => {
    try {
      const { id } = projectIdParamsSchema.parse(req.params);
      const project = await projectService.getProjectById(id, req.headers);

      res.status(HttpStatus.OK).json(
        ApiResponse({
          success: true,
          status: HttpStatus.OK,
          message: 'Project fetched successfully.',
          data: project
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

  updateProjectById: (async (req, res, next) => {
    try {
      const { id } = projectIdParamsSchema.parse(req.params);
      const payload = updateProjectSchema.parse(req.body);
      const project = await projectService.updateProjectById(id, payload, req.headers);

      res.status(HttpStatus.OK).json(
        ApiResponse({
          success: true,
          status: HttpStatus.OK,
          message: 'Project updated successfully.',
          data: project
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

  deleteProjectById: (async (req, res, next) => {
    try {
      const { id } = projectIdParamsSchema.parse(req.params);
      const project = await projectService.deleteProjectById(id, req.headers);

      res.status(HttpStatus.OK).json(
        ApiResponse({
          success: true,
          status: HttpStatus.OK,
          message: 'Project deleted successfully.',
          data: project
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
