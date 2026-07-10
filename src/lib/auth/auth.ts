import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { organization } from 'better-auth/plugins';
import { env } from '../../config/env.js';
import { LeadStatus } from '../../generated/prisma/client.js';
import {
  sendInvitationEmail,
  sendMemberAcceptedInvitationEmail,
  sendResetPasswordEmail
} from '../email/index.js';
import { leadService } from '../../services/lead.service.js';
import { clientService } from '../../services/client.service.js';
import { logger } from '../logger.js';
import { prisma } from '../prisma.js';
import { ac, organizationRoles, Role } from './permissions.js';

export const auth = betterAuth({
  appName: 'FCOP',
  baseURL: env.betterAuthUrl,
  secret: env.betterAuthSecret,
  trustedOrigins: env.corsOrigins,
  database: prismaAdapter(prisma, {
    provider: 'mysql'
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: sendResetPasswordEmail
  },
  plugins: [
    organization({
      ac,
      roles: organizationRoles,
      creatorRole: Role.ADMIN,
      cancelPendingInvitationsOnReInvite: true,
      sendInvitationEmail,
      organizationHooks: {
        // When an invitee accepts, notify admin, create client profile if needed, and qualify matching leads.
        afterAcceptInvitation: async (payload) => {
          await sendMemberAcceptedInvitationEmail(payload);

          try {
            await clientService.createClient(payload);
          } catch (error) {
            logger.error(
              {
                error,
                memberId: payload.member.id,
                invitationId: payload.invitation.id
              },
              'Failed to create client profile after invitation acceptance.'
            );
          }

          try {
            await leadService.updateLeadByEmail(payload.user.email, {
              status: LeadStatus.QUALIFIED
            });
          } catch (error) {
            logger.error(
              {
                error,
                userEmail: payload.user.email,
                invitationId: payload.invitation.id
              },
              'Failed to qualify lead after invitation acceptance.'
            );
          }
        }
      },
      teams: {
        enabled: true
      }
    })
  ]
});
