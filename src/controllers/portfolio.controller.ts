import type { RequestHandler } from 'express';
import { z } from 'zod';
import { portfolioService } from '../services/portfolio.service.js';
import { ApiResponse, HttpStatus } from '../utils/api-response.js';
import { createHttpError, sendValidationError } from '../utils/http-error.js';
import {
  createPortfolioSchema,
  portfolioFiltersSchema,
  portfolioIdParamsSchema,
  portfolioAddonSchema,
  portfolioAddonParamsSchema,
  portfolioSlugParamsSchema,
  publishedPortfolioFiltersSchema,
  updatePortfolioSchema
} from '../validators/portfolio.validator.js';

const handleError = (error: unknown, res: Parameters<RequestHandler>[1], next: Parameters<RequestHandler>[2]) => {
  if (error instanceof z.ZodError) sendValidationError(res, error);
  else next(error);
};

export const portfolioController = {
  getPublishedPortfolios: (async (req, res, next) => {
    try {
      const filters = publishedPortfolioFiltersSchema.parse(req.query);
      const portfolios = await portfolioService.getPublishedPortfolios(filters);
      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Portfolios fetched successfully.', data: portfolios }));
    } catch (error) {
      handleError(error, res, next);
    }
  }) satisfies RequestHandler,

  getPublishedPortfolioBySlug: (async (req, res, next) => {
    try {
      const { slug } = portfolioSlugParamsSchema.parse(req.params);
      const portfolio = await portfolioService.getPublishedPortfolioBySlug(slug);
      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Portfolio fetched successfully.', data: portfolio }));
    } catch (error) {
      handleError(error, res, next);
    }
  }) satisfies RequestHandler,

  getPortfolios: (async (req, res, next) => {
    try {
      const filters = portfolioFiltersSchema.parse(req.query);
      const portfolios = await portfolioService.getPortfolios(filters);
      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Portfolios fetched successfully.', data: portfolios }));
    } catch (error) {
      handleError(error, res, next);
    }
  }) satisfies RequestHandler,

  getPortfolioById: (async (req, res, next) => {
    try {
      const { id } = portfolioIdParamsSchema.parse(req.params);
      const portfolio = await portfolioService.getPortfolioById(id);
      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Portfolio fetched successfully.', data: portfolio }));
    } catch (error) {
      handleError(error, res, next);
    }
  }) satisfies RequestHandler,

  createPortfolio: (async (req, res, next) => {
    try {
      const payload = createPortfolioSchema.parse(req.body);
      const portfolio = await portfolioService.createPortfolio(payload);
      res.status(HttpStatus.CREATED).json(ApiResponse({ success: true, status: HttpStatus.CREATED, message: 'Portfolio created successfully.', data: portfolio }));
    } catch (error) {
      handleError(error, res, next);
    }
  }) satisfies RequestHandler,

  updatePortfolioById: (async (req, res, next) => {
    try {
      const { id } = portfolioIdParamsSchema.parse(req.params);
      const payload = updatePortfolioSchema.parse(req.body);
      const portfolio = await portfolioService.updatePortfolioById(id, payload);
      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Portfolio updated successfully.', data: portfolio }));
    } catch (error) {
      handleError(error, res, next);
    }
  }) satisfies RequestHandler,

  updatePortfolioCoverImageById: (async (req, res, next) => {
    try {
      const { id } = portfolioIdParamsSchema.parse(req.params);
      if (!req.file) throw createHttpError(HttpStatus.BAD_REQUEST, 'Cover image is required.', 'PORTFOLIO_IMAGE_REQUIRED');
      const portfolio = await portfolioService.updatePortfolioCoverImageById(id, req.file);
      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Portfolio cover image updated successfully.', data: portfolio }));
    } catch (error) {
      handleError(error, res, next);
    }
  }) satisfies RequestHandler,

  deletePortfolioCoverImageById: (async (req, res, next) => {
    try {
      const { id } = portfolioIdParamsSchema.parse(req.params);
      const portfolio = await portfolioService.deletePortfolioCoverImageById(id);
      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Portfolio cover image deleted successfully.', data: portfolio }));
    } catch (error) {
      handleError(error, res, next);
    }
  }) satisfies RequestHandler,

  createPortfolioAddon: (async (req, res, next) => {
    try {
      const { id } = portfolioIdParamsSchema.parse(req.params);
      const addon = portfolioAddonSchema.parse(req.body);
      const created = await portfolioService.createPortfolioAddon(id, addon);
      res.status(HttpStatus.CREATED).json(ApiResponse({ success: true, status: HttpStatus.CREATED, message: 'Portfolio add-on created successfully.', data: created }));
    } catch (error) {
      handleError(error, res, next);
    }
  }) satisfies RequestHandler,

  getPortfolioAddon: (async (req, res, next) => {
    try {
      const { id, addonId } = portfolioAddonParamsSchema.parse(req.params);
      const addon = await portfolioService.getPortfolioAddon(id, addonId);
      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Portfolio add-on fetched successfully.', data: addon }));
    } catch (error) {
      handleError(error, res, next);
    }
  }) satisfies RequestHandler,

  updatePortfolioAddon: (async (req, res, next) => {
    try {
      const { id, addonId } = portfolioAddonParamsSchema.parse(req.params);
      const addon = portfolioAddonSchema.parse(req.body);
      const updated = await portfolioService.updatePortfolioAddon(id, addonId, addon);
      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Portfolio add-on updated successfully.', data: updated }));
    } catch (error) {
      handleError(error, res, next);
    }
  }) satisfies RequestHandler,

  deletePortfolioAddon: (async (req, res, next) => {
    try {
      const { id, addonId } = portfolioAddonParamsSchema.parse(req.params);
      const deleted = await portfolioService.deletePortfolioAddon(id, addonId);
      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Portfolio add-on deleted successfully.', data: deleted }));
    } catch (error) {
      handleError(error, res, next);
    }
  }) satisfies RequestHandler,

  deletePortfolioById: (async (req, res, next) => {
    try {
      const { id } = portfolioIdParamsSchema.parse(req.params);
      const portfolio = await portfolioService.deletePortfolioById(id);
      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Portfolio deleted successfully.', data: portfolio }));
    } catch (error) {
      handleError(error, res, next);
    }
  }) satisfies RequestHandler
};
