import type { ProjectCurrency, ProposalPaymentStatus } from '../generated/prisma/client.js';

export type PaymentListItem = {
  id: string;
  proposalId: string;
  serviceRequestId: string;
  client: {
    id: string;
    name: string;
    email: string;
  };
  description: string;
  amount: string;
  currency: ProjectCurrency;
  status: ProposalPaymentStatus;
  paidAt: Date | null;
  stripeInvoiceId: string;
  stripeInvoiceNumber: string | null;
  stripeHostedInvoiceUrl: string | null;
  stripeInvoicePdfUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};
