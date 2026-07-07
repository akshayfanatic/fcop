import { logger } from '../../logger.js';
import { env } from '../../../config/env.js';
import { createInvitationEmailTemplate } from '../templates/invitation-email.js';
import { createResetPasswordEmailTemplate } from '../templates/reset-password-email.js';
import { sendTemplateEmail } from './email.service.js';

type SendResetPasswordParams = {
  user: {
    email: string;
  };
  url: string;
  token: string;
};

type SendInvitationEmailParams = {
  id: string;
  role: string;
  email: string;
  organization: {
    name: string;
  };
  inviter: {
    user: {
      name: string;
    };
  };
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

export const sendInvitationEmail = async ({
  id,
  role,
  email,
  organization,
  inviter
}: SendInvitationEmailParams) => {
  const acceptUrl = `${env.frontendUrl}/accept-invitation?invitationId=${encodeURIComponent(id)}`;

  try {
    await sendTemplateEmail({
      to: email,
      template: createInvitationEmailTemplate({
        acceptUrl,
        invitedEmail: email,
        inviterName: inviter.user.name,
        organizationName: organization.name,
        role
      })
    });
  } catch (error) {
    logger.error(
      {
        err: error,
        email,
        invitationId: id
      },
      'Failed to send invitation email.'
    );
  }
};
