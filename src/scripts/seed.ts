import {
  LeadSource,
  LeadStatus,
  type Prisma,
  Role,
  ServiceInterest
} from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';

const users = [
  {
    id: 'seed-user-admin',
    name: 'FCOP Admin',
    email: 'admin@fanaticcoders.test',
    emailVerified: true,
    image: null,
    role: Role.ADMIN
  },
  {
    id: 'seed-user-manager',
    name: 'FCOP Manager',
    email: 'manager@fanaticcoders.test',
    emailVerified: true,
    image: null,
    role: Role.MANAGER
  },
  {
    id: 'seed-user-member',
    name: 'FCOP Member',
    email: 'member@fanaticcoders.test',
    emailVerified: true,
    image: null,
    role: Role.MEMBER
  },
  {
    id: 'seed-user-client',
    name: 'FCOP Client',
    email: 'client@fanaticcoders.test',
    emailVerified: true,
    image: null,
    role: Role.CLIENT
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
  for (const user of users) {
    await prisma.user.upsert({
      where: {
        email: user.email
      },
      create: user,
      update: {
        name: user.name,
        emailVerified: user.emailVerified,
        image: user.image,
        role: user.role
      } satisfies Prisma.UserUpdateInput
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

const main = async () => {
  assertUnique(users, 'id');
  assertUnique(users, 'email');
  assertUnique(leads, 'id');

  await seedUsers();
  await seedLeads();

  console.info(`Seeded ${users.length} users and ${leads.length} leads.`);
};

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
