import assert from 'node:assert/strict';
import { afterEach, mock, test, type Mock } from 'node:test';
import { prisma } from '../src/lib/prisma.js';
import { cloudinaryMedia } from '../src/lib/cloudinary/media.js';
import { hasResourcePermission } from '../src/lib/auth/permissions.js';
import { createOpenApiDocument } from '../src/openapi/spec.js';
import { portfolioService } from '../src/services/portfolio.service.js';
import { createPortfolioSchema, portfolioAddonParamsSchema, portfolioAddonSchema, portfolioFiltersSchema, updatePortfolioSchema } from '../src/validators/portfolio.validator.js';

const restoreStubs: Array<() => void> = [];

function stub<T extends object, K extends keyof T>(target: T, key: K, implementation: (...args: never[]) => unknown) {
  const original = target[key];
  const spy = mock.fn(implementation) as unknown as Mock<Extract<T[K], (...args: never[]) => unknown>>;
  Reflect.set(target, key, spy);
  restoreStubs.push(() => Reflect.set(target, key, original));
  return spy;
}

afterEach(() => {
  for (const restore of restoreStubs.splice(0).reverse()) restore();
  mock.restoreAll();
});

const base = { slug: 'northwind-commerce', title: 'Northwind Commerce', description: 'A faster storefront.' };
const challenge = { type: 'CHALLENGE' as const, title: 'The Challenge', content: 'Checkout was slow.' };
const delivery = { type: 'DELIVERY' as const, title: 'How We Delivered', cards: [{ title: 'Rebuild', duration: '3 weeks', desc: 'Rebuilt the storefront.' }] };
const results = {
  type: 'RESULTS' as const,
  title: 'The Results',
  content: 'Conversion improved.',
  cards: [{ label: 'conversion', value: '+38%', caption: 'Checkout conversion' }]
};

test('portfolio validation accepts repeater arrays and validates each card type', () => {
  const parsed = createPortfolioSchema.parse({ ...base, addons: [challenge, delivery, results] });
  assert.deepEqual(parsed.tags, []);
  assert.deepEqual(parsed.services, []);
  assert.deepEqual(parsed.tech, []);
  assert.deepEqual(parsed.addons, [challenge, delivery, results]);
  assert.equal(createPortfolioSchema.safeParse({ ...base, addons: [{ ...delivery, cards: [{ title: 'Missing description' }] }] }).success, false);
  assert.equal(createPortfolioSchema.safeParse({ ...base, addons: [{ ...results, cards: [{ title: 'Wrong card' }] }] }).success, false);
  assert.equal(portfolioAddonSchema.safeParse({ ...results, cards: [{ label: 'conversion', value: '+38%', icon: 'trendingUp' }] }).success, false);
  assert.equal(createPortfolioSchema.safeParse({ ...base, addons: [{ ...challenge, cards: [{ title: 'Unexpected' }] }] }).success, false);
  assert.equal(createPortfolioSchema.safeParse({ ...base, addons: [{ type: 'TESTIMONIAL', title: 'Quote', content: 'Nice work.' }] }).success, false);
  assert.equal(updatePortfolioSchema.safeParse({}).success, false);
  assert.deepEqual(updatePortfolioSchema.parse({ addons: [] }), { addons: [] });
});

test('public portfolio reads only published entries', async () => {
  const findMany = stub(prisma.portfolio, 'findMany', async () => []);
  stub(prisma.portfolio, 'count', async () => 0);
  const findFirst = stub(prisma.portfolio, 'findFirst', async () => null);

  await portfolioService.getPublishedPortfolios({ page: 1, pageSize: 5 });
  assert.deepEqual(findMany.mock.calls[0].arguments[0].where, { isPublished: true });
  await assert.rejects(portfolioService.getPublishedPortfolioBySlug('draft'), { statusCode: 404 });
  assert.deepEqual(findFirst.mock.calls[0].arguments[0].where, { slug: 'draft', isPublished: true });
});

