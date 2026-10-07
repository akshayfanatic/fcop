import { Prisma } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { cloudinaryMedia } from '../lib/cloudinary/media.js';
import { HttpStatus } from '../utils/api-response.js';
import { createHttpError } from '../utils/http-error.js';
import { createPaginatedData, getPaginationOffset } from '../utils/pagination.js';
import type { CreatePortfolioInput, PortfolioFiltersInput, PortfolioSectionInput, PublishedPortfolioFiltersInput, UpdatePortfolioInput } from '../validators/portfolio.validator.js';

const portfolioInclude = { addons: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] } } satisfies Prisma.PortfolioInclude;

const coverImagePublicId = (id: string) => `fcop/portfolios/${id}/cover-image`;
const hasManagedCoverImage = (id: string, url: string | null) => Boolean(url?.includes(`/${coverImagePublicId(id)}.`));

const addonCreateData = (addons: CreatePortfolioInput['addons']) =>
  addons.map((addon, sortOrder) => ({
    type: addon.type,
    title: addon.title,
    content: addon.content,
    imageUrl: addon.imageUrl,
    cards: (addon.cards ?? []) as Prisma.InputJsonValue,
    sortOrder
  }));

export const portfolioService = {
  getPublishedPortfolios: async (filters: PublishedPortfolioFiltersInput) => {
    const where = { isPublished: true } satisfies Prisma.PortfolioWhereInput;
    const [items, totalItems] = await Promise.all([
      prisma.portfolio.findMany({ where, include: portfolioInclude, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }], skip: getPaginationOffset(filters), take: filters.pageSize }),
      prisma.portfolio.count({ where })
    ]);
    return createPaginatedData({ items, page: filters.page, pageSize: filters.pageSize, totalItems });
  },

  getPublishedPortfolioBySlug: async (slug: string) => {
    // A known draft slug must not expose unpublished case-study content.
    const portfolio = await prisma.portfolio.findFirst({ where: { slug, isPublished: true }, include: portfolioInclude });
    if (!portfolio) throw createHttpError(HttpStatus.NOT_FOUND, 'Portfolio not found.', 'NOT_FOUND');
    return portfolio;
  },

  getPortfolios: async (filters: PortfolioFiltersInput) => {
    const where = {
      ...(filters.title ? { title: { contains: filters.title } } : {}),
      ...(filters.isPublished === undefined ? {} : { isPublished: filters.isPublished })
    } satisfies Prisma.PortfolioWhereInput;
    const [items, totalItems] = await Promise.all([
      prisma.portfolio.findMany({ where, include: portfolioInclude, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }], skip: getPaginationOffset(filters), take: filters.pageSize }),
      prisma.portfolio.count({ where })
    ]);
    return createPaginatedData({ items, page: filters.page, pageSize: filters.pageSize, totalItems });
  },

  getPortfolioById: async (id: string) => {
    const portfolio = await prisma.portfolio.findUnique({ where: { id }, include: portfolioInclude });
    if (!portfolio) throw createHttpError(HttpStatus.NOT_FOUND, 'Portfolio not found.', 'NOT_FOUND');
    return portfolio;
  },

  createPortfolio: async (payload: CreatePortfolioInput) => {
    const { addons, ...portfolio } = payload;
    return prisma.portfolio.create({
      data: { ...portfolio, addons: { create: addonCreateData(addons) } },
      include: portfolioInclude
    });
  },

  updatePortfolioById: async (id: string, payload: UpdatePortfolioInput) => {
    const { addons, ...portfolio } = payload;
    try {
      // One nested write replaces supplied sections with the portfolio update.
      return await prisma.portfolio.update({
        where: { id },
        data: {
          ...portfolio,
          ...(addons === undefined ? {} : { addons: { deleteMany: {}, ...(addons.length ? { create: addonCreateData(addons) } : {}) } })
        },
        include: portfolioInclude
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw createHttpError(HttpStatus.NOT_FOUND, 'Portfolio not found.', 'NOT_FOUND');
      }
      throw error;
    }
  },

  updatePortfolioCoverImageById: async (id: string, file: Express.Multer.File) => {
    await portfolioService.getPortfolioById(id);
    const uploaded = await cloudinaryMedia.upload({
      buffer: file.buffer,
      folder: `fcop/portfolios/${id}`,
      publicId: 'cover-image',
      resourceType: 'image',
      overwrite: true
    });

    // Save the versioned URL so readers see the replacement image immediately.
    return prisma.portfolio.update({ where: { id }, data: { imageUrl: uploaded.secureUrl }, include: portfolioInclude });
  },

  deletePortfolioCoverImageById: async (id: string) => {
    const portfolio = await portfolioService.getPortfolioById(id);
    if (hasManagedCoverImage(id, portfolio.imageUrl)) {
      await cloudinaryMedia.delete({ publicId: coverImagePublicId(id), resourceType: 'image' });
    }
    return prisma.portfolio.update({ where: { id }, data: { imageUrl: null }, include: portfolioInclude });
  },

  getPortfolioAddon: async (id: string, addonId: string) => {
    const addon = await prisma.portfolioAddon.findFirst({ where: { id: addonId, portfolioId: id } });
    if (!addon) throw createHttpError(HttpStatus.NOT_FOUND, 'Portfolio add-on not found.', 'NOT_FOUND');
    return addon;
  },

  createPortfolioAddon: async (id: string, addon: PortfolioSectionInput) => {
    const existing = await prisma.portfolioAddon.findFirst({ where: { portfolioId: id, type: addon.type }, select: { id: true } });
    if (existing) throw createHttpError(HttpStatus.CONFLICT, 'This portfolio section already exists.', 'CONFLICT');
    try {
      return await prisma.portfolioAddon.create({
        data: { ...addonCreateData([addon])[0], sortOrder: ['CHALLENGE', 'APPROACH', 'DELIVERY', 'RESULTS'].indexOf(addon.type), portfolio: { connect: { id } } }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw createHttpError(HttpStatus.NOT_FOUND, 'Portfolio not found.', 'NOT_FOUND');
      }
      throw error;
    }
  },

  updatePortfolioAddon: async (id: string, addonId: string, addon: PortfolioSectionInput) => {
    const existing = await prisma.portfolioAddon.findFirst({ where: { id: addonId, portfolioId: id }, select: { type: true } });
    if (!existing) throw createHttpError(HttpStatus.NOT_FOUND, 'Portfolio add-on not found.', 'NOT_FOUND');
    if (existing.type !== addon.type) throw createHttpError(HttpStatus.BAD_REQUEST, 'Section type cannot be changed.', 'VALIDATION_ERROR');
    try {
      return await prisma.portfolioAddon.update({
        where: { id: addonId, portfolioId: id },
        data: { title: addon.title, content: addon.content, imageUrl: addon.imageUrl, cards: (addon.cards ?? []) as Prisma.InputJsonValue }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw createHttpError(HttpStatus.NOT_FOUND, 'Portfolio add-on not found.', 'NOT_FOUND');
      }
      throw error;
    }
  },

  deletePortfolioAddon: async (id: string, addonId: string) => {
    try {
      return await prisma.portfolioAddon.delete({ where: { id: addonId, portfolioId: id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw createHttpError(HttpStatus.NOT_FOUND, 'Portfolio add-on not found.', 'NOT_FOUND');
      }
      throw error;
    }
  },

  deletePortfolioById: async (id: string) => {
    const portfolio = await portfolioService.getPortfolioById(id);
    if (hasManagedCoverImage(id, portfolio.imageUrl)) {
      // Remove the stored cover when its portfolio is deleted.
      await cloudinaryMedia.delete({ publicId: coverImagePublicId(id), resourceType: 'image' });
    }
    await prisma.portfolio.delete({ where: { id } });
    return portfolio;
  }
};
