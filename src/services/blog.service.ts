import { type Prisma } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { cloudinaryMedia } from '../lib/cloudinary/media.js';
import { logger } from '../lib/logger.js';
import { HttpStatus } from '../utils/api-response.js';
import { createHttpError } from '../utils/http-error.js';
import { createPaginatedData, getPaginationOffset } from '../utils/pagination.js';
import type { BlogFiltersInput, CreateBlogInput, PublishedBlogFiltersInput, UpdateBlogInput } from '../validators/blog.validator.js';
import { blogAnnouncementService } from './blog-announcement.service.js';

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

const blogDetailInclude = { blogSeo: true, blogCategories: { include: { category: true } }, blogTags: { include: { tag: true } } } satisfies Prisma.BlogInclude;

const featureImagePublicId = (id: string) => `fcop/blogs/${id}/feature-image`;

const hasManagedFeatureImage = (id: string, url: string | null) => Boolean(url?.includes(`/${featureImagePublicId(id)}.`));

const announcePublishedBlog = (blog: { id: string; title: string; slug: string; excerpt: string | null }) => {
  // Email delivery runs after the blog is saved so a provider failure cannot undo publication.
  setImmediate(() => {
    void blogAnnouncementService.sendToSubscribers(blog).catch((error) => {
      logger.error({ error, blogId: blog.id }, 'Failed to send blog announcement.');
    });
  });
};

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
    const blog = await prisma.blog.findFirst({
      where: { slug, isPublished: true },
      include: blogDetailInclude
    });
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
    const blog = await prisma.blog.findUnique({
      where: { id },
      include: blogDetailInclude
    });
    if (!blog) {
      throw createHttpError(HttpStatus.NOT_FOUND, 'Blog not found.', 'NOT_FOUND');
    }
    return blog;
  },

  createBlog: async (payload: CreateBlogInput) => {
    const { blogSeo, ...blogData } = payload;
    const blog = await prisma.blog.create({
      data: { ...blogData, ...(blogSeo === undefined ? {} : { blogSeo: { create: blogSeo } }) } satisfies Prisma.BlogCreateInput,
      include: blogDetailInclude
    });
    if (blog.isPublished) announcePublishedBlog(blog);
    return blog;
  },

  updateBlogById: async (id: string, payload: UpdateBlogInput) => {
    const { categoryIds, tagIds, blogSeo, ...blogData } = payload;

    const { updatedBlog, becamePublished } = await prisma.$transaction(async (tx) => {
      const blog = await tx.blog.findUnique({ where: { id }, select: { id: true, isPublished: true } });
      if (!blog) throw createHttpError(HttpStatus.NOT_FOUND, 'Blog not found.', 'NOT_FOUND');

      const uniqueCategoryIds = categoryIds === undefined ? undefined : [...new Set(categoryIds)];
      const uniqueTagIds = tagIds === undefined ? undefined : [...new Set(tagIds)];

      if (uniqueCategoryIds !== undefined) {
        const count = await tx.category.count({ where: { id: { in: uniqueCategoryIds } } });
        if (count !== uniqueCategoryIds.length) throw createHttpError(HttpStatus.BAD_REQUEST, 'One or more categories were not found.', 'INVALID_BLOG_CATEGORY');
      }
      if (uniqueTagIds !== undefined) {
        const count = await tx.tag.count({ where: { id: { in: uniqueTagIds } } });
        if (count !== uniqueTagIds.length) throw createHttpError(HttpStatus.BAD_REQUEST, 'One or more tags were not found.', 'INVALID_BLOG_TAG');
      }

      // Update the blog and its selections together so invalid IDs cannot leave partial changes.
      if (Object.keys(blogData).length > 0) await tx.blog.update({ where: { id }, data: blogData });
      if (blogSeo === null) await tx.blogSeo.deleteMany({ where: { blogId: id } });
      else if (blogSeo !== undefined) await tx.blogSeo.upsert({ where: { blogId: id }, create: { blogId: id, ...blogSeo }, update: blogSeo });
      if (uniqueCategoryIds !== undefined) {
        await tx.blogCategory.deleteMany({ where: { blogId: id } });
        if (uniqueCategoryIds.length > 0) await tx.blogCategory.createMany({ data: uniqueCategoryIds.map((categoryId) => ({ blogId: id, categoryId })) });
      }
      if (uniqueTagIds !== undefined) {
        await tx.blogTag.deleteMany({ where: { blogId: id } });
        if (uniqueTagIds.length > 0) await tx.blogTag.createMany({ data: uniqueTagIds.map((tagId) => ({ blogId: id, tagId })) });
      }

      const updatedBlog = await tx.blog.findUniqueOrThrow({ where: { id }, include: blogDetailInclude });
      return { updatedBlog, becamePublished: !blog.isPublished && updatedBlog.isPublished };
    });
    if (becamePublished) announcePublishedBlog(updatedBlog);
    return updatedBlog;
  },

  updateBlogFeatureImageById: async (id: string, file: Express.Multer.File) => {
    await blogService.getBlogById(id);
    const uploaded = await cloudinaryMedia.upload({
      buffer: file.buffer,
      folder: `fcop/blogs/${id}`,
      publicId: 'feature-image',
      resourceType: 'image',
      overwrite: true
    });

    // The versioned delivery URL points readers to the replacement image.
    return prisma.blog.update({ where: { id }, data: { featureImage: uploaded.secureUrl } });
  },

  deleteBlogFeatureImageById: async (id: string) => {
    const blog = await blogService.getBlogById(id);
    if (hasManagedFeatureImage(id, blog.featureImage)) {
      await cloudinaryMedia.delete({ publicId: featureImagePublicId(id), resourceType: 'image' });
    }
    return prisma.blog.update({ where: { id }, data: { featureImage: null } });
  },

  deleteBlogById: async (id: string) => {
    const blog = await blogService.getBlogById(id);
    if (hasManagedFeatureImage(id, blog.featureImage)) {
      await cloudinaryMedia.delete({ publicId: featureImagePublicId(id), resourceType: 'image' });
    }
    await prisma.blog.delete({ where: { id } });
    return blog;
  }
};
