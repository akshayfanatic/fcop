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

export const createInvitationEmailTemplate = ({ acceptUrl, invitedEmail, inviterName, organizationName, role }: InvitationEmailProps): EmailTemplate => ({
  subject: `You're invited to ${organizationName}`,
  react: (
    <BaseEmail previewText={`You've been invited to join ${organizationName}.`}>
      <h1 style={emailStyles.heading}>Join {organizationName}</h1>
      <p style={emailStyles.text}>
        {inviterName} invited {invitedEmail} to join {organizationName} as {role}.
      </p>
      <p style={emailStyles.text}>
        <a href={acceptUrl} style={emailStyles.button}>
          Accept invitation
        </a>
      </p>
      <p style={emailStyles.lastText}>
        If the button does not work, use this link:{' '}
        <a href={acceptUrl} style={emailStyles.link}>
          {acceptUrl}
        </a>
      </p>
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
