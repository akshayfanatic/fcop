import type { Lead } from '../../../generated/prisma/client.js';
import { BaseEmail } from '../components/base-email.js';
import { emailStyles } from '../styles.js';
import type { EmailTemplate } from '../types.js';

type NewLeadEmailProps = {
  lead: Lead;
};

export const createNewLeadEmailTemplate = ({ lead }: NewLeadEmailProps): EmailTemplate => ({
  subject: `New FCOP lead: ${lead.name}`,
  react: (
    <BaseEmail previewText={`New lead from ${lead.name}`}>
      <h1 style={emailStyles.heading}>New lead captured</h1>
      <p style={emailStyles.text}>Name: {lead.name}</p>
      <p style={emailStyles.text}>Email: {lead.email}</p>
      <p style={emailStyles.text}>Company: {lead.companyName ?? 'Not provided'}</p>
      <p style={emailStyles.text}>Service: {lead.serviceInterest}</p>
      <p style={emailStyles.lastText}>Budget: {lead.budgetRange ?? 'Not provided'}</p>
    </BaseEmail>
  ),
  text: [
    'New lead captured',
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    `Company: ${lead.companyName ?? 'Not provided'}`,
    `Service: ${lead.serviceInterest}`,
    `Budget: ${lead.budgetRange ?? 'Not provided'}`
  ].join('\n')
});
