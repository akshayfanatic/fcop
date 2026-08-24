import type { Prisma } from '../../../generated/prisma/client.js';
import { SERVICE_INTEREST_OPTIONS } from '../../../constants/enum.js';
import { getOptionLabel } from '../../../utils/options.js';
import { BaseEmail } from '../components/base-email.js';
import { EmailIntro, EmailMetadata, EmailSummary } from '../components/email-content.js';
import type { EmailTemplate } from '../types.js';

type NewServiceRequest = Prisma.ServiceRequestGetPayload<{
  include: {
    client: {
      include: {
        member: {
          include: {
            user: {
              select: {
                id: true;
                name: true;
                email: true;
              };
            };
            organization: {
              select: {
                id: true;
                name: true;
                slug: true;
              };
            };
          };
        };
      };
    };
  };
}>;

type NewServiceRequestEmailProps = {
  request: NewServiceRequest;
};

export const createNewServiceRequestEmailTemplate = ({ request }: NewServiceRequestEmailProps): EmailTemplate => {
  const user = request.client.member.user;
  const serviceLabel = getOptionLabel(SERVICE_INTEREST_OPTIONS, request.service);
  const createdAt = request.createdAt.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  return {
    subject: `New service request: ${serviceLabel}`,
    react: (
      <BaseEmail previewText={`New service request from ${request.client.name}`} category="REQUEST">
        <EmailIntro context="Admin notification" title="New service request submitted">
          A client submitted a new service request that is ready for review.
        </EmailIntro>
        <EmailSummary
          label="REQUEST"
          title={serviceLabel}
          items={[
            { label: 'Client', value: request.client.name },
            { label: 'Email', value: user.email },
            { label: 'Submitted', value: createdAt }
          ]}
        />
        <EmailMetadata>Request ID: {request.id}</EmailMetadata>
      </BaseEmail>
    ),
    text: ['New service request submitted', `Client: ${request.client.name}`, `Email: ${user.email}`, `Service: ${serviceLabel}`, `Submitted: ${createdAt}`, `Request ID: ${request.id}`].join('\n')
  };
};
