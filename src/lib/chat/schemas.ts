import { z } from 'zod';

export const chatChannelSchema = z.object({
  channel: z.object({
    type: z.enum(['service-request', 'project']),
    id: z.string().trim().min(1)
  })
});

export const sendChatMessageSchema = chatChannelSchema.extend({
  body: z.string().trim().min(1).max(10_000),
  isInternal: z.boolean().optional().default(false)
});

export const chatMessageSchema = z.object({
  id: z.string(),
  channel: chatChannelSchema.shape.channel,
  authorMemberId: z.string(),
  body: z.string(),
  isInternal: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  author: z.object({
    id: z.string(),
    role: z.string(),
    user: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      image: z.null()
    })
  })
});

export const chatHistoryMessagesSchema = z.array(chatMessageSchema);

export type ChatChannelInput = z.infer<typeof chatChannelSchema>;
export type SendChatMessageInput = z.infer<typeof sendChatMessageSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
