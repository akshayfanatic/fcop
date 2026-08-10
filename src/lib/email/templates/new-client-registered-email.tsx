import { BaseEmail } from '../components/base-email.js';
import { emailStyles } from '../styles.js';
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
    <BaseEmail previewText={`${userName} registered as a new client in ${organizationName}.`}>
      <h1 style={emailStyles.heading}>New client registered</h1>
      <p style={emailStyles.text}>
        {userName} ({userEmail}) registered and joined {organizationName} as a client.
      </p>
      <p style={emailStyles.text}>Client ID: {clientId}</p>
      <p style={emailStyles.lastText}>Member ID: {memberId}</p>
    </BaseEmail>
  ),
  text: ['New client registered', `${userName} (${userEmail}) registered and joined ${organizationName} as a client.`, `Client ID: ${clientId}`, `Member ID: ${memberId}`].join('\n')
});
