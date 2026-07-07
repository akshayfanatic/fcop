import { z } from 'zod';
import { Role } from '../lib/auth/permissions.js';

export const inviteMemberSchema = z.object({
  email: z.email().trim().toLowerCase().max(255),
  role: z.enum([Role.MANAGER, Role.MEMBER, Role.CLIENT]),
  resend: z.boolean().optional()
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
