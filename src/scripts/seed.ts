import { LeadSource, LeadStatus, type Prisma, ServiceInterest } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';

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
  assertUnique(leads, 'id');

  await seedLeads();

  console.info(`Seeded ${leads.length} leads.`);
};

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
