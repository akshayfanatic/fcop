import type { Prisma } from '../../generated/prisma/client.js';
import type { getSessionMember } from '../../lib/auth/session.js';
import { isClientRole } from '../role.js';

type SessionMember = Awaited<ReturnType<typeof getSessionMember>>;

export function getServiceRequestAccessWhere(member: SessionMember): Prisma.ServiceRequestWhereInput {
  return {
    client: { member: { organizationId: member.organizationId } },
    ...(isClientRole(member.role) ? { clientId: member.client?.id ?? '__no_client_request_access__' } : {})
  };
}
