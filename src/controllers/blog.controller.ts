import type { RequestHandler } from 'express';
import { z } from 'zod';
import { blogService } from '../services/blog.service.js';
import { ApiResponse, HttpStatus } from '../utils/api-response.js';
import { sendValidationError } from '../utils/http-error.js';
import { blogFiltersSchema, blogIdParamsSchema, blogSlugParamsSchema, createBlogSchema, publishedBlogFiltersSchema, updateBlogSchema } from '../validators/blog.validator.js';

export const blogController = {
  createBlog: (async (req, res, next) => {
    try {
      const payload = createBlogSchema.parse(req.body);
      const blog = await blogService.createBlog(payload);

      res.status(HttpStatus.CREATED).json(ApiResponse({ success: true, status: HttpStatus.CREATED, message: 'Blog created successfully.', data: blog }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }
      next(error);
    }
  }) satisfies RequestHandler,

  getBlogs: (async (req, res, next) => {
    try {
      const filters = blogFiltersSchema.parse(req.query);
      const blogs = await blogService.getBlogs(filters);

      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Blogs fetched successfully.', data: blogs }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }
      next(error);
    }
  }) satisfies RequestHandler,

  getBlogById: (async (req, res, next) => {
    try {
      const { id } = blogIdParamsSchema.parse(req.params);
      const blog = await blogService.getBlogById(id);

      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Blog fetched successfully.', data: blog }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }
      next(error);
    }
  }) satisfies RequestHandler,

  updateBlogById: (async (req, res, next) => {
    try {
      const { id } = blogIdParamsSchema.parse(req.params);
      const payload = updateBlogSchema.parse(req.body);
      const blog = await blogService.updateBlogById(id, payload);

      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Blog updated successfully.', data: blog }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }
      next(error);
    }
  }) satisfies RequestHandler,

  deleteBlogById: (async (req, res, next) => {
    try {
      const { id } = blogIdParamsSchema.parse(req.params);
      const blog = await blogService.deleteBlogById(id);

      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Blog deleted successfully.', data: blog }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }
      next(error);
    }
  }) satisfies RequestHandler,

  getPublishedBlogs: (async (req, res, next) => {
    try {
      const filters = publishedBlogFiltersSchema.parse(req.query);
      const blogs = await blogService.getPublishedBlogs(filters);

      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Blogs fetched successfully.', data: blogs }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }
      next(error);
    }
  }) satisfies RequestHandler,

  getPublishedBlogBySlug: (async (req, res, next) => {
    try {
      const { slug } = blogSlugParamsSchema.parse(req.params);
      const blog = await blogService.getPublishedBlogBySlug(slug);

      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Blog fetched successfully.', data: blog }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }
      next(error);
    }
  }) satisfies RequestHandler
};
