import { createAccessControl } from 'better-auth/plugins/access';
import { defaultStatements, ownerAc } from 'better-auth/plugins/organization/access';

export const Role = {
  ADMIN: 'ADMIN',
  CLIENT: 'CLIENT',
  MANAGER: 'MANAGER',
  MEMBER: 'MEMBER'
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const resourceStatements = {
  ...defaultStatements,
  lead: ['create', 'read', 'update', 'delete'],
  serviceRequest: ['create', 'read', 'update', 'delete'],
  proposal: ['create', 'read', 'update', 'delete'],
  project: ['create', 'read', 'update', 'delete'],
  task: ['create', 'read', 'update', 'delete'],
  chat: ['create', 'read'],
  taskComment: ['create', 'read', 'update', 'delete'],
  payment: ['read'],
  dashboard: ['read'],
  notification: ['read', 'update']
} as const;

export type Resource = keyof typeof resourceStatements;
export type ResourceAction<R extends Resource> = (typeof resourceStatements)[R][number];
export type OrganizationPermission = {
  [R in Resource]?: ReadonlyArray<ResourceAction<R>>;
};

export const ac = createAccessControl(resourceStatements);

export const rolePermissionStatements = {
  [Role.ADMIN]: {
    ...ownerAc.statements,
    lead: ['create', 'read', 'update', 'delete'],
    serviceRequest: ['read', 'update', 'delete'],
    proposal: ['create', 'read', 'update', 'delete'],
    project: ['create', 'read', 'update', 'delete'],
    task: ['create', 'read', 'update', 'delete'],
    chat: ['create', 'read'],
    taskComment: ['create', 'read', 'update', 'delete'],
    payment: ['read'],
    dashboard: ['read'],
    notification: ['read', 'update']
  },
  [Role.MANAGER]: {
    organization: ['update'],
    member: ['create', 'update'],
    invitation: ['create'],
    ac: ['read'],
    lead: ['read', 'update'],
    serviceRequest: ['read', 'update', 'delete'],
    proposal: ['create', 'read', 'update', 'delete'],
    project: ['create', 'read', 'update'],
    task: ['create', 'read', 'update', 'delete'],
    chat: ['create', 'read'],
    taskComment: ['create', 'read', 'update', 'delete'],
    payment: ['read'],
    dashboard: ['read'],
    notification: ['read', 'update']
  },
  [Role.MEMBER]: {
    ac: ['read'],
    project: ['read'],
    task: ['read', 'update'],
    chat: ['create', 'read'],
    taskComment: ['create', 'read', 'update', 'delete'],
    dashboard: ['read'],
    notification: ['read', 'update']
  },
  [Role.CLIENT]: {
    ac: ['read'],
    project: ['read'],
    task: ['read'],
    serviceRequest: ['create', 'read'],
    proposal: ['read', 'update'],
    chat: ['create', 'read'],
    taskComment: ['create', 'read', 'update', 'delete'],
    payment: ['read'],
    dashboard: ['read'],
    notification: ['read', 'update']
  }
} satisfies Record<Role, OrganizationPermission>;

export function getRolePermissionStatements(roles: string): OrganizationPermission {
  const permissions: Record<string, string[]> = {};
  const knownRoles = Object.values(Role);

  for (const roleName of roles.split(',')) {
    const role = roleName.trim();
    if (!knownRoles.includes(role as Role)) {
      continue;
    }

    const rolePermissions = rolePermissionStatements[role as Role];
    for (const [resource, actions] of Object.entries(rolePermissions)) {
      if (!permissions[resource]) {
        permissions[resource] = [];
      }

      for (const action of actions) {
        if (!permissions[resource].includes(action)) {
          permissions[resource].push(action);
        }
      }
    }
  }

  return permissions as OrganizationPermission;
}

export function hasResourcePermission<R extends Resource>(roles: string, resource: R, action: ResourceAction<R>): boolean {
  const permissions = getRolePermissionStatements(roles);
  const allowedActions = permissions[resource] as readonly string[] | undefined;
  if (!allowedActions) {
    return false;
  }

  return allowedActions.includes(action);
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
