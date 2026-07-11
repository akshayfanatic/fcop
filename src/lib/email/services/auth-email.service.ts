import { logger } from '../../logger.js';
import { env } from '../../../config/env.js';
import { createInvitationEmailTemplate } from '../templates/invitation-email.js';
import { createMemberAcceptedInvitationEmailTemplate } from '../templates/member-accepted-invitation-email.js';
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

type SendMemberAcceptedInvitationEmailParams = {
  invitation: {
    id: string;
  };
  member: {
    id: string;
    role: string;
  };
  user: {
    name: string;
    email: string;
  };
  organization: {
    name: string;
  };
};

export const sendResetPasswordEmail = async ({ user, url, token }: SendResetPasswordParams) => {
  try {
    // Send email to help user reset their password.
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
    // Send email to invite user into the organization.
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

export const sendMemberAcceptedInvitationEmail = async ({
  invitation,
  member,
  user,
  organization
}: SendMemberAcceptedInvitationEmailParams) => {
  if (!env.adminEmail) {
    logger.warn(
      {
        invitationId: invitation.id,
        memberId: member.id,
        userEmail: user.email
      },
      'ADMIN_EMAIL is not configured. Skipping member accepted invitation email.'
    );
    return;
  }

  try {
    // Send email to tell admin that invitation was accepted.
    await sendTemplateEmail({
      to: env.adminEmail,
      template: createMemberAcceptedInvitationEmailTemplate({
        userName: user.name,
        userEmail: user.email,
        organizationName: organization.name,
        role: member.role,
        memberId: member.id,
        invitationId: invitation.id
      })
    });
  } catch (error) {
    logger.error(
      {
        err: error,
        invitationId: invitation.id,
        memberId: member.id,
        userEmail: user.email
      },
      'Failed to send member accepted invitation email.'
    );
  }
};