test('portfolio title and status filters apply to rows and pagination count', async () => {
  const findMany = stub(prisma.portfolio, 'findMany', async () => []);
  const count = stub(prisma.portfolio, 'count', async () => 0);
  const filters = portfolioFiltersSchema.parse({ title: '  Northwind  ', isPublished: 'false', page: '2', pageSize: '10' });

  await portfolioService.getPortfolios(filters);

  const where = { title: { contains: 'Northwind' }, isPublished: false };
  assert.deepEqual(findMany.mock.calls[0].arguments[0].where, where);
  assert.deepEqual(count.mock.calls[0].arguments[0].where, where);
  assert.equal(findMany.mock.calls[0].arguments[0].skip, 10);
  assert.equal(portfolioFiltersSchema.safeParse({ title: '   ' }).success, false);
});

test('portfolio create keeps addon order and update replaces the repeater in one nested write', async () => {
  const create = stub(prisma.portfolio, 'create', async () => ({ id: 'portfolio-1' }));
  const payload = createPortfolioSchema.parse({ ...base, addons: [challenge, delivery] });
  await portfolioService.createPortfolio(payload);
  assert.deepEqual(
    create.mock.calls[0].arguments[0].data.addons.create.map((addon: { sortOrder: number }) => addon.sortOrder),
    [0, 1]
  );
  assert.deepEqual(create.mock.calls[0].arguments[0].data.addons.create[0].cards, []);

  const update = stub(prisma.portfolio, 'update', async () => ({ id: 'portfolio-1' }));
  await portfolioService.updatePortfolioById('portfolio-1', { title: 'Updated', addons: [delivery, results] });
  assert.deepEqual(update.mock.calls[0].arguments[0].data.title, 'Updated');
  assert.deepEqual(update.mock.calls[0].arguments[0].data.addons.deleteMany, {});
  assert.deepEqual(
    update.mock.calls[0].arguments[0].data.addons.create.map((addon: { sortOrder: number }) => addon.sortOrder),
    [0, 1]
  );

  await portfolioService.updatePortfolioById('portfolio-1', { addons: [] });
  assert.deepEqual(update.mock.calls[1].arguments[0].data.addons, { deleteMany: {} });

  await portfolioService.updatePortfolioById('portfolio-1', { title: 'Only title' });
  assert.equal(update.mock.calls[2].arguments[0].data.addons, undefined);
});

test('portfolio add-on create, update, and delete target one section by id', async () => {
  assert.equal(portfolioAddonParamsSchema.safeParse({ id: 'portfolio-1', addonId: '' }).success, false);
  const addon = portfolioAddonSchema.parse(delivery);
  let existing: null | { id?: string; type?: string } = null;
  const findFirst = stub(prisma.portfolioAddon, 'findFirst', async () => existing);
  const create = stub(prisma.portfolioAddon, 'create', async () => ({ id: 'addon-1' }));
  const update = stub(prisma.portfolioAddon, 'update', async () => ({ id: 'addon-1' }));
  const remove = stub(prisma.portfolioAddon, 'delete', async () => ({ id: 'addon-1' }));
  await portfolioService.createPortfolioAddon('portfolio-1', addon);
  assert.deepEqual(findFirst.mock.calls[0].arguments[0].where, { portfolioId: 'portfolio-1', type: 'DELIVERY' });
  assert.equal(create.mock.calls[0].arguments[0].data.sortOrder, 2);
  assert.deepEqual(create.mock.calls[0].arguments[0].data.portfolio.connect, { id: 'portfolio-1' });

  existing = { id: 'addon-1', type: 'DELIVERY' };
  await assert.rejects(portfolioService.createPortfolioAddon('portfolio-1', addon), { statusCode: 409 });
  await portfolioService.updatePortfolioAddon('portfolio-1', 'addon-1', addon);
  assert.deepEqual(findFirst.mock.calls[2].arguments[0].where, { id: 'addon-1', portfolioId: 'portfolio-1' });
  assert.deepEqual(update.mock.calls[0].arguments[0].where, { id: 'addon-1', portfolioId: 'portfolio-1' });
  assert.equal(update.mock.calls[0].arguments[0].data.title, 'How We Delivered');

  await portfolioService.deletePortfolioAddon('portfolio-1', 'addon-1');
  assert.deepEqual(remove.mock.calls[0].arguments[0].where, { id: 'addon-1', portfolioId: 'portfolio-1' });
});

