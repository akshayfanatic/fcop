import type { IncomingHttpHeaders } from 'node:http';
import type { Prisma } from '../generated/prisma/client.js';
import { getSessionMember } from '../lib/auth/session.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import type { PaymentListItem } from '../types/payment.js';
import { createPaginatedData, getPaginationOffset } from '../utils/pagination.js';
import { isClientRole } from '../utils/role.js';
import type { PaymentFiltersInput } from '../validators/payment.validator.js';

const paymentSelect = {
  id: true,
  serviceRequestId: true,
  description: true,
  amount: true,
  currency: true,
  paymentStatus: true,
  paidAt: true,
  stripeInvoiceId: true,
  stripeInvoiceNumber: true,
  stripeHostedInvoiceUrl: true,
  stripeInvoicePdfUrl: true,
  createdAt: true,
  updatedAt: true,
  serviceRequest: {
    select: {
      client: {
        select: {
          id: true,
          name: true,
          member: {
            select: {
              user: {
                select: {
                  email: true
                }
              }
            }
          }
        }
      }
    }
  }
} satisfies Prisma.ProposalSelect;

export const paymentService = {
  getPayments: async (filters: PaymentFiltersInput, headers: IncomingHttpHeaders) => {
    try {
      const member = await getSessionMember(headers);
      const where: Prisma.ProposalWhereInput = {
        stripeInvoiceId: {
          not: null
        },
        paymentStatus: filters.status,
        serviceRequest: {
          clientId: isClientRole(member.role) ? member.client?.id : undefined,
          client: filters.search
            ? {
                OR: [
                  {
                    name: {
                      contains: filters.search
                    }
                  },
                  {
                    member: {
                      user: {
                        email: {
                          contains: filters.search
                        }
                      }
                    }
                  }
                ]
              }
            : undefined
        }
      };

      const [payments, totalItems] = await Promise.all([
        prisma.proposal.findMany({
          where,
          orderBy: [
            {
              paidAt: 'desc'
            },
            {
              createdAt: 'desc'
            }
          ],
          skip: getPaginationOffset(filters),
          take: filters.pageSize,
          select: paymentSelect
        }),
        prisma.proposal.count({ where })
      ]);

      const items: PaymentListItem[] = payments.map((payment) => {
        if (!payment.stripeInvoiceId) {
          throw new Error(`Payment proposal ${payment.id} has no Stripe invoice ID.`);
        }

        return {
          id: payment.id,
          proposalId: payment.id,
          serviceRequestId: payment.serviceRequestId,
          client: {
            id: payment.serviceRequest.client.id,
            name: payment.serviceRequest.client.name,
            email: payment.serviceRequest.client.member.user.email
          },
          description: payment.description,
          amount: payment.amount.toFixed(2),
          currency: payment.currency,
          status: payment.paymentStatus,
          paidAt: payment.paidAt,
          stripeInvoiceId: payment.stripeInvoiceId,
          stripeInvoiceNumber: payment.stripeInvoiceNumber,
          stripeHostedInvoiceUrl: payment.stripeHostedInvoiceUrl,
          stripeInvoicePdfUrl: payment.stripeInvoicePdfUrl,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt
        };
      });

      return createPaginatedData({
        items,
        page: filters.page,
        pageSize: filters.pageSize,
        totalItems
      });
    } catch (error) {
      logger.error({ error }, 'Failed to fetch payments.');
      throw error;
    }
  }
};
