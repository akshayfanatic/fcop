import type { Lead } from '../../../generated/prisma/client.js';
import { BaseEmail } from '../components/base-email.js';
import { EmailIntro, EmailSummary } from '../components/email-content.js';
import type { EmailTemplate } from '../types.js';

type NewLeadEmailProps = {
  lead: Lead;
};

export const createNewLeadEmailTemplate = ({ lead }: NewLeadEmailProps): EmailTemplate => ({
  subject: `New FCOP lead: ${lead.name}`,
  react: (
    <BaseEmail previewText={`New lead from ${lead.name}`} category="LEAD">
      <EmailIntro context="Admin notification" title="New lead captured">
        A new contact-form lead is ready for qualification and follow-up.
      </EmailIntro>
      <EmailSummary
        label="LEAD"
        title={lead.name}
        items={[
          { label: 'Email', value: lead.email },
          { label: 'Company', value: lead.companyName ?? 'Not provided' },
          { label: 'Service', value: lead.serviceInterest },
          { label: 'Budget', value: lead.budgetRange ?? 'Not provided' }
        ]}
      />
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
