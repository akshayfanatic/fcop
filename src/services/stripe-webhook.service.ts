import type Stripe from 'stripe';
import { env } from '../config/env.js';
import { ProposalPaymentStatus } from '../generated/prisma/client.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import { getStripeClient } from '../lib/stripe/client.js';
import { HttpStatus } from '../utils/api-response.js';
import { createHttpError } from '../utils/http-error.js';

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

const handleInvoicePaid = async (event: Stripe.InvoicePaidEvent) => {
  const invoice = event.data.object;
  const proposal = await prisma.proposal.findUnique({
    where: {
      stripeInvoiceId: invoice.id
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
