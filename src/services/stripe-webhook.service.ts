import type Stripe from 'stripe';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
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

const handleInvoicePaid = (event: Stripe.InvoicePaidEvent) => {
  logger.info(
    {
      stripeEventId: event.id,
      stripeInvoiceId: event.data.object.id
    },
    'Received paid Stripe invoice.'
  );
};

export const stripeWebhookService = {
  handleEvent: (payload: Buffer, signature: string) => {
    const event = constructStripeEvent(payload, signature);

    switch (event.type) {
      case 'invoice.paid':
        handleInvoicePaid(event);
        break;
      default:
        logger.debug({ stripeEventId: event.id, stripeEventType: event.type }, 'Ignored unhandled Stripe event.');
    }

    return event.id;
  }
};
