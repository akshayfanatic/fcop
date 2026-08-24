import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller.js';
import { requireOrgPermission } from '../middleware/require-org-permission.js';

export const dashboardRouter = Router();

dashboardRouter.use(requireOrgPermission({ dashboard: ['read'] }));

dashboardRouter.get('/projects', requireOrgPermission({ project: ['read'] }), dashboardController.getCurrentProjects);
dashboardRouter.get('/overview', dashboardController.getOverview);
dashboardRouter.get('/payment-summary', dashboardController.getPaymentSummary);
// Lead totals belong to the lead workspace, so anyone allowed to read leads may view them.
dashboardRouter.get('/leads', requireOrgPermission({ lead: ['read'] }), dashboardController.getLeadDistribution);
dashboardRouter.get('/tasks', dashboardController.getTaskDistribution);
dashboardRouter.get('/recent/leads', dashboardController.getRecentLeads);
dashboardRouter.get('/attention/tasks', dashboardController.getAttentionTasks);
