import type { IncomingHttpHeaders } from 'node:http';
import { getRolePermissionStatements, type OrganizationPermission } from '../lib/auth/permissions.js';
import { cloudinaryMedia } from '../lib/cloudinary/media.js';
import { getSessionMember } from '../lib/auth/session.js';
import { prisma } from '../lib/prisma.js';

type AvatarFile = {
  buffer: Buffer;
};

export type CurrentUserAccess = {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  organizationId: string;
  memberId: string;
  role: string;
  permissions: OrganizationPermission;
};

export const meService = {
  getMe: async (headers: IncomingHttpHeaders): Promise<CurrentUserAccess> => {
    const member = await getSessionMember(headers);

    // Expose current access for UI decisions; backend route guards remain the source of enforcement.
    return {
      user: {
        id: member.userId,
        name: member.user.name,
        email: member.user.email,
        image: member.user.image
      },
      organizationId: member.organizationId,
      memberId: member.id,
      role: member.role,
      permissions: getRolePermissionStatements(member.role)
    };
  },

  updateAvatar: async (file: AvatarFile, headers: IncomingHttpHeaders) => {
    const member = await getSessionMember(headers);

    const uploaded = await cloudinaryMedia.upload({
      buffer: file.buffer,
      folder: `fcop/users/${member.userId}`,
      publicId: 'avatar',
      resourceType: 'image',
      overwrite: true
    });

    // Save the current delivery URL so all profile consumers receive the replaced avatar version.
    return await prisma.user.update({
      where: {
        id: member.userId
      },
      data: {
        image: uploaded.secureUrl
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      }
    });
  },

  deleteAvatar: async (headers: IncomingHttpHeaders) => {
    const member = await getSessionMember(headers);

    // Remove the stored avatar before clearing its profile reference.
    await cloudinaryMedia.delete({
      publicId: `fcop/users/${member.userId}/avatar`,
      resourceType: 'image'
    });

    return await prisma.user.update({
      where: {
        id: member.userId
      },
      data: {
        image: null
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      }
    });
  }
};
