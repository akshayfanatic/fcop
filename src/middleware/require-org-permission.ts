import type { RequestHandler } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/auth/auth.js';
import type { OrganizationPermission } from '../lib/auth/permissions.js';
import { ApiResponse, HttpStatus } from '../utils/api-response.js';

type MutableOrganizationPermission = {
  [Key in keyof OrganizationPermission]?: Array<NonNullable<OrganizationPermission[Key]>[number]>;
};

/**
 * Converts readonly permission statements into the mutable shape Better Auth expects.
 *
 * @param permissions - FCOP permission statements used by route guards.
 * @returns Permission statements with cloned action arrays.
 *
 * @example
 * clonePermissionStatements({ serviceRequest: ['read'] });
 * // { serviceRequest: ['read'] }
 */
function clonePermissionStatements(permissions: OrganizationPermission): MutableOrganizationPermission {
  return Object.fromEntries(Object.entries(permissions).map(([resource, actions]) => [resource, [...actions]])) as MutableOrganizationPermission;
}

export const requireOrgPermission =
  (permissions: OrganizationPermission): RequestHandler =>
  async (req, res, next) => {
    try {
      const result = await auth.api.hasPermission({
        headers: fromNodeHeaders(req.headers),
        body: {
          permissions: clonePermissionStatements(permissions)
        }
      });

      if (!result.success) {
        res.status(HttpStatus.FORBIDDEN).json(
          ApiResponse({
            success: false,
            status: HttpStatus.FORBIDDEN,
            message: 'You do not have permission to access this resource.',
            error: {
              code: 'FORBIDDEN'
            }
          })
        );
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
