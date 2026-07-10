import { type Prisma } from '../generated/prisma/client.js';
import { env } from '../config/env.js';
import { createNewLeadEmailTemplate, sendTemplateEmail } from '../lib/email/index.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import { HttpStatus } from '../utils/api-response.js';
import { createHttpError } from '../utils/http-error.js';
import type { CreateLeadInput, UpdateLeadInput } from '../validators/lead.validator.js';

export const leadService = {
  getLeads: async () => {
    try {
      return await prisma.lead.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (error) {
      logger.error({ error }, 'Failed to fetch leads.');
      throw error;
    }
  },

  getLeadById: async (id: string) => {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id }
      });

      if (!lead) {
        throw createHttpError(HttpStatus.NOT_FOUND, 'Lead not found.', 'NOT_FOUND');
      }

      return lead;
    } catch (error) {
      logger.error({ error, leadId: id }, 'Failed to fetch lead by id.');
      throw error;
    }
  },

  createLead: async (payload: CreateLeadInput) => {
    try {
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
    } catch (error) {
      logger.error({ error, email: payload.email }, 'Failed to create lead.');
      throw error;
    }
  },

  updateLeadById: async (id: string, payload: UpdateLeadInput) => {
    try {
      await leadService.getLeadById(id);

      return await prisma.lead.update({
        where: { id },
        data: payload
      });
    } catch (error) {
      logger.error({ error, leadId: id }, 'Failed to update lead by id.');
      throw error;
    }
  },

  // Accepted invitations qualify matching leads captured with the same email.
  updateLeadByEmail: async (email: string, payload: UpdateLeadInput) => {
    try {
      const result = await prisma.lead.updateMany({
        where: {
          email,
          ...(payload.status ? { status: { not: payload.status } } : {})
        },
        data: payload
      });

      logger.info(
        {
          email,
          updatedCount: result.count
        },
        'Qualified leads for accepted organization member.'
      );

      return result;
    } catch (error) {
      logger.error({ error, email }, 'Failed to qualify lead for accepted organization member.');
      throw error;
    }
  },

  deleteLeadById: async (id: string) => {
    try {
      await leadService.getLeadById(id);

      return await prisma.lead.delete({
        where: { id }
      });
    } catch (error) {
      logger.error({ error, leadId: id }, 'Failed to delete lead by id.');
      throw error;
    }
  }
};
