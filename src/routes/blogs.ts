import { Router } from 'express';
import { blogController } from '../controllers/blog.controller.js';
import { blogSeoController } from '../controllers/blog-seo.controller.js';
import { parseBlogFeatureImageUpload } from '../middleware/blog-feature-image-upload.js';
import { requireOrgPermission } from '../middleware/require-org-permission.js';

export const blogRouter = Router();

blogRouter.get('/published', blogController.getPublishedBlogs);
blogRouter.get('/published/:slug', blogController.getPublishedBlogBySlug);

blogRouter.post('/', requireOrgPermission({ blog: ['create'] }), blogController.createBlog);
blogRouter.get('/', requireOrgPermission({ blog: ['read'] }), blogController.getBlogs);
blogRouter.get('/:id', requireOrgPermission({ blog: ['read'] }), blogController.getBlogById);
blogRouter.get('/:id/seo', requireOrgPermission({ blog: ['read'] }), blogSeoController.getBlogSeoByBlogId);
blogRouter.put('/:id/seo', requireOrgPermission({ blog: ['update'] }), blogSeoController.upsertBlogSeoByBlogId);
blogRouter.delete('/:id/seo', requireOrgPermission({ blog: ['update'] }), blogSeoController.deleteBlogSeoByBlogId);
blogRouter.put('/:id/feature-image', requireOrgPermission({ blog: ['update'] }), parseBlogFeatureImageUpload, blogController.updateBlogFeatureImageById);
blogRouter.delete('/:id/feature-image', requireOrgPermission({ blog: ['update'] }), blogController.deleteBlogFeatureImageById);
blogRouter.put('/:id', requireOrgPermission({ blog: ['update'] }), blogController.updateBlogById);
blogRouter.delete('/:id', requireOrgPermission({ blog: ['delete'] }), blogController.deleteBlogById);
