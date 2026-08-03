import { getStripeClient } from './client.js';

type EnsureStripeCustomerInput = {
  clientId: string;
  stripeCustomerId?: string | null;
  name: string;
  email: string;
};

export const ensureStripeCustomer = async ({ clientId, stripeCustomerId, name, email }: EnsureStripeCustomerInput) => {
  const stripe = getStripeClient();

  if (stripeCustomerId) {
    const customer = await stripe.customers.retrieve(stripeCustomerId);

    if (!customer.deleted) {
      return customer;
    }
  }

  return await stripe.customers.create(
    {
      name,
      email,
      metadata: {
        clientId
      }
    },
    {
      idempotencyKey: `client:${clientId}:stripe-customer:${stripeCustomerId ?? 'initial'}`
    }
  );
};
