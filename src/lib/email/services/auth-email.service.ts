import { logger } from '../../logger.js';
import { env } from '../../../config/env.js';
import { createInvitationEmailTemplate } from '../templates/invitation-email.js';
import { createClientWelcomeEmailTemplate } from '../templates/client-welcome-email.js';
import { createMemberAcceptedInvitationEmailTemplate } from '../templates/member-accepted-invitation-email.js';
import { createNewClientRegisteredEmailTemplate } from '../templates/new-client-registered-email.js';
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
  invitation: {
    id: string;
    serviceInterest?: string | null;
    [key: string]: unknown;
  };
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

type SendNewClientRegisteredEmailParams = {
  clientId: string;
  memberId: string;
  userName: string;
  userEmail: string;
  organizationName: string;
};

type SendClientWelcomeEmailParams = {
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

export const sendInvitationEmail = async ({ id, role, email, invitation, organization, inviter }: SendInvitationEmailParams) => {
  const acceptUrl = new URL('/accept-invitation', env.frontendUrl);
  acceptUrl.searchParams.set('invitationId', id);

  if (invitation.serviceInterest) {
    acceptUrl.searchParams.set('serviceInterest', invitation.serviceInterest);
  }

  try {
    // Send email to invite user into the organization.
    await sendTemplateEmail({
      to: email,
      template: createInvitationEmailTemplate({
        acceptUrl: acceptUrl.toString(),
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

export const sendMemberAcceptedInvitationEmail = async ({ invitation, member, user, organization }: SendMemberAcceptedInvitationEmailParams) => {
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

export const sendClientWelcomeEmail = async ({ user, organization }: SendClientWelcomeEmailParams) => {
  const dashboardUrl = new URL('/dashboard', env.frontendUrl).toString();

  try {
    // Send email to welcome the customer after their invited client profile is ready.
    await sendTemplateEmail({
      to: user.email,
      template: createClientWelcomeEmailTemplate({
        userName: user.name,
        organizationName: organization.name,
        dashboardUrl
      })
    });
  } catch (error) {
    logger.error(
      {
        err: error,
        userEmail: user.email
      },
      'Failed to send client welcome email.'
    );
  }
};

export const sendNewClientRegisteredEmail = async (client: SendNewClientRegisteredEmailParams) => {
  if (!env.adminEmail) {
    logger.warn(
      {
        clientId: client.clientId,
        memberId: client.memberId,
        userEmail: client.userEmail
      },
      'ADMIN_EMAIL is not configured. Skipping new client registered email.'
    );
    return;
  }

  try {
    // Send email to tell admin that a direct signup became a client.
    await sendTemplateEmail({
      to: env.adminEmail,
      template: createNewClientRegisteredEmailTemplate(client)
    });
  } catch (error) {
    logger.error(
      {
        err: error,
        clientId: client.clientId,
        memberId: client.memberId,
        userEmail: client.userEmail
      },
      'Failed to send new client registered email.'
    );
  }
};
