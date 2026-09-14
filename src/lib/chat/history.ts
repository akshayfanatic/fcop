import type { Prisma } from '../../generated/prisma/client.js';
import { env } from '../../config/env.js';
import { prisma } from '../prisma.js';
import { chatHistoryMessagesSchema, type ChatMessage } from './schemas.js';

type ChatChannel = ChatMessage['channel'];

const channelKey = (channel: ChatChannel) => ({
  channelType: channel.type,
  channelId: channel.id
});

const asJson = (messages: ChatMessage[]) => JSON.parse(JSON.stringify(messages)) as Prisma.InputJsonValue;

export async function loadChatHistory(channel: ChatChannel) {
  const now = new Date();

  // Remove expired channel histories before returning retained messages.
  await prisma.chatHistory.deleteMany({ where: { expiresAt: { lte: now } } });

  const history = await prisma.chatHistory.findUnique({
    where: { channelType_channelId: channelKey(channel) },
    select: { messages: true }
  });

  const parsed = chatHistoryMessagesSchema.safeParse(history?.messages ?? []);
  return parsed.success ? parsed.data : [];
}

export async function saveChatMessage(message: ChatMessage) {
  const key = channelKey(message.channel);
  const expiresAt = new Date(Date.now() + env.chatRetentionDays * 24 * 60 * 60 * 1000);

  await prisma.$transaction(
    async (tx) => {
      // Reject in-flight messages after account or channel deletion instead of recreating history.
      const author = await tx.member.findUnique({ where: { id: message.authorMemberId }, select: { id: true } });
      const parent =
        message.channel.type === 'project'
          ? await tx.project.findUnique({ where: { id: message.channel.id }, select: { id: true } })
          : await tx.serviceRequest.findUnique({ where: { id: message.channel.id }, select: { id: true } });
      if (!author || !parent) {
        throw Object.assign(new Error('Chat is no longer available.'), { code: 'CHAT_NOT_FOUND' });
      }
      const history = await tx.chatHistory.findUnique({
        where: { channelType_channelId: key },
        select: { messages: true, expiresAt: true }
      });
      const parsed = chatHistoryMessagesSchema.safeParse(history?.messages ?? []);
      const currentMessages = history && history.expiresAt > new Date() && parsed.success ? parsed.data : [];
      const messages = [...currentMessages, message].slice(-env.chatMaxMessages);

      await tx.chatHistory.upsert({
        where: { channelType_channelId: key },
        create: { ...key, messages: asJson(messages), expiresAt },
        update: { messages: asJson(messages), expiresAt }
      });
    },
    { isolationLevel: 'Serializable' }
  );
}
