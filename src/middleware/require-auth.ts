import type { RequestHandler } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import type { Role } from '../generated/prisma/client.js';
import { auth } from '../lib/auth.js';
import { ApiResponse, HttpStatus } from '../utils/api-response.js';

export const requireAuth =
  (...allowedRoles: Role[]): RequestHandler =>
  async (req, res, next) => {
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers)
      });

      if (!session) {
        res.status(HttpStatus.UNAUTHORIZED).json(
          ApiResponse({
            success: false,
            status: HttpStatus.UNAUTHORIZED,
            message: 'Authentication required.',
            error: {
              code: 'UNAUTHORIZED'
            }
          })
        );
        return;
      }

      const hasAllowedRole =
        allowedRoles.length === 0 || allowedRoles.some((role) => role === session.user.role);

      if (!hasAllowedRole) {
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
