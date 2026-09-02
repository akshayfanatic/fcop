import type { Prisma } from '../../generated/prisma/client.js';
import { Role } from '../../lib/auth/permissions.js';
import type { getSessionMember } from '../../lib/auth/session.js';
import { getProjectAccessWhere } from '../project/project-access.js';
import { hasRole } from '../role.js';

type SessionMember = Awaited<ReturnType<typeof getSessionMember>>;

export const getVisibleTaskWhere = (member: SessionMember): Prisma.TaskWhereInput => ({
  project: getProjectAccessWhere(member),
  ...(hasRole(member.role, Role.MEMBER) && {
    assignees: {
      some: {
        memberId: member.id
      }
    }
  })
});
