import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { organization } from 'better-auth/plugins';
import { env } from '../../config/env.js';
import {
  sendInvitationEmail,
  sendMemberAcceptedInvitationEmail,
  sendResetPasswordEmail
} from '../email/index.js';
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
      sendInvitationEmail,
      organizationHooks: {
        afterAcceptInvitation: sendMemberAcceptedInvitationEmail
      },
      teams: {
        enabled: true
      }
    })
  ]
});
