import { BaseEmail } from '../components/base-email.js';
import { EmailAction, EmailIntro, EmailMetadata } from '../components/email-content.js';
import type { EmailTemplate } from '../types.js';

type InvitationEmailProps = {
  acceptUrl: string;
  invitedEmail: string;
  inviterName: string;
  organizationName: string;
  role: string;
};

export const createInvitationEmailTemplate = ({ acceptUrl, organizationName }: InvitationEmailProps): EmailTemplate => ({
  subject: `You're invited to ${organizationName}`,
  react: (
    <BaseEmail previewText={`You've been invited to join ${organizationName}.`} category="INVITATION">
      <EmailIntro context={organizationName} title="You're invited">
        You have been invited to join the {organizationName} workspace. Accept the invitation to get started.
      </EmailIntro>
      <EmailAction href={acceptUrl}>Accept invitation</EmailAction>
      <EmailMetadata>If you were not expecting this invitation, you can ignore this email.</EmailMetadata>
    </BaseEmail>
  ),
  text: [
    `You're invited to ${organizationName}`,
    '',
    `You have been invited to join the ${organizationName} workspace.`,
    `Accept invitation: ${acceptUrl}`,
    '',
    'If you did not expect this invitation, you can ignore this email.'
  ].join('\n')
});
