import assert from 'node:assert/strict';
import { afterEach, mock, test, type Mock } from 'node:test';
import { prisma } from '../src/lib/prisma.js';
import { hasResourcePermission } from '../src/lib/auth/permissions.js';
import { createOpenApiDocument } from '../src/openapi/spec.js';
import { blogService } from '../src/services/blog.service.js';
import { categoryRouter } from '../src/routes/categories.js';
import { categoryService } from '../src/services/category.service.js';
import { tagService } from '../src/services/tag.service.js';
import { updateBlogSchema } from '../src/validators/blog.validator.js';
import { createCategorySchema, updateCategorySchema } from '../src/validators/category.validator.js';
import { createTagSchema, updateTagSchema } from '../src/validators/tag.validator.js';

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

test('category and tag payloads require names and URL slugs', () => {
  assert.deepEqual(createCategorySchema.parse({ name: 'Design', slug: 'design' }), { name: 'Design', slug: 'design' });
  assert.deepEqual(createTagSchema.parse({ name: 'Next.js', slug: 'nextjs' }), { name: 'Next.js', slug: 'nextjs' });
  assert.equal(createCategorySchema.safeParse({ name: 'Design', slug: 'Bad Slug' }).success, false);
  assert.equal(createTagSchema.safeParse({ name: '', slug: 'nextjs' }).success, false);
  assert.equal(updateCategorySchema.safeParse({}).success, false);
  assert.equal(updateTagSchema.safeParse({}).success, false);
  assert.deepEqual(updateBlogSchema.parse({ categoryIds: [], tagIds: [] }), { categoryIds: [], tagIds: [] });
  assert.equal(updateBlogSchema.safeParse({ categoryIds: [''] }).success, false);
});

test('category and tag reads report missing records', async () => {
  stub(prisma.category, 'findUnique', async () => null);
  stub(prisma.tag, 'findUnique', async () => null);
  await assert.rejects(categoryService.getCategoryById('missing-id'), { statusCode: 404 });
  await assert.rejects(tagService.getTagById('missing-id'), { statusCode: 404 });
});

test('category options include every category ordered by name and id', async () => {
  const findMany = stub(prisma.category, 'findMany', async () => [
    { id: 'cat-1', name: 'Design' },
    { id: 'cat-2', name: 'Design' },
    { id: 'cat-3', name: 'Engineering' }
  ]);
  assert.deepEqual(await categoryService.getCategoryOptions(), [
    { label: 'Design', value: 'cat-1' },
    { label: 'Design', value: 'cat-2' },
    { label: 'Engineering', value: 'cat-3' }
  ]);
  assert.deepEqual(findMany.mock.calls[0].arguments[0], { select: { id: true, name: true }, orderBy: [{ name: 'asc' }, { id: 'asc' }] });
});

test('category options route is public', () => {
  const route = categoryRouter.stack.find((layer) => layer.route?.path === '/options');
  assert.equal(route?.route?.stack.length, 1);
});

test('blog update changes fields, categories, and tags together', async () => {
  const updated = { id: 'blog-id', title: 'Updated', blogCategories: [], blogTags: [] };
  const seo = { metaTitle: 'Updated title', metaDescription: 'Updated description' };
  const tx = {
    blog: {
      findUnique: mock.fn(async () => ({ id: 'blog-id' })),
      update: mock.fn(async () => updated),
      findUniqueOrThrow: mock.fn(async () => updated)
    },
    category: { count: mock.fn(async () => 1) },
    tag: { count: mock.fn(async () => 1) },
    blogSeo: { upsert: mock.fn(async () => ({ id: 'seo-id', ...seo })) },
    blogCategory: {
      deleteMany: mock.fn(async () => ({ count: 0 })),
      createMany: mock.fn(async () => ({ count: 1 }))
    },
    blogTag: {
      deleteMany: mock.fn(async () => ({ count: 0 })),
      createMany: mock.fn(async () => ({ count: 1 }))
    }
  };
  stub(prisma, '$transaction', async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx));

  assert.deepEqual(await blogService.updateBlogById('blog-id', { title: 'Updated', blogSeo: seo, categoryIds: ['category-1', 'category-1'], tagIds: ['tag-1'] }), updated);
  assert.deepEqual(tx.blog.update.mock.calls[0].arguments[0], { where: { id: 'blog-id' }, data: { title: 'Updated' } });
  assert.deepEqual(tx.category.count.mock.calls[0].arguments[0], { where: { id: { in: ['category-1'] } } });
  assert.deepEqual(tx.tag.count.mock.calls[0].arguments[0], { where: { id: { in: ['tag-1'] } } });
  assert.deepEqual(tx.blogCategory.createMany.mock.calls[0].arguments[0], {
    data: [{ blogId: 'blog-id', categoryId: 'category-1' }]
  });
  assert.deepEqual(tx.blogTag.createMany.mock.calls[0].arguments[0], { data: [{ blogId: 'blog-id', tagId: 'tag-1' }] });
  assert.deepEqual(tx.blogSeo.upsert.mock.calls[0].arguments[0], { where: { blogId: 'blog-id' }, create: { blogId: 'blog-id', ...seo }, update: seo });
});

