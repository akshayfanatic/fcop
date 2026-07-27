import { Router } from 'express';
import { taskController } from '../controllers/task.controller.js';
import { requireOrgPermission } from '../middleware/require-org-permission.js';

export const projectTaskRouter = Router({ mergeParams: true });
export const taskRouter = Router();

projectTaskRouter.post('/', requireOrgPermission({ task: ['create'] }), taskController.createTask);
projectTaskRouter.get('/', requireOrgPermission({ task: ['read'] }), taskController.getProjectTasks);

taskRouter.put('/:taskId', requireOrgPermission({ task: ['update'] }), taskController.updateTaskById);
taskRouter.delete('/:taskId', requireOrgPermission({ task: ['delete'] }), taskController.deleteTaskById);
taskRouter.get('/', requireOrgPermission({ task: ['read'] }), taskController.getTasks);
