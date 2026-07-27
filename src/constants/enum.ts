import type { LeadSource, LeadStatus, ServiceInterest, ServiceRequestStatus, TaskPriority, TaskStatus } from '../generated/prisma/client.js';
import type { Option } from '../utils/options.js';

export const LEAD_STATUS_OPTIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'DEAD', label: 'Closed' }
] as const satisfies readonly Option<LeadStatus>[];

export const LEAD_SOURCE_OPTIONS = [{ value: 'CONTACT_FORM', label: 'Contact form' }] as const satisfies readonly Option<LeadSource>[];

export const SERVICE_INTEREST_OPTIONS = [
  { value: 'WEB_DEVELOPMENT', label: 'Web development' },
  { value: 'MOBILE_APP_DEVELOPMENT', label: 'Mobile app development' },
  { value: 'SEO', label: 'SEO' },
  { value: 'GOOGLE_ADS', label: 'Google Ads' },
  { value: 'GENERAL_MARKETING', label: 'General marketing' },
  { value: 'OTHER', label: 'Other' }
] as const satisfies readonly Option<ServiceInterest>[];

export const SERVICE_REQUEST_STATUS_OPTIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' }
] as const satisfies readonly Option<ServiceRequestStatus>[];

export const TASK_STATUS_OPTIONS = [
  { value: 'TODO', label: 'To do' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'IN_REVIEW', label: 'In review' },
  { value: 'DONE', label: 'Done' }
] as const satisfies readonly Option<TaskStatus>[];

export const TASK_PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' }
] as const satisfies readonly Option<TaskPriority>[];
