import type { ProjectCurrency } from '../../../generated/prisma/client.js';
import { BaseEmail } from '../components/base-email.js';
import { emailStyles } from '../styles.js';
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
    <BaseEmail previewText={`We received your payment for ${props.serviceLabel}.`}>
      <h1 style={emailStyles.heading}>Payment received</h1>
      <p style={emailStyles.text}>Hi {props.recipientName},</p>
      <p style={emailStyles.text}>We received your payment successfully. Your service request now reflects the completed payment.</p>
      <p style={emailStyles.text}>Service: {props.serviceLabel}</p>
      <p style={emailStyles.text}>
        Amount: {props.currency} {props.amount}
      </p>
      {props.invoiceNumber && <p style={emailStyles.text}>Invoice: {props.invoiceNumber}</p>}
      <p style={emailStyles.text}>
        <a href={props.serviceRequestUrl} style={emailStyles.button}>
          View service request
        </a>
      </p>
      <p style={emailStyles.lastText}>Thank you for your payment.</p>
    </BaseEmail>
  ),
  text: ['Payment received', `Hi ${props.recipientName},`, 'We received your payment successfully.', ...paymentDetails(props), 'Thank you for your payment.'].join('\n')
});

export const createAdminPaymentReceivedEmailTemplate = (props: PaymentReceivedEmailProps): EmailTemplate => ({
  subject: `Payment received from ${props.clientName}`,
  react: (
    <BaseEmail previewText={`${props.clientName} completed a payment for ${props.serviceLabel}.`}>
      <h1 style={emailStyles.heading}>Customer payment received</h1>
      <p style={emailStyles.text}>Hi {props.recipientName},</p>
      <p style={emailStyles.text}>
        {props.clientName} completed payment for {props.serviceLabel}.
      </p>
      <p style={emailStyles.text}>
        Amount: {props.currency} {props.amount}
      </p>
      {props.invoiceNumber && <p style={emailStyles.text}>Invoice: {props.invoiceNumber}</p>}
      <p style={emailStyles.text}>
        <a href={props.serviceRequestUrl} style={emailStyles.button}>
          Review service request
        </a>
      </p>
      <p style={emailStyles.lastText}>The proposal payment status is now marked as paid.</p>
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
