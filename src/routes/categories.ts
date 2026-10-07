import { Router } from 'express';
import { categoryController } from '../controllers/category.controller.js';
import { requireOrgPermission } from '../middleware/require-org-permission.js';

export const categoryRouter = Router();

categoryRouter.post('/', requireOrgPermission({ blog: ['create'] }), categoryController.createCategory);
categoryRouter.get('/', requireOrgPermission({ blog: ['read'] }), categoryController.getCategories);
categoryRouter.get('/options', categoryController.getCategoryOptions);
categoryRouter.get('/:id', requireOrgPermission({ blog: ['read'] }), categoryController.getCategoryById);
categoryRouter.put('/:id', requireOrgPermission({ blog: ['update'] }), categoryController.updateCategoryById);
categoryRouter.delete('/:id', requireOrgPermission({ blog: ['delete'] }), categoryController.deleteCategoryById);
