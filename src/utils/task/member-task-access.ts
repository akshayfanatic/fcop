import type { Prisma } from '../../generated/prisma/client.js';
import { Role } from '../../lib/auth/permissions.js';
import type { getSessionMember } from '../../lib/auth/session.js';
import { prisma } from '../../lib/prisma.js';
import { HttpStatus } from '../api-response.js';
import { createHttpError } from '../http-error.js';
import { getProjectAccessWhere } from '../project/project-access.js';
import { hasRole } from '../role.js';

type SessionMember = Awaited<ReturnType<typeof getSessionMember>>;

const canReadTeamTasks = (member: SessionMember) => hasRole(member.role, Role.ADMIN) || hasRole(member.role, Role.MANAGER);

export const getMemberTaskWhere = async (memberId: string, currentMember: SessionMember): Promise<Prisma.TaskWhereInput> => {
  // Limit cross-member task visibility to roles responsible for team delivery.
  if (memberId !== currentMember.id && !canReadTeamTasks(currentMember)) {
    throw createHttpError(HttpStatus.FORBIDDEN, 'You can only view your own task assignments.', 'MEMBER_TASK_READ_FORBIDDEN');
  }

  const targetMember = await prisma.member.findFirst({
    where: {
      id: memberId,
      organizationId: currentMember.organizationId
    },
    select: {
      id: true
    }
  });

  if (!targetMember) {
    throw createHttpError(HttpStatus.NOT_FOUND, 'Organization member not found.', 'MEMBER_NOT_FOUND');
  }

  return {
    project: getProjectAccessWhere(currentMember),
    assignees: {
      some: {
        memberId: targetMember.id
      }
    }
  };
};
