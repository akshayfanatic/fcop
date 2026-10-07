import type { RequestHandler } from 'express';
import { z } from 'zod';
import { categoryService } from '../services/category.service.js';
import { ApiResponse, HttpStatus } from '../utils/api-response.js';
import { sendValidationError } from '../utils/http-error.js';
import { categoryFiltersSchema, categoryIdParamsSchema, createCategorySchema, updateCategorySchema } from '../validators/category.validator.js';

export const categoryController = {
  createCategory: (async (req, res, next) => {
    try {
      const payload = createCategorySchema.parse(req.body);
      const category = await categoryService.createCategory(payload);
      res.status(HttpStatus.CREATED).json(ApiResponse({ success: true, status: HttpStatus.CREATED, message: 'Category created successfully.', data: category }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }
      next(error);
    }
  }) satisfies RequestHandler,

  getCategories: (async (req, res, next) => {
    try {
      const filters = categoryFiltersSchema.parse(req.query);
      const categories = await categoryService.getCategories(filters);
      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Categories fetched successfully.', data: categories }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }
      next(error);
    }
  }) satisfies RequestHandler,

  getCategoryOptions: (async (_req, res, next) => {
    try {
      const options = await categoryService.getCategoryOptions();
      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Category options fetched successfully.', data: options }));
    } catch (error) {
      next(error);
    }
  }) satisfies RequestHandler,

  getCategoryById: (async (req, res, next) => {
    try {
      const { id } = categoryIdParamsSchema.parse(req.params);
      const category = await categoryService.getCategoryById(id);
      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Category fetched successfully.', data: category }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }
      next(error);
    }
  }) satisfies RequestHandler,

  updateCategoryById: (async (req, res, next) => {
    try {
      const { id } = categoryIdParamsSchema.parse(req.params);
      const payload = updateCategorySchema.parse(req.body);
      const category = await categoryService.updateCategoryById(id, payload);
      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Category updated successfully.', data: category }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }
      next(error);
    }
  }) satisfies RequestHandler,

  deleteCategoryById: (async (req, res, next) => {
    try {
      const { id } = categoryIdParamsSchema.parse(req.params);
      const category = await categoryService.deleteCategoryById(id);
      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Category deleted successfully.', data: category }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }
      next(error);
    }
  }) satisfies RequestHandler
};
