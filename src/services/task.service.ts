import type { IncomingHttpHeaders } from 'node:http';
import { env } from '../config/env.js';
import { ProjectMemberRole, type Prisma } from '../generated/prisma/client.js';
import { createTaskAssignedEmailTemplate, sendTemplateEmail } from '../lib/email/index.js';
import { Role } from '../lib/auth/permissions.js';
import { getSessionMember } from '../lib/auth/session.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import { HttpStatus } from '../utils/api-response.js';
import { createHttpError } from '../utils/http-error.js';
import { getProjectAccessWhere } from '../utils/project/project-access.js';
import { hasRole } from '../utils/role.js';
import type { CreateTaskInput, UpdateTaskInput } from '../validators/task.validator.js';

const includeTaskDetails = {
  project: {
    select: {
      id: true,
      name: true
    }
  },
  createdBy: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      }
    }
  },
  assignees: {
    include: {
      member: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        }
      }
    }
  }
} satisfies Prisma.TaskInclude;

type SessionMember = Awaited<ReturnType<typeof getSessionMember>>;
type TaskWritePayload = CreateTaskInput | UpdateTaskInput;
type TaskDetails = Prisma.TaskGetPayload<{
  include: typeof includeTaskDetails;
}>;

const canManageTasks = (member: SessionMember) => hasRole(member.role, Role.ADMIN) || hasRole(member.role, Role.MANAGER);
const canWorkOnTasks = (member: SessionMember) => hasRole(member.role, Role.MEMBER);

const assertProjectAccess = async (projectId: string, member: SessionMember) => {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ...getProjectAccessWhere(member)
    },
    include: {
      memberProjects: true,
      client: {
        include: {
          member: true
        }
      }
    }
  });

  if (!project) {
    throw createHttpError(HttpStatus.NOT_FOUND, 'Project not found.', 'PROJECT_NOT_FOUND');
  }

  return project;
};

const assertTaskAccess = async (taskId: string, member: SessionMember) => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: getProjectAccessWhere(member)
    },
    include: {
      project: true,
      assignees: true
    }
  });

  if (!task) {
    throw createHttpError(HttpStatus.NOT_FOUND, 'Task not found.', 'TASK_NOT_FOUND');
  }

  if (!canManageTasks(member) && !task.assignees.some((assignee) => assignee.memberId === member.id)) {
    throw createHttpError(HttpStatus.FORBIDDEN, 'You can only update tasks assigned to you.', 'TASK_UPDATE_FORBIDDEN');
  }

  return task;
};

const getValidAssigneeMemberIds = async (projectId: string, member: SessionMember, payload: TaskWritePayload) => {
  if (payload.assigneeMemberIds === undefined) {
    return undefined;
  }

  const uniqueAssigneeIds = Array.from(new Set(payload.assigneeMemberIds));

  if (!canManageTasks(member)) {
    throw createHttpError(HttpStatus.FORBIDDEN, 'Only Admin and Manager members can assign tasks.', 'TASK_ASSIGN_FORBIDDEN');
  }

  if (uniqueAssigneeIds.length === 0) {
    return [];
  }

  const assignableMembers = await prisma.member.findMany({
    where: {
      id: {
        in: uniqueAssigneeIds
      },
      organizationId: member.organizationId,
      OR: [
        {
          role: Role.MEMBER
        },
        {
          role: Role.MANAGER
        }
      ]
    },
    select: {
      id: true
    }
  });

  if (assignableMembers.length !== uniqueAssigneeIds.length) {
    throw createHttpError(HttpStatus.BAD_REQUEST, 'Assignees must be Manager or Member users in the active organization.', 'INVALID_TASK_ASSIGNEE');
  }

  return uniqueAssigneeIds;
};

const replaceTaskAssignees = async (tx: Prisma.TransactionClient, taskId: string, projectId: string, assigneeMemberIds: string[]) => {
  await tx.taskAssignee.deleteMany({
    where: {
      taskId
    }
  });

  if (assigneeMemberIds.length === 0) {
    return;
  }

  await tx.taskAssignee.createMany({
    data: assigneeMemberIds.map((memberId) => ({
      taskId,
      projectId,
      memberId
    }))
  });

  await tx.memberProject.createMany({
    data: assigneeMemberIds.map((memberId) => ({
      projectId,
      memberId,
      role: ProjectMemberRole.MEMBER
    })),
    skipDuplicates: true
  });
};

const sendTaskAssignedEmails = async (task: TaskDetails, assigneeMemberIds: string[]) => {
  if (assigneeMemberIds.length === 0) {
    return;
  }

  const assignedMembers = task.assignees.filter((assignee) => assigneeMemberIds.includes(assignee.memberId));
  const projectUrl = new URL(`/dashboard/projects/${task.projectId}`, env.frontendUrl).toString();

  await Promise.all(
    assignedMembers.map(async (assignee) => {
      try {
        // Send email to tell team member about newly assigned delivery work.
        await sendTemplateEmail({
          to: assignee.member.user.email,
          template: createTaskAssignedEmailTemplate({
            task,
            assigneeName: assignee.member.user.name,
            projectUrl
          })
        });
      } catch (error) {
        logger.error(
          {
            error,
            taskId: task.id,
            memberId: assignee.memberId
          },
          'Failed to send task assignment email.'
        );
      }
    })
  );
};

