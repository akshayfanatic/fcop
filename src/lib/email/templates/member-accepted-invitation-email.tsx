import { BaseEmail } from '../components/base-email.js';
import { EmailIntro, EmailMetadata, EmailSummary } from '../components/email-content.js';
import type { EmailTemplate } from '../types.js';

type MemberAcceptedInvitationEmailProps = {
  userName: string;
  userEmail: string;
  organizationName: string;
  role: string;
  memberId: string;
  invitationId: string;
};

export const createMemberAcceptedInvitationEmailTemplate = ({ userName, userEmail, organizationName, role, memberId, invitationId }: MemberAcceptedInvitationEmailProps): EmailTemplate => ({
  subject: `Invitation accepted: ${userName}`,
  react: (
    <BaseEmail previewText={`${userName} accepted an invitation to ${organizationName}.`} category="MEMBER">
      <EmailIntro context="Admin notification" title="Invitation accepted">
        {userName} accepted an invitation and joined the {organizationName} workspace.
      </EmailIntro>
      <EmailSummary
        label="NEW MEMBER"
        title={userName}
        items={[
          { label: 'Email', value: userEmail },
          { label: 'Role', value: role }
        ]}
      />
      <EmailMetadata>
        Member ID: {memberId} · Invitation ID: {invitationId}
      </EmailMetadata>
    </BaseEmail>
  ),
  text: ['Invitation accepted', `${userName} (${userEmail}) accepted an invitation to join ${organizationName}.`, `Role: ${role}`, `Member ID: ${memberId}`, `Invitation ID: ${invitationId}`].join(
    '\n'
  )
});
