import type Stripe from 'stripe';
import { SERVICE_INTEREST_OPTIONS } from '../constants/enum.js';
import { env } from '../config/env.js';
import { ProposalPaymentStatus, type ProjectCurrency } from '../generated/prisma/client.js';
import { Role } from '../lib/auth/permissions.js';
import { createAdminPaymentReceivedEmailTemplate, createClientPaymentReceivedEmailTemplate, sendTemplateEmail } from '../lib/email/index.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import { getStripeClient } from '../lib/stripe/client.js';
import { HttpStatus } from '../utils/api-response.js';
import { createHttpError } from '../utils/http-error.js';
import { getOptionLabel } from '../utils/options.js';
import { notificationService } from './notification.service.js';

const constructStripeEvent = (payload: Buffer, signature: string) => {
  if (!env.stripeWebhookSecret) {
    throw createHttpError(HttpStatus.INTERNAL_ERROR, 'Stripe webhook secret is not configured.', 'STRIPE_WEBHOOK_NOT_CONFIGURED');
  }

  try {
    // Verify the signature before trusting payment state from Stripe.
    return getStripeClient().webhooks.constructEvent(payload, signature, env.stripeWebhookSecret);
  } catch {
    throw createHttpError(HttpStatus.BAD_REQUEST, 'Invalid Stripe webhook signature.', 'INVALID_STRIPE_SIGNATURE');
  }
};

type PaymentRecipient = {
  memberId: string;
  name: string;
  email: string;
  audience: 'client' | 'admin';
};

type PaymentDetails = {
  serviceRequestId: string;
  clientName: string;
  serviceLabel: string;
  amount: string;
  currency: ProjectCurrency;
  invoiceNumber: string | null;
};

const sendPaymentReceivedEmails = async (recipients: PaymentRecipient[], payment: PaymentDetails) => {
  const serviceRequestUrl = new URL(`/dashboard/services/${payment.serviceRequestId}`, env.frontendUrl).toString();

  await Promise.all(
    recipients.map(async (recipient) => {
      try {
        const templateInput = {
          recipientName: recipient.name,
          clientName: payment.clientName,
          serviceLabel: payment.serviceLabel,
          amount: payment.amount,
          currency: payment.currency,
          serviceRequestUrl,
          invoiceNumber: payment.invoiceNumber
        };

        // Send payment confirmation to each affected customer or administrator.
        await sendTemplateEmail({
          to: recipient.email,
          template: recipient.audience === 'client' ? createClientPaymentReceivedEmailTemplate(templateInput) : createAdminPaymentReceivedEmailTemplate(templateInput)
        });
      } catch (error) {
        logger.error({ error, memberId: recipient.memberId, serviceRequestId: payment.serviceRequestId }, 'Failed to send payment received email.');
      }
    })
  );
};

const createPaymentReceivedNotifications = async (clientMemberId: string, adminMemberIds: string[], payment: PaymentDetails) => {
  const link = `/dashboard/services/${payment.serviceRequestId}`;
  const amount = `${payment.currency} ${payment.amount}`;

  await Promise.all([
    notificationService.createForMembers({
      memberIds: [clientMemberId],
      title: 'Payment received',
      message: `Your payment of ${amount} for ${payment.serviceLabel} was received successfully.`,
      link
    }),
    notificationService.createForMembers({
      memberIds: adminMemberIds,
      title: 'Customer payment received',
      message: `${payment.clientName} paid ${amount} for ${payment.serviceLabel}.`,
      link
    })
  ]);
};

const handleInvoicePaid = async (event: Stripe.InvoicePaidEvent) => {
  const invoice = event.data.object;
  const proposal = await prisma.proposal.findUnique({
    where: {
      stripeInvoiceId: invoice.id
    },
    include: {
      serviceRequest: {
        include: {
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
          }
        }
      }
    }
  });

  if (!proposal) {
    logger.warn({ stripeEventId: event.id, stripeInvoiceId: invoice.id }, 'Paid Stripe invoice is not linked to a proposal.');
    return;
  }

  // Apply payment acknowledgement once even when Stripe retries the webhook.
  const result = await prisma.proposal.updateMany({
    where: {
      id: proposal.id,
      paymentStatus: ProposalPaymentStatus.UNPAID
    },
    data: {
      paymentStatus: ProposalPaymentStatus.PAID,
      paidAt: new Date(event.created * 1000)
    }
  });

  if (result.count === 1) {
    const clientMember = proposal.serviceRequest.client.member;
    const admins = await prisma.member.findMany({
      where: {
        organizationId: clientMember.organizationId,
        role: Role.ADMIN
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    const payment = {
      serviceRequestId: proposal.serviceRequestId,
      clientName: proposal.serviceRequest.client.name,
      serviceLabel: getOptionLabel(SERVICE_INTEREST_OPTIONS, proposal.serviceRequest.service),
      amount: proposal.amount.toString(),
      currency: proposal.currency,
      invoiceNumber: invoice.number
    } satisfies PaymentDetails;
    const recipients: PaymentRecipient[] = [
      {
        memberId: clientMember.id,
        name: clientMember.user.name,
        email: clientMember.user.email,
        audience: 'client'
      },
      ...admins.map((admin) => ({
        memberId: admin.id,
        name: admin.user.name,
        email: admin.user.email,
        audience: 'admin' as const
      }))
    ];

    // Tell the client and organization administrators that payment completed.
    await Promise.all([
      sendPaymentReceivedEmails(recipients, payment),
      createPaymentReceivedNotifications(
        clientMember.id,
        admins.map((admin) => admin.id),
        payment
      )
    ]);
  }

  logger.info(
    {
      stripeEventId: event.id,
      stripeInvoiceId: invoice.id,
      proposalId: proposal.id,
      paymentAcknowledged: result.count === 1
    },
    'Received paid Stripe invoice.'
  );
};

export const stripeWebhookService = {
  handleEvent: async (payload: Buffer, signature: string) => {
    const event = constructStripeEvent(payload, signature);

    switch (event.type) {
      case 'invoice.paid':
        await handleInvoicePaid(event);
        break;
      default:
        logger.debug({ stripeEventId: event.id, stripeEventType: event.type }, 'Ignored unhandled Stripe event.');
    }

    return event.id;
  }
};
