import { type Prisma } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { HttpStatus } from '../utils/api-response.js';
import { createHttpError } from '../utils/http-error.js';
import { createPaginatedData, getPaginationOffset } from '../utils/pagination.js';
import type { CategoryFiltersInput, CreateCategoryInput, UpdateCategoryInput } from '../validators/category.validator.js';

export const categoryService = {
  getCategories: async (filters: CategoryFiltersInput) => {
    const [items, totalItems] = await Promise.all([prisma.category.findMany({ orderBy: { name: 'asc' }, skip: getPaginationOffset(filters), take: filters.pageSize }), prisma.category.count()]);

    return createPaginatedData({ items, page: filters.page, pageSize: filters.pageSize, totalItems });
  },

  getCategoryById: async (id: string) => {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw createHttpError(HttpStatus.NOT_FOUND, 'Category not found.', 'NOT_FOUND');
    return category;
  },

  createCategory: async (payload: CreateCategoryInput) => prisma.category.create({ data: payload satisfies Prisma.CategoryCreateInput }),

  updateCategoryById: async (id: string, payload: UpdateCategoryInput) => {
    const result = await prisma.category.updateMany({ where: { id }, data: payload });
    if (result.count === 0) throw createHttpError(HttpStatus.NOT_FOUND, 'Category not found.', 'NOT_FOUND');
    return prisma.category.findUniqueOrThrow({ where: { id } });
  },

  deleteCategoryById: async (id: string) => {
    await categoryService.getCategoryById(id);
    return prisma.category.delete({ where: { id } });
  }
};
