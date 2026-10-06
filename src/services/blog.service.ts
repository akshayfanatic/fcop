import { type Prisma } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { HttpStatus } from '../utils/api-response.js';
import { createHttpError } from '../utils/http-error.js';
import { createPaginatedData, getPaginationOffset } from '../utils/pagination.js';
import type { BlogFiltersInput, CreateBlogInput, PublishedBlogFiltersInput, UpdateBlogInput } from '../validators/blog.validator.js';

const blogSummarySelect = {
  id: true,
  title: true,
  slug: true,
  featureImage: true,
  excerpt: true,
  isPublished: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.BlogSelect;

export const blogService = {
  getPublishedBlogs: async (filters: PublishedBlogFiltersInput) => {
    const where = { isPublished: true } satisfies Prisma.BlogWhereInput;
    const [items, totalItems] = await Promise.all([
      prisma.blog.findMany({
        where,
        select: blogSummarySelect,
        orderBy: { createdAt: 'desc' },
        skip: getPaginationOffset(filters),
        take: filters.pageSize
      }),
      prisma.blog.count({ where })
    ]);

    return createPaginatedData({ items, page: filters.page, pageSize: filters.pageSize, totalItems });
  },

  getPublishedBlogBySlug: async (slug: string) => {
    // Keep unpublished drafts out of the public blog even when their slug is known.
    const blog = await prisma.blog.findFirst({ where: { slug, isPublished: true } });
    if (!blog) {
      throw createHttpError(HttpStatus.NOT_FOUND, 'Blog not found.', 'NOT_FOUND');
    }
    return blog;
  },

  getBlogs: async (filters: BlogFiltersInput) => {
    const where = {
      ...(filters.isPublished === undefined ? {} : { isPublished: filters.isPublished })
    } satisfies Prisma.BlogWhereInput;
    const [items, totalItems] = await Promise.all([
      prisma.blog.findMany({
        where,
        select: blogSummarySelect,
        orderBy: { createdAt: 'desc' },
        skip: getPaginationOffset(filters),
        take: filters.pageSize
      }),
      prisma.blog.count({ where })
    ]);

    return createPaginatedData({ items, page: filters.page, pageSize: filters.pageSize, totalItems });
  },

  getBlogById: async (id: string) => {
    const blog = await prisma.blog.findUnique({ where: { id } });
    if (!blog) {
      throw createHttpError(HttpStatus.NOT_FOUND, 'Blog not found.', 'NOT_FOUND');
    }
    return blog;
  },

  createBlog: async (payload: CreateBlogInput) =>
    prisma.blog.create({
      data: payload satisfies Prisma.BlogCreateInput
    }),

  updateBlogById: async (id: string, payload: UpdateBlogInput) => {
    const result = await prisma.blog.updateMany({ where: { id }, data: payload });
    if (result.count === 0) {
      throw createHttpError(HttpStatus.NOT_FOUND, 'Blog not found.', 'NOT_FOUND');
    }
    return prisma.blog.findUniqueOrThrow({ where: { id } });
  },

  deleteBlogById: async (id: string) => {
    const blog = await blogService.getBlogById(id);
    await prisma.blog.delete({ where: { id } });
    return blog;
  }
};
