import type { LeadStatus, TaskPriority, TaskStatus } from '../generated/prisma/client.js';

export type StatusDistribution<TStatus extends string> = Record<TStatus, number>;

export type AdminDashboardOverview = {
  totalLeads: number;
  newLeads: number;
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  openTasks: number;
  completedTasks: number;
  totalServiceRequests: number;
  openServiceRequests: number;
};

export type AdminLeadDistribution = StatusDistribution<LeadStatus>;

export type AdminTaskDistribution = StatusDistribution<TaskStatus>;

export type AdminRecentLead = {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
  status: LeadStatus;
  createdAt: Date;
};

export type AdminAttentionTask = {
  id: string;
  projectId: string;
  title: string;
  priority: TaskPriority;
  dueDate: Date | null;
  project: {
    name: string;
  };
};
