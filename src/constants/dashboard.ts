import { ProjectStatus } from '../generated/prisma/client.js';

export const DASHBOARD_LIST_LIMIT = 5;
export const REVENUE_TREND_DAYS = 365;
export const CURRENT_PROJECT_STATUSES: ProjectStatus[] = [ProjectStatus.PLANNING, ProjectStatus.ACTIVE, ProjectStatus.ON_HOLD];
