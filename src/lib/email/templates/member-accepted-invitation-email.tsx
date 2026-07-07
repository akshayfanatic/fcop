import { BaseEmail } from '../components/base-email.js';
import { emailStyles } from '../styles.js';
import type { EmailTemplate } from '../types.js';

type MemberAcceptedInvitationEmailProps = {
  userName: string;
  userEmail: string;
  organizationName: string;
  role: string;
  memberId: string;
  invitationId: string;
};

export const createMemberAcceptedInvitationEmailTemplate = ({
  userName,
  userEmail,
  organizationName,
  role,
  memberId,
  invitationId
}: MemberAcceptedInvitationEmailProps): EmailTemplate => ({
  subject: `Invitation accepted: ${userName}`,
  react: (
    <BaseEmail previewText={`${userName} accepted an invitation to ${organizationName}.`}>
      <h1 style={emailStyles.heading}>Invitation accepted</h1>
      <p style={emailStyles.text}>
        {userName} ({userEmail}) accepted an invitation to join {organizationName}.
      </p>
      <p style={emailStyles.text}>Role: {role}</p>
      <p style={emailStyles.text}>Member ID: {memberId}</p>
      <p style={emailStyles.lastText}>Invitation ID: {invitationId}</p>
    </BaseEmail>
  ),
  text: [
    'Invitation accepted',
    `${userName} (${userEmail}) accepted an invitation to join ${organizationName}.`,
    `Role: ${role}`,
    `Member ID: ${memberId}`,
    `Invitation ID: ${invitationId}`
  ].join('\n')
});
