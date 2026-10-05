import { type Prisma } from '../generated/prisma/client.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import type { CreateNewsletterSubscriptionInput } from '../validators/newsletter.validator.js';

const accepted = { accepted: true } as const;

export const newsletterService = {
  createSubscription: async (payload: CreateNewsletterSubscriptionInput) => {
    // Silently accept honeypot submissions so bots cannot tune around the field.
    if (payload.website) {
      logger.warn('Discarded newsletter honeypot submission.');
      return accepted;
    }

    try {
      // Upsert keeps repeated signups private and prevents duplicate subscriber rows.
      await prisma.newsletterSubscriber.upsert({
        where: { email: payload.email },
        create: { email: payload.email } satisfies Prisma.NewsletterSubscriberCreateInput,
        update: {}
      });

      return accepted;
    } catch (error) {
      logger.error({ error }, 'Failed to create newsletter subscription.');
      throw error;
    }
  }
};
