import { logger } from '../../logger.js';
import { createResetPasswordEmailTemplate } from '../templates/reset-password-email.js';
import { sendTemplateEmail } from './email.service.js';

type SendResetPasswordParams = {
  user: {
    email: string;
  };
  url: string;
  token: string;
};

export const sendResetPasswordEmail = async ({ user, url, token }: SendResetPasswordParams) => {
  try {
    await sendTemplateEmail({
      to: user.email,
      template: createResetPasswordEmailTemplate({
        resetUrl: url,
        token
      })
    });
  } catch (error) {
    logger.error(
      {
        err: error,
        email: user.email
      },
      'Failed to send reset password email.'
    );
  }
};
