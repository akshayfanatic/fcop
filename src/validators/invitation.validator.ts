import { z } from 'zod';
import { ServiceInterest } from '../generated/prisma/client.js';
import { Role } from '../lib/auth/permissions.js';

export const inviteMemberSchema = z.object({
  email: z.email().trim().toLowerCase().max(255),
  role: z.enum([Role.MANAGER, Role.MEMBER, Role.CLIENT]),
  serviceInterest: z.enum(ServiceInterest).optional(),
  resend: z.boolean().optional()
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
