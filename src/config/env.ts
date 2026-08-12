import dotenv from 'dotenv';
import { toLogLevel, toOrigin, toOrigins, toPort, toPositiveInteger } from '../utils/env-parser.js';

const nodeEnv = process.env.NODE_ENV ?? 'development';
dotenv.config({ path: [`.env.${nodeEnv}`, '.env'] });

const frontendUrl = toOrigin(process.env.FRONTEND_URL ?? 'http://localhost:3001');
const betterAuthUrl = toOrigin(process.env.BETTER_AUTH_URL ?? 'http://localhost:3000');
const corsOrigins = toOrigins(process.env.CORS_ORIGIN, [frontendUrl, 'http://192.168.29.204:3001', 'http://localhost:3001']);

export const env = {
  nodeEnv,
  logLevel: toLogLevel(process.env.LOG_LEVEL),
  port: toPort(process.env.PORT, 3000),
  corsOrigins,
  frontendUrl,
  betterAuthUrl,
  authTrustedOrigins: Array.from(new Set([...corsOrigins, frontendUrl])),
  betterAuthSecret: process.env.BETTER_AUTH_SECRET ?? 'dev-better-auth-secret-change-before-production',
  databaseUrl: process.env.DATABASE_URL ?? 'mysql://root@localhost:3306/fcop',
  resendApiKey: process.env.RESEND_API_KEY ?? '',
  emailFrom: process.env.EMAIL_FROM ?? 'FCOP <onboarding@resend.dev>',
  adminEmail: process.env.ADMIN_EMAIL ?? '',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  stripeInvoiceDaysUntilDue: toPositiveInteger(process.env.STRIPE_INVOICE_DAYS_UNTIL_DUE, 7),
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY ?? '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
  chatRetentionDays: toPositiveInteger(process.env.CHAT_RETENTION_DAYS, 7),
  chatMaxMessages: toPositiveInteger(process.env.CHAT_MAX_MESSAGES, 100)
};
