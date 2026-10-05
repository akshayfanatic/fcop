import assert from 'node:assert/strict';
import { afterEach, mock, test, type Mock } from 'node:test';
import { createOpenApiDocument } from '../src/openapi/spec.js';
import { env } from '../src/config/env.js';
import { Prisma } from '../src/generated/prisma/client.js';
import { resend } from '../src/lib/email/services/resend.service.js';
import { prisma } from '../src/lib/prisma.js';
import { newsletterService } from '../src/services/newsletter.service.js';
import { createNewsletterSubscriptionSchema } from '../src/validators/newsletter.validator.js';

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
});

test('newsletter subscription notifies the admin and returns no subscriber record', async () => {
  const createdAt = new Date('2026-10-05T12:00:00.000Z');
  const create = stub(prisma.newsletterSubscriber, 'create', async () => ({
    id: 'subscriber-id',
    email: 'reader@example.com',
    createdAt,
    updatedAt: createdAt
  }));
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

test('OpenAPI documents the public newsletter endpoint without a read operation', () => {
  const document = createOpenApiDocument('http://localhost:3000');
  const endpoint = document.paths['/api/v1/newsletter/subscriptions'];

  assert.ok(endpoint.post);
  assert.equal('get' in endpoint, false);
  assert.equal(endpoint.post.responses['201'].description, 'Subscription received.');
  assert.equal(endpoint.post.responses['429'].description, 'Too many subscription attempts.');
});
