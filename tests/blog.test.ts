import assert from 'node:assert/strict';
import { afterEach, mock, test, type Mock } from 'node:test';
import { prisma } from '../src/lib/prisma.js';
import { hasResourcePermission } from '../src/lib/auth/permissions.js';
import { createOpenApiDocument } from '../src/openapi/spec.js';
import { blogService } from '../src/services/blog.service.js';
import { cloudinaryMedia } from '../src/lib/cloudinary/media.js';
import { blogAnnouncementService } from '../src/services/blog-announcement.service.js';
import { blogFiltersSchema, createBlogSchema, updateBlogSchema } from '../src/validators/blog.validator.js';

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

const content = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }] };
const payload = { title: 'Hello world', slug: 'hello-world', content, isPublished: false };
const seo = { metaTitle: 'Hello world', metaDescription: 'A useful blog post.' };

test('blog validation accepts Tiptap JSON and rejects malformed content and slugs', () => {
  assert.deepEqual(createBlogSchema.parse(payload), payload);
  assert.equal(createBlogSchema.safeParse({ ...payload, content: '<p>Hello</p>' }).success, false);
  assert.equal(createBlogSchema.safeParse({ ...payload, content: { type: 'paragraph' } }).success, false);
  assert.equal(createBlogSchema.safeParse({ ...payload, slug: 'Hello World' }).success, false);
  assert.equal(createBlogSchema.safeParse({ ...payload, unexpected: true }).success, false);
  assert.equal(updateBlogSchema.safeParse({}).success, false);
  assert.deepEqual(updateBlogSchema.parse({ isPublished: true }), { isPublished: true });
  assert.deepEqual(createBlogSchema.parse({ ...payload, blogSeo: seo }).blogSeo, seo);
  assert.deepEqual(updateBlogSchema.parse({ blogSeo: null }), { blogSeo: null });
  assert.equal(createBlogSchema.safeParse({ ...payload, blogSeo: { ...seo, metaDescription: ' ' } }).success, false);
  assert.equal(updateBlogSchema.safeParse({ blogSeo: { ...seo, extra: true } }).success, false);
  assert.deepEqual(blogFiltersSchema.parse({ isPublished: 'false' }).isPublished, false);
});

test('public blog queries only return published posts', async () => {
  const findMany = stub(prisma.blog, 'findMany', async () => []);
  const count = stub(prisma.blog, 'count', async () => 0);
  const findFirst = stub(prisma.blog, 'findFirst', async () => null);

  const list = await blogService.getPublishedBlogs({ page: 2, pageSize: 5 });
  assert.deepEqual(list.pagination, { page: 2, pageSize: 5, totalItems: 0, totalPages: 0 });
  assert.deepEqual(findMany.mock.calls[0].arguments[0].where, { isPublished: true });
  assert.deepEqual(count.mock.calls[0].arguments[0], { where: { isPublished: true } });
  await assert.rejects(blogService.getPublishedBlogBySlug('draft-post'), { statusCode: 404 });
  assert.deepEqual(findFirst.mock.calls[0].arguments[0], {
    where: { slug: 'draft-post', isPublished: true },
    include: { blogSeo: true, blogCategories: { include: { category: true } }, blogTags: { include: { tag: true } } }
  });
});

test('blog CRUD uses ids and reports missing records', async () => {
  const blog = { id: 'blog-id', ...payload };
  const create = stub(prisma.blog, 'create', async () => blog);
  const findUnique = stub(prisma.blog, 'findUnique', async () => null);

  assert.deepEqual(await blogService.createBlog(payload), blog);
  assert.deepEqual(create.mock.calls[0].arguments[0], { data: payload, include: { blogSeo: true, blogCategories: { include: { category: true } }, blogTags: { include: { tag: true } } } });
  await assert.rejects(blogService.deleteBlogById('missing-id'), { statusCode: 404 });
  assert.deepEqual(findUnique.mock.calls[0].arguments[0], {
    where: { id: 'missing-id' },
    include: { blogSeo: true, blogCategories: { include: { category: true } }, blogTags: { include: { tag: true } } }
  });
});

test('blog create includes SEO metadata in the same request', async () => {
  const create = stub(prisma.blog, 'create', async () => ({ id: 'blog-id', ...payload, blogSeo: seo, blogCategories: [], blogTags: [] }));
  await blogService.createBlog({ ...payload, blogSeo: seo });
  assert.deepEqual(create.mock.calls[0].arguments[0].data, { ...payload, blogSeo: { create: seo } });
});

