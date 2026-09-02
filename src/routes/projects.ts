import { Router } from 'express';
import { projectMediaController } from '../controllers/project-media.controller.js';
import { projectController } from '../controllers/project.controller.js';
import { parseMediaUpload } from '../middleware/media-upload.js';
import { requireOrgPermission } from '../middleware/require-org-permission.js';
import { projectTaskRouter } from './tasks.js';

export const projectRouter = Router();

projectRouter.post('/', requireOrgPermission({ project: ['create'] }), projectController.createProject);
projectRouter.get('/', requireOrgPermission({ project: ['read'] }), projectController.getProjects);
projectRouter.get('/options', requireOrgPermission({ project: ['read'] }), projectController.getProjectOptions);
projectRouter.post('/:projectId/media', requireOrgPermission({ project: ['update'] }), parseMediaUpload, projectMediaController.uploadProjectMedia);
projectRouter.get('/:projectId/media', requireOrgPermission({ project: ['read'] }), projectMediaController.getProjectMedia);
projectRouter.delete('/:projectId/media/:mediaId', requireOrgPermission({ project: ['update'] }), projectMediaController.deleteProjectMedia);
projectRouter.get('/:id', requireOrgPermission({ project: ['read'] }), projectController.getProjectById);
projectRouter.use('/:projectId/tasks', projectTaskRouter); // Tasks belong to a specific project.
projectRouter.put('/:id', requireOrgPermission({ project: ['update'] }), projectController.updateProjectById);
projectRouter.delete('/:id', requireOrgPermission({ project: ['delete'] }), projectController.deleteProjectById);
