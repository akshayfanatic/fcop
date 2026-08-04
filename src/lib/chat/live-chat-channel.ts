import { randomUUID } from 'node:crypto';
import type { IncomingHttpHeaders } from 'node:http';
import type { Server, Socket } from 'socket.io';
import { z } from 'zod';
import type { getSessionMember } from '../auth/session.js';
import { Role } from '../auth/permissions.js';
import { logger } from '../logger.js';
import { prisma } from '../prisma.js';
import { hasRole } from '../../utils/role.js';
import { getProjectAccessWhere } from '../../utils/project/project-access.js';
import { loadChatHistory, saveChatMessage } from './history.js';
import { chatChannelSchema, sendChatMessageSchema, type ChatChannelInput, type ChatMessage, type SendChatMessageInput } from './schemas.js';

type SessionMember = Awaited<ReturnType<typeof getSessionMember>>;

type ChatSocketData = {
  headers: IncomingHttpHeaders;
  member: SessionMember;
};

type ChatAck<T = undefined> = (response: { success: true; data?: T } | { success: false; message: string; code: string }) => void;

type ChatChannel = ChatChannelInput['channel'];

const publicRoom = (channel: ChatChannel) => `${channel.type}:${channel.id}`;
const managementRoom = (channel: ChatChannel) => `${publicRoom(channel)}:management`;

function getSafeSocketError(error: unknown) {
  if (error instanceof z.ZodError) {
    return { message: 'Invalid chat payload.', code: 'VALIDATION_ERROR' };
  }

  if (error instanceof Error) {
    const code = 'code' in error && typeof error.code === 'string' ? error.code : 'CHAT_ERROR';
    return { message: error.message, code };
  }

  return { message: 'Chat request failed.', code: 'CHAT_ERROR' };
}

async function getChatAccess(channel: ChatChannel, member: SessionMember) {
  const isManagement = hasRole(member.role, Role.ADMIN) || hasRole(member.role, Role.MANAGER);
  if (channel.type === 'project') {
    const project = await prisma.project.findFirst({
      where: {
        AND: [{ id: channel.id, client: { member: { organizationId: member.organizationId } } }, getProjectAccessWhere(member)]
      },
      select: { id: true }
    });

    // Hide project chat outside the viewer's existing project access.
    if (!project) {
      throw Object.assign(new Error('Project chat not found.'), { code: 'PROJECT_CHAT_NOT_FOUND' });
    }

    return { isManagement };
  }

  const request = await prisma.serviceRequest.findFirst({
    where: {
      id: channel.id,
      client: {
        member: {
          organizationId: member.organizationId
        }
      }
    },
    select: {
      id: true,
      clientId: true
    }
  });

  // Hide chat rooms outside the current organization or client account.
  if (!request || (!isManagement && member.client?.id !== request.clientId)) {
    throw Object.assign(new Error('Service request chat not found.'), { code: 'SERVICE_REQUEST_CHAT_NOT_FOUND' });
  }

  return { isManagement };
}

function createChatMessage(payload: SendChatMessageInput, member: SessionMember): ChatMessage {
  const timestamp = new Date().toISOString();

  return {
    id: randomUUID(),
    channel: payload.channel,
    authorMemberId: member.id,
    body: payload.body,
    isInternal: payload.isInternal,
    createdAt: timestamp,
    updatedAt: timestamp,
    author: {
      id: member.id,
      role: member.role,
      user: {
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        image: null
      }
    }
  };
}

export function registerLiveChatChannel(io: Server, socket: Socket<Record<string, never>, Record<string, never>, Record<string, never>, ChatSocketData>) {
  socket.on('chat:join', async (rawPayload: unknown, acknowledge: ChatAck<ChatMessage[]>) => {
    try {
      const { channel } = chatChannelSchema.parse(rawPayload);
      const { isManagement } = await getChatAccess(channel, socket.data.member);

      await socket.join(publicRoom(channel));

      if (isManagement) {
        await socket.join(managementRoom(channel));
      }

      const history = await loadChatHistory(channel);
      acknowledge({
        success: true,
        data: isManagement ? history : history.filter((message) => !message.isInternal)
      });
    } catch (error) {
      const safeError = getSafeSocketError(error);
      logger.warn({ error, socketId: socket.id }, 'Failed to join chat channel.');
      acknowledge({ success: false, ...safeError });
    }
  });

  socket.on('chat:leave', async (rawPayload: unknown) => {
    const result = chatChannelSchema.safeParse(rawPayload);

    if (!result.success) {
      return;
    }

    await socket.leave(publicRoom(result.data.channel));
    await socket.leave(managementRoom(result.data.channel));
  });

  socket.on('chat:send', async (rawPayload: unknown, acknowledge: ChatAck<ChatMessage>) => {
    try {
      const payload = sendChatMessageSchema.parse(rawPayload);
      const { isManagement } = await getChatAccess(payload.channel, socket.data.member);

      // Keep internal live-chat notes hidden from clients.
      if (payload.isInternal && !isManagement) {
        throw Object.assign(new Error('Clients cannot send internal messages.'), { code: 'INTERNAL_MESSAGE_FORBIDDEN' });
      }

      const message = createChatMessage(payload, socket.data.member);
      const room = message.isInternal ? managementRoom(payload.channel) : publicRoom(payload.channel);

      // Retain bounded history before confirming delivery to connected participants.
      await saveChatMessage(message);
      io.to(room).emit('chat:message', message);
      acknowledge({ success: true, data: message });
    } catch (error) {
      const safeError = getSafeSocketError(error);
      logger.warn({ error, socketId: socket.id }, 'Failed to send chat message.');
      acknowledge({ success: false, ...safeError });
    }
  });
}
