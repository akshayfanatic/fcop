import { BaseEmail } from '../components/base-email.js';
import { emailStyles } from '../styles.js';
import type { EmailTemplate } from '../types.js';

type ResetPasswordEmailProps = {
  resetUrl: string;
  token: string;
};

const buttonStyle = {
  display: 'inline-block',
  backgroundColor: '#111827',
  color: '#ffffff',
  padding: '12px 18px',
  borderRadius: '6px',
  fontSize: '15px',
  fontWeight: 700,
  textDecoration: 'none'
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

export const createResetPasswordEmailTemplate = ({
  resetUrl,
  token
}: ResetPasswordEmailProps): EmailTemplate => ({
  subject: 'Reset your FCOP password',
  react: (
    <BaseEmail previewText="Use this secure link to reset your FCOP password.">
      <h1 style={emailStyles.heading}>Reset your password</h1>
      <p style={emailStyles.text}>
        We received a request to reset your FCOP password. Use the button below to continue.
      </p>
      <p style={emailStyles.text}>
        <a href={resetUrl} style={buttonStyle}>
          Reset password
        </a>
      </p>
      <p style={emailStyles.text}>If the button does not work, use this reset token:</p>
      <p style={tokenStyle}>{token}</p>
      <p style={emailStyles.lastText}>
        If you did not request a password reset, you can ignore this email.
      </p>
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
