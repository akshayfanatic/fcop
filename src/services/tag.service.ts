import { type Prisma } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { HttpStatus } from '../utils/api-response.js';
import { createHttpError } from '../utils/http-error.js';
import { createPaginatedData, getPaginationOffset } from '../utils/pagination.js';
import type { CreateTagInput, TagFiltersInput, UpdateTagInput } from '../validators/tag.validator.js';

export const tagService = {
  getTagOptions: async () => {
    const tags = await prisma.tag.findMany({ select: { id: true, name: true }, orderBy: [{ name: 'asc' }, { id: 'asc' }] });
    return tags.map(({ id, name }) => ({ label: name, value: id }));
  },

  getTags: async (filters: TagFiltersInput) => {
    const [items, totalItems] = await Promise.all([prisma.tag.findMany({ orderBy: { name: 'asc' }, skip: getPaginationOffset(filters), take: filters.pageSize }), prisma.tag.count()]);

    return createPaginatedData({ items, page: filters.page, pageSize: filters.pageSize, totalItems });
  },

  getTagById: async (id: string) => {
    const tag = await prisma.tag.findUnique({ where: { id } });
    if (!tag) throw createHttpError(HttpStatus.NOT_FOUND, 'Tag not found.', 'NOT_FOUND');
    return tag;
  },

  createTag: async (payload: CreateTagInput) => prisma.tag.create({ data: payload satisfies Prisma.TagCreateInput }),

  updateTagById: async (id: string, payload: UpdateTagInput) => {
    const result = await prisma.tag.updateMany({ where: { id }, data: payload });
    if (result.count === 0) throw createHttpError(HttpStatus.NOT_FOUND, 'Tag not found.', 'NOT_FOUND');
    return prisma.tag.findUniqueOrThrow({ where: { id } });
  },

  deleteTagById: async (id: string) => {
    await tagService.getTagById(id);
    return prisma.tag.delete({ where: { id } });
  }
};
