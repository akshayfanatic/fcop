import { SERVICE_INTEREST_OPTIONS } from '../../../constants/enum.js';
import type { ServiceInterest } from '../../../generated/prisma/client.js';
import { getOptionLabel } from '../../../utils/options.js';
import { BaseEmail } from '../components/base-email.js';
import { EmailAction, EmailIntro, EmailMetadata, EmailSummary } from '../components/email-content.js';
import type { EmailTemplate } from '../types.js';

type ServiceRequestReceivedEmailProps = {
  recipientName: string;
  requestId: string;
  requestUrl: string;
  service: ServiceInterest;
  submittedAt: Date;
};

export const createServiceRequestReceivedEmailTemplate = ({ recipientName, requestId, requestUrl, service, submittedAt }: ServiceRequestReceivedEmailProps): EmailTemplate => {
  const serviceLabel = getOptionLabel(SERVICE_INTEREST_OPTIONS, service);
  const submittedLabel = submittedAt.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  return {
    subject: `We received your ${serviceLabel} request`,
    react: (
      <BaseEmail previewText="We received your request. Start a conversation with our team in the request chat." category="SERVICE REQUEST">
        <EmailIntro context="Request received" title={`Hi, ${recipientName}`}>
          We’ve received your {serviceLabel} request. You can start a conversation in the request chat. Our team will respond shortly.
        </EmailIntro>
        <EmailSummary
          label="REQUEST"
          title={serviceLabel}
          items={[
            { label: 'Status', value: 'Received' },
            { label: 'Submitted', value: submittedLabel }
          ]}
        />
        <EmailAction href={requestUrl}>Open request chat</EmailAction>
        <EmailMetadata>Request ID: {requestId}</EmailMetadata>
      </BaseEmail>
    ),
    text: [
      `Hi, ${recipientName}`,
      `We've received your ${serviceLabel} request. You can start a conversation in the request chat. Our team will respond shortly.`,
      `Submitted: ${submittedLabel}`,
      `Open request chat: ${requestUrl}`,
      `Request ID: ${requestId}`
    ].join('\n')
  };
};
