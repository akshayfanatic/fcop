import type { LeadStatus, ProjectCurrency, ProjectStatus, TaskPriority, TaskStatus } from '../generated/prisma/client.js';

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

export type DashboardProjectSummary = {
  id: string;
  name: string;
  clientName: string;
  status: ProjectStatus;
  endDate: Date | null;
  completedTasks: number;
  totalTasks: number;
  progressPercent: number;
  nextTask: {
    id: string;
    title: string;
    dueDate: Date | null;
  } | null;
};

export type DashboardCurrentProjects = {
  stats: {
    active: number;
    onHold: number;
    averageProgress: number;
    dueThisMonth: number;
  };
  projects: DashboardProjectSummary[];
};

export type AdminPaymentSummary = {
  paidTransactions: number;
  unpaidTransactions: number;
  byCurrency: Array<{
    currency: ProjectCurrency;
    totalAmount: string;
    averageAmount: string;
    transactionCount: number;
  }>;
  recentTransactions: Array<{
    id: string;
    serviceRequestId: string;
    clientName: string;
    description: string;
    amount: string;
    currency: ProjectCurrency;
    status: 'PAID';
    paidAt: Date;
    stripeInvoiceNumber: string | null;
  }>;
};
