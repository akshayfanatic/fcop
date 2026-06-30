import { type Prisma } from '../generated/prisma/client.js';
import { env } from '../config/env.js';
import { createNewLeadEmailTemplate, sendTemplateEmail } from '../lib/email/index.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import type { CreatePublicLeadInput } from '../validators/lead.validator.js';

export const leadService = {
  createPublicLead: async (payload: CreatePublicLeadInput) => {
    const data = {
      name: payload.name,
      email: payload.email,
      companyName: payload.companyName,
      serviceInterest: payload.serviceInterest,
      budgetRange: payload.budgetRange
    } satisfies Prisma.LeadCreateInput;

    const lead = await prisma.lead.create({
      data
    });

    if (!env.adminEmail) {
      logger.warn('ADMIN_EMAIL is not configured. Skipping new lead email notification.');
      return lead;
    }

    try {
      await sendTemplateEmail({
        to: env.adminEmail,
        replyTo: lead.email,
        template: createNewLeadEmailTemplate({ lead })
      });
    } catch (error) {
      logger.error({ error, leadId: lead.id }, 'Failed to send new lead email notification.');
    }

    return lead;
  }
};
