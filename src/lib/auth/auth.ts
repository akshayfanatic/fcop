import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { bearer, organization } from 'better-auth/plugins';
import { env } from '../../config/env.js';
import { LeadStatus } from '../../generated/prisma/client.js';
import { sendClientWelcomeEmail, sendInvitationEmail, sendMemberAcceptedInvitationEmail, sendNewClientRegisteredEmail, sendResetPasswordEmail } from '../email/index.js';
import { leadService } from '../../services/lead.service.js';
import { clientService } from '../../services/client.service.js';
import { logger } from '../logger.js';
import { prisma } from '../prisma.js';
import { ac, organizationRoles, Role } from './permissions.js';

export const auth = betterAuth({
  appName: 'FCOP',
  baseURL: env.betterAuthUrl,
  secret: env.betterAuthSecret,
  trustedOrigins: env.authTrustedOrigins,
  database: prismaAdapter(prisma, {
    provider: 'mysql'
  }),
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          // Provision direct signups before login while invitations keep their assigned role.
          const provisionedClient = await clientService.provisionDirectSignupClient(session.userId);

          if (provisionedClient.newClient) {
            // Send email to tell admin that a direct signup became a client.
            await sendNewClientRegisteredEmail(provisionedClient.newClient);

            // Send welcome email after the self-registered client profile is ready.
            await sendClientWelcomeEmail(provisionedClient.newClient);
          }

          return {
            data: {
              ...session,
              ...(provisionedClient.activeOrganizationId ? { activeOrganizationId: provisionedClient.activeOrganizationId } : {})
            }
          };
        }
      }
    }
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    revokeSessionsOnPasswordReset: true,
    // Send email to help user reset their password.
    sendResetPassword: sendResetPasswordEmail
  },
  plugins: [
    bearer(),
    organization({
      ac,
      roles: organizationRoles,
      creatorRole: Role.ADMIN,
      allowUserToCreateOrganization: false,
      cancelPendingInvitationsOnReInvite: true,
      schema: {
        invitation: {
          additionalFields: {
            serviceInterest: {
              type: 'string',
              input: true,
              required: false
            }
          }
        }
      },
      // Send email to invite user into the organization.
      sendInvitationEmail,
      organizationHooks: {
        // Send email to tell admin that invitation was accepted.
        afterAcceptInvitation: async (payload) => {
          await sendMemberAcceptedInvitationEmail(payload);

          try {
            // Create client profile after invitation is accepted.
            const client = await clientService.createClient(payload);

            if (client) {
              // Send welcome email after the invited client profile is ready.
              await sendClientWelcomeEmail({
                userName: payload.user.name,
                userEmail: payload.user.email,
                organizationName: payload.organization.name
              });
            }
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
            // Mark matching lead as qualified after user joins.
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
      }
    })
  ]
});
