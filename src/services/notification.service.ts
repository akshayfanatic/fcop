import type { IncomingHttpHeaders } from 'node:http';
import type { Prisma } from '../generated/prisma/client.js';
import { getSessionMember } from '../lib/auth/session.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import { HttpStatus } from '../utils/api-response.js';
import { createHttpError } from '../utils/http-error.js';
import { createPaginatedData, getPaginationOffset } from '../utils/pagination.js';
import type { NotificationListQueryInput } from '../validators/notification.validator.js';

type CreateNotificationsInput = {
  memberIds: string[];
  title: string;
  message: string;
  link?: string;
};

const createForMembers = async (input: CreateNotificationsInput) => {
  const memberIds = [...new Set(input.memberIds)];

  if (memberIds.length === 0) {
    return;
  }

  try {
    // Create one personal notification for every member affected by the business action.
    await prisma.notification.createMany({
      data: memberIds.map((memberId) => ({
        memberId,
        title: input.title,
        message: input.message,
        link: input.link
      }))
    });
  } catch (error) {
    logger.error({ error, memberIds }, 'Failed to create member notifications.');
  }
};

export const notificationService = {
  createForMembers,

  getNotifications: async (query: NotificationListQueryInput, headers: IncomingHttpHeaders) => {
    try {
      const member = await getSessionMember(headers);
      const where = {
        memberId: member.id,
        ...(query.unreadOnly ? { readAt: null } : {})
      } satisfies Prisma.NotificationWhereInput;

      const [items, totalItems, unreadCount] = await prisma.$transaction([
        prisma.notification.findMany({
          where,
          orderBy: {
            createdAt: 'desc'
          },
          skip: getPaginationOffset(query),
          take: query.pageSize
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({
          where: {
            memberId: member.id,
            readAt: null
          }
        })
      ]);

      return {
        ...createPaginatedData({
          items,
          page: query.page,
          pageSize: query.pageSize,
          totalItems
        }),
        unreadCount
      };
    } catch (error) {
      logger.error({ error }, 'Failed to fetch notifications.');
      throw error;
    }
  },

  markAsRead: async (notificationId: string, headers: IncomingHttpHeaders) => {
    try {
      const member = await getSessionMember(headers);
      const result = await prisma.notification.updateMany({
        where: {
          id: notificationId,
          memberId: member.id
        },
        data: {
          readAt: new Date()
        }
      });

      if (result.count === 0) {
        throw createHttpError(HttpStatus.NOT_FOUND, 'Notification not found.', 'NOTIFICATION_NOT_FOUND');
      }

      return await prisma.notification.findUniqueOrThrow({
        where: {
          id: notificationId
        }
      });
    } catch (error) {
      logger.error({ error, notificationId }, 'Failed to mark notification as read.');
      throw error;
    }
  },

  markAllAsRead: async (headers: IncomingHttpHeaders) => {
    try {
      const member = await getSessionMember(headers);
      const result = await prisma.notification.updateMany({
        where: {
          memberId: member.id,
          readAt: null
        },
        data: {
          readAt: new Date()
        }
      });

      return {
        updatedCount: result.count
      };
    } catch (error) {
      logger.error({ error }, 'Failed to mark all notifications as read.');
      throw error;
    }
  }
};
