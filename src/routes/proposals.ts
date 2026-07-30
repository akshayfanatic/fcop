import { Router } from 'express';
import { proposalController } from '../controllers/proposal.controller.js';
import { requireOrgPermission } from '../middleware/require-org-permission.js';

export const proposalRouter = Router({ mergeParams: true });

proposalRouter.post('/', requireOrgPermission({ proposal: ['create'] }), proposalController.createProposal);
proposalRouter.get('/', requireOrgPermission({ proposal: ['read'] }), proposalController.getProposal);
proposalRouter.patch('/', requireOrgPermission({ proposal: ['update'] }), proposalController.updateProposal);
proposalRouter.delete('/', requireOrgPermission({ proposal: ['delete'] }), proposalController.deleteProposal);