test('publishing a new blog starts the subscriber announcement after it is saved', async () => {
  stub(prisma.blog, 'create', async ({ data }: { data: typeof payload }) => ({ id: 'blog-id', excerpt: null, ...data }));
  const send = stub(blogAnnouncementService, 'sendToSubscribers', async () => undefined);

  await blogService.createBlog(payload);
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(send.mock.callCount(), 0);

  await blogService.createBlog({ ...payload, isPublished: true });
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(send.mock.callCount(), 1);
  assert.deepEqual(send.mock.calls[0].arguments[0], { id: 'blog-id', excerpt: null, ...payload, isPublished: true });
});

test('OpenAPI follows resource routes', () => {
  assert.equal(hasResourcePermission('ADMIN', 'blog', 'create'), true);
  assert.equal(hasResourcePermission('MANAGER', 'blog', 'create'), true);
  assert.equal(hasResourcePermission('CLIENT', 'blog', 'delete'), false);

  const paths = createOpenApiDocument('http://localhost:3000').paths;
  assert.ok(paths['/api/v1/blogs'].get);
  assert.ok(paths['/api/v1/blogs/published'].get);
  assert.ok(paths['/api/v1/blogs/published/{slug}'].get);
  assert.deepEqual(paths['/api/v1/blogs'].post['x-requiredPermissions'], { blog: ['create'] });
  assert.deepEqual(paths['/api/v1/blogs/{id}'].delete['x-requiredPermissions'], { blog: ['delete'] });
  assert.deepEqual(paths['/api/v1/blogs/{id}/feature-image'].put['x-requiredPermissions'], { blog: ['update'] });
  assert.deepEqual(paths['/api/v1/blogs/{id}/feature-image'].delete['x-requiredPermissions'], { blog: ['update'] });
  assert.deepEqual(paths['/api/v1/blogs/{id}/feature-image'].put.requestBody.content['multipart/form-data'].schema.required, ['image']);
  assert.equal(paths['/api/v1/blogs/{id}/seo'], undefined);
});

test('blog feature image replaces and removes its managed Cloudinary asset', async () => {
  const id = 'blog-id';
  const current = { id, ...payload, featureImage: 'https://res.cloudinary.com/demo/image/upload/v1/fcop/blogs/blog-id/feature-image.jpg' };
  stub(prisma.blog, 'findUnique', async () => current);
  const update = stub(prisma.blog, 'update', async ({ data }: { data: { featureImage: string | null } }) => ({ ...current, ...data }));
  const upload = stub(cloudinaryMedia, 'upload', async () => ({ secureUrl: 'https://res.cloudinary.com/demo/image/upload/v2/fcop/blogs/blog-id/feature-image.webp' }));
  const remove = stub(cloudinaryMedia, 'delete', async () => undefined);

  const uploaded = await blogService.updateBlogFeatureImageById(id, { buffer: Buffer.from('image') } as Express.Multer.File);
  assert.equal(uploaded.featureImage, 'https://res.cloudinary.com/demo/image/upload/v2/fcop/blogs/blog-id/feature-image.webp');
  assert.deepEqual(upload.mock.calls[0].arguments[0], {
    buffer: Buffer.from('image'),
    folder: 'fcop/blogs/blog-id',
    publicId: 'feature-image',
    resourceType: 'image',
    overwrite: true
  });

  const deleted = await blogService.deleteBlogFeatureImageById(id);
  assert.equal(deleted.featureImage, null);
  assert.deepEqual(remove.mock.calls[0].arguments[0], { publicId: 'fcop/blogs/blog-id/feature-image', resourceType: 'image' });
  assert.deepEqual(update.mock.calls[1].arguments[0], { where: { id }, data: { featureImage: null } });
});

test('OpenAPI exposes the complete blog entity and optional publish flag', () => {
  const schemas = createOpenApiDocument('http://localhost:3000').components.schemas;

  assert.deepEqual(schemas.CreateBlogRequest.required, ['title', 'content', 'slug']);
  assert.equal(schemas.CreateBlogRequest.properties.isPublished.description, 'Defaults to false when omitted.');
  assert.deepEqual(schemas.CreateBlogRequest.properties.content, { $ref: '#/components/schemas/TiptapDocument' });
  assert.deepEqual(schemas.Blog.allOf[1].properties.content, { $ref: '#/components/schemas/TiptapDocument' });
  assert.deepEqual(schemas.BlogSummary.required, ['id', 'title', 'slug', 'featureImage', 'excerpt', 'isPublished', 'createdAt', 'updatedAt']);
  assert.deepEqual(schemas.BlogSeoInput.required, ['metaTitle', 'metaDescription']);
  assert.deepEqual(schemas.CreateBlogRequest.properties.blogSeo, { $ref: '#/components/schemas/BlogSeoInput' });
  assert.equal(schemas.UpdateBlogRequest.properties.blogSeo.nullable, true);
  assert.equal(schemas.Blog.allOf[1].properties.blogSeo.nullable, true);
});
