import type { IncomingHttpHeaders } from 'node:http';
import { type Prisma } from '../generated/prisma/client.js';
import { env } from '../config/env.js';
import { getSessionMember } from '../lib/auth/session.js';
import { createNewServiceRequestEmailTemplate, sendTemplateEmail } from '../lib/email/index.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import { HttpStatus } from '../utils/api-response.js';
import { createHttpError } from '../utils/http-error.js';
import type { CreateServiceRequestInput, UpdateServiceRequestInput } from '../validators/service-request.validator.js';

const includeClientRequestDetails = {
  client: {
    include: {
      member: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          organization: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      }
    }
  }
} satisfies Prisma.ServiceRequestInclude;

export const serviceRequestService = {
  createServiceRequest: async (payload: CreateServiceRequestInput, headers: IncomingHttpHeaders) => {
    try {
      const member = await getSessionMember(headers);
      const client = member.client;

      // Make sure only clients can create service requests.
      if (!client) {
        throw createHttpError(HttpStatus.NOT_FOUND, 'Client profile has not been created.', 'CLIENT_NOT_FOUND');
      }

      const request = await prisma.serviceRequest.create({
        data: {
          clientId: client.id,
          service: payload.service,
          data: payload.data as Prisma.InputJsonValue
        },
        include: includeClientRequestDetails
      });

      if (!env.adminEmail) {
        logger.warn('ADMIN_EMAIL is not configured. Skipping new service request email notification.');
        return request;
      }

      // Send email to tell admin about the new service request.
      try {
        await sendTemplateEmail({
          to: env.adminEmail,
          replyTo: request.client.member.user.email,
          template: createNewServiceRequestEmailTemplate({ request })
        });
      } catch (error) {
        logger.error({ error, serviceRequestId: request.id }, 'Failed to send new service request email notification.');
      }

      return request;
    } catch (error) {
      logger.error({ error, service: payload.service }, 'Failed to create service request.');
      throw error;
    }
  },

  getServiceRequests: async (headers: IncomingHttpHeaders) => {
    try {
      const member = await getSessionMember(headers);

      if (!member.client) {
        return await prisma.serviceRequest.findMany({
          include: includeClientRequestDetails,
          orderBy: {
            createdAt: 'desc'
          }
        });
      }

      return await prisma.serviceRequest.findMany({
        where: {
          clientId: member.client.id
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (error) {
      logger.error({ error }, 'Failed to fetch client service requests.');
      throw error;
    }
  },

  getServiceRequestById: async (id: string, headers: IncomingHttpHeaders) => {
    try {
      const member = await getSessionMember(headers);

      if (!member.client) {
        const request = await prisma.serviceRequest.findUnique({
          where: {
            id
          },
          include: includeClientRequestDetails
        });

        if (!request) {
          throw createHttpError(HttpStatus.NOT_FOUND, 'Service request not found.', 'SERVICE_REQUEST_NOT_FOUND');
        }

        return request;
      }

      const request = await prisma.serviceRequest.findFirst({
        where: {
          id,
          clientId: member.client.id
        }
      });

      if (!request) {
        throw createHttpError(HttpStatus.NOT_FOUND, 'Service request not found.', 'SERVICE_REQUEST_NOT_FOUND');
      }

      return request;
    } catch (error) {
      logger.error({ error, serviceRequestId: id }, 'Failed to fetch client service request.');
      throw error;
    }
  },

  updateServiceRequestById: async (id: string, payload: UpdateServiceRequestInput, _headers: IncomingHttpHeaders) => {
    try {
      const request = await prisma.serviceRequest.findUnique({
        where: {
          id
        }
      });

      // Make sure service request exists before update.
      if (!request) {
        throw createHttpError(HttpStatus.NOT_FOUND, 'Service request not found.', 'SERVICE_REQUEST_NOT_FOUND');
      }

      return await prisma.serviceRequest.update({
        where: {
          id
        },
        data: {
          ...(payload.status ? { status: payload.status } : {}),
          ...(payload.data ? { data: payload.data as Prisma.InputJsonValue } : {})
        },
        include: includeClientRequestDetails
      });
    } catch (error) {
      logger.error({ error, serviceRequestId: id }, 'Failed to update service request.');
      throw error;
    }
  },

  deleteServiceRequestById: async (id: string, _headers: IncomingHttpHeaders) => {
    try {
      const request = await prisma.serviceRequest.findUnique({
        where: {
          id
        }
      });

      // Make sure service request exists before delete.
      if (!request) {
        throw createHttpError(HttpStatus.NOT_FOUND, 'Service request not found.', 'SERVICE_REQUEST_NOT_FOUND');
      }

      return await prisma.serviceRequest.delete({
        where: {
          id
        }
      });
    } catch (error) {
      logger.error({ error, serviceRequestId: id }, 'Failed to delete service request.');
      throw error;
    }
  }
};
