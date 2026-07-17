import type { Member, User } from '../generated/prisma/client.js';
import { Role } from '../lib/auth/permissions.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import { hasRole } from '../utils/role.js';

type AcceptedMemberPayload = {
  member: Pick<Member, 'id' | 'role'>;
  user: Pick<User, 'name'>;
};

export const clientService = {
  createClient: async ({ member, user }: AcceptedMemberPayload) => {
    // Create client profile only for client members.
    if (!hasRole(member.role, Role.CLIENT)) {
      return null;
    }

    try {
      const client = await prisma.client.upsert({
        where: {
          memberId: member.id
        },
        update: {},
        create: {
          memberId: member.id,
          name: user.name
        }
      });

      logger.info(
        {
          clientId: client.id,
          memberId: member.id
        },
        'Created client profile for accepted member.'
      );

      return client;
    } catch (error) {
      logger.error({ error, memberId: member.id }, 'Failed to create client profile.');
      throw error;
    }
  }
};
