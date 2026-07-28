import type { IncomingHttpHeaders } from 'node:http';
import { type Prisma, ServiceRequestStatus } from '../generated/prisma/client.js';
import { createProjectCreatedEmailTemplate, sendTemplateEmail } from '../lib/email/index.js';
import { getSessionMember } from '../lib/auth/session.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import { HttpStatus } from '../utils/api-response.js';
import { createHttpError } from '../utils/http-error.js';
import { createPaginatedData, getPaginationOffset } from '../utils/pagination.js';
import { getAssignableProjectManagerId, getProjectAccessWhere, upsertProjectManager } from '../utils/project/project-access.js';
import type { CreateProjectFromServiceRequestInput, CreateProjectInput, ProjectFiltersInput, UpdateProjectInput } from '../validators/project.validator.js';

const includeProjectDetails = {
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
          }
        }
      }
    }
  },
  serviceRequest: true,
  createdBy: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  },
  memberProjects: {
    include: {
      member: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }
    }
  }
} satisfies Prisma.ProjectInclude;

type ProjectDetails = Prisma.ProjectGetPayload<{
  include: typeof includeProjectDetails;
}>;

const sendProjectCreatedEmail = async (project: ProjectDetails) => {
  try {
    // Send email to tell customer that their project workspace has been created.
    await sendTemplateEmail({
      to: project.client.member.user.email,
      template: createProjectCreatedEmailTemplate({ project })
    });
  } catch (error) {
    logger.error({ error, projectId: project.id }, 'Failed to send project created email notification.');
  }
};

