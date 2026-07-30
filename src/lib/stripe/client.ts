import Stripe from 'stripe';
import { env } from '../../config/env.js';
import { HttpStatus } from '../../utils/api-response.js';
import { createHttpError } from '../../utils/http-error.js';

let stripeClient: Stripe | undefined;

export const getStripeClient = () => {
  if (!env.stripeSecretKey) {
    throw createHttpError(HttpStatus.INTERNAL_ERROR, 'Stripe secret key is not configured.', 'STRIPE_NOT_CONFIGURED');
  }

  stripeClient ??= new Stripe(env.stripeSecretKey);

  return stripeClient;
};
