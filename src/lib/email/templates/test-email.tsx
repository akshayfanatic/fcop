import type { EmailTemplate } from '../types.js';
import { BaseEmail } from '../components/base-email.js';
import { EmailIntro, EmailMetadata } from '../components/email-content.js';

type TestEmailProps = {
  recipientName?: string;
};

export const TestEmail = ({ recipientName = 'there' }: TestEmailProps) => (
  <BaseEmail previewText="Your FCOP email setup is working." category="SYSTEM">
    <EmailIntro context="Delivery test" title="Email setup works">
      Hi {recipientName}, Resend is configured and this message was sent through the FCOP backend email layer.
    </EmailIntro>
    <EmailMetadata>No action is required.</EmailMetadata>
  </BaseEmail>
);

export const createTestEmailTemplate = (params: TestEmailProps = {}): EmailTemplate => {
  const name = params.recipientName ?? 'there';

  return {
    subject: 'FCOP email integration test',
    react: TestEmail({ recipientName: name }),
    text: `Hi ${name},\n\nResend is configured and this message was sent through the FCOP backend email layer.`
  };
};
