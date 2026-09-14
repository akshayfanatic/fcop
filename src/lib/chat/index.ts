import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { env } from '../../config/env.js';
import { getSessionMember } from '../auth/session.js';
import { logger } from '../logger.js';
import { registerLiveChatChannel } from './live-chat-channel.js';
import { userDeletionEvents, type UserDeletion } from '../auth/user-deletion-events.js';

function getSocketHeaders(headers: Record<string, string | string[] | undefined>, token: unknown) {
  const authToken = typeof token === 'string' ? token.trim() : '';

  return {
    ...headers,
    ...(authToken ? { authorization: `Bearer ${authToken}` } : {})
  };
}

export function initializeChatServer(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: env.corsOrigins,
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const headers = getSocketHeaders(socket.handshake.headers, socket.handshake.auth.token);
      const member = await getSessionMember(headers);

      socket.data.headers = headers;
      socket.data.member = member;
      next();
    } catch (error) {
      logger.warn({ error, socketId: socket.id }, 'Rejected unauthenticated chat socket.');
      next(new Error('Authentication required.'));
    }
  });

  io.on('connection', (socket) => {
    registerLiveChatChannel(io, socket);
  });

  const onUserDeleted = ({ userId, projectIds, requestIds }: UserDeletion) => {
    for (const socket of io.sockets.sockets.values()) {
      if (socket.data.member?.userId === userId) socket.disconnect(true);
    }
    for (const room of [...projectIds.map((id) => `project:${id}`), ...requestIds.map((id) => `service-request:${id}`)]) {
      io.in(room).socketsLeave(room);
      io.in(`${room}:management`).socketsLeave(`${room}:management`);
    }
  };
  userDeletionEvents.on('deleted', onUserDeleted);
  server.once('close', () => userDeletionEvents.off('deleted', onUserDeleted));

  return io;
}
