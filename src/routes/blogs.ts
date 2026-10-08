import { Router } from 'express';
import { blogController } from '../controllers/blog.controller.js';
import { parseBlogFeatureImageUpload } from '../middleware/image-upload.js';
import { requireOrgPermission } from '../middleware/require-org-permission.js';

export const blogRouter = Router();

blogRouter.get('/published', blogController.getPublishedBlogs);
blogRouter.get('/published/:slug', blogController.getPublishedBlogBySlug);

blogRouter.post('/', requireOrgPermission({ blog: ['create'] }), blogController.createBlog);
blogRouter.get('/', requireOrgPermission({ blog: ['read'] }), blogController.getBlogs);
blogRouter.get('/:id', requireOrgPermission({ blog: ['read'] }), blogController.getBlogById);
blogRouter.put('/:id/feature-image', requireOrgPermission({ blog: ['update'] }), parseBlogFeatureImageUpload, blogController.updateBlogFeatureImageById);
blogRouter.delete('/:id/feature-image', requireOrgPermission({ blog: ['update'] }), blogController.deleteBlogFeatureImageById);
blogRouter.put('/:id', requireOrgPermission({ blog: ['update'] }), blogController.updateBlogById);
blogRouter.delete('/:id', requireOrgPermission({ blog: ['delete'] }), blogController.deleteBlogById);
