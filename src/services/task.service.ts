import type { IncomingHttpHeaders } from 'node:http';
import { env } from '../config/env.js';
import { MediaTargetType, ProjectMemberRole, TaskStatus, type Prisma } from '../generated/prisma/client.js';
import { createTaskAssignedEmailTemplate, sendTemplateEmail } from '../lib/email/index.js';
import { Role } from '../lib/auth/permissions.js';
import { getSessionMember } from '../lib/auth/session.js';
import { cloudinaryMedia, type StoredResourceType } from '../lib/cloudinary/media.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import { notificationService } from './notification.service.js';
import { HttpStatus } from '../utils/api-response.js';
import { createHttpError } from '../utils/http-error.js';
import { getProjectAccessWhere } from '../utils/project/project-access.js';
import { hasRole } from '../utils/role.js';
import { getMemberTaskWhere } from '../utils/task/member-task-access.js';
import { getVisibleTaskWhere } from '../utils/task/task-access.js';
import type { CreateAddOnTaskInput, CreateTaskInput, UpdateAddOnTaskInput, UpdateTaskInput } from '../validators/task.validator.js';

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
  },
  addOnTasks: {
    orderBy: {
      createdAt: 'asc'
    }
  }
} satisfies Prisma.TaskInclude;

type SessionMember = Awaited<ReturnType<typeof getSessionMember>>;
type TaskWritePayload = CreateTaskInput | UpdateTaskInput;
type TaskDetails = Prisma.TaskGetPayload<{
  include: typeof includeTaskDetails;
}>;

const canManageTasks = (member: SessionMember) => hasRole(member.role, Role.ADMIN) || hasRole(member.role, Role.MANAGER);

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

