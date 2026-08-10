import type { Member, User } from '../generated/prisma/client.js';
import { Role } from '../lib/auth/permissions.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import { hasRole } from '../utils/role.js';

type AcceptedMemberPayload = {
  member: Pick<Member, 'id' | 'role'>;
  user: Pick<User, 'name'>;
};

const FCOP_ORGANIZATION_SLUG = 'fanatic-coders';

export const clientService = {
  findOrganizationClientByEmail: async (email: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();

      const client = await prisma.client.findFirst({
        where: {
          member: {
            organization: {
              slug: FCOP_ORGANIZATION_SLUG
            },
            user: {
              email: normalizedEmail
            }
          }
        },
        select: {
          id: true,
          name: true,
          member: {
            select: {
              user: {
                select: {
                  email: true
                }
              }
            }
          }
        }
      });

      return client;
    } catch (error) {
      logger.error({ error, email }, 'Failed to find client by email.');
      throw error;
    }
  },

  provisionDirectSignupClient: async (userId: string) => {
    try {
      const [user, organization] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, email: true }
        }),
        prisma.organization.findUnique({
          where: { slug: FCOP_ORGANIZATION_SLUG },
          select: { id: true }
        })
      ]);

      if (!user || !organization) {
        throw new Error('FCOP client onboarding is not configured.');
      }

      const existingMember = await prisma.member.findFirst({
        where: {
          userId: user.id,
          organizationId: organization.id
        },
        select: {
          id: true,
          role: true
        }
      });

      if (existingMember) {
        if (hasRole(existingMember.role, Role.CLIENT)) {
          // Repair a missing client profile before the member starts a new session.
          await prisma.client.upsert({
            where: { memberId: existingMember.id },
            update: {},
            create: {
              memberId: existingMember.id,
              name: user.name
            }
          });
        }

        return organization.id;
      }

      const pendingInvitation = await prisma.invitation.findFirst({
        where: {
          organizationId: organization.id,
          email: user.email,
          status: 'pending'
        },
        select: { id: true }
      });

      // Preserve the role selected by an invitation instead of defaulting invited staff to Client.
      if (pendingInvitation) {
        return null;
      }

      // Add direct signups to the existing organization with their required client profile.
      await prisma.member.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: Role.CLIENT,
          client: {
            create: {
              name: user.name
            }
          }
        }
      });

      logger.info(
        {
          userId: user.id,
          organizationId: organization.id
        },
        'Provisioned direct signup as an organization client.'
      );

      return organization.id;
    } catch (error) {
      logger.error({ error, userId }, 'Failed to provision direct signup as an organization client.');
      throw error;
    }
  },

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
