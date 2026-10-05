import assert from 'node:assert/strict';
import { afterEach, mock, test, type Mock } from 'node:test';
import { createOpenApiDocument } from '../src/openapi/spec.js';
import { env } from '../src/config/env.js';
import { Prisma } from '../src/generated/prisma/client.js';
import { resend } from '../src/lib/email/services/resend.service.js';
import { prisma } from '../src/lib/prisma.js';
import { newsletterService } from '../src/services/newsletter.service.js';
import { createNewsletterSubscriptionSchema, newsletterSubscriptionFiltersSchema } from '../src/validators/newsletter.validator.js';

const restoreStubs: Array<() => void> = [];

function stub<T extends object, K extends keyof T>(target: T, key: K, implementation: (...args: never[]) => unknown) {
  const original = target[key];
  const spy = mock.fn(implementation) as unknown as Mock<Extract<T[K], (...args: never[]) => unknown>>;
  Reflect.set(target, key, spy);
  restoreStubs.push(() => {
    Reflect.set(target, key, original);
  });
  return spy;
}

afterEach(() => {
  for (const restore of restoreStubs.splice(0).reverse()) {
    restore();
  }
  mock.restoreAll();
});

test('newsletter validation normalizes email and rejects unknown input', () => {
  assert.deepEqual(createNewsletterSubscriptionSchema.parse({ email: ' Reader@Example.COM ' }), {
    email: 'reader@example.com',
    website: ''
  });
  assert.equal(createNewsletterSubscriptionSchema.safeParse({ email: 'not-an-email' }).success, false);
  assert.equal(createNewsletterSubscriptionSchema.safeParse({ email: 'reader@example.com', role: 'admin' }).success, false);
  assert.deepEqual(newsletterSubscriptionFiltersSchema.parse({ email: ' Reader@Example.COM ', page: '2', pageSize: '10' }), {
    email: 'reader@example.com',
    page: 2,
    pageSize: 10
  });
});

test('newsletter subscriptions support email filtering and pagination', async () => {
  const createdAt = new Date('2026-10-05T12:00:00.000Z');
  const subscriber = {
    id: 'subscriber-id',
    email: 'reader@example.com',
    createdAt,
    updatedAt: createdAt
  };
  const findMany = stub(prisma.newsletterSubscriber, 'findMany', async () => [subscriber]);
  const count = stub(prisma.newsletterSubscriber, 'count', async () => 6);

  const result = await newsletterService.getSubscriptions({
    email: 'reader@example.com',
    page: 2,
    pageSize: 5
  });

  assert.deepEqual(findMany.mock.calls[0].arguments[0], {
    where: { email: { contains: 'reader@example.com' } },
    orderBy: { createdAt: 'desc' },
    skip: 5,
    take: 5
  });
  assert.deepEqual(count.mock.calls[0].arguments[0], {
    where: { email: { contains: 'reader@example.com' } }
  });
  assert.deepEqual(result, {
    items: [subscriber],
    pagination: {
      page: 2,
      pageSize: 5,
      totalItems: 6,
      totalPages: 2
    }
  });
});

test('newsletter subscription notifies the admin and returns no subscriber record', async () => {
  const createdAt = new Date('2026-10-05T12:00:00.000Z');
  const create = stub(prisma.newsletterSubscriber, 'create', async () => ({
    id: 'subscriber-id',
    email: 'reader@example.com',
    createdAt,
    updatedAt: createdAt
  }));
  const findAdmins = stub(prisma.member, 'findMany', async () => [{ id: 'admin-member-id' }]);
  const createNotifications = stub(prisma.notification, 'createMany', async () => ({ count: 1 }));
  const send = stub(resend.emails, 'send', async () => ({ data: { id: 'email-id' }, error: null }));
  const originalAdminEmail = env.adminEmail;
  env.adminEmail = 'admin@example.com';
  restoreStubs.push(() => {
    env.adminEmail = originalAdminEmail;
  });

  const result = await newsletterService.createSubscription({
    email: 'reader@example.com',
    website: ''
  });

  assert.deepEqual(result, { accepted: true });
  assert.deepEqual(create.mock.calls[0].arguments[0], {
    data: { email: 'reader@example.com' }
  });
  assert.equal(send.mock.callCount(), 1);
  assert.equal(send.mock.calls[0].arguments[0].to, 'admin@example.com');
  assert.equal(send.mock.calls[0].arguments[0].replyTo, 'reader@example.com');
  assert.equal(send.mock.calls[0].arguments[0].subject, 'New newsletter subscription');
  assert.equal(send.mock.calls[0].arguments[0].text, ['New newsletter subscription', '', 'Email: reader@example.com', 'Subscribed: Oct 5, 2026, 12:00 PM UTC'].join('\n'));
  assert.equal(send.mock.calls[0].arguments[0].text.includes('subscriber-id'), false);
  assert.deepEqual(findAdmins.mock.calls[0].arguments[0], {
    where: { role: 'ADMIN' },
    select: { id: true }
  });
  assert.deepEqual(createNotifications.mock.calls[0].arguments[0], {
    data: [
      {
        memberId: 'admin-member-id',
        title: 'New newsletter subscriber',
        message: 'reader@example.com subscribed to the newsletter.',
        link: '/dashboard/admin/newsletter'
      }
    ]
  });
});

test('duplicate newsletter subscription is accepted without notifying the admin', async () => {
  stub(prisma.newsletterSubscriber, 'create', async () => {
    throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed.', {
      code: 'P2002',
      clientVersion: '7.8.0'
    });
  });
  const send = stub(resend.emails, 'send', async () => ({ data: { id: 'unexpected' }, error: null }));

  const result = await newsletterService.createSubscription({
    email: 'reader@example.com',
    website: ''
  });

  assert.deepEqual(result, { accepted: true });
  assert.equal(send.mock.callCount(), 0);
});

test('newsletter honeypot silently accepts without writing to the database', async () => {
  const create = stub(prisma.newsletterSubscriber, 'create', async () => ({ id: 'unexpected' }));

  const result = await newsletterService.createSubscription({
    email: 'bot@example.com',
    website: 'https://spam.example'
  });

  assert.deepEqual(result, { accepted: true });
  assert.equal(create.mock.callCount(), 0);
});

test('OpenAPI documents public signup and protected newsletter subscription listing', () => {
  const document = createOpenApiDocument('http://localhost:3000');
  const endpoint = document.paths['/api/v1/newsletter/subscriptions'];

  assert.ok(endpoint.post);
  assert.ok(endpoint.get);
  assert.equal(endpoint.post.responses['201'].description, 'Subscription received.');
  assert.equal(endpoint.post.responses['429'].description, 'Too many subscription attempts.');
  assert.deepEqual(endpoint.get['x-requiredPermissions'], { newsletter: ['read'] });
  assert.equal(endpoint.get.responses['200'].content['application/json'].schema.$ref, '#/components/schemas/NewsletterSubscriptionsResponse');
});
