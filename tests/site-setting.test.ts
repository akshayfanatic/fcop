import assert from 'node:assert/strict';
import { afterEach, mock, test, type Mock } from 'node:test';
import { app } from '../src/app.js';
import { hasResourcePermission } from '../src/lib/auth/permissions.js';
import { prisma } from '../src/lib/prisma.js';
import { createOpenApiDocument } from '../src/openapi/spec.js';
import { siteSettingService } from '../src/services/site-setting.service.js';
import { updateSiteSettingSchema } from '../src/validators/site-setting.validator.js';

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

test('site settings validation normalizes email and rejects unsafe or unknown input', () => {
  assert.deepEqual(updateSiteSettingSchema.parse({ contactEmail: ' Info@Example.COM ', phone: ' +1 555 0100 ' }), {
    contactEmail: 'info@example.com',
    phone: '+1 555 0100'
  });
  assert.equal(updateSiteSettingSchema.safeParse({ contactEmail: 'bad-email' }).success, false);
  assert.equal(updateSiteSettingSchema.safeParse({ contactEmail: 'info@example.com', facebookUrl: 'javascript:alert(1)' }).success, false);
  assert.equal(updateSiteSettingSchema.safeParse({ contactEmail: 'info@example.com', githubUrl: 'ftp://example.com' }).success, false);
  assert.equal(updateSiteSettingSchema.safeParse({ contactEmail: 'info@example.com', role: 'ADMIN' }).success, false);
  assert.equal(updateSiteSettingSchema.safeParse({ contactEmail: 'info@example.com', phone: '' }).success, false);
});

test('public settings read returns null before an admin configures them', async () => {
  const findUnique = stub(prisma.siteSetting, 'findUnique', async () => null);
  assert.equal(await siteSettingService.getSiteSetting(), null);
  assert.deepEqual(findUnique.mock.calls[0].arguments[0].where, { id: 'main' });
  assert.equal(findUnique.mock.calls[0].arguments[0].select.contactEmail, true);
  assert.equal(findUnique.mock.calls[0].arguments[0].select.id, undefined);
});

test('admin save upserts the main row and clears omitted optional values', async () => {
  const upsert = stub(prisma.siteSetting, 'upsert', async () => ({ contactEmail: 'info@example.com' }));
  const payload = updateSiteSettingSchema.parse({ contactEmail: 'info@example.com', facebookUrl: 'https://facebook.com/fanaticcoders' });

  await siteSettingService.updateSiteSetting(payload);

  const query = upsert.mock.calls[0].arguments[0];
  assert.deepEqual(query.where, { id: 'main' });
  assert.equal(query.create.id, 'main');
  assert.equal(query.create.contactEmail, 'info@example.com');
  assert.equal(query.update.facebookUrl, 'https://facebook.com/fanaticcoders');
  assert.equal(query.update.phone, null);
  assert.deepEqual(query.select, {
    contactEmail: true,
    phone: true,
    whatsapp: true,
    address: true,
    businessHours: true,
    facebookUrl: true,
    twitterUrl: true,
    instagramUrl: true,
    linkedinUrl: true,
    githubUrl: true
  });
});

test('site settings route allows public reads and rejects unauthenticated updates', async () => {
  stub(prisma.siteSetting, 'findUnique', async () => ({ contactEmail: 'info@example.com', phone: null }));
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise<void>((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/site-settings`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.data.contactEmail, 'info@example.com');

    const updateResponse = await fetch(`http://127.0.0.1:${address.port}/api/v1/site-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactEmail: 'new@example.com' })
    });
    assert.equal(updateResponse.status, 401);
    assert.equal((await updateResponse.json()).success, false);
  } finally {
    if (server.listening) {
      await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    }
  }
});

test('only admins can update settings and OpenAPI describes both routes', () => {
  assert.equal(hasResourcePermission('ADMIN', 'siteSetting', 'update'), true);
  for (const role of ['MANAGER', 'MEMBER', 'CLIENT', 'unknown']) {
    assert.equal(hasResourcePermission(role, 'siteSetting', 'update'), false);
  }

  const document = createOpenApiDocument('http://localhost:3000');
  const endpoint = document.paths['/api/v1/site-settings'];
  assert.ok(endpoint.get);
  assert.deepEqual(endpoint.put['x-requiredPermissions'], { siteSetting: ['update'] });
  assert.equal(endpoint.put.requestBody.content['application/json'].schema.$ref, '#/components/schemas/UpdateSiteSettingRequest');
  assert.deepEqual(document.components.schemas.UpdateSiteSettingRequest.required, ['contactEmail']);
});
