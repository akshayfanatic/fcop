import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../lib/prisma.js';
import { HttpStatus } from '../api-response.js';
import { createHttpError } from '../http-error.js';
import { Role } from '../../lib/auth/permissions.js';
import type { getSessionMember } from '../../lib/auth/session.js';
import { getProjectAccessWhere } from '../project/project-access.js';
import { hasRole } from '../role.js';

type SessionMember = Awaited<ReturnType<typeof getSessionMember>>;

export function getVisibleTaskWhere(member: SessionMember): Prisma.TaskWhereInput {
  const where: Prisma.TaskWhereInput = {
    project: getProjectAccessWhere(member)
  };

  if (hasRole(member.role, Role.MEMBER)) {
    where.assignees = {
      some: {
        memberId: member.id
      }
    };
  }

  return where;
}

export async function requireAccessibleTask(taskId: string, member: SessionMember) {
  const where = getVisibleTaskWhere(member);
  where.id = taskId;

  const task = await prisma.task.findFirst({
    where,
    select: {
      id: true,
      projectId: true,
      assignees: {
        select: { memberId: true }
      }
    }
  });

  if (!task) {
    throw createHttpError(HttpStatus.NOT_FOUND, 'Task not found.', 'TASK_NOT_FOUND');
  }

  return task;
}
