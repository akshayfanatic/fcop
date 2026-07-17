import { Router } from 'express';
import { leadController } from '../controllers/lead.controller.js';
import { requireOrgPermission } from '../middleware/require-org-permission.js';

export const leadRouter = Router();

leadRouter.post('/', leadController.createLead);

leadRouter.get('/', requireOrgPermission({ lead: ['read'] }), leadController.getLeads);
leadRouter.get('/:id', requireOrgPermission({ lead: ['read'] }), leadController.getLeadById);
leadRouter.put('/:id', requireOrgPermission({ lead: ['update'] }), leadController.updateLeadById);
leadRouter.delete('/:id', requireOrgPermission({ lead: ['delete'] }), leadController.deleteLeadById);
