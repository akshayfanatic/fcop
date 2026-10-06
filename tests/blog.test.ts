import assert from 'node:assert/strict';
import { afterEach, mock, test, type Mock } from 'node:test';
import { prisma } from '../src/lib/prisma.js';
import { hasResourcePermission } from '../src/lib/auth/permissions.js';
import { createOpenApiDocument } from '../src/openapi/spec.js';
import { blogService } from '../src/services/blog.service.js';
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

test('blog validation accepts Tiptap JSON and rejects malformed content and slugs', () => {
  assert.deepEqual(createBlogSchema.parse(payload), payload);
  assert.equal(createBlogSchema.safeParse({ ...payload, content: '<p>Hello</p>' }).success, false);
  assert.equal(createBlogSchema.safeParse({ ...payload, content: { type: 'paragraph' } }).success, false);
  assert.equal(createBlogSchema.safeParse({ ...payload, slug: 'Hello World' }).success, false);
  assert.equal(createBlogSchema.safeParse({ ...payload, unexpected: true }).success, false);
  assert.equal(updateBlogSchema.safeParse({}).success, false);
  assert.deepEqual(updateBlogSchema.parse({ isPublished: true }), { isPublished: true });
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
  assert.deepEqual(findFirst.mock.calls[0].arguments[0], { where: { slug: 'draft-post', isPublished: true } });
});

test('blog CRUD uses ids and reports missing records', async () => {
  const blog = { id: 'blog-id', ...payload };
  const create = stub(prisma.blog, 'create', async () => blog);
  const updateMany = stub(prisma.blog, 'updateMany', async () => ({ count: 1 }));
  const findUniqueOrThrow = stub(prisma.blog, 'findUniqueOrThrow', async () => ({ ...blog, isPublished: true }));
  const findUnique = stub(prisma.blog, 'findUnique', async () => null);

  assert.deepEqual(await blogService.createBlog(payload), blog);
  assert.deepEqual(create.mock.calls[0].arguments[0], { data: payload });
  assert.equal((await blogService.updateBlogById('blog-id', { isPublished: true })).isPublished, true);
  assert.deepEqual(updateMany.mock.calls[0].arguments[0], { where: { id: 'blog-id' }, data: { isPublished: true } });
  assert.deepEqual(findUniqueOrThrow.mock.calls[0].arguments[0], { where: { id: 'blog-id' } });
  await assert.rejects(blogService.deleteBlogById('missing-id'), { statusCode: 404 });
  assert.deepEqual(findUnique.mock.calls[0].arguments[0], { where: { id: 'missing-id' } });
});

test('blog write permission belongs to admins and OpenAPI follows resource routes', () => {
  assert.equal(hasResourcePermission('ADMIN', 'blog', 'create'), true);
  assert.equal(hasResourcePermission('MANAGER', 'blog', 'create'), false);
  assert.equal(hasResourcePermission('CLIENT', 'blog', 'delete'), false);

  const paths = createOpenApiDocument('http://localhost:3000').paths;
  assert.ok(paths['/api/v1/blogs'].get);
  assert.ok(paths['/api/v1/blogs/published'].get);
  assert.ok(paths['/api/v1/blogs/published/{slug}'].get);
  assert.deepEqual(paths['/api/v1/blogs'].post['x-requiredPermissions'], { blog: ['create'] });
  assert.deepEqual(paths['/api/v1/blogs/{id}'].delete['x-requiredPermissions'], { blog: ['delete'] });
});