test('portfolio cover image uploads, replaces, and removes its managed asset', async () => {
  const id = 'portfolio-1';
  const current = {
    id,
    ...base,
    imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/fcop/portfolios/portfolio-1/cover-image.jpg'
  };
  stub(prisma.portfolio, 'findUnique', async () => current);
  const update = stub(prisma.portfolio, 'update', async ({ data }: { data: { imageUrl: string | null } }) => ({ ...current, ...data }));
  const upload = stub(cloudinaryMedia, 'upload', async () => ({ secureUrl: 'https://res.cloudinary.com/demo/image/upload/v2/fcop/portfolios/portfolio-1/cover-image.webp' }));
  const remove = stub(cloudinaryMedia, 'delete', async () => undefined);

  const uploaded = await portfolioService.updatePortfolioCoverImageById(id, { buffer: Buffer.from('image') } as Express.Multer.File);
  assert.equal(uploaded.imageUrl, 'https://res.cloudinary.com/demo/image/upload/v2/fcop/portfolios/portfolio-1/cover-image.webp');
  assert.deepEqual(upload.mock.calls[0].arguments[0], {
    buffer: Buffer.from('image'),
    folder: 'fcop/portfolios/portfolio-1',
    publicId: 'cover-image',
    resourceType: 'image',
    overwrite: true
  });

  const deleted = await portfolioService.deletePortfolioCoverImageById(id);
  assert.equal(deleted.imageUrl, null);
  assert.deepEqual(remove.mock.calls[0].arguments[0], { publicId: 'fcop/portfolios/portfolio-1/cover-image', resourceType: 'image' });
  assert.deepEqual(update.mock.calls[1].arguments[0].data, { imageUrl: null });
});

test('portfolio routes and permissions are documented', () => {
  assert.equal(hasResourcePermission('ADMIN', 'portfolio', 'create'), true);
  assert.equal(hasResourcePermission('MANAGER', 'portfolio', 'delete'), true);
  assert.equal(hasResourcePermission('CLIENT', 'portfolio', 'read'), false);

  const document = createOpenApiDocument('http://localhost:3000');
  assert.ok(document.paths['/api/v1/portfolios/published'].get);
  assert.ok(document.paths['/api/v1/portfolios/published/{slug}'].get);
  assert.ok(document.paths['/api/v1/portfolios'].get.parameters.some((parameter: { name: string }) => parameter.name === 'title'));
  assert.deepEqual(document.paths['/api/v1/portfolios'].post['x-requiredPermissions'], { portfolio: ['create'] });
  assert.deepEqual(document.paths['/api/v1/portfolios/{id}'].delete['x-requiredPermissions'], { portfolio: ['delete'] });
  assert.deepEqual(document.paths['/api/v1/portfolios/{id}/cover-image'].put['x-requiredPermissions'], { portfolio: ['update'] });
  assert.equal(document.paths['/api/v1/portfolios/{id}/cover-image'].put.requestBody.content['multipart/form-data'].schema.properties.image.format, 'binary');
  assert.deepEqual(document.paths['/api/v1/portfolios/{id}/cover-image'].delete['x-requiredPermissions'], { portfolio: ['update'] });
  assert.deepEqual(document.paths['/api/v1/portfolios/{id}/addons'].post['x-requiredPermissions'], { portfolio: ['update'] });
  assert.deepEqual(document.paths['/api/v1/portfolios/{id}/addons/{addonId}'].put['x-requiredPermissions'], { portfolio: ['update'] });
  assert.deepEqual(document.paths['/api/v1/portfolios/{id}/addons/{addonId}'].delete['x-requiredPermissions'], { portfolio: ['update'] });
  assert.equal(document.paths['/api/v1/portfolios/{id}/addons'].post.responses['201'].content['application/json'].schema.$ref, '#/components/schemas/PortfolioAddonResponse');
  assert.deepEqual(document.components.schemas.UpdatePortfolioRequest.required, undefined);
});
