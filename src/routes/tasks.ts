import { Router } from 'express';
import { taskController } from '../controllers/task.controller.js';
import { taskCommentController } from '../controllers/task-comment.controller.js';
import { taskMediaController } from '../controllers/task-media.controller.js';
import { parseMediaUpload } from '../middleware/media-upload.js';
import { requireOrgPermission } from '../middleware/require-org-permission.js';

export const projectTaskRouter = Router({ mergeParams: true });
export const taskRouter = Router();

/* Project task routes */
projectTaskRouter.post('/', requireOrgPermission({ task: ['create'] }), taskController.createTask);
projectTaskRouter.get('/', requireOrgPermission({ task: ['read'] }), taskController.getProjectTasks);

/* Visible task collection routes */
taskRouter.get('/', requireOrgPermission({ task: ['read'] }), taskController.getTasks);

/* Member task routes */
taskRouter.get('/member/:memberId/stats', requireOrgPermission({ task: ['read'] }), taskController.getTaskStatsByMemberId);
taskRouter.get('/member/:memberId', requireOrgPermission({ task: ['read'] }), taskController.getTasksByMemberId);

/* Task lifecycle routes */
taskRouter.put('/:taskId', requireOrgPermission({ task: ['update'] }), taskController.updateTaskById);
taskRouter.delete('/:taskId', requireOrgPermission({ task: ['delete'] }), taskController.deleteTaskById);

/* Task comment routes */
taskRouter.post('/:taskId/comments', requireOrgPermission({ taskComment: ['create'] }), taskCommentController.createTaskComment);
taskRouter.get('/:taskId/comments', requireOrgPermission({ taskComment: ['read'] }), taskCommentController.getTaskComments);
taskRouter.put('/:taskId/comments/:commentId', requireOrgPermission({ taskComment: ['update'] }), taskCommentController.updateTaskComment);
taskRouter.delete('/:taskId/comments/:commentId', requireOrgPermission({ taskComment: ['delete'] }), taskCommentController.deleteTaskComment);

/* Task media routes */
taskRouter.post('/:taskId/media', requireOrgPermission({ task: ['update'] }), parseMediaUpload, taskMediaController.uploadTaskMedia);
taskRouter.get('/:taskId/media', requireOrgPermission({ task: ['read'] }), taskMediaController.getTaskMedia);
taskRouter.delete('/:taskId/media/:mediaId', requireOrgPermission({ task: ['update'] }), taskMediaController.deleteTaskMedia);

/* Task add-on routes */
taskRouter.post('/:taskId/addon', requireOrgPermission({ task: ['create'] }), taskController.createAddOnTask);
taskRouter.put('/:taskId/addon/:addOnTaskId', requireOrgPermission({ task: ['update'] }), taskController.updateAddOnTaskById);
taskRouter.delete('/:taskId/addon/:addOnTaskId', requireOrgPermission({ task: ['delete'] }), taskController.deleteAddOnTaskById);
