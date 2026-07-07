import type { IncomingHttpHeaders } from 'node:http';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/auth/auth.js';
import { prisma } from '../lib/prisma.js';
import { HttpStatus } from '../utils/api-response.js';
import { createHttpError } from '../utils/http-error.js';
import type { InviteMemberInput } from '../validators/invitation.validator.js';

const FCOP_ORGANIZATION_SLUG = 'fanatic-coders';

export const invitationService = {
  inviteMember: async (payload: InviteMemberInput, headers: IncomingHttpHeaders) => {
    const organization = await prisma.organization.findUnique({
      where: {
        slug: FCOP_ORGANIZATION_SLUG
      },
      select: {
        id: true
      }
    });

    if (!organization) {
      throw createHttpError(
        HttpStatus.NOT_FOUND,
        'FCOP organization has not been bootstrapped.',
        'ORGANIZATION_NOT_FOUND'
      );
    }

    return auth.api.createInvitation({
      headers: fromNodeHeaders(headers),
      body: {
        email: payload.email,
        role: payload.role,
        organizationId: organization.id,
        resend: payload.resend
      }
    });
  }
};
