import { env } from '../../config/env.js';
import { toMinorUnits, type DecimalAmount } from '../../utils/money.js';
import { getStripeClient } from './client.js';

type CreateProposalInvoiceInput = {
  proposalId: string;
  serviceRequestId: string;
  clientId: string;
  stripeCustomerId: string;
  description: string;
  amount: DecimalAmount;
  currency: string;
};

export const createAndSendProposalInvoice = async ({ proposalId, serviceRequestId, clientId, stripeCustomerId, description, amount, currency }: CreateProposalInvoiceInput) => {
  const stripe = getStripeClient();
  const metadata = {
    proposalId,
    serviceRequestId,
    clientId
  };

  const invoice = await stripe.invoices.create(
    {
      customer: stripeCustomerId,
      collection_method: 'send_invoice',
      days_until_due: env.stripeInvoiceDaysUntilDue,
      auto_advance: false,
      metadata
    },
    {
      idempotencyKey: `proposal:${proposalId}:invoice`
    }
  );

  await stripe.invoiceItems.create(
    {
      customer: stripeCustomerId,
      invoice: invoice.id,
      amount: toMinorUnits(amount),
      currency: currency.toLowerCase(),
      description,
      metadata
    },
    {
      idempotencyKey: `proposal:${proposalId}:invoice-item`
    }
  );

  return await stripe.invoices.sendInvoice(
    invoice.id,
    {},
    {
      idempotencyKey: `proposal:${proposalId}:send-invoice`
    }
  );
};
