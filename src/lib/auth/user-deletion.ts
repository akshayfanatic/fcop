import { APIError } from 'better-auth/api';
import type { Prisma } from '../../generated/prisma/client.js';
import { Role } from './permissions.js';
import { hasRole } from '../../utils/role.js';

export async function authorizeUserDeletion(tx: Prisma.TransactionClient, actorUserId: string, targetUserId: string) {
  if (actorUserId === targetUserId) {
    throw new APIError('BAD_REQUEST', { code: 'CANNOT_DELETE_SELF', message: 'You cannot delete your own account.' });
  }

  const actorMemberships = await tx.member.findMany({ where: { userId: actorUserId }, select: { organizationId: true, role: true } });
  const adminOrganizationIds = new Set(actorMemberships.filter((member) => hasRole(member.role, Role.ADMIN)).map((member) => member.organizationId));
  if (adminOrganizationIds.size === 0) {
    throw new APIError('FORBIDDEN', { code: 'USER_DELETE_FORBIDDEN', message: 'Only organization admins can delete users.' });
  }

  const target = await tx.user.findUnique({ where: { id: targetUserId }, include: { members: true } });
  // Account deletion affects every membership, so require authority over all of them.
  if (!target || target.members.length === 0 || target.members.some((member) => !adminOrganizationIds.has(member.organizationId))) {
    throw new APIError('NOT_FOUND', { code: 'USER_NOT_FOUND', message: 'User not found in your administered organizations.' });
  }
  return target;
}

export async function deleteUserRelatedData(tx: Prisma.TransactionClient, target: { id: string; email: string; members: { id: string }[] }) {
  const memberIds = target.members.map((member) => member.id);
  const requests = await tx.serviceRequest.findMany({ where: { client: { memberId: { in: memberIds } } }, select: { id: true } });
  const projects = await tx.project.findMany({
    where: { client: { memberId: { in: memberIds } } },
    select: { id: true }
  });
  const projectIds = projects.map((project) => project.id);
  const tasks = await tx.task.findMany({
    where: { projectId: { in: projectIds } },
    select: { id: true }
  });

  // Remove polymorphic records that have no foreign-key cascade to their parent.
  await tx.media.deleteMany({
    where: {
      OR: [
        { targetType: 'PROJECT', targetId: { in: projectIds } },
        { targetType: 'TASK', targetId: { in: tasks.map((task) => task.id) } }
      ]
    }
  });
  await tx.chatHistory.deleteMany({
    where: {
      OR: [
        { channelType: 'project', channelId: { in: projectIds } },
        { channelType: 'service-request', channelId: { in: requests.map((request) => request.id) } }
      ]
    }
  });

  // Remove this user's embedded messages while preserving other authors' conversations.
  const histories = await tx.chatHistory.findMany({ select: { id: true, messages: true } });
  for (const history of histories) {
    if (!Array.isArray(history.messages)) continue;
    const messages = history.messages.filter((message) => {
      if (!message || typeof message !== 'object' || Array.isArray(message)) return true;
      return !memberIds.includes(String(message.authorMemberId));
    });
    if (messages.length !== history.messages.length) {
      await tx.chatHistory.update({ where: { id: history.id }, data: { messages: messages as Prisma.InputJsonValue } });
    }
  }

  await tx.invitation.deleteMany({ where: { email: target.email } });
  await tx.lead.deleteMany({ where: { email: target.email } });
  await tx.verification.deleteMany({ where: { OR: [{ value: target.id }, { identifier: target.email }] } });
  // Cascade client-owned work; SetNull preserves staff-created work and comments.
  return { userId: target.id, projectIds, requestIds: requests.map((request) => request.id) };
}
