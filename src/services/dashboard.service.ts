import type { IncomingHttpHeaders } from 'node:http';
import { LeadStatus, ProjectStatus, ServiceRequestStatus, TaskPriority, TaskStatus } from '../generated/prisma/client.js';
import { Role } from '../lib/auth/permissions.js';
import { getSessionMember } from '../lib/auth/session.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import type { AdminAttentionTask, AdminDashboardOverview, AdminLeadDistribution, AdminRecentLead, AdminTaskDistribution, DashboardCurrentProjects, StatusDistribution } from '../types/dashboard.js';
import { HttpStatus } from '../utils/api-response.js';
import { createHttpError } from '../utils/http-error.js';
import { getProjectAccessWhere } from '../utils/project/project-access.js';
import { hasRole } from '../utils/role.js';

const DASHBOARD_LIST_LIMIT = 5;
const CURRENT_PROJECT_STATUSES = [ProjectStatus.PLANNING, ProjectStatus.ACTIVE, ProjectStatus.ON_HOLD];

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
  getCurrentProjects: async (headers: IncomingHttpHeaders): Promise<DashboardCurrentProjects> => {
    try {
      const member = await getSessionMember(headers);
      const where = {
        AND: [
          // Keep dashboard project data inside the member's active organization.
          {
            client: {
              member: {
                organizationId: member.organizationId
              }
            }
          },
          getProjectAccessWhere(member),
          {
            status: {
              in: CURRENT_PROJECT_STATUSES
            }
          }
        ]
      };

      const projects = await prisma.project.findMany({
        where,
        select: {
          id: true,
          name: true,
          status: true,
          endDate: true,
          updatedAt: true,
          client: {
            select: {
              name: true
            }
          },
          tasks: {
            where: {
              status: {
                not: TaskStatus.DONE
              }
            },
            orderBy: [
              {
                dueDate: {
                  sort: 'asc',
                  nulls: 'last'
                }
              },
              {
                createdAt: 'asc'
              }
            ],
            take: 1,
            select: {
              id: true,
              title: true,
              dueDate: true
            }
          }
        }
      });

      const taskGroups = projects.length
        ? await prisma.task.groupBy({
            by: ['projectId', 'status'],
            where: {
              projectId: {
                in: projects.map((project) => project.id)
              }
            },
            _count: {
              status: true
            }
          })
        : [];

      const taskTotals = new Map<string, { completed: number; total: number }>();
      for (const group of taskGroups) {
        const totals = taskTotals.get(group.projectId) ?? { completed: 0, total: 0 };
        totals.total += group._count.status;
        if (group.status === TaskStatus.DONE) {
          totals.completed += group._count.status;
        }
        taskTotals.set(group.projectId, totals);
      }

      const summaries = projects.map((project) => {
        const totals = taskTotals.get(project.id) ?? { completed: 0, total: 0 };
        return {
          id: project.id,
          name: project.name,
          clientName: project.client.name,
          status: project.status,
          endDate: project.endDate,
          updatedAt: project.updatedAt,
          completedTasks: totals.completed,
          totalTasks: totals.total,
          progressPercent: totals.total === 0 ? 0 : Math.round((totals.completed / totals.total) * 100),
          nextTask: project.tasks[0] ?? null
        };
      });

      const now = new Date();
      const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
      const averageProgress = summaries.length === 0 ? 0 : Math.round(summaries.reduce((total, project) => total + project.progressPercent, 0) / summaries.length);

      const currentProjects = [...summaries]
        .sort((first, second) => {
          if (!first.endDate && !second.endDate) {
            return second.updatedAt.getTime() - first.updatedAt.getTime();
          }
          if (!first.endDate) return 1;
          if (!second.endDate) return -1;
          return first.endDate.getTime() - second.endDate.getTime();
        })
        .slice(0, DASHBOARD_LIST_LIMIT)
        .map(({ updatedAt: _updatedAt, ...project }) => project);

      return {
        stats: {
          active: summaries.filter((project) => project.status === ProjectStatus.ACTIVE).length,
          onHold: summaries.filter((project) => project.status === ProjectStatus.ON_HOLD).length,
          averageProgress,
          dueThisMonth: summaries.filter((project) => project.endDate && project.endDate >= monthStart && project.endDate < nextMonthStart).length
        },
        projects: currentProjects
      };
    } catch (error) {
      logger.error({ error }, 'Failed to fetch current dashboard projects.');
      throw error;
    }
  },

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
