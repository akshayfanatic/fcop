import { Router } from 'express';
import { tagController } from '../controllers/tag.controller.js';
import { requireOrgPermission } from '../middleware/require-org-permission.js';

export const tagRouter = Router();

tagRouter.post('/', requireOrgPermission({ blog: ['create'] }), tagController.createTag);
tagRouter.get('/', requireOrgPermission({ blog: ['read'] }), tagController.getTags);
tagRouter.get('/:id', requireOrgPermission({ blog: ['read'] }), tagController.getTagById);
tagRouter.put('/:id', requireOrgPermission({ blog: ['update'] }), tagController.updateTagById);
tagRouter.delete('/:id', requireOrgPermission({ blog: ['delete'] }), tagController.deleteTagById);
