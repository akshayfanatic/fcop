import { Role } from '../lib/auth/permissions.js';

export const hasRole = (role: string, expectedRole: string) =>
  role
    .split(',')
    .map((item) => item.trim())
    .includes(expectedRole);

export const isClientRole = (role: string) => hasRole(role, Role.CLIENT);
