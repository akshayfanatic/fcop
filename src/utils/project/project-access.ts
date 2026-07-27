import { type Prisma, ProjectMemberRole } from '../../generated/prisma/client.js';
import { Role } from '../../lib/auth/permissions.js';
import type { getSessionMember } from '../../lib/auth/session.js';
import { prisma } from '../../lib/prisma.js';
import { HttpStatus } from '../api-response.js';
import { createHttpError } from '../http-error.js';
import { hasRole, isClientRole } from '../role.js';

type SessionMember = Awaited<ReturnType<typeof getSessionMember>>;

export const getAssignableProjectManagerId = async (currentMember: SessionMember, managerMemberId?: string | null) => {
  if (hasRole(currentMember.role, Role.ADMIN)) {
    if (!managerMemberId) {
      throw createHttpError(HttpStatus.BAD_REQUEST, 'Project manager is required.', 'PROJECT_MANAGER_REQUIRED');
    }

    const assignedManager = await prisma.member.findFirst({
      where: {
        id: managerMemberId,
        organizationId: currentMember.organizationId
      }
    });

    if (!assignedManager || !hasRole(assignedManager.role, Role.MANAGER)) {
      throw createHttpError(HttpStatus.BAD_REQUEST, 'Assigned project manager must be a Manager in the active organization.', 'INVALID_PROJECT_MANAGER');
    }

    return assignedManager.id;
  }

  if (hasRole(currentMember.role, Role.MANAGER)) {
    return currentMember.id;
  }

  throw createHttpError(HttpStatus.FORBIDDEN, 'Only Admin and Manager members can create or assign projects.', 'PROJECT_CREATE_FORBIDDEN');
};

export const getProjectAccessWhere = (member: SessionMember): Prisma.ProjectWhereInput => {
  if (hasRole(member.role, Role.ADMIN)) {
    return {};
  }

  if (isClientRole(member.role)) {
    if (!member.client) {
      return {
        id: '__no_client_project_access__'
      };
    }

    return {
      clientId: member.client.id
    };
  }

  return {
    OR: [
      {
        createdByMemberId: member.id
      },
      {
        memberProjects: {
          some: {
            memberId: member.id
          }
        }
      }
    ]
  };
};

export const upsertProjectManager = async (tx: Prisma.TransactionClient, projectId: string, managerMemberId: string) => {
  // Keep a single manager assignment row for project ownership checks.
  await tx.memberProject.deleteMany({
    where: {
      projectId,
      role: ProjectMemberRole.MANAGER,
      memberId: {
        not: managerMemberId
      }
    }
  });

  await tx.memberProject.upsert({
    where: {
      projectId_memberId: {
        projectId,
        memberId: managerMemberId
      }
    },
    update: {
      role: ProjectMemberRole.MANAGER
    },
    create: {
      projectId,
      memberId: managerMemberId,
      role: ProjectMemberRole.MANAGER
    }
  });
};
