import assert from 'node:assert/strict';
import { afterEach, mock, test } from 'node:test';
import { env } from '../src/config/env.js';
import { resend } from '../src/lib/email/services/resend.service.js';
import { prisma } from '../src/lib/prisma.js';
import { blogAnnouncementService } from '../src/services/blog-announcement.service.js';

const originalApiKey = env.resendApiKey;
const originalFindMany = prisma.newsletterSubscriber.findMany;
const originalBatchSend = resend.batch.send;

afterEach(() => {
  env.resendApiKey = originalApiKey;
  prisma.newsletterSubscriber.findMany = originalFindMany;
  resend.batch.send = originalBatchSend;
  mock.restoreAll();
});

test('blog announcements send each subscriber one private email across batches', async () => {
  env.resendApiKey = 'test-key';
  const subscribers = Array.from({ length: 101 }, (_, index) => ({ id: `id-${String(index).padStart(3, '0')}`, email: `reader${index}@example.com` }));
  const findMany = mock.fn(async ({ cursor }: { cursor?: { id: string } }) => (cursor ? subscribers.slice(100) : subscribers.slice(0, 100)));
  const send = mock.fn(async () => ({ data: [], error: null }));
  prisma.newsletterSubscriber.findMany = findMany as typeof originalFindMany;
  resend.batch.send = send as typeof originalBatchSend;

  await blogAnnouncementService.sendToSubscribers({ id: 'blog-1', title: 'New post', slug: 'new-post', excerpt: 'Read this.' });

  assert.equal(send.mock.callCount(), 2);
  const firstBatch = send.mock.calls[0].arguments[0] as { to: string; subject: string; text: string }[];
  const secondBatch = send.mock.calls[1].arguments[0] as { to: string }[];
  assert.equal(firstBatch.length, 100);
  assert.deepEqual(
    firstBatch.map((email) => email.to),
    subscribers.slice(0, 100).map((subscriber) => subscriber.email)
  );
  assert.equal(firstBatch[0].subject, 'New on the blog: New post');
  assert.match(firstBatch[0].text, /\/blog\/new-post/);
  assert.deepEqual(
    secondBatch.map((email) => email.to),
    [subscribers[100].email]
  );
  assert.deepEqual(send.mock.calls[0].arguments[1], { idempotencyKey: 'blog-blog-1-id-099' });
  assert.deepEqual(send.mock.calls[1].arguments[1], { idempotencyKey: 'blog-blog-1-id-100' });
});
