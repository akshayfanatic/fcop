import type { IncomingHttpHeaders } from 'node:http';
import { ProposalStatus } from '../generated/prisma/client.js';
import { getSessionMember } from '../lib/auth/session.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import { ensureStripeCustomer } from '../lib/stripe/customer.js';
import { createAndSendProposalInvoice } from '../lib/stripe/invoice.js';
import { HttpStatus } from '../utils/api-response.js';
import { createHttpError } from '../utils/http-error.js';
import { isClientRole } from '../utils/role.js';
import type { CreateProposalInput, UpdateProposalInput } from '../validators/proposal.validator.js';

const getServiceRequestForProposal = async (serviceRequestId: string, headers: IncomingHttpHeaders) => {
  const member = await getSessionMember(headers);
  const request = await prisma.serviceRequest.findUnique({
    where: {
      id: serviceRequestId
    },
    include: {
      proposal: true,
      client: {
        include: {
          member: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      },
      project: {
        select: {
          id: true
        }
      }
    }
  });

  if (!request) {
    throw createHttpError(HttpStatus.NOT_FOUND, 'Service request not found.', 'SERVICE_REQUEST_NOT_FOUND');
  }

  // Restrict clients to proposals attached to their own service requests.
  if (isClientRole(member.role) && request.clientId !== member.client?.id) {
    throw createHttpError(HttpStatus.NOT_FOUND, 'Service request not found.', 'SERVICE_REQUEST_NOT_FOUND');
  }

  return {
    member,
    request
  };
};

export const proposalService = {
  createProposal: async (serviceRequestId: string, payload: CreateProposalInput, headers: IncomingHttpHeaders) => {
    try {
      const { member, request } = await getServiceRequestForProposal(serviceRequestId, headers);

      if (request.proposal) {
        throw createHttpError(HttpStatus.CONFLICT, 'Proposal already exists for this service request.', 'PROPOSAL_ALREADY_EXISTS');
      }

      if (request.project) {
        throw createHttpError(HttpStatus.CONFLICT, 'A project already exists for this service request.', 'PROJECT_ALREADY_EXISTS');
      }

      return await prisma.proposal.create({
        data: {
          serviceRequestId: request.id,
          createdByMemberId: member.id,
          description: payload.description,
          amount: payload.amount,
          currency: payload.currency
        }
      });
    } catch (error) {
      logger.error({ error, serviceRequestId }, 'Failed to create proposal.');
      throw error;
    }
  },

  getProposal: async (serviceRequestId: string, headers: IncomingHttpHeaders) => {
    try {
      const { request } = await getServiceRequestForProposal(serviceRequestId, headers);

      if (!request.proposal) {
        throw createHttpError(HttpStatus.NOT_FOUND, 'Proposal not found.', 'PROPOSAL_NOT_FOUND');
      }

      return request.proposal;
    } catch (error) {
      logger.error({ error, serviceRequestId }, 'Failed to fetch proposal.');
      throw error;
    }
  },

  updateProposal: async (serviceRequestId: string, payload: UpdateProposalInput, headers: IncomingHttpHeaders) => {
    try {
      const { member, request } = await getServiceRequestForProposal(serviceRequestId, headers);
      const proposal = request.proposal;

      if (!proposal) {
        throw createHttpError(HttpStatus.NOT_FOUND, 'Proposal not found.', 'PROPOSAL_NOT_FOUND');
      }

      if (isClientRole(member.role)) {
        // Allow clients to update only the acceptance state of their own sent proposal.
        if (Object.keys(payload).some((key) => key !== 'status') || payload.status !== ProposalStatus.ACCEPTED) {
          throw createHttpError(HttpStatus.FORBIDDEN, 'Clients can only accept proposals.', 'PROPOSAL_UPDATE_FORBIDDEN');
        }

        if (proposal.status === ProposalStatus.ACCEPTED && proposal.stripeInvoiceId) {
          return proposal;
        }

        if (proposal.status !== ProposalStatus.SENT && proposal.status !== ProposalStatus.ACCEPTED) {
          throw createHttpError(HttpStatus.CONFLICT, 'Only a sent proposal can be accepted.', 'PROPOSAL_NOT_SENT');
        }

        const acceptedProposal =
          proposal.status === ProposalStatus.ACCEPTED
            ? proposal
            : await prisma.proposal.update({
                where: {
                  id: proposal.id
                },
                data: {
                  status: ProposalStatus.ACCEPTED,
                  acceptedAt: new Date()
                }
              });

        // Create or recover the Stripe customer before issuing the accepted proposal invoice.
        const stripeCustomer = await ensureStripeCustomer({
          clientId: request.client.id,
          stripeCustomerId: request.client.stripeCustomerId,
          name: request.client.member.user.name,
          email: request.client.member.user.email
        });

        if (request.client.stripeCustomerId !== stripeCustomer.id) {
          await prisma.client.update({
            where: {
              id: request.client.id
            },
            data: {
              stripeCustomerId: stripeCustomer.id
            }
          });
        }

        // Send one idempotent Stripe invoice for the final accepted commercial terms.
        const invoice = await createAndSendProposalInvoice({
          proposalId: acceptedProposal.id,
          serviceRequestId: request.id,
          clientId: request.client.id,
          stripeCustomerId: stripeCustomer.id,
          description: acceptedProposal.description,
          amount: acceptedProposal.amount,
          currency: acceptedProposal.currency
        });

        return await prisma.proposal.update({
          where: {
            id: acceptedProposal.id
          },
          data: {
            stripeInvoiceId: invoice.id,
            stripeInvoiceNumber: invoice.number,
            stripeHostedInvoiceUrl: invoice.hosted_invoice_url,
            stripeInvoicePdfUrl: invoice.invoice_pdf
          }
        });
      }

      // Lock the agreed commercial terms after the client accepts the proposal.
      if (proposal.status === ProposalStatus.ACCEPTED) {
        throw createHttpError(HttpStatus.CONFLICT, 'Accepted proposal cannot be changed.', 'PROPOSAL_ALREADY_ACCEPTED');
      }

      if (payload.status) {
        if (payload.status === ProposalStatus.ACCEPTED) {
          throw createHttpError(HttpStatus.FORBIDDEN, 'Only the client can accept a proposal.', 'PROPOSAL_ACCEPTANCE_FORBIDDEN');
        }
      }

      return await prisma.proposal.update({
        where: {
          id: proposal.id
        },
        data: {
          description: payload.description,
          amount: payload.amount,
          currency: payload.currency,
          // Require management to resend changed commercial terms unless this update explicitly sends them.
          status: payload.status ?? ProposalStatus.DRAFT
        }
      });
    } catch (error) {
      logger.error({ error, serviceRequestId }, 'Failed to update proposal.');
      throw error;
    }
  },

  deleteProposal: async (serviceRequestId: string, headers: IncomingHttpHeaders) => {
    try {
      const { member, request } = await getServiceRequestForProposal(serviceRequestId, headers);
      const proposal = request.proposal;

      // Reserve proposal removal for management roles.
      if (isClientRole(member.role)) {
        throw createHttpError(HttpStatus.FORBIDDEN, 'Clients cannot delete proposals.', 'PROPOSAL_DELETE_FORBIDDEN');
      }

      if (!proposal) {
        throw createHttpError(HttpStatus.NOT_FOUND, 'Proposal not found.', 'PROPOSAL_NOT_FOUND');
      }

      // Preserve accepted agreements as immutable business records.
      if (proposal.status === ProposalStatus.ACCEPTED) {
        throw createHttpError(HttpStatus.CONFLICT, 'Accepted proposal cannot be deleted.', 'PROPOSAL_ALREADY_ACCEPTED');
      }

      return await prisma.proposal.delete({
        where: {
          id: proposal.id
        }
      });
    } catch (error) {
      logger.error({ error, serviceRequestId }, 'Failed to delete proposal.');
      throw error;
    }
  }
};
