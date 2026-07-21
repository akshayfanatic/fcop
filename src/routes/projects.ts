import { Router } from 'express';
import { projectController } from '../controllers/project.controller.js';
import { requireOrgPermission } from '../middleware/require-org-permission.js';

export const projectRouter = Router();

projectRouter.post('/', requireOrgPermission({ project: ['create'] }), projectController.createProject);
projectRouter.get('/', requireOrgPermission({ project: ['read'] }), projectController.getProjects);
projectRouter.get('/:id', requireOrgPermission({ project: ['read'] }), projectController.getProjectById);
projectRouter.put('/:id', requireOrgPermission({ project: ['update'] }), projectController.updateProjectById);
projectRouter.delete('/:id', requireOrgPermission({ project: ['delete'] }), projectController.deleteProjectById);
