import type { Prisma } from '../../../generated/prisma/client.js';
import { SERVICE_INTEREST_OPTIONS } from '../../../constants/enum.js';
import { getOptionLabel } from '../../../utils/options.js';
import { BaseEmail } from '../components/base-email.js';
import { emailStyles } from '../styles.js';
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
      <BaseEmail previewText={`New service request from ${request.client.name}`}>
        <h1 style={emailStyles.heading}>New service request submitted</h1>
        <p style={emailStyles.text}>Client: {request.client.name}</p>
        <p style={emailStyles.text}>Email: {user.email}</p>
        <p style={emailStyles.text}>Service: {serviceLabel}</p>
        <p style={emailStyles.text}>Submitted: {createdAt}</p>
        <p style={emailStyles.lastText}>Request ID: {request.id}</p>
      </BaseEmail>
    ),
    text: ['New service request submitted', `Client: ${request.client.name}`, `Email: ${user.email}`, `Service: ${serviceLabel}`, `Submitted: ${createdAt}`, `Request ID: ${request.id}`].join('\n')
  };
};
