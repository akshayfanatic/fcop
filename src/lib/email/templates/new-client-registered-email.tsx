import { BaseEmail } from '../components/base-email.js';
import { EmailIntro, EmailMetadata, EmailSummary } from '../components/email-content.js';
import type { EmailTemplate } from '../types.js';

type NewClientRegisteredEmailProps = {
  clientId: string;
  memberId: string;
  userName: string;
  userEmail: string;
  organizationName: string;
};

export const createNewClientRegisteredEmailTemplate = ({ clientId, memberId, userName, userEmail, organizationName }: NewClientRegisteredEmailProps): EmailTemplate => ({
  subject: `New client registered: ${userName}`,
  react: (
    <BaseEmail previewText={`${userName} registered as a new client in ${organizationName}.`} category="CLIENT">
      <EmailIntro context="Admin notification" title="New client registered">
        A new client account was created and joined the {organizationName} workspace.
      </EmailIntro>
      <EmailSummary
        label="CLIENT"
        title={userName}
        items={[
          { label: 'Email', value: userEmail },
          { label: 'Organization', value: organizationName }
        ]}
      />
      <EmailMetadata>
        Client ID: {clientId} · Member ID: {memberId}
      </EmailMetadata>
    </BaseEmail>
  ),
  text: ['New client registered', `${userName} (${userEmail}) registered and joined ${organizationName} as a client.`, `Client ID: ${clientId}`, `Member ID: ${memberId}`].join('\n')
});
