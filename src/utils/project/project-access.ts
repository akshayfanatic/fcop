import type { Prisma } from '../../generated/prisma/client.js';
import { Role } from '../../lib/auth/permissions.js';
import type { getSessionMember } from '../../lib/auth/session.js';
import { hasRole, isClientRole } from '../role.js';

type SessionMember = Awaited<ReturnType<typeof getSessionMember>>;

export function getProjectAccessWhere(member: SessionMember): Prisma.ProjectWhereInput {
  // Every project query stays inside the member's organization.
  const where: Prisma.ProjectWhereInput = {
    client: { member: { organizationId: member.organizationId } }
  };

  if (hasRole(member.role, Role.ADMIN)) {
    return where;
  }

  if (isClientRole(member.role)) {
    if (member.client) {
      where.clientId = member.client.id;
    } else {
      // A client without a profile cannot access any projects.
      where.id = { in: [] };
    }
    return where;
  }

  where.OR = [{ createdByMemberId: member.id }, { memberProjects: { some: { memberId: member.id } } }];

  return where;
}
