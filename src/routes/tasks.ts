import { Router } from 'express';
import { taskController } from '../controllers/task.controller.js';
import { taskMediaController } from '../controllers/task-media.controller.js';
import { parseMediaUpload } from '../middleware/media-upload.js';
import { requireOrgPermission } from '../middleware/require-org-permission.js';

export const projectTaskRouter = Router({ mergeParams: true });
export const taskRouter = Router();

projectTaskRouter.post('/', requireOrgPermission({ task: ['create'] }), taskController.createTask);
projectTaskRouter.get('/', requireOrgPermission({ task: ['read'] }), taskController.getProjectTasks);

taskRouter.put('/:taskId', requireOrgPermission({ task: ['update'] }), taskController.updateTaskById);
taskRouter.delete('/:taskId', requireOrgPermission({ task: ['delete'] }), taskController.deleteTaskById);
taskRouter.post('/:taskId/media', requireOrgPermission({ task: ['update'] }), parseMediaUpload, taskMediaController.uploadTaskMedia);
taskRouter.get('/:taskId/media', requireOrgPermission({ task: ['read'] }), taskMediaController.getTaskMedia);
taskRouter.delete('/:taskId/media/:mediaId', requireOrgPermission({ task: ['update'] }), taskMediaController.deleteTaskMedia);
taskRouter.post('/:taskId/addon', requireOrgPermission({ task: ['create'] }), taskController.createAddOnTask);
taskRouter.put('/:taskId/addon/:addOnTaskId', requireOrgPermission({ task: ['update'] }), taskController.updateAddOnTaskById);
taskRouter.delete('/:taskId/addon/:addOnTaskId', requireOrgPermission({ task: ['delete'] }), taskController.deleteAddOnTaskById);
taskRouter.get('/', requireOrgPermission({ task: ['read'] }), taskController.getTasks);
