import type { IncomingHttpHeaders } from 'node:http';
import { MediaTargetType } from '../generated/prisma/client.js';
import { getSessionMember } from '../lib/auth/session.js';
import { cloudinaryMedia, type StoredResourceType } from '../lib/cloudinary/media.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import { HttpStatus } from '../utils/api-response.js';
import { createHttpError } from '../utils/http-error.js';
import { createPaginatedData, getPaginationOffset } from '../utils/pagination.js';
import { getProjectAccessWhere } from '../utils/project/project-access.js';
import type { ProjectMediaFiltersInput } from '../validators/project-media.validator.js';

const requireAccessibleProject = async (projectId: string, headers: IncomingHttpHeaders) => {
  const member = await getSessionMember(headers);
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ...getProjectAccessWhere(member)
    },
    select: {
      id: true
    }
  });

  if (!project) {
    throw createHttpError(HttpStatus.NOT_FOUND, 'Project not found.', 'PROJECT_NOT_FOUND');
  }

  return member;
};

export const projectMediaService = {
  uploadProjectMedia: async (projectId: string, file: Express.Multer.File | undefined, headers: IncomingHttpHeaders) => {
    if (!file) {
      throw createHttpError(HttpStatus.BAD_REQUEST, 'Media file is required.', 'MEDIA_FILE_REQUIRED');
    }

    await requireAccessibleProject(projectId, headers);
    const uploaded = await cloudinaryMedia.upload({
      buffer: file.buffer,
      folder: `projects/${projectId}/media`,
      resourceType: file.mimetype === 'application/pdf' ? 'raw' : 'auto'
    });

    try {
      // Save attachment metadata so project reads do not depend on Cloudinary administration APIs.
      return await prisma.media.create({
        data: {
          targetType: MediaTargetType.PROJECT,
          targetId: projectId,
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
        logger.error({ cleanupError, publicId: uploaded.publicId }, 'Failed to remove orphaned project media.');
      }

      throw error;
    }
  },

  getProjectMedia: async (projectId: string, filters: ProjectMediaFiltersInput, headers: IncomingHttpHeaders) => {
    await requireAccessibleProject(projectId, headers);
    const { page, pageSize } = filters;
    const [items, totalItems] = await Promise.all([
      prisma.media.findMany({
        where: {
          targetType: MediaTargetType.PROJECT,
          targetId: projectId
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: getPaginationOffset({ page, pageSize }),
        take: pageSize
      }),
      prisma.media.count({
        where: {
          targetType: MediaTargetType.PROJECT,
          targetId: projectId
        }
      })
    ]);

    return createPaginatedData({ items, page, pageSize, totalItems });
  },

  deleteProjectMedia: async (projectId: string, mediaId: string, headers: IncomingHttpHeaders) => {
    await requireAccessibleProject(projectId, headers);
    const media = await prisma.media.findFirst({
      where: {
        id: mediaId,
        targetType: MediaTargetType.PROJECT,
        targetId: projectId
      }
    });

    if (!media) {
      throw createHttpError(HttpStatus.NOT_FOUND, 'Project media not found.', 'MEDIA_NOT_FOUND');
    }

    // Remove the provider asset before deleting its application record.
    await cloudinaryMedia.delete({
      publicId: media.publicId,
      resourceType: media.resourceType as StoredResourceType
    });

    return await prisma.media.delete({
      where: {
        id: media.id
      }
    });
  }
};
