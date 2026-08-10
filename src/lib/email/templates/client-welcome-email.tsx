import { BaseEmail } from '../components/base-email.js';
import { emailStyles } from '../styles.js';
import type { EmailTemplate } from '../types.js';

type ClientWelcomeEmailProps = {
  userName: string;
  organizationName: string;
  dashboardUrl: string;
};

export const createClientWelcomeEmailTemplate = ({ userName, organizationName, dashboardUrl }: ClientWelcomeEmailProps): EmailTemplate => ({
  subject: `Welcome to ${organizationName}, ${userName}`,
  react: (
    <BaseEmail previewText={`Your ${organizationName} account is ready.`}>
      <h1 style={emailStyles.heading}>Welcome to {organizationName}</h1>
      <p style={emailStyles.text}>Hi {userName},</p>
      <p style={emailStyles.text}>
        Your invitation has been accepted and your client account is ready. You can now submit service requests and follow your projects, tasks, proposals, and payments from one place.
      </p>
      <p style={emailStyles.text}>
        <a href={dashboardUrl} style={emailStyles.button}>
          Open your dashboard
        </a>
      </p>
      <p style={emailStyles.lastText}>We look forward to building with you.</p>
    </BaseEmail>
  ),
  text: [
    `Welcome to ${organizationName}, ${userName}`,
    'Your invitation has been accepted and your client account is ready.',
    'Submit service requests and follow your projects, tasks, proposals, and payments from your dashboard.',
    `Open your dashboard: ${dashboardUrl}`,
    'We look forward to building with you.'
  ].join('\n')
});
