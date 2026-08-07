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
  serviceRequest: ['create', 'read', 'update', 'delete'],
  proposal: ['create', 'read', 'update', 'delete'],
  project: ['create', 'read', 'update', 'delete'],
  task: ['create', 'read', 'update', 'delete'],
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
  [Key in keyof typeof statement]?: ReadonlyArray<(typeof statement)[Key][number]>;
};

export const rolePermissionStatements = {
  [Role.ADMIN]: {
    ...ownerAc.statements,
    lead: ['create', 'read', 'update', 'delete'],
    serviceRequest: ['create', 'read', 'update', 'delete'],
    proposal: ['create', 'read', 'update', 'delete'],
    project: ['create', 'read', 'update', 'delete'],
    task: ['create', 'read', 'update', 'delete'],
    deliverable: ['create', 'read', 'update', 'delete', 'download'],
    comment: ['create', 'read', 'update', 'delete'],
    file: ['upload', 'read', 'delete'],
    timeEntry: ['create', 'read', 'update', 'delete'],
    billing: ['read', 'update'],
    revenue: ['read'],
    dashboard: ['read']
  },
  [Role.MANAGER]: {
    organization: ['update'],
    member: ['create', 'update'],
    invitation: ['create'],
    ac: ['read'],
    lead: ['read', 'update'],
    serviceRequest: ['create', 'read', 'update', 'delete'],
    proposal: ['create', 'read', 'update', 'delete'],
    project: ['create', 'read', 'update'],
    task: ['create', 'read', 'update', 'delete'],
    deliverable: ['create', 'read', 'update', 'download'],
    comment: ['create', 'read', 'update'],
    file: ['upload', 'read'],
    timeEntry: ['read'],
    billing: ['read'],
    dashboard: ['read']
  },
  [Role.MEMBER]: {
    ac: ['read'],
    project: ['read'],
    task: ['read', 'update'],
    deliverable: ['create', 'read', 'update', 'download'],
    comment: ['create', 'read', 'update'],
    file: ['upload', 'read'],
    timeEntry: ['create', 'read', 'update'],
    dashboard: ['read']
  },
  [Role.CLIENT]: {
    ac: ['read'],
    project: ['read'],
    task: ['read'],
    serviceRequest: ['create', 'read'],
    proposal: ['read', 'update'],
    deliverable: ['read', 'download'],
    comment: ['create', 'read'],
    file: ['read'],
    billing: ['read'],
    dashboard: ['read']
  }
} satisfies Record<Role, OrganizationPermission>;

/**
 * Returns the permission statements configured for a FCOP organization role.
 *
 * @param role - Organization member role stored by Better Auth.
 * @returns Permission statements for known FCOP roles, or an empty map for unknown roles.
 *
 * @example
 * getRolePermissionStatements('CLIENT');
 * // { ac: ['read'], project: ['read'], serviceRequest: ['create', 'read'], ... }
 */
export function getRolePermissionStatements(role: string): OrganizationPermission {
  if (Object.values(Role).includes(role as Role)) {
    return rolePermissionStatements[role as Role];
  }

  return {};
}

export const admin = ac.newRole(rolePermissionStatements[Role.ADMIN]);

export const manager = ac.newRole(rolePermissionStatements[Role.MANAGER]);

export const member = ac.newRole(rolePermissionStatements[Role.MEMBER]);

export const client = ac.newRole(rolePermissionStatements[Role.CLIENT]);

export const organizationRoles = {
  [Role.ADMIN]: admin,
  [Role.MANAGER]: manager,
  [Role.MEMBER]: member,
  [Role.CLIENT]: client
};
