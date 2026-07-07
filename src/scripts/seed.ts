import { hashPassword } from 'better-auth/crypto';
import {
  LeadSource,
  LeadStatus,
  type Prisma,
  ServiceInterest
} from '../generated/prisma/client.js';
import { Role } from '../lib/auth/permissions.js';
import { prisma } from '../lib/prisma.js';

const seedPassword = 'Password@123';

const users = [
  {
    id: 'seed-user-admin',
    name: 'FCOP Admin',
    email: 'admin@fanaticcoders.test',
    emailVerified: true,
    image: null
  },
  {
    id: 'seed-user-manager',
    name: 'FCOP Manager',
    email: 'manager@fanaticcoders.test',
    emailVerified: true,
    image: null
  },
  {
    id: 'seed-user-member',
    name: 'FCOP Member',
    email: 'member@fanaticcoders.test',
    emailVerified: true,
    image: null
  },
  {
    id: 'seed-user-client',
    name: 'FCOP Client',
    email: 'client@fanaticcoders.test',
    emailVerified: true,
    image: null
  }
] satisfies Prisma.UserCreateInput[];

const leads = [
  {
    id: 'seed-lead-web',
    name: 'Aisha Khan',
    email: 'aisha@example.test',
    companyName: 'Aisha Studio',
    serviceInterest: ServiceInterest.WEB_DEVELOPMENT,
    budgetRange: 'AED 10,000 - AED 25,000',
    status: LeadStatus.NEW,
    source: LeadSource.CONTACT_FORM
  },
  {
    id: 'seed-lead-seo',
    name: 'Omar Farooq',
    email: 'omar@example.test',
    companyName: 'Farooq Trading',
    serviceInterest: ServiceInterest.SEO,
    budgetRange: 'AED 5,000 - AED 10,000',
    status: LeadStatus.IN_PROGRESS,
    source: LeadSource.CONTACT_FORM
  },
  {
    id: 'seed-lead-ads',
    name: 'Nina Patel',
    email: 'nina@example.test',
    companyName: 'Patel Retail',
    serviceInterest: ServiceInterest.GOOGLE_ADS,
    budgetRange: 'AED 25,000+',
    status: LeadStatus.DEAD,
    source: LeadSource.CONTACT_FORM
  }
] satisfies Prisma.LeadCreateInput[];

const organization = {
  id: 'seed-org-fanatic-coders',
  name: 'Fanatic Coders',
  slug: 'fanatic-coders',
  logo: null,
  metadata: null
} satisfies Prisma.OrganizationCreateInput;

const organizationMembers = [
  {
    id: 'seed-member-admin',
    userId: 'seed-user-admin',
    role: Role.ADMIN
  },
  {
    id: 'seed-member-manager',
    userId: 'seed-user-manager',
    role: Role.MANAGER
  },
  {
    id: 'seed-member-member',
    userId: 'seed-user-member',
    role: Role.MEMBER
  },
  {
    id: 'seed-member-client',
    userId: 'seed-user-client',
    role: Role.CLIENT
  }
] as const;

const assertUnique = <T>(records: readonly T[], key: keyof T) => {
  const seen = new Set<T[keyof T]>();

  for (const record of records) {
    const value = record[key];

    if (seen.has(value)) {
      throw new Error(`Duplicate seed value for ${String(key)}: ${String(value)}`);
    }

    seen.add(value);
  }
};

const seedUsers = async () => {
  const passwordHash = await hashPassword(seedPassword);

  for (const user of users) {
    const persistedUser = await prisma.user.upsert({
      where: {
        email: user.email
      },
      create: user,
      update: {
        name: user.name,
        emailVerified: user.emailVerified,
        image: user.image
      } satisfies Prisma.UserUpdateInput
    });

    await prisma.account.upsert({
      where: {
        id: `seed-account-${persistedUser.id}`
      },
      create: {
        id: `seed-account-${persistedUser.id}`,
        accountId: persistedUser.id,
        providerId: 'credential',
        user: {
          connect: {
            id: persistedUser.id
          }
        },
        password: passwordHash
      },
      update: {
        accountId: persistedUser.id,
        providerId: 'credential',
        password: passwordHash
      } satisfies Prisma.AccountUpdateInput
    });
  }
};

const seedLeads = async () => {
  for (const lead of leads) {
    await prisma.lead.upsert({
      where: {
        id: lead.id
      },
      create: lead,
      update: {
        name: lead.name,
        email: lead.email,
        companyName: lead.companyName,
        serviceInterest: lead.serviceInterest,
        budgetRange: lead.budgetRange,
        status: lead.status,
        source: lead.source
      } satisfies Prisma.LeadUpdateInput
    });
  }
};

const seedOrganization = async () => {
  const org = await prisma.organization.upsert({
    where: {
      slug: organization.slug
    },
    create: organization,
    update: {
      name: organization.name,
      logo: organization.logo,
      metadata: organization.metadata
    } satisfies Prisma.OrganizationUpdateInput
  });

  for (const member of organizationMembers) {
    await prisma.member.upsert({
      where: {
        id: member.id
      },
      create: {
        id: member.id,
        user: {
          connect: {
            id: member.userId
          }
        },
        organization: {
          connect: {
            id: org.id
          }
        },
        role: member.role
      },
      update: {
        role: member.role,
        organization: {
          connect: {
            id: org.id
          }
        }
      } satisfies Prisma.MemberUpdateInput
    });
  }

  return org;
};

const main = async () => {
  assertUnique(users, 'id');
  assertUnique(users, 'email');
  assertUnique(leads, 'id');

  await seedUsers();
  const org = await seedOrganization();
  await seedLeads();

  console.info(
    `Seeded ${users.length} users, ${organizationMembers.length} organization members in ${org.name}, and ${leads.length} leads.`
  );
  console.info(`Seed user password: ${seedPassword}`);
};

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
