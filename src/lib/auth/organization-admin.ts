import type { BetterAuthPlugin } from 'better-auth';
import { createAuthEndpoint, sessionMiddleware } from 'better-auth/api';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin } from 'better-auth/plugins/admin';
import { runWithAdapter } from '@better-auth/core/context';
import { z } from 'zod';
import type { PrismaClient } from '../../generated/prisma/client.js';
import { authorizeUserDeletion, deleteUserRelatedData } from './user-deletion.js';
import { userDeletionEvents } from './user-deletion-events.js';

// Expose only Admin's removal operation while keeping Member.role as FCOP's authority.
export function organizationAdmin(db: PrismaClient) {
  return {
    id: 'organization-admin',
    endpoints: {
      removeUser: createAuthEndpoint(
        '/admin/remove-user',
        {
          method: 'POST',
          body: z.object({ userId: z.string().trim().min(1).max(36) }),
          use: [sessionMiddleware]
        },
        async (ctx) => {
          const deleted = await db.$transaction(
            async (tx) => {
              const actorId = ctx.context.session.user.id;
              const target = await authorizeUserDeletion(tx, actorId, ctx.body.userId);
              const result = await deleteUserRelatedData(tx, target);

              // Delegate auth cleanup to Better Auth inside the same database transaction.
              const adapter = prismaAdapter(tx, { provider: 'mysql' })(ctx.context.options);
              const removeUser = admin({ adminUserIds: [actorId] }).endpoints.removeUser;
              await runWithAdapter(adapter, () => removeUser({ ...ctx, asResponse: false, returnHeaders: false, returnStatus: false }));
              return result;
            },
            { isolationLevel: 'Serializable', timeout: 30000 }
          );

          // Disconnect deleted accounts so existing sockets cannot keep receiving private messages.
          userDeletionEvents.emit('deleted', deleted);
          return ctx.json({ success: true });
        }
      )
    }
  } satisfies BetterAuthPlugin;
}
