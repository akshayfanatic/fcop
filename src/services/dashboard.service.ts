import type { IncomingHttpHeaders } from 'node:http';
import { LeadStatus, ProjectStatus, ServiceRequestStatus, TaskPriority, TaskStatus } from '../generated/prisma/client.js';
import { Role } from '../lib/auth/permissions.js';
import { getSessionMember } from '../lib/auth/session.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import type { AdminAttentionTask, AdminDashboardOverview, AdminLeadDistribution, AdminRecentLead, AdminTaskDistribution, StatusDistribution } from '../types/dashboard.js';
import { HttpStatus } from '../utils/api-response.js';
import { createHttpError } from '../utils/http-error.js';
import { hasRole } from '../utils/role.js';

const DASHBOARD_LIST_LIMIT = 5;

const requireAdmin = async (headers: IncomingHttpHeaders) => {
  const member = await getSessionMember(headers);

  // Restrict organization-wide business analytics to administrators.
  if (!hasRole(member.role, Role.ADMIN)) {
    throw createHttpError(HttpStatus.FORBIDDEN, 'Admin dashboard access is required.', 'FORBIDDEN');
  }
};

const createDistribution = <TStatus extends string>(
  statuses: readonly TStatus[],
  groups: Array<{
    status: TStatus;
    _count?:
      | true
      | {
          status?: number;
        };
  }>
): StatusDistribution<TStatus> => {
  const counts = Object.fromEntries(statuses.map((status) => [status, 0])) as StatusDistribution<TStatus>;

  for (const group of groups) {
    counts[group.status] = typeof group._count === 'object' ? (group._count.status ?? 0) : 0;
  }

  return counts;
};

export const dashboardService = {
  getOverview: async (headers: IncomingHttpHeaders): Promise<AdminDashboardOverview> => {
    try {
      await requireAdmin(headers);

      const [totalLeads, newLeads, totalProjects, activeProjects, totalTasks, completedTasks, totalServiceRequests, openServiceRequests] = await prisma.$transaction([
        prisma.lead.count(),
        prisma.lead.count({
          where: {
            status: LeadStatus.NEW
          }
        }),
        prisma.project.count(),
        prisma.project.count({
          where: {
            status: ProjectStatus.ACTIVE
          }
        }),
        prisma.task.count(),
        prisma.task.count({
          where: {
            status: TaskStatus.DONE
          }
        }),
        prisma.serviceRequest.count(),
        prisma.serviceRequest.count({
          where: {
            status: {
              in: [ServiceRequestStatus.NEW, ServiceRequestStatus.IN_PROGRESS]
            }
          }
        })
      ]);

      return {
        totalLeads,
        newLeads,
        totalProjects,
        activeProjects,
        totalTasks,
        openTasks: totalTasks - completedTasks,
        completedTasks,
        totalServiceRequests,
        openServiceRequests
      };
    } catch (error) {
      logger.error({ error }, 'Failed to fetch admin dashboard overview.');
      throw error;
    }
  },

  getLeadDistribution: async (headers: IncomingHttpHeaders): Promise<AdminLeadDistribution> => {
    try {
      await requireAdmin(headers);

      const groups = await prisma.lead.groupBy({
        by: ['status'],
        orderBy: {
          status: 'asc'
        },
        _count: {
          status: true
        }
      });

      return createDistribution(Object.values(LeadStatus), groups);
    } catch (error) {
      logger.error({ error }, 'Failed to fetch admin lead distribution.');
      throw error;
    }
  },

  getTaskDistribution: async (headers: IncomingHttpHeaders): Promise<AdminTaskDistribution> => {
    try {
      await requireAdmin(headers);

      const groups = await prisma.task.groupBy({
        by: ['status'],
        orderBy: {
          status: 'asc'
        },
        _count: {
          status: true
        }
      });

      return createDistribution(Object.values(TaskStatus), groups);
    } catch (error) {
      logger.error({ error }, 'Failed to fetch admin task distribution.');
      throw error;
    }
  },

  getRecentLeads: async (headers: IncomingHttpHeaders): Promise<AdminRecentLead[]> => {
    try {
      await requireAdmin(headers);

      return await prisma.lead.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        take: DASHBOARD_LIST_LIMIT,
        select: {
          id: true,
          name: true,
          email: true,
          companyName: true,
          status: true,
          createdAt: true
        }
      });
    } catch (error) {
      logger.error({ error }, 'Failed to fetch recent admin dashboard leads.');
      throw error;
    }
  },

  getAttentionTasks: async (headers: IncomingHttpHeaders): Promise<AdminAttentionTask[]> => {
    try {
      await requireAdmin(headers);

      return await prisma.task.findMany({
        where: {
          status: {
            not: TaskStatus.DONE
          },
          OR: [
            {
              priority: TaskPriority.URGENT
            },
            {
              dueDate: {
                lt: new Date()
              }
            }
          ]
        },
        orderBy: [
          {
            dueDate: 'asc'
          },
          {
            createdAt: 'desc'
          }
        ],
        take: DASHBOARD_LIST_LIMIT,
        select: {
          id: true,
          projectId: true,
          title: true,
          priority: true,
          dueDate: true,
          project: {
            select: {
              name: true
            }
          }
        }
      });
    } catch (error) {
      logger.error({ error }, 'Failed to fetch admin dashboard attention tasks.');
      throw error;
    }
  }
};