const assertAddOnTaskAccess = async (taskId: string, addOnTaskId: string, member: SessionMember) => {
  const task = await assertTaskAccess(taskId, member);
  const addOnTask = await prisma.addOnTask.findFirst({
    where: {
      id: addOnTaskId,
      taskId,
      projectId: task.projectId
    }
  });

  if (!addOnTask) {
    throw createHttpError(HttpStatus.NOT_FOUND, 'Add-on task not found.', 'ADD_ON_TASK_NOT_FOUND');
  }

  return { addOnTask, task };
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
        where: getVisibleTaskWhere(member),
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

  getTaskById: async (taskId: string, headers: IncomingHttpHeaders) => {
    try {
      const member = await getSessionMember(headers);
      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          ...getVisibleTaskWhere(member)
        },
        include: includeTaskDetails
      });

      if (!task) {
        throw createHttpError(HttpStatus.NOT_FOUND, 'Task not found.', 'TASK_NOT_FOUND');
      }

      return task;
    } catch (error) {
      logger.error({ error, taskId }, 'Failed to fetch task.');
      throw error;
    }
  },

  getTasksByMemberId: async (memberId: string, headers: IncomingHttpHeaders) => {
    try {
      const currentMember = await getSessionMember(headers);
      const memberTaskWhere = await getMemberTaskWhere(memberId, currentMember);

      return await prisma.task.findMany({
        where: {
          ...memberTaskWhere,
          status: {
            not: TaskStatus.DONE
          }
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
      logger.error({ error, memberId }, 'Failed to fetch member tasks.');
      throw error;
    }
  },

  getTaskStatsByMemberId: async (memberId: string, headers: IncomingHttpHeaders) => {
    try {
      const currentMember = await getSessionMember(headers);
      const memberTaskWhere = await getMemberTaskWhere(memberId, currentMember);
      const now = new Date();

      const [total, active, completed, overdue] = await Promise.all([
        prisma.task.count({
          where: memberTaskWhere
        }),
        prisma.task.count({
          where: {
            ...memberTaskWhere,
            status: {
              not: TaskStatus.DONE
            }
          }
        }),
        prisma.task.count({
          where: {
            ...memberTaskWhere,
            status: TaskStatus.DONE
          }
        }),
        prisma.task.count({
          where: {
            ...memberTaskWhere,
            status: {
              not: TaskStatus.DONE
            },
            dueDate: {
              lt: now
            }
          }
        })
      ]);

      return {
        total,
        active,
        completed,
        overdue
      };
    } catch (error) {
      logger.error({ error, memberId }, 'Failed to fetch member task statistics.');
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
        // Create checklist items with the parent task so partial task setup cannot be saved.
        const task = await tx.task.create({
          data: {
            projectId,
            createdByMemberId: member.id,
            title: payload.title,
            description: payload.description,
            status: payload.status,
            priority: payload.priority,
            dueDate: payload.dueDate,
            estimatedHours: payload.estimatedHours,
            addOnTasks: {
              create: payload.addOnTasks.map((addOnTask) => ({
                projectId,
                name: addOnTask.name
              }))
            }
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

      // Notify assignees after task creation without coupling notification delivery to the task transaction.
      await notificationService.createForMembers({
        memberIds: assigneeMemberIds ?? [],
        title: 'New task assigned',
        message: `You were assigned to "${task.title}".`,
        link: `/dashboard/projects/${projectId}`
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
          ...getVisibleTaskWhere(member)
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

      // Notify only newly added assignees without coupling notification delivery to the task transaction.
      await notificationService.createForMembers({
        memberIds: newAssigneeIds,
        title: 'New task assigned',
        message: `You were assigned to "${updatedTask.title}".`,
        link: `/dashboard/projects/${task.projectId}`
      });

      await sendTaskAssignedEmails(updatedTask, newAssigneeIds);

      return updatedTask;
    } catch (error) {
      logger.error({ error, taskId }, 'Failed to update task.');
      throw error;
    }
  },

  updateAddOnTaskById: async (taskId: string, addOnTaskId: string, payload: UpdateAddOnTaskInput, headers: IncomingHttpHeaders) => {
    try {
      const member = await getSessionMember(headers);
      await assertAddOnTaskAccess(taskId, addOnTaskId, member);
      const isManager = canManageTasks(member);

      // Assigned members may update completion but cannot rename checklist work.
      if (!isManager && (payload.name !== undefined || payload.isCompleted === undefined)) {
        throw createHttpError(HttpStatus.FORBIDDEN, 'Members can only update add-on task completion.', 'ADD_ON_TASK_UPDATE_FORBIDDEN');
      }

      return await prisma.addOnTask.update({
        where: {
          id: addOnTaskId
        },
        data: {
          ...(isManager && payload.name !== undefined ? { name: payload.name } : {}),
          ...(payload.isCompleted !== undefined ? { isCompleted: payload.isCompleted } : {})
        }
      });
    } catch (error) {
      logger.error({ error, taskId, addOnTaskId }, 'Failed to update add-on task.');
      throw error;
    }
  },

  createAddOnTask: async (taskId: string, payload: CreateAddOnTaskInput, headers: IncomingHttpHeaders) => {
    try {
      const member = await getSessionMember(headers);

      // Keep task structure under Admin and Manager control.
      if (!canManageTasks(member)) {
        throw createHttpError(HttpStatus.FORBIDDEN, 'Only Admin and Manager members can add add-on tasks.', 'ADD_ON_TASK_CREATE_FORBIDDEN');
      }

      const task = await assertTaskAccess(taskId, member);
      const addOnTaskCount = await prisma.addOnTask.count({ where: { taskId } });

      if (addOnTaskCount >= 5) {
        throw createHttpError(HttpStatus.BAD_REQUEST, 'A task can have up to 5 add-on tasks.', 'ADD_ON_TASK_LIMIT_REACHED');
      }

      return await prisma.addOnTask.create({
        data: {
          taskId,
          projectId: task.projectId,
          name: payload.name
        }
      });
    } catch (error) {
      logger.error({ error, taskId }, 'Failed to create add-on task.');
      throw error;
    }
  },

  deleteAddOnTaskById: async (taskId: string, addOnTaskId: string, headers: IncomingHttpHeaders) => {
    try {
      const member = await getSessionMember(headers);

      // Keep task structure under Admin and Manager control.
      if (!canManageTasks(member)) {
        throw createHttpError(HttpStatus.FORBIDDEN, 'Only Admin and Manager members can delete add-on tasks.', 'ADD_ON_TASK_DELETE_FORBIDDEN');
      }

      await assertAddOnTaskAccess(taskId, addOnTaskId, member);

      return await prisma.addOnTask.delete({
        where: {
          id: addOnTaskId
        }
      });
    } catch (error) {
      logger.error({ error, taskId, addOnTaskId }, 'Failed to delete add-on task.');
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
      const attachments = await prisma.media.findMany({
        where: {
          targetType: MediaTargetType.TASK,
          targetId: taskId
        },
        select: {
          publicId: true,
          resourceType: true
        }
      });

      // Remove task-owned provider assets before their database references disappear.
      await Promise.all(
        attachments.map((attachment) =>
          cloudinaryMedia.delete({
            publicId: attachment.publicId,
            resourceType: attachment.resourceType as StoredResourceType
          })
        )
      );

      return await prisma.$transaction(async (tx) => {
        await tx.media.deleteMany({
          where: {
            targetType: MediaTargetType.TASK,
            targetId: taskId
          }
        });

        return await tx.task.delete({
          where: {
            id: taskId
          },
          include: includeTaskDetails
        });
      });
    } catch (error) {
      logger.error({ error, taskId }, 'Failed to delete task.');
      throw error;
    }
  }
};
