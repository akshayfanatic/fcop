import type { EmailTemplate } from '../types.js';
import { BaseEmail } from '../components/base-email.js';
import { emailStyles } from '../styles.js';

type TestEmailProps = {
  recipientName?: string;
};

export const TestEmail = ({ recipientName = 'there' }: TestEmailProps) => (
  <BaseEmail previewText="Your FCOP email setup is working.">
    <h1 style={emailStyles.heading}>Email setup works</h1>
    <p style={emailStyles.text}>Hi {recipientName},</p>
    <p style={emailStyles.lastText}>
      Resend is configured and this message was sent through the FCOP backend email layer.
    </p>
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