export const projectService = {
  createProject: async (payload: CreateProjectInput, headers: IncomingHttpHeaders) => {
    try {
      const member = await getSessionMember(headers);
      const managerMemberId = await getAssignableProjectManagerId(member, payload.managerMemberId);

      const client = await prisma.client.findUnique({
        where: {
          id: payload.clientId
        }
      });

      if (!client) {
        throw createHttpError(HttpStatus.NOT_FOUND, 'Client not found.', 'CLIENT_NOT_FOUND');
      }

      if (payload.serviceRequestId) {
        const request = await prisma.serviceRequest.findFirst({
          where: {
            id: payload.serviceRequestId,
            clientId: payload.clientId
          }
        });

        if (!request) {
          throw createHttpError(HttpStatus.NOT_FOUND, 'Service request not found for this client.', 'SERVICE_REQUEST_NOT_FOUND');
        }
      }

      const project = await prisma.$transaction(async (tx) => {
        const project = await tx.project.create({
          data: {
            clientId: payload.clientId,
            serviceRequestId: payload.serviceRequestId,
            createdByMemberId: member.id,
            name: payload.name,
            description: payload.description,
            service: payload.service,
            status: payload.status,
            startDate: payload.startDate,
            endDate: payload.endDate,
            budgetAmount: payload.budgetAmount,
            currency: payload.currency
          }
        });

        // Assign a manager so task creation can be scoped to project ownership.
        await upsertProjectManager(tx, project.id, managerMemberId);

        return await tx.project.findUniqueOrThrow({
          where: {
            id: project.id
          },
          include: includeProjectDetails
        });
      });

      await sendProjectCreatedEmail(project);

      return project;
    } catch (error) {
      logger.error({ error, clientId: payload.clientId }, 'Failed to create project.');
      throw error;
    }
  },

  createProjectFromServiceRequest: async (serviceRequestId: string, payload: CreateProjectFromServiceRequestInput, headers: IncomingHttpHeaders) => {
    try {
      const member = await getSessionMember(headers);
      const managerMemberId = await getAssignableProjectManagerId(member, payload.managerMemberId);
      const request = await prisma.serviceRequest.findUnique({
        where: {
          id: serviceRequestId
        },
        include: {
          client: true,
          project: true
        }
      });

      if (!request) {
        throw createHttpError(HttpStatus.NOT_FOUND, 'Service request not found.', 'SERVICE_REQUEST_NOT_FOUND');
      }

      if (request.project) {
        throw createHttpError(HttpStatus.CONFLICT, 'Project already exists for this service request.', 'PROJECT_ALREADY_EXISTS');
      }

      const project = await prisma.$transaction(async (tx) => {
        const project = await tx.project.create({
          data: {
            clientId: request.clientId,
            serviceRequestId: request.id,
            createdByMemberId: member.id,
            name: payload.name ?? `${request.client.name} ${request.service.replaceAll('_', ' ').toLowerCase()} project`,
            description: payload.description,
            service: request.service,
            status: payload.status,
            startDate: payload.startDate,
            endDate: payload.endDate,
            budgetAmount: payload.budgetAmount,
            currency: payload.currency
          }
        });

        // Mark the request completed once delivery has a project container.
        await tx.serviceRequest.update({
          where: {
            id: request.id
          },
          data: {
            status: ServiceRequestStatus.COMPLETED
          }
        });

        // Assign a manager so the project has an owner before tasks are created.
        await upsertProjectManager(tx, project.id, managerMemberId);

        return await tx.project.findUniqueOrThrow({
          where: {
            id: project.id
          },
          include: includeProjectDetails
        });
      });

      await sendProjectCreatedEmail(project);

      return project;
    } catch (error) {
      logger.error({ error, serviceRequestId }, 'Failed to create project from service request.');
      throw error;
    }
  },

  getProjects: async (filters: ProjectFiltersInput, headers: IncomingHttpHeaders) => {
    try {
      const member = await getSessionMember(headers);
      const { page, pageSize } = filters;
      const where = {
        AND: [
          getProjectAccessWhere(member),
          {
            ...(filters.name ? { name: { contains: filters.name } } : {}),
            ...(filters.status ? { status: filters.status } : {}),
            ...(filters.serviceType ? { service: filters.serviceType } : {})
          }
        ]
      } satisfies Prisma.ProjectWhereInput;

      const [items, totalItems] = await Promise.all([
        prisma.project.findMany({
          where,
          include: includeProjectDetails,
          orderBy: {
            createdAt: 'desc'
          },
          skip: getPaginationOffset({ page, pageSize }),
          take: pageSize
        }),
        prisma.project.count({ where })
      ]);

      return createPaginatedData({
        items,
        page,
        pageSize,
        totalItems
      });
    } catch (error) {
      logger.error({ error }, 'Failed to fetch projects.');
      throw error;
    }
  },

  getProjectById: async (id: string, headers: IncomingHttpHeaders) => {
    try {
      const member = await getSessionMember(headers);
      const project = await prisma.project.findFirst({
        where: {
          id,
          ...getProjectAccessWhere(member)
        },
        include: includeProjectDetails
      });

      if (!project) {
        throw createHttpError(HttpStatus.NOT_FOUND, 'Project not found.', 'PROJECT_NOT_FOUND');
      }

      return project;
    } catch (error) {
      logger.error({ error, projectId: id }, 'Failed to fetch project.');
      throw error;
    }
  },

  updateProjectById: async (id: string, payload: UpdateProjectInput, headers: IncomingHttpHeaders) => {
    try {
      const member = await getSessionMember(headers);
      const existingProject = await prisma.project.findFirst({
        where: {
          id,
          ...getProjectAccessWhere(member)
        }
      });

      if (!existingProject) {
        throw createHttpError(HttpStatus.NOT_FOUND, 'Project not found.', 'PROJECT_NOT_FOUND');
      }

      const managerMemberId = payload.managerMemberId === undefined ? undefined : await getAssignableProjectManagerId(member, payload.managerMemberId);

      return await prisma.$transaction(async (tx) => {
        await tx.project.update({
          where: {
            id
          },
          data: {
            ...(payload.name ? { name: payload.name } : {}),
            ...(payload.description !== undefined ? { description: payload.description } : {}),
            ...(payload.status ? { status: payload.status } : {}),
            ...(payload.startDate !== undefined ? { startDate: payload.startDate } : {}),
            ...(payload.endDate !== undefined ? { endDate: payload.endDate } : {}),
            ...(payload.budgetAmount !== undefined ? { budgetAmount: payload.budgetAmount } : {}),
            ...(payload.currency ? { currency: payload.currency } : {})
          }
        });

        if (managerMemberId) {
          // Reassign manager while preserving future team-member assignments.
          await upsertProjectManager(tx, id, managerMemberId);
        }

        return await tx.project.findUniqueOrThrow({
          where: {
            id
          },
          include: includeProjectDetails
        });
      });
    } catch (error) {
      logger.error({ error, projectId: id }, 'Failed to update project.');
      throw error;
    }
  },

  deleteProjectById: async (id: string, headers: IncomingHttpHeaders) => {
    try {
      const member = await getSessionMember(headers);
      const project = await prisma.project.findFirst({
        where: {
          id,
          ...getProjectAccessWhere(member)
        }
      });

      if (!project) {
        throw createHttpError(HttpStatus.NOT_FOUND, 'Project not found.', 'PROJECT_NOT_FOUND');
      }

      return await prisma.project.delete({
        where: {
          id
        }
      });
    } catch (error) {
      logger.error({ error, projectId: id }, 'Failed to delete project.');
      throw error;
    }
  }
};
