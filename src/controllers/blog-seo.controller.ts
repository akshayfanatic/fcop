import type { RequestHandler } from 'express';
import { z } from 'zod';
import { blogSeoService } from '../services/blog-seo.service.js';
import { ApiResponse, HttpStatus } from '../utils/api-response.js';
import { sendValidationError } from '../utils/http-error.js';
import { upsertBlogSeoSchema } from '../validators/blog-seo.validator.js';
import { blogIdParamsSchema } from '../validators/blog.validator.js';

export const blogSeoController = {
  getBlogSeoByBlogId: (async (req, res, next) => {
    try {
      const { id } = blogIdParamsSchema.parse(req.params);
      const blogSeo = await blogSeoService.getBlogSeoByBlogId(id);

      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Blog SEO fetched successfully.', data: blogSeo }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }
      next(error);
    }
  }) satisfies RequestHandler,

  upsertBlogSeoByBlogId: (async (req, res, next) => {
    try {
      const { id } = blogIdParamsSchema.parse(req.params);
      const payload = upsertBlogSeoSchema.parse(req.body);
      const blogSeo = await blogSeoService.upsertBlogSeoByBlogId(id, payload);

      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Blog SEO saved successfully.', data: blogSeo }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }
      next(error);
    }
  }) satisfies RequestHandler,

  deleteBlogSeoByBlogId: (async (req, res, next) => {
    try {
      const { id } = blogIdParamsSchema.parse(req.params);
      const blogSeo = await blogSeoService.deleteBlogSeoByBlogId(id);

      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Blog SEO deleted successfully.', data: blogSeo }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }
      next(error);
    }
  }) satisfies RequestHandler
};
