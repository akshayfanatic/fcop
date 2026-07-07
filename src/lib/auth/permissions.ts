import { createAccessControl } from 'better-auth/plugins/access';
import { defaultStatements, ownerAc } from 'better-auth/plugins/organization/access';

export const Role = {
  ADMIN: 'ADMIN',
  CLIENT: 'CLIENT',
  MANAGER: 'MANAGER',
  MEMBER: 'MEMBER'
} as const;

export type Role = (typeof Role)[keyof typeof Role];

const statement = {
  ...defaultStatements,
  lead: ['create', 'read', 'update', 'delete'],
  project: ['create', 'read', 'update', 'delete'],
  task: ['create', 'read', 'update', 'delete', 'assign'],
  deliverable: ['create', 'read', 'update', 'delete', 'download'],
  comment: ['create', 'read', 'update', 'delete'],
  file: ['upload', 'read', 'delete'],
  timeEntry: ['create', 'read', 'update', 'delete'],
  billing: ['read', 'update'],
  revenue: ['read'],
  dashboard: ['read']
} as const;

export const ac = createAccessControl(statement);
export type OrganizationPermission = {
  [Key in keyof typeof statement]?: Array<(typeof statement)[Key][number]>;
};

export const admin = ac.newRole({
  ...ownerAc.statements,
  lead: ['create', 'read', 'update', 'delete'],
  project: ['create', 'read', 'update', 'delete'],
  task: ['create', 'read', 'update', 'delete', 'assign'],
  deliverable: ['create', 'read', 'update', 'delete', 'download'],
  comment: ['create', 'read', 'update', 'delete'],
  file: ['upload', 'read', 'delete'],
  timeEntry: ['create', 'read', 'update', 'delete'],
  billing: ['read', 'update'],
  revenue: ['read'],
  dashboard: ['read']
});

export const manager = ac.newRole({
  organization: ['update'],
  member: ['create', 'update'],
  team: ['create', 'update'],
  ac: ['read'],
  lead: ['read', 'update'],
  project: ['create', 'read', 'update'],
  task: ['create', 'read', 'update', 'assign'],
  deliverable: ['create', 'read', 'update', 'download'],
  comment: ['create', 'read', 'update'],
  file: ['upload', 'read'],
  timeEntry: ['read'],
  billing: ['read'],
  dashboard: ['read']
});

export const member = ac.newRole({
  ac: ['read'],
  project: ['read'],
  task: ['read', 'update'],
  deliverable: ['create', 'read', 'update', 'download'],
  comment: ['create', 'read', 'update'],
  file: ['upload', 'read'],
  timeEntry: ['create', 'read', 'update'],
  dashboard: ['read']
});

export const client = ac.newRole({
  ac: ['read'],
  project: ['read'],
  deliverable: ['read', 'download'],
  comment: ['create', 'read'],
  file: ['read'],
  billing: ['read'],
  dashboard: ['read']
});

export const organizationRoles = {
  [Role.ADMIN]: admin,
  [Role.MANAGER]: manager,
  [Role.MEMBER]: member,
  [Role.CLIENT]: client
};
