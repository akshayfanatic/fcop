import { type Prisma } from '../generated/prisma/client.js';
import { env } from '../config/env.js';
import { createNewLeadEmailTemplate, sendTemplateEmail } from '../lib/email/index.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import { HttpStatus } from '../utils/api-response.js';
import { createHttpError } from '../utils/http-error.js';
import { createPaginatedData, getPaginationOffset } from '../utils/pagination.js';
import type { CreateLeadInput, LeadFiltersInput, UpdateLeadInput } from '../validators/lead.validator.js';

export const leadService = {
  getLeads: async (filters: LeadFiltersInput) => {
    try {
      const { page, pageSize } = filters;
      const where = {
        ...(filters.email ? { email: { contains: filters.email } } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.serviceType ? { serviceInterest: filters.serviceType } : {})
      } satisfies Prisma.LeadWhereInput;

      const [items, totalItems] = await Promise.all([
        prisma.lead.findMany({
          where,
          orderBy: {
            createdAt: 'desc'
          },
          skip: getPaginationOffset({ page, pageSize }),
          take: pageSize
        }),
        prisma.lead.count({ where })
      ]);

      return createPaginatedData({
        items,
        page,
        pageSize,
        totalItems
      });
    } catch (error) {
      logger.error({ error, filters }, 'Failed to fetch leads.');
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
        // Send email to tell admin about the new lead.
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
      // Make sure lead exists before update.
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
      // Make sure lead exists before delete.
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
