import type { IncomingHttpHeaders } from 'node:http';
import { MediaTargetType } from '../generated/prisma/client.js';
import { getSessionMember } from '../lib/auth/session.js';
import { cloudinaryMedia, type StoredResourceType } from '../lib/cloudinary/media.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import { HttpStatus } from '../utils/api-response.js';
import { createHttpError } from '../utils/http-error.js';
import { createPaginatedData, getPaginationOffset } from '../utils/pagination.js';
import { getVisibleTaskWhere } from '../utils/task/task-access.js';
import type { TaskMediaFiltersInput } from '../validators/task-media.validator.js';

const requireAccessibleTask = async (taskId: string, headers: IncomingHttpHeaders) => {
  const member = await getSessionMember(headers);
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      ...getVisibleTaskWhere(member)
    },
    select: {
      id: true
    }
  });

  if (!task) {
    throw createHttpError(HttpStatus.NOT_FOUND, 'Task not found.', 'TASK_NOT_FOUND');
  }

  return task;
};

export const taskMediaService = {
  uploadTaskMedia: async (taskId: string, file: Express.Multer.File | undefined, headers: IncomingHttpHeaders) => {
    if (!file) {
      throw createHttpError(HttpStatus.BAD_REQUEST, 'Media file is required.', 'MEDIA_FILE_REQUIRED');
    }

    const task = await requireAccessibleTask(taskId, headers);
    const uploaded = await cloudinaryMedia.upload({
      buffer: file.buffer,
      folder: `tasks/${task.id}/media`,
      resourceType: file.mimetype === 'application/pdf' ? 'raw' : 'auto'
    });

    try {
      // Save attachment metadata so task reads do not depend on Cloudinary administration APIs.
      return await prisma.media.create({
        data: {
          targetType: MediaTargetType.TASK,
          targetId: task.id,
          publicId: uploaded.publicId,
          secureUrl: uploaded.secureUrl,
          resourceType: uploaded.resourceType
        }
      });
    } catch (error) {
      try {
        // Remove orphaned media when database persistence fails after provider upload.
        await cloudinaryMedia.delete({
          publicId: uploaded.publicId,
          resourceType: uploaded.resourceType
        });
      } catch (cleanupError) {
        logger.error({ cleanupError, publicId: uploaded.publicId }, 'Failed to remove orphaned task media.');
      }

      throw error;
    }
  },

  getTaskMedia: async (taskId: string, filters: TaskMediaFiltersInput, headers: IncomingHttpHeaders) => {
    const task = await requireAccessibleTask(taskId, headers);
    const { page, pageSize } = filters;
    const where = {
      targetType: MediaTargetType.TASK,
      targetId: task.id
    };
    const [items, totalItems] = await Promise.all([
      prisma.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: getPaginationOffset({ page, pageSize }),
        take: pageSize
      }),
      prisma.media.count({ where })
    ]);

    return createPaginatedData({ items, page, pageSize, totalItems });
  },

  deleteTaskMedia: async (taskId: string, mediaId: string, headers: IncomingHttpHeaders) => {
    const task = await requireAccessibleTask(taskId, headers);
    const media = await prisma.media.findFirst({
      where: {
        id: mediaId,
        targetType: MediaTargetType.TASK,
        targetId: task.id
      }
    });

    if (!media) {
      throw createHttpError(HttpStatus.NOT_FOUND, 'Task attachment not found.', 'MEDIA_NOT_FOUND');
    }

    // Remove the provider asset before deleting its application record.
    await cloudinaryMedia.delete({
      publicId: media.publicId,
      resourceType: media.resourceType as StoredResourceType
    });

    return await prisma.media.delete({ where: { id: media.id } });
  }
};
