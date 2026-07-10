import type { IncomingHttpHeaders } from 'node:http';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from './auth.js';
import { prisma } from '../prisma.js';
import { HttpStatus } from '../../utils/api-response.js';
import { createHttpError } from '../../utils/http-error.js';

export const getSessionMember = async (headers: IncomingHttpHeaders) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(headers)
  });

  if (!session) {
    throw createHttpError(HttpStatus.UNAUTHORIZED, 'Authentication required.', 'UNAUTHORIZED');
  }

  const member = await prisma.member.findFirst({
    where: {
      userId: session.user.id,
      ...(session.session.activeOrganizationId
        ? { organizationId: session.session.activeOrganizationId }
        : {})
    },
    include: {
      user: {
        select: {
          name: true
        }
      },
      client: true
    }
  });

  if (!member) {
    throw createHttpError(
      HttpStatus.NOT_FOUND,
      'Organization member not found.',
      'MEMBER_NOT_FOUND'
    );
  }

  return member;
};
