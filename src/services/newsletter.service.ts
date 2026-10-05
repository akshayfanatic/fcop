import { Prisma } from '../generated/prisma/client.js';
import { env } from '../config/env.js';
import { createNewNewsletterSubscriptionEmailTemplate, sendTemplateEmail } from '../lib/email/index.js';
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
      const subscriber = await prisma.newsletterSubscriber.create({
        data: { email: payload.email } satisfies Prisma.NewsletterSubscriberCreateInput
      });

      if (!env.adminEmail) {
        logger.warn('ADMIN_EMAIL is not configured. Skipping new newsletter subscription email notification.');
        return accepted;
      }

      try {
        // Send email to tell admin about the new newsletter subscriber.
        await sendTemplateEmail({
          to: env.adminEmail,
          replyTo: subscriber.email,
          template: createNewNewsletterSubscriptionEmailTemplate({ subscriber })
        });
      } catch (error) {
        logger.error({ error, subscriberId: subscriber.id }, 'Failed to send new newsletter subscription email notification.');
      }

      return accepted;
    } catch (error) {
      // Repeated signups remain private and do not send duplicate admin emails.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return accepted;
      }

      logger.error({ error }, 'Failed to create newsletter subscription.');
      throw error;
    }
  }
};
