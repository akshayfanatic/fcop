import { Prisma } from '../generated/prisma/client.js';
import { env } from '../config/env.js';
import { Role } from '../lib/auth/permissions.js';
import { createNewNewsletterSubscriptionEmailTemplate, sendTemplateEmail } from '../lib/email/index.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import { createPaginatedData, getPaginationOffset } from '../utils/pagination.js';
import type { CreateNewsletterSubscriptionInput, NewsletterSubscriptionFiltersInput } from '../validators/newsletter.validator.js';
import { notificationService } from './notification.service.js';

const accepted = { accepted: true } as const;

const notifyAdmins = async (subscriber: { email: string }) => {
  try {
    const admins = await prisma.member.findMany({
      where: {
        role: Role.ADMIN
      },
      select: {
        id: true
      }
    });

    // Create notifications so every administrator can see the new subscriber in their inbox.
    await notificationService.createForMembers({
      memberIds: admins.map((admin) => admin.id),
      title: 'New newsletter subscriber',
      message: `${subscriber.email} subscribed to the newsletter.`,
      link: '/dashboard/admin/newsletter'
    });
  } catch (error) {
    logger.error({ error, subscriberEmail: subscriber.email }, 'Failed to create new newsletter subscription notifications.');
  }
};

export const newsletterService = {
  getSubscriptions: async (filters: NewsletterSubscriptionFiltersInput) => {
    try {
      const where = {
        ...(filters.email ? { email: { contains: filters.email } } : {})
      } satisfies Prisma.NewsletterSubscriberWhereInput;

      const [items, totalItems] = await Promise.all([
        prisma.newsletterSubscriber.findMany({
          where,
          orderBy: {
            createdAt: 'desc'
          },
          skip: getPaginationOffset(filters),
          take: filters.pageSize
        }),
        prisma.newsletterSubscriber.count({ where })
      ]);

      return createPaginatedData({
        items,
        page: filters.page,
        pageSize: filters.pageSize,
        totalItems
      });
    } catch (error) {
      logger.error({ error, filters }, 'Failed to fetch newsletter subscriptions.');
      throw error;
    }
  },

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

      await notifyAdmins(subscriber);

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
