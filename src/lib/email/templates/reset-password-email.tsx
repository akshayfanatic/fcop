import { BaseEmail } from '../components/base-email.js';
import { EmailAction, EmailIntro, EmailMetadata } from '../components/email-content.js';
import { emailStyles } from '../styles.js';
import type { EmailTemplate } from '../types.js';

type ResetPasswordEmailProps = {
  resetUrl: string;
  token: string;
};

const tokenStyle = {
  margin: '0 0 16px',
  padding: '12px',
  backgroundColor: '#f3f4f6',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  color: '#111827',
  fontFamily: 'Consolas, Monaco, monospace',
  fontSize: '13px',
  lineHeight: '1.5',
  wordBreak: 'break-all' as const
};

export const createResetPasswordEmailTemplate = ({ resetUrl, token }: ResetPasswordEmailProps): EmailTemplate => ({
  subject: 'Reset your FCOP password',
  react: (
    <BaseEmail previewText="Use this secure link to reset your FCOP password." category="SECURITY">
      <EmailIntro context="Account security" title="Reset your password">
        We received a request to reset your FCOP password. Use the button below to continue.
      </EmailIntro>
      <EmailAction href={resetUrl}>Reset password</EmailAction>
      <p style={emailStyles.text}>If the button does not work, use this reset token:</p>
      <p style={tokenStyle}>{token}</p>
      <EmailMetadata>If you did not request a password reset, you can ignore this email.</EmailMetadata>
    </BaseEmail>
  ),
  text: [
    'Reset your password',
    '',
    'We received a request to reset your FCOP password.',
    `Reset link: ${resetUrl}`,
    `Reset token: ${token}`,
    '',
    'If you did not request a password reset, you can ignore this email.'
  ].join('\n')
});
