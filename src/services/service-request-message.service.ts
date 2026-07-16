import type { IncomingHttpHeaders } from 'node:http';
import { type Prisma } from '../generated/prisma/client.js';
import { getSessionMember } from '../lib/auth/session.js';
import { Role } from '../lib/auth/permissions.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import { HttpStatus } from '../utils/api-response.js';
import { createHttpError } from '../utils/http-error.js';
import { hasRole } from '../utils/role.js';
import type { CreateServiceRequestMessageInput } from '../validators/service-request-message.validator.js';

const includeMessageAuthor = {
  author: {
    select: {
      id: true,
      role: true,
      user: {
        select: {
          id: true,
          name: true,
          image: true
        }
      }
    }
  }
} satisfies Prisma.ServiceRequestMessageInclude;

const getServiceRequestMessageAccess = async (serviceRequestId: string, headers: IncomingHttpHeaders) => {
  const member = await getSessionMember(headers);
  const isManagement = hasRole(member.role, Role.ADMIN) || hasRole(member.role, Role.MANAGER);

  const request = await prisma.serviceRequest.findFirst({
    where: {
      id: serviceRequestId,
      client: {
        member: {
          organizationId: member.organizationId
        }
      }
    },
    select: {
      id: true,
      clientId: true
    }
  });

  // Hide requests outside the current organization or client account.
  if (!request || (!isManagement && member.client?.id !== request.clientId)) {
    throw createHttpError(HttpStatus.NOT_FOUND, 'Service request not found.', 'SERVICE_REQUEST_NOT_FOUND');
  }

  return {
    member,
    isManagement
  };
};

export const serviceRequestMessageService = {
  createServiceRequestMessage: async (serviceRequestId: string, payload: CreateServiceRequestMessageInput, headers: IncomingHttpHeaders) => {
    try {
      const { member, isManagement } = await getServiceRequestMessageAccess(serviceRequestId, headers);

      // Keep internal consultation notes hidden from clients.
      if (payload.isInternal && !isManagement) {
        throw createHttpError(HttpStatus.FORBIDDEN, 'Clients cannot create internal messages.', 'INTERNAL_MESSAGE_FORBIDDEN');
      }

      return await prisma.serviceRequestMessage.create({
        data: {
          serviceRequestId,
          authorMemberId: member.id,
          body: payload.body,
          isInternal: payload.isInternal
        },
        include: includeMessageAuthor
      });
    } catch (error) {
      logger.error({ error, serviceRequestId }, 'Failed to create service request message.');
      throw error;
    }
  },

  getServiceRequestMessages: async (serviceRequestId: string, headers: IncomingHttpHeaders) => {
    try {
      const { isManagement } = await getServiceRequestMessageAccess(serviceRequestId, headers);

      return await prisma.serviceRequestMessage.findMany({
        where: {
          serviceRequestId,
          ...(!isManagement && { isInternal: false })
        },
        include: includeMessageAuthor,
        orderBy: {
          createdAt: 'asc'
        }
      });
    } catch (error) {
      logger.error({ error, serviceRequestId }, 'Failed to fetch service request messages.');
      throw error;
    }
  }
};
