import assert from 'node:assert/strict';
import test from 'node:test';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { bearer } from 'better-auth/plugins/bearer';
import type { Prisma, PrismaClient } from '../src/generated/prisma/client.js';
import { organizationAdmin } from '../src/lib/auth/organization-admin.js';
import { authorizeUserDeletion, deleteUserRelatedData } from '../src/lib/auth/user-deletion.js';

function policyDb(role: string, targetOrganizations = ['org-1']) {
  return {
    member: { findMany: async () => [{ organizationId: 'org-1', role }] },
    user: { findUnique: async () => ({ id: 'target', email: 'target@example.com', members: targetOrganizations.map((organizationId) => ({ id: organizationId, organizationId })) }) }
  } as unknown as Prisma.TransactionClient;
}

for (const role of ['CLIENT', 'MEMBER', 'MANAGER', '', 'admin', 'NOT_ADMIN']) {
  test(`rejects deletion by ${role || 'empty role'}`, async () => {
    await assert.rejects(authorizeUserDeletion(policyDb(role), 'actor', 'target'), { status: 'FORBIDDEN' });
  });
}
test('accepts organization ADMIN, including a comma-separated role', async () => {
  for (const role of ['ADMIN', ' MEMBER, ADMIN ']) {
    assert.equal((await authorizeUserDeletion(policyDb(role), 'actor', 'target')).id, 'target');
  }
});
test('blocks self-deletion and accounts outside administered organizations', async () => {
  await assert.rejects(authorizeUserDeletion(policyDb('ADMIN'), 'actor', 'actor'), { status: 'BAD_REQUEST' });
  for (const orgs of [[], ['org-2'], ['org-1', 'org-2']]) {
    await assert.rejects(authorizeUserDeletion(policyDb('ADMIN', orgs), 'actor', 'target'), { status: 'NOT_FOUND' });
  }
});

test('cleans client-owned media and chat while leaving staff-created business records to foreign-key rules', async () => {
  const calls: { model: string; args: unknown }[] = [];
  const tx: Record<string, unknown> = {};
  for (const model of ['media', 'taskComment', 'task', 'project', 'proposal', 'invitation', 'lead', 'verification']) {
    tx[model] = {
      deleteMany: async (args: unknown) => {
        calls.push({ model, args });
      }
    };
  }
  Object.assign(tx.project as object, {
    findMany: async (args: unknown) => {
      assert.deepEqual(args, { where: { client: { memberId: { in: ['target-member'] } } }, select: { id: true } });
      return [{ id: 'project-1' }];
    }
  });
  Object.assign(tx.task as object, {
    findMany: async (args: unknown) => {
      assert.deepEqual(args, { where: { projectId: { in: ['project-1'] } }, select: { id: true } });
      return [{ id: 'task-1' }];
    }
  });
  tx.serviceRequest = { findMany: async () => [{ id: 'request-1' }] };
  tx.chatHistory = {
    deleteMany: async (args: unknown) => {
      calls.push({ model: 'chatHistory.deleteMany', args });
    },
    findMany: async () => [
      {
        id: 'unrelated-channel',
        messages: [
          { authorMemberId: 'target-member', body: 'remove' },
          { authorMemberId: 'other', body: 'keep' }
        ]
      }
    ],
    update: async (args: unknown) => {
      calls.push({ model: 'chatHistory.update', args });
    }
  };
  const result = await deleteUserRelatedData(tx as unknown as Prisma.TransactionClient, { id: 'target', email: 'target@example.com', members: [{ id: 'target-member' }] });
  assert.deepEqual(result, { userId: 'target', projectIds: ['project-1'], requestIds: ['request-1'] });
  assert.deepEqual(calls.find((call) => call.model === 'media')?.args, {
    where: {
      OR: [
        { targetType: 'PROJECT', targetId: { in: ['project-1'] } },
        { targetType: 'TASK', targetId: { in: ['task-1'] } }
      ]
    }
  });
  assert.deepEqual(calls.find((call) => call.model === 'chatHistory.update')?.args, { where: { id: 'unrelated-channel' }, data: { messages: [{ authorMemberId: 'other', body: 'keep' }] } });
  assert.equal(
    calls.some((call) => ['task', 'project', 'proposal', 'taskComment'].includes(call.model)),
    false
  );
});

