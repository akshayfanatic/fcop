import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller.js';
import { requireOrgPermission } from '../middleware/require-org-permission.js';

export const paymentRouter = Router();

paymentRouter.get('/', requireOrgPermission({ payment: ['read'] }), paymentController.getPayments);
