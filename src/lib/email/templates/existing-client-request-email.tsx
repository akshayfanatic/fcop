import { SERVICE_INTEREST_OPTIONS } from '../../../constants/enum.js';
import type { ServiceInterest } from '../../../generated/prisma/client.js';
import { getOptionLabel } from '../../../utils/options.js';
import { BaseEmail } from '../components/base-email.js';
import { emailStyles } from '../styles.js';
import type { EmailTemplate } from '../types.js';

type ExistingClientRequestEmailProps = {
  clientName: string;
  requestUrl: string;
  serviceInterest: ServiceInterest;
};

const buttonStyle = {
  display: 'inline-block',
  backgroundColor: '#111827',
  color: '#ffffff',
  padding: '12px 18px',
  borderRadius: '6px',
  fontSize: '15px',
  fontWeight: 700,
  textDecoration: 'none'
};

export const createExistingClientRequestEmailTemplate = ({ clientName, requestUrl, serviceInterest }: ExistingClientRequestEmailProps): EmailTemplate => {
  const serviceLabel = getOptionLabel(SERVICE_INTEREST_OPTIONS, serviceInterest);

  return {
    subject: 'Continue your service request',
    react: (
      <BaseEmail previewText="Continue your request from your client account.">
        <h1 style={emailStyles.heading}>Continue your service request</h1>
        <p style={emailStyles.text}>
          Hi {clientName}, we received your request for {serviceLabel}. Sign in to your account to review and submit it.
        </p>
        <p style={emailStyles.text}>
          <a href={requestUrl} style={buttonStyle}>
            Continue request
          </a>
        </p>
        <p style={emailStyles.lastText}>If you did not make this request, you can ignore this email.</p>
      </BaseEmail>
    ),
    text: [
      'Continue your service request',
      '',
      `Hi ${clientName}, we received your request for ${serviceLabel}.`,
      `Sign in to review and submit it: ${requestUrl}`,
      '',
      'If you did not make this request, you can ignore this email.'
    ].join('\n')
  };
};
