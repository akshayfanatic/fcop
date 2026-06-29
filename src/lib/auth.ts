import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { env } from '../config/env.js';
import { prisma } from './prisma.js';

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
    minPasswordLength: 8
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'USER',
        input: false
      }
    }
  }
});
