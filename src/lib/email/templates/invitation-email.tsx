import { BaseEmail } from '../components/base-email.js';
import { emailStyles } from '../styles.js';
import type { EmailTemplate } from '../types.js';

type InvitationEmailProps = {
  acceptUrl: string;
  invitedEmail: string;
  inviterName: string;
  organizationName: string;
  role: string;
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

export const createInvitationEmailTemplate = ({ acceptUrl, invitedEmail, inviterName, organizationName, role }: InvitationEmailProps): EmailTemplate => ({
  subject: `You're invited to ${organizationName}`,
  react: (
    <BaseEmail previewText={`You've been invited to join ${organizationName}.`}>
      <h1 style={emailStyles.heading}>Join {organizationName}</h1>
      <p style={emailStyles.text}>
        {inviterName} invited {invitedEmail} to join {organizationName} as {role}.
      </p>
      <p style={emailStyles.text}>
        <a href={acceptUrl} style={buttonStyle}>
          Accept invitation
        </a>
      </p>
      <p style={emailStyles.lastText}>If the button does not work, copy and paste this link into your browser: {acceptUrl}</p>
    </BaseEmail>
  ),
  text: [
    `Join ${organizationName}`,
    '',
    `${inviterName} invited ${invitedEmail} to join ${organizationName} as ${role}.`,
    `Accept invitation: ${acceptUrl}`,
    '',
    'If you did not expect this invitation, you can ignore this email.'
  ].join('\n')
});