export const taskService = {
  getTasks: async (headers: IncomingHttpHeaders) => {
    try {
      const member = await getSessionMember(headers);

      return await prisma.task.findMany({
        where: {
          project: getProjectAccessWhere(member),
          ...(canWorkOnTasks(member) && {
            assignees: {
              some: {
                memberId: member.id
              }
            }
          })
        },
        include: {
          ...includeTaskDetails,
          project: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: [
          {
            dueDate: 'asc'
          },
          {
            createdAt: 'desc'
          }
        ]
      });
    } catch (error) {
      logger.error({ error }, 'Failed to fetch tasks.');
      throw error;
    }
  },

  createTask: async (projectId: string, payload: CreateTaskInput, headers: IncomingHttpHeaders) => {
    try {
      const member = await getSessionMember(headers);

      if (!canManageTasks(member)) {
        throw createHttpError(HttpStatus.FORBIDDEN, 'Only Admin and Manager members can create tasks.', 'TASK_CREATE_FORBIDDEN');
      }

      await assertProjectAccess(projectId, member);
      const assigneeMemberIds = await getValidAssigneeMemberIds(projectId, member, payload);

      const task = await prisma.$transaction(async (tx) => {
        const task = await tx.task.create({
          data: {
            projectId,
            createdByMemberId: member.id,
            title: payload.title,
            description: payload.description,
            status: payload.status,
            priority: payload.priority,
            dueDate: payload.dueDate,
            estimatedHours: payload.estimatedHours
          }
        });

        // Assign members inside the task transaction so delivery ownership is created with the work item.
        await replaceTaskAssignees(tx, task.id, projectId, assigneeMemberIds ?? []);

        return await tx.task.findUniqueOrThrow({
          where: {
            id: task.id
          },
          include: includeTaskDetails
        });
      });

      await sendTaskAssignedEmails(task, assigneeMemberIds ?? []);

      return task;
    } catch (error) {
      logger.error({ error, projectId }, 'Failed to create task.');
      throw error;
    }
  },

  getProjectTasks: async (projectId: string, headers: IncomingHttpHeaders) => {
    try {
      const member = await getSessionMember(headers);

      await assertProjectAccess(projectId, member);

      return await prisma.task.findMany({
        where: {
          projectId,
          ...(canWorkOnTasks(member) && {
            assignees: {
              some: {
                memberId: member.id
              }
            }
          })
        },
        include: includeTaskDetails,
        orderBy: [
          {
            dueDate: 'asc'
          },
          {
            createdAt: 'desc'
          }
        ]
      });
    } catch (error) {
      logger.error({ error, projectId }, 'Failed to fetch project tasks.');
      throw error;
    }
  },

  updateTaskById: async (taskId: string, payload: UpdateTaskInput, headers: IncomingHttpHeaders) => {
    try {
      const member = await getSessionMember(headers);
      const task = await assertTaskAccess(taskId, member);
      const assigneeMemberIds = await getValidAssigneeMemberIds(task.projectId, member, payload);
      const isManager = canManageTasks(member);

      if (!isManager && !payload.status) {
        throw createHttpError(HttpStatus.FORBIDDEN, 'Members can only update task status.', 'TASK_UPDATE_FORBIDDEN');
      }

      const previousAssigneeIds = task.assignees.map((assignee) => assignee.memberId);
      const updatedTask = await prisma.$transaction(async (tx) => {
        await tx.task.update({
          where: {
            id: taskId
          },
          data: {
            ...(isManager && payload.title ? { title: payload.title } : {}),
            ...(isManager && payload.description !== undefined ? { description: payload.description } : {}),
            ...(payload.status ? { status: payload.status } : {}),
            ...(isManager && payload.priority ? { priority: payload.priority } : {}),
            ...(isManager && payload.dueDate !== undefined ? { dueDate: payload.dueDate } : {}),
            ...(isManager && payload.estimatedHours !== undefined ? { estimatedHours: payload.estimatedHours } : {})
          }
        });

        if (assigneeMemberIds !== undefined) {
          // Replace task assignees only when management explicitly submits assignment changes.
          await replaceTaskAssignees(tx, taskId, task.projectId, assigneeMemberIds);
        }

        return await tx.task.findUniqueOrThrow({
          where: {
            id: taskId
          },
          include: includeTaskDetails
        });
      });

      const newAssigneeIds = assigneeMemberIds?.filter((assigneeMemberId) => !previousAssigneeIds.includes(assigneeMemberId)) ?? [];

      await sendTaskAssignedEmails(updatedTask, newAssigneeIds);

      return updatedTask;
    } catch (error) {
      logger.error({ error, taskId }, 'Failed to update task.');
      throw error;
    }
  },

  deleteTaskById: async (taskId: string, headers: IncomingHttpHeaders) => {
    try {
      const member = await getSessionMember(headers);

      if (!canManageTasks(member)) {
        throw createHttpError(HttpStatus.FORBIDDEN, 'Only Admin and Manager members can delete tasks.', 'TASK_DELETE_FORBIDDEN');
      }

      await assertTaskAccess(taskId, member);

      return await prisma.task.delete({
        where: {
          id: taskId
        },
        include: includeTaskDetails
      });
    } catch (error) {
      logger.error({ error, taskId }, 'Failed to delete task.');
      throw error;
    }
  }
};
