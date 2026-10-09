import { env } from '../config/env.js';
import { emailConfig } from '../lib/email/config.js';
import { resend } from '../lib/email/services/resend.service.js';
import { createNewBlogPostEmailTemplate } from '../lib/email/templates/new-blog-post-email.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';

type BlogAnnouncement = { id: string; title: string; slug: string; excerpt: string | null };

const batchSize = 100;

export const blogAnnouncementService = {
  sendToSubscribers: async (blog: BlogAnnouncement) => {
    if (!env.resendApiKey) {
      logger.warn({ blogId: blog.id }, 'RESEND_API_KEY is missing; blog announcement was not sent.');
      return;
    }

    const template = createNewBlogPostEmailTemplate(blog);
    let cursor: string | undefined;
    let sent = 0;

    do {
      const subscribers = await prisma.newsletterSubscriber.findMany({
        select: { id: true, email: true },
        orderBy: { id: 'asc' },
        take: batchSize,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})
      });
      if (subscribers.length === 0) break;

      cursor = subscribers[subscribers.length - 1].id;

      // Batch emails keep recipients private and stay within Resend's 100 email limit.
      const { error } = await resend.batch.send(
        subscribers.map(({ email }) => ({
          from: emailConfig.from,
          to: email,
          subject: template.subject,
          react: template.react,
          text: template.text
        })),
        { idempotencyKey: `blog-${blog.id}-${cursor}` }
      );

      if (error) {
        logger.error({ error, blogId: blog.id, batchEnd: cursor }, 'Failed to send blog announcement batch.');
      } else {
        sent += subscribers.length;
      }

      if (subscribers.length < batchSize) break;
    } while (cursor);

    logger.info({ blogId: blog.id, sent }, 'Blog announcement finished.');
  }
};
