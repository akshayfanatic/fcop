import { z } from 'zod';
import { env } from '../config/env.js';

const trustedResetOrigins = new Set([...env.corsOrigins, env.frontendUrl]);

export const requestPasswordResetSchema = z.object({
  email: z.email().trim().toLowerCase(),
  redirectTo: z
    .url()
    .optional()
    .refine((value) => !value || trustedResetOrigins.has(new URL(value).origin), 'redirectTo must use a trusted frontend origin.')
});
