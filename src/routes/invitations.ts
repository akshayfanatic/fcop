import { Router } from 'express';
import { invitationController } from '../controllers/invitation.controller.js';
import { requireOrgPermission } from '../middleware/require-org-permission.js';

export const invitationRouter = Router();

invitationRouter.post('/', requireOrgPermission({ invitation: ['create'] }), invitationController.inviteMember);
