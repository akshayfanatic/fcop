import { SERVICE_INTEREST_OPTIONS } from '../../../constants/enum.js';
import type { ServiceInterest } from '../../../generated/prisma/client.js';
import { getOptionLabel } from '../../../utils/options.js';
import { BaseEmail } from '../components/base-email.js';
import { EmailAction, EmailIntro, EmailMetadata } from '../components/email-content.js';
import type { EmailTemplate } from '../types.js';

type ExistingClientRequestEmailProps = {
  clientName: string;
  requestUrl: string;
  serviceInterest: ServiceInterest;
};

export const createExistingClientRequestEmailTemplate = ({ clientName, requestUrl, serviceInterest }: ExistingClientRequestEmailProps): EmailTemplate => {
  const serviceLabel = getOptionLabel(SERVICE_INTEREST_OPTIONS, serviceInterest);

  return {
    subject: 'Continue your service request',
    react: (
      <BaseEmail previewText="Continue your request from your client account." category="SERVICE REQUEST">
        <EmailIntro context="Request saved" title="Continue your service request">
          Hi {clientName}, we received your request for {serviceLabel}. Sign in to review and submit it.
        </EmailIntro>
        <EmailAction href={requestUrl}>Continue request</EmailAction>
        <EmailMetadata>If you did not make this request, you can ignore this email.</EmailMetadata>
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
