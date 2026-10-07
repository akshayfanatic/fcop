import { Router } from 'express';
import { portfolioController } from '../controllers/portfolio.controller.js';
import { parsePortfolioCoverImageUpload } from '../middleware/image-upload.js';
import { requireOrgPermission } from '../middleware/require-org-permission.js';

export const portfolioRouter = Router();

portfolioRouter.get('/published', portfolioController.getPublishedPortfolios);
portfolioRouter.get('/published/:slug', portfolioController.getPublishedPortfolioBySlug);

portfolioRouter.post('/', requireOrgPermission({ portfolio: ['create'] }), portfolioController.createPortfolio);
portfolioRouter.get('/', requireOrgPermission({ portfolio: ['read'] }), portfolioController.getPortfolios);
portfolioRouter.get('/:id', requireOrgPermission({ portfolio: ['read'] }), portfolioController.getPortfolioById);
portfolioRouter.put('/:id/cover-image', requireOrgPermission({ portfolio: ['update'] }), parsePortfolioCoverImageUpload, portfolioController.updatePortfolioCoverImageById);
portfolioRouter.delete('/:id/cover-image', requireOrgPermission({ portfolio: ['update'] }), portfolioController.deletePortfolioCoverImageById);
portfolioRouter.put('/:id', requireOrgPermission({ portfolio: ['update'] }), portfolioController.updatePortfolioById);
portfolioRouter.post('/:id/addons', requireOrgPermission({ portfolio: ['update'] }), portfolioController.createPortfolioAddon);
portfolioRouter.get('/:id/addons/:addonId', requireOrgPermission({ portfolio: ['read'] }), portfolioController.getPortfolioAddon);
portfolioRouter.put('/:id/addons/:addonId', requireOrgPermission({ portfolio: ['update'] }), portfolioController.updatePortfolioAddon);
portfolioRouter.delete('/:id/addons/:addonId', requireOrgPermission({ portfolio: ['update'] }), portfolioController.deletePortfolioAddon);
portfolioRouter.delete('/:id', requireOrgPermission({ portfolio: ['delete'] }), portfolioController.deletePortfolioById);
