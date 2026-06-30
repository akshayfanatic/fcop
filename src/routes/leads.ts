import { Router } from 'express';
import { leadController } from '../controllers/lead.controller.js';
import { Role } from '../generated/prisma/client.js';
import { requireAuth } from '../middleware/require-auth.js';

export const leadRouter = Router();

leadRouter.post('/', leadController.createLead);

leadRouter.get('/', requireAuth(Role.ADMIN, Role.MANAGER), leadController.getLeads);
leadRouter.get('/:id', requireAuth(Role.ADMIN, Role.MANAGER), leadController.getLeadById);
leadRouter.put('/:id', requireAuth(Role.ADMIN, Role.MANAGER), leadController.updateLeadById);
leadRouter.delete('/:id', requireAuth(Role.ADMIN, Role.MANAGER), leadController.deleteLeadById);
