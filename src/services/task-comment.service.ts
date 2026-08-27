import type { IncomingHttpHeaders } from 'node:http';
import { Role } from '../lib/auth/permissions.js';
import { getSessionMember } from '../lib/auth/session.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import { HttpStatus } from '../utils/api-response.js';
import { createHttpError } from '../utils/http-error.js';
import { createPaginatedData, getPaginationOffset } from '../utils/pagination.js';
import { getProjectAccessWhere } from '../utils/project/project-access.js';
import { hasRole } from '../utils/role.js';
import type { CreateTaskCommentInput, TaskCommentListQueryInput, UpdateTaskCommentInput } from '../validators/task-comment.validator.js';

type SessionMember = Awaited<ReturnType<typeof getSessionMember>>;

const includeCommentAuthor = {
  member: {
    select: {
      id: true,
      role: true,
      user: {
        select: {
          id: true,
          name: true,
          image: true
        }
      }
    }
  }
} as const;

const requireAccessibleTask = async (taskId: string, member: SessionMember) => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: getProjectAccessWhere(member)
    },
    select: {
      id: true
    }
  });

  if (!task) {
    throw createHttpError(HttpStatus.NOT_FOUND, 'Task not found.', 'TASK_NOT_FOUND');
  }

  return task;
};

const requireTaskComment = async (taskId: string, commentId: string) => {
  const comment = await prisma.taskComment.findFirst({
    where: {
      id: commentId,
      taskId
    }
  });

  if (!comment) {
    throw createHttpError(HttpStatus.NOT_FOUND, 'Task comment not found.', 'TASK_COMMENT_NOT_FOUND');
  }

  return comment;
};

const canModerateComments = (member: SessionMember) => hasRole(member.role, Role.ADMIN) || hasRole(member.role, Role.MANAGER);

const requireCommentWriteAccess = (commentMemberId: string | null, member: SessionMember) => {
  // Allow authors to manage their comments while Admin and Manager members can moderate discussions.
  if (commentMemberId !== member.id && !canModerateComments(member)) {
    throw createHttpError(HttpStatus.FORBIDDEN, 'You can only modify your own task comments.', 'TASK_COMMENT_WRITE_FORBIDDEN');
  }
};

export const taskCommentService = {
  createTaskComment: async (taskId: string, payload: CreateTaskCommentInput, headers: IncomingHttpHeaders) => {
    try {
      const member = await getSessionMember(headers);
      const task = await requireAccessibleTask(taskId, member);

      return await prisma.taskComment.create({
        data: {
          taskId: task.id,
          memberId: member.id,
          content: payload.content
        },
        include: includeCommentAuthor
      });
    } catch (error) {
      logger.error({ error, taskId }, 'Failed to create task comment.');
      throw error;
    }
  },

  getTaskComments: async (taskId: string, query: TaskCommentListQueryInput, headers: IncomingHttpHeaders) => {
    try {
      const member = await getSessionMember(headers);
      const task = await requireAccessibleTask(taskId, member);
      const where = { taskId: task.id };
      const [items, totalItems] = await prisma.$transaction([
        prisma.taskComment.findMany({
          where,
          include: includeCommentAuthor,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip: getPaginationOffset(query),
          take: query.pageSize
        }),
        prisma.taskComment.count({ where })
      ]);

      return createPaginatedData({ items, page: query.page, pageSize: query.pageSize, totalItems });
    } catch (error) {
      logger.error({ error, taskId }, 'Failed to fetch task comments.');
      throw error;
    }
  },

  updateTaskComment: async (taskId: string, commentId: string, payload: UpdateTaskCommentInput, headers: IncomingHttpHeaders) => {
    try {
      const member = await getSessionMember(headers);
      await requireAccessibleTask(taskId, member);
      const comment = await requireTaskComment(taskId, commentId);
      requireCommentWriteAccess(comment.memberId, member);

      return await prisma.taskComment.update({
        where: { id: comment.id },
        data: { content: payload.content },
        include: includeCommentAuthor
      });
    } catch (error) {
      logger.error({ error, taskId, commentId }, 'Failed to update task comment.');
      throw error;
    }
  },

  deleteTaskComment: async (taskId: string, commentId: string, headers: IncomingHttpHeaders) => {
    try {
      const member = await getSessionMember(headers);
      await requireAccessibleTask(taskId, member);
      const comment = await requireTaskComment(taskId, commentId);
      requireCommentWriteAccess(comment.memberId, member);

      return await prisma.taskComment.delete({
        where: { id: comment.id },
        include: includeCommentAuthor
      });
    } catch (error) {
      logger.error({ error, taskId, commentId }, 'Failed to delete task comment.');
      throw error;
    }
  }
};
