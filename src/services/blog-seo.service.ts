import { prisma } from '../lib/prisma.js';
import { HttpStatus } from '../utils/api-response.js';
import { createHttpError } from '../utils/http-error.js';
import type { UpsertBlogSeoInput } from '../validators/blog-seo.validator.js';

export const blogSeoService = {
  getBlogSeoByBlogId: async (blogId: string) => {
    const blogSeo = await prisma.blogSeo.findUnique({ where: { blogId } });
    if (!blogSeo) {
      throw createHttpError(HttpStatus.NOT_FOUND, 'Blog SEO not found.', 'NOT_FOUND');
    }
    return blogSeo;
  },

  upsertBlogSeoByBlogId: async (blogId: string, payload: UpsertBlogSeoInput) => {
    // Make sure SEO metadata is attached only to an existing blog.
    const blog = await prisma.blog.findUnique({ where: { id: blogId }, select: { id: true } });
    if (!blog) {
      throw createHttpError(HttpStatus.NOT_FOUND, 'Blog not found.', 'NOT_FOUND');
    }

    return prisma.blogSeo.upsert({
      where: { blogId },
      create: { blogId, ...payload },
      update: payload
    });
  },

  deleteBlogSeoByBlogId: async (blogId: string) => {
    await blogSeoService.getBlogSeoByBlogId(blogId);
    return prisma.blogSeo.delete({ where: { blogId } });
  }
};
