import type { ProjectCurrency } from '../../../generated/prisma/client.js';
import { BaseEmail } from '../components/base-email.js';
import { EmailAction, EmailIntro, EmailMetadata, EmailSummary } from '../components/email-content.js';
import type { EmailTemplate } from '../types.js';

type PaymentReceivedEmailProps = {
  recipientName: string;
  clientName: string;
  serviceLabel: string;
  amount: string;
  currency: ProjectCurrency;
  serviceRequestUrl: string;
  invoiceNumber: string | null;
};

const paymentDetails = ({ clientName, serviceLabel, amount, currency, serviceRequestUrl, invoiceNumber }: PaymentReceivedEmailProps) => [
  `Client: ${clientName}`,
  `Service: ${serviceLabel}`,
  `Amount: ${currency} ${amount}`,
  ...(invoiceNumber ? [`Invoice: ${invoiceNumber}`] : []),
  `View service request: ${serviceRequestUrl}`
];

export const createClientPaymentReceivedEmailTemplate = (props: PaymentReceivedEmailProps): EmailTemplate => ({
  subject: `Payment received for ${props.serviceLabel}`,
  react: (
    <BaseEmail previewText={`We received your payment for ${props.serviceLabel}.`} category="PAYMENT">
      <EmailIntro context="Payment confirmed" title="Payment received">
        Hi {props.recipientName}, your payment was received successfully. Your service request now shows the updated payment status.
      </EmailIntro>
      <EmailSummary
        label="AMOUNT"
        title={`${props.currency} ${props.amount}`}
        items={[{ label: 'Status', value: 'Paid' }, ...(props.invoiceNumber ? [{ label: 'Invoice', value: props.invoiceNumber }] : []), { label: 'Service', value: props.serviceLabel }]}
      />
      <EmailAction href={props.serviceRequestUrl}>View payment</EmailAction>
      <EmailMetadata>Thank you for your payment.</EmailMetadata>
    </BaseEmail>
  ),
  text: ['Payment received', `Hi ${props.recipientName},`, 'We received your payment successfully.', ...paymentDetails(props), 'Thank you for your payment.'].join('\n')
});

export const createAdminPaymentReceivedEmailTemplate = (props: PaymentReceivedEmailProps): EmailTemplate => ({
  subject: `Payment received from ${props.clientName}`,
  react: (
    <BaseEmail previewText={`${props.clientName} completed a payment for ${props.serviceLabel}.`} category="PAYMENT">
      <EmailIntro context="Admin notification" title="Customer payment received">
        Hi {props.recipientName}, {props.clientName} completed payment for {props.serviceLabel}.
      </EmailIntro>
      <EmailSummary
        label="PAYMENT"
        title={`${props.currency} ${props.amount}`}
        items={[{ label: 'Customer', value: props.clientName }, ...(props.invoiceNumber ? [{ label: 'Invoice', value: props.invoiceNumber }] : []), { label: 'Service', value: props.serviceLabel }]}
      />
      <EmailAction href={props.serviceRequestUrl}>Review payment</EmailAction>
      <EmailMetadata>The proposal payment status is now marked as paid.</EmailMetadata>
    </BaseEmail>
  ),
  text: [
    'Customer payment received',
    `Hi ${props.recipientName},`,
    `${props.clientName} completed payment for ${props.serviceLabel}.`,
    ...paymentDetails(props),
    'The proposal payment status is now marked as paid.'
  ].join('\n')
});
