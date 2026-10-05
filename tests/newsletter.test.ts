import assert from 'node:assert/strict';
import { afterEach, mock, test, type Mock } from 'node:test';
import { createOpenApiDocument } from '../src/openapi/spec.js';
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

test('newsletter subscription is duplicate-safe and returns no subscriber record', async () => {
  const upsert = stub(prisma.newsletterSubscriber, 'upsert', async () => ({ id: 'subscriber-id' }));

  const result = await newsletterService.createSubscription({
    email: 'reader@example.com',
    website: ''
  });

  assert.deepEqual(result, { accepted: true });
  assert.deepEqual(upsert.mock.calls[0].arguments[0], {
    where: { email: 'reader@example.com' },
    create: { email: 'reader@example.com' },
    update: {}
  });
});

test('newsletter honeypot silently accepts without writing to the database', async () => {
  const upsert = stub(prisma.newsletterSubscriber, 'upsert', async () => ({ id: 'unexpected' }));

  const result = await newsletterService.createSubscription({
    email: 'bot@example.com',
    website: 'https://spam.example'
  });

  assert.deepEqual(result, { accepted: true });
  assert.equal(upsert.mock.callCount(), 0);
});

test('OpenAPI documents the public newsletter endpoint without a read operation', () => {
  const document = createOpenApiDocument('http://localhost:3000');
  const endpoint = document.paths['/api/v1/newsletter/subscriptions'];

  assert.ok(endpoint.post);
  assert.equal('get' in endpoint, false);
  assert.equal(endpoint.post.responses['201'].description, 'Subscription received.');
  assert.equal(endpoint.post.responses['429'].description, 'Too many subscription attempts.');
});
