import { BaseEmail } from '../components/base-email.js';
import { EmailAction, EmailIntro, EmailMetadata } from '../components/email-content.js';
import type { EmailTemplate } from '../types.js';

type ClientWelcomeEmailProps = {
  userName: string;
  organizationName: string;
  dashboardUrl: string;
};

export const createClientWelcomeEmailTemplate = ({ userName, organizationName, dashboardUrl }: ClientWelcomeEmailProps): EmailTemplate => ({
  subject: `Welcome to ${organizationName}, ${userName}`,
  react: (
    <BaseEmail previewText={`Your ${organizationName} account is ready.`} category="WELCOME">
      <EmailIntro context="Your account is ready" title={`Welcome to ${organizationName}`}>
        Hi {userName}, your client account is ready. You can now submit service requests and follow your projects, tasks, proposals, and payments.
      </EmailIntro>
      <EmailAction href={dashboardUrl}>Open your dashboard</EmailAction>
      <EmailMetadata>We look forward to working with you.</EmailMetadata>
    </BaseEmail>
  ),
  text: [
    `Welcome to ${organizationName}, ${userName}`,
    'Your client account is ready.',
    'Submit service requests and follow your projects, tasks, proposals, and payments from your dashboard.',
    `Open your dashboard: ${dashboardUrl}`,
    'We look forward to building with you.'
  ].join('\n')
});
