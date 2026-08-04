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

export type ChatChannelInput = z.infer<typeof chatChannelSchema>;
export type SendChatMessageInput = z.infer<typeof sendChatMessageSchema>;
