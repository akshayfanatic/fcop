import { Role } from '../lib/auth/permissions.js';
import { prisma } from '../lib/prisma.js';

const FCOP_ORGANIZATION_SLUG = 'fanatic-coders';

export const teamService = {
  async getPublicTeam() {
    // Publish staff profiles without exposing client accounts or private user fields.
    const members = await prisma.member.findMany({
      where: {
        organization: { slug: FCOP_ORGANIZATION_SLUG },
        role: { in: [Role.ADMIN, Role.MANAGER, Role.MEMBER] }
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            designation: true,
            bio: true
          }
        }
      }
    });

    return members.map(({ user }) => user);
  }
};
