import { Router } from 'express';
import { newsletterController } from '../controllers/newsletter.controller.js';
import { createRateLimit } from '../middleware/rate-limit.js';
import { requireOrgPermission } from '../middleware/require-org-permission.js';

export const newsletterRouter = Router();

const newsletterSubmissionRateLimit = createRateLimit({
  maxRequests: 10,
  windowMs: 15 * 60 * 1000
});

newsletterRouter.post('/subscriptions', newsletterSubmissionRateLimit, newsletterController.createSubscription);
newsletterRouter.get('/subscriptions', requireOrgPermission({ newsletter: ['read'] }), newsletterController.getSubscriptions);