// Exercise the actual Better Auth handler and Prisma adapter against a transactional test double.
function fixture(role = 'ADMIN', failUserDelete = false) {
  const now = new Date();
  const users = ['actor', 'target'].map((id) => ({ id, name: id, email: `${id}@example.com`, emailVerified: true, createdAt: now, updatedAt: now }));
  const sessions = users.map((user) => ({ id: `${user.id}-session`, token: `${user.id}-token`, userId: user.id, createdAt: now, updatedAt: now, expiresAt: new Date(Date.now() + 3600000) }));
  const store: Record<string, Record<string, unknown>[]> = {
    user: users,
    session: sessions,
    account: [{ id: 'target-account', userId: 'target', providerId: 'credential', accountId: 'target', createdAt: now, updatedAt: now }],
    member: [
      { id: 'actor-member', userId: 'actor', organizationId: 'org-1', role },
      { id: 'target-member', userId: 'target', organizationId: 'org-1', role: 'CLIENT' }
    ],
    serviceRequest: [],
    project: [],
    task: [],
    media: [],
    chatHistory: [],
    taskComment: [],
    proposal: [],
    invitation: [],
    lead: [
      { id: 'target-lead', email: 'target@example.com' },
      { id: 'other-lead', email: 'other@example.com' }
    ],
    verification: []
  };
  const matches = (row: Record<string, unknown>, where: Record<string, unknown> = {}): boolean =>
    Object.entries(where).every(([key, value]) => {
      if (key === 'OR') return (value as Record<string, unknown>[]).some((item) => matches(row, item));
      if (key === 'AND') return (value as Record<string, unknown>[]).every((item) => matches(row, item));
      if (value && typeof value === 'object') {
        if ('in' in value) return (value.in as unknown[]).includes(row[key]);
        if ('equals' in value) return row[key] === value.equals;
      }
      return row[key] === value;
    });
  let transactions = 0;
  const db = {
    $transaction: async (fn: (tx: Prisma.TransactionClient) => Promise<unknown>) => {
      transactions++;
      const snapshot = structuredClone(store);
      const tx: Record<string, unknown> = {};
      for (const model of Object.keys(store)) {
        const find = async ({ where }: { where: Record<string, unknown> }) => {
          const row = store[model].find((entry) => matches(entry, where));
          return row ? { ...row, ...(model === 'user' ? { members: store.member.filter((member) => member.userId === row.id) } : {}) } : null;
        };
        tx[model] = {
          findUnique: find,
          findFirst: find,
          findMany: async ({ where }: { where?: Record<string, unknown> } = {}) => store[model].filter((entry) => matches(entry, where)),
          deleteMany: async ({ where }: { where: Record<string, unknown> }) => {
            const original = store[model].length;
            store[model] = store[model].filter((entry) => !matches(entry, where));
            return { count: original - store[model].length };
          },
          delete: async ({ where }: { where: Record<string, unknown> }) => {
            if (model === 'user' && failUserDelete) throw new Error('Injected database failure');
            const entry = store[model].find((row) => matches(row, where));
            store[model] = store[model].filter((row) => !matches(row, where));
            return entry;
          }
        };
      }
      try {
        return await fn(tx as unknown as Prisma.TransactionClient);
      } catch (error) {
        Object.assign(store, snapshot);
        throw error;
      }
    }
  } as unknown as PrismaClient;
  const auth = betterAuth({
    baseURL: 'http://localhost:3456',
    secret: 'test-secret-only-not-a-production-secret-123456',
    database: memoryAdapter(store),
    logger: { disabled: true },
    plugins: [bearer(), organizationAdmin(db)]
  });
  const request = (token?: string, userId = 'target', path = '/admin/remove-user') =>
    auth.handler(
      new Request(`http://localhost:3456/api/auth${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ userId })
      })
    );
  return { store, request, transactions: () => transactions };
}

test('HTTP endpoint rejects unauthenticated requests before starting a transaction', async () => {
  const f = fixture();
  assert.equal((await f.request()).status, 401);
  assert.equal(f.transactions(), 0);
});
test('HTTP endpoint denies managers and does not expose other global-admin operations', async () => {
  const f = fixture('MANAGER');
  assert.equal((await f.request('actor-token')).status, 403);
  assert.equal((await f.request('actor-token', 'target', '/admin/ban-user')).status, 404);
  assert.equal(f.store.user.length, 2);
});
test('organization admin removes account and sessions through the built-in Admin endpoint', async () => {
  const f = fixture();
  const response = await f.request('actor-token');
  assert.equal(response.status, 200, JSON.stringify(await response.clone().json()));
  assert.deepEqual(await response.json(), { success: true });
  assert.deepEqual(
    f.store.user.map((user) => user.id),
    ['actor']
  );
  assert.deepEqual(
    f.store.session.map((session) => session.userId),
    ['actor']
  );
  assert.equal(f.store.account.length, 0);
  assert.deepEqual(
    f.store.lead.map((lead) => lead.id),
    ['other-lead']
  );
  assert.equal((await f.request('target-token', 'actor')).status, 401);
});
test('account deletion failure rolls back session and account cleanup', async () => {
  const f = fixture('ADMIN', true);
  const response = await f.request('actor-token');
  assert.equal(response.status, 500);
  assert.equal(f.store.user.length, 2);
  assert.equal(f.store.session.length, 2);
  assert.equal(f.store.account.length, 1);
  assert.equal(f.store.lead.length, 2);
});

test('HTTP endpoint blocks self-deletion and invalid input', async () => {
  const f = fixture();
  assert.equal((await f.request('actor-token', 'actor')).status, 400);
  assert.equal((await f.request('actor-token', '')).status, 400);
  assert.equal(f.store.user.length, 2);
});
