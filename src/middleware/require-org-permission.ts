import type { RequestHandler } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/auth/auth.js';
import type { OrganizationPermission } from '../lib/auth/permissions.js';
import { ApiResponse, HttpStatus } from '../utils/api-response.js';

export const requireOrgPermission =
  (permissions: OrganizationPermission): RequestHandler =>
  async (req, res, next) => {
    try {
      const result = await auth.api.hasPermission({
        headers: fromNodeHeaders(req.headers),
        body: {
          permissions
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