test('invalid category ids do not change blog fields or links', async () => {
  const tx = {
    blog: { findUnique: mock.fn(async () => ({ id: 'blog-id' })), update: mock.fn(async () => ({})) },
    category: { count: mock.fn(async () => 0) },
    blogCategory: { deleteMany: mock.fn(async () => ({ count: 0 })) }
  };
  stub(prisma, '$transaction', async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx));

  await assert.rejects(blogService.updateBlogById('blog-id', { title: 'Updated', categoryIds: ['missing-id'] }), { statusCode: 400 });
  assert.equal(tx.blog.update.mock.callCount(), 0);
  assert.equal(tx.blogCategory.deleteMany.mock.callCount(), 0);
});

test('blog update clears tags while leaving categories untouched', async () => {
  const updated = { id: 'blog-id', blogCategories: [], blogTags: [] };
  const tx = {
    blog: { findUnique: mock.fn(async () => ({ id: 'blog-id' })), findUniqueOrThrow: mock.fn(async () => updated) },
    tag: { count: mock.fn(async () => 0) },
    blogTag: {
      deleteMany: mock.fn(async () => ({ count: 2 })),
      createMany: mock.fn(async () => ({ count: 0 }))
    }
  };
  stub(prisma, '$transaction', async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx));

  assert.deepEqual(await blogService.updateBlogById('blog-id', { tagIds: [] }), updated);
  assert.deepEqual(tx.blogTag.deleteMany.mock.calls[0].arguments[0], { where: { blogId: 'blog-id' } });
  assert.equal(tx.blogTag.createMany.mock.callCount(), 0);
});

test('blog update removes SEO metadata when explicitly set to null', async () => {
  const updated = { id: 'blog-id', blogSeo: null, blogCategories: [], blogTags: [] };
  const tx = {
    blog: { findUnique: mock.fn(async () => ({ id: 'blog-id' })), findUniqueOrThrow: mock.fn(async () => updated) },
    blogSeo: { deleteMany: mock.fn(async () => ({ count: 1 })) }
  };
  stub(prisma, '$transaction', async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx));

  assert.deepEqual(await blogService.updateBlogById('blog-id', { blogSeo: null }), updated);
  assert.deepEqual(tx.blogSeo.deleteMany.mock.calls[0].arguments[0], { where: { blogId: 'blog-id' } });
});

test('blog update rejects a missing blog before changing SEO', async () => {
  const tx = {
    blog: { findUnique: mock.fn(async () => null) },
    blogSeo: { upsert: mock.fn(async () => ({})) }
  };
  stub(prisma, '$transaction', async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx));

  await assert.rejects(blogService.updateBlogById('missing-id', { blogSeo: { metaTitle: 'Title', metaDescription: 'Description' } }), { statusCode: 404 });
  assert.equal(tx.blogSeo.upsert.mock.callCount(), 0);
});

test('taxonomy routes reuse blog permissions and publish complete contract', () => {
  assert.equal(hasResourcePermission('ADMIN', 'blog', 'create'), true);
  assert.equal(hasResourcePermission('MANAGER', 'blog', 'update'), true);
  assert.equal(hasResourcePermission('MEMBER', 'blog', 'read'), false);

  const document = createOpenApiDocument('http://localhost:3000');
  const paths = document.paths;
  assert.deepEqual(paths['/api/v1/categories'].post['x-requiredPermissions'], { blog: ['create'] });
  assert.equal(paths['/api/v1/categories/options'].get.security, undefined);
  assert.equal(paths['/api/v1/categories/options'].get['x-requiredPermissions'], undefined);
  assert.equal(paths['/api/v1/categories/options'].get.responses['200'].content['application/json'].schema.$ref, '#/components/schemas/CategoryOptionsResponse');
  assert.deepEqual(paths['/api/v1/categories/{id}'].delete['x-requiredPermissions'], { blog: ['delete'] });
  assert.deepEqual(paths['/api/v1/tags'].post['x-requiredPermissions'], { blog: ['create'] });
  assert.deepEqual(paths['/api/v1/tags/{id}'].delete['x-requiredPermissions'], { blog: ['delete'] });
  assert.equal(paths['/api/v1/blogs/{id}/categories'], undefined);
  assert.equal(paths['/api/v1/blogs/{id}/tags'], undefined);
  assert.deepEqual(paths['/api/v1/blogs/{id}'].put['x-requiredPermissions'], { blog: ['update'] });
  assert.ok(document.components.schemas.UpdateBlogRequest.properties.categoryIds);
  assert.ok(document.components.schemas.UpdateBlogRequest.properties.tagIds);
  assert.ok(document.components.schemas.Blog.allOf[1].properties.blogCategories);
  assert.ok(document.components.schemas.Blog.allOf[1].properties.blogTags);
  assert.deepEqual(document.components.schemas.BlogDetail.allOf[1].required, ['blogSeo', 'blogCategories', 'blogTags']);
  assert.equal(paths['/api/v1/blogs/{id}'].get.responses['200'].content['application/json'].schema.$ref, '#/components/schemas/BlogDetailResponse');
  assert.equal(paths['/api/v1/blogs/{id}'].put.responses['200'].content['application/json'].schema.$ref, '#/components/schemas/BlogDetailResponse');
  assert.equal(paths['/api/v1/blogs'].post.responses['201'].content['application/json'].schema.$ref, '#/components/schemas/BlogDetailResponse');
  assert.equal(paths['/api/v1/blogs/published/{slug}'].get.responses['200'].content['application/json'].schema.$ref, '#/components/schemas/BlogDetailResponse');
});
