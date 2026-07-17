import type { IncomingHttpHeaders } from 'node:http';
import { getRolePermissionStatements, type OrganizationPermission } from '../lib/auth/permissions.js';
import { getSessionMember } from '../lib/auth/session.js';

export type CurrentUserAccess = {
  user: {
    id: string;
    name: string;
    email: string;
  };
  organizationId: string;
  memberId: string;
  role: string;
  permissions: OrganizationPermission;
};

export const meService = {
  getMe: async (headers: IncomingHttpHeaders): Promise<CurrentUserAccess> => {
    const member = await getSessionMember(headers);

    // Expose current access for UI decisions; backend route guards remain the source of enforcement.
    return {
      user: {
        id: member.userId,
        name: member.user.name,
        email: member.user.email
      },
      organizationId: member.organizationId,
      memberId: member.id,
      role: member.role,
      permissions: getRolePermissionStatements(member.role)
    };
  }
};
