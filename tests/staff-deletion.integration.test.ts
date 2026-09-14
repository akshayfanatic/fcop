import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, test } from 'node:test';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { bearer } from 'better-auth/plugins/bearer';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { organizationAdmin } from '../src/lib/auth/organization-admin.js';
import { createTaskAssignedEmailTemplate } from '../src/lib/email/templates/task-assigned-email.js';

// Opt in only against a dedicated, disposable database with the migrations applied.
const connection = process.env.USER_DELETION_TEST_DATABASE_URL;
let db: PrismaClient;
before(() => {
  if (!connection) return;
  const url = new URL(connection);
  assert.equal(url.pathname, '/fcop_deletion_test');
  assert.ok(['localhost', '127.0.0.1'].includes(url.hostname));
  db = new PrismaClient({
    adapter: new PrismaMariaDb({
      host: url.hostname,
      port: Number(url.port),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: 'fcop_deletion_test',
      connectionLimit: 3
    })
  });
});
after(async () => {
  if (db) await db.$disconnect();
});

async function fixture(role: string) {
  const suffix = randomUUID();
  const org = await db.organization.create({ data: { name: 'Deletion test', slug: suffix } });
  const actor = await db.user.create({ data: { name: 'Admin', email: `admin-${suffix}@example.test` } });
  const target = await db.user.create({ data: { name: 'Target', email: `target-${suffix}@example.test` } });
  const actorMember = await db.member.create({ data: { userId: actor.id, organizationId: org.id, role: 'ADMIN' } });
  const targetMember = await db.member.create({ data: { userId: target.id, organizationId: org.id, role } });
  const owner = role === 'CLIENT' ? target : await db.user.create({ data: { name: 'Client', email: `client-${suffix}@example.test` } });
  const ownerMember = role === 'CLIENT' ? targetMember : await db.member.create({ data: { userId: owner.id, organizationId: org.id, role: 'CLIENT' } });
  const client = await db.client.create({ data: { memberId: ownerMember.id, name: 'Client business' } });
  const request = await db.serviceRequest.create({ data: { clientId: client.id, service: 'WEB_DEVELOPMENT' } });
  const creatorId = role === 'CLIENT' ? actorMember.id : targetMember.id;
  const project = await db.project.create({ data: { name: 'Client project', clientId: client.id, serviceRequestId: request.id, service: 'WEB_DEVELOPMENT', createdByMemberId: creatorId } });
  const proposal = await db.proposal.create({
    data: { serviceRequestId: request.id, createdByMemberId: creatorId, description: 'Proposal', amount: 100, currency: 'USD', stripeInvoiceId: `invoice-${suffix}` }
  });
  const task = await db.task.create({ data: { projectId: project.id, createdByMemberId: creatorId, title: 'Client task' } });
  const comment = await db.taskComment.create({ data: { taskId: task.id, memberId: targetMember.id, content: 'Work history' } });
  await db.taskAssignee.create({ data: { taskId: task.id, projectId: project.id, memberId: targetMember.id } });
  await db.memberProject.create({ data: { projectId: project.id, memberId: targetMember.id } });
  await db.media.createMany({
    data: [
      { targetType: 'PROJECT', targetId: project.id, publicId: `project-${suffix}`, secureUrl: 'https://example.test/project', resourceType: 'image' },
      { targetType: 'TASK', targetId: task.id, publicId: `task-${suffix}`, secureUrl: 'https://example.test/task', resourceType: 'image' }
    ]
  });
  await db.chatHistory.create({
    data: { channelType: 'project', channelId: project.id, messages: [{ authorMemberId: actorMember.id, body: 'Keep this conversation' }], expiresAt: new Date(Date.now() + 3600000) }
  });
  await db.session.create({ data: { userId: actor.id, token: `actor-${suffix}`, expiresAt: new Date(Date.now() + 3600000) } });
  await db.session.create({ data: { userId: target.id, token: `target-${suffix}`, expiresAt: new Date(Date.now() + 3600000) } });
  await db.account.create({ data: { userId: target.id, accountId: target.id, providerId: 'credential' } });
  const auth = betterAuth({
    baseURL: 'http://localhost:3456',
    secret: 'isolated-integration-test-secret-only-123456',
    database: prismaAdapter(db, { provider: 'mysql' }),
    plugins: [bearer(), organizationAdmin(db)]
  });
  const remove = async () => {
    const response = await auth.handler(
      new Request('http://localhost:3456/api/auth/admin/remove-user', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer actor-${suffix}` },
        body: JSON.stringify({ userId: target.id })
      })
    );
    assert.equal(response.status, 200, JSON.stringify(await response.clone().json()));
  };
  return { actor, target, targetMember, owner, client, request, project, proposal, task, comment, remove };
}

for (const role of ['ADMIN', 'MANAGER', 'MEMBER']) {
  test(`MySQL: deleting ${role} preserves client work and clears creator references`, { skip: !connection }, async () => {
    const f = await fixture(role);
    await f.remove();
    assert.equal(await db.user.findUnique({ where: { id: f.target.id } }), null);
    assert.equal(await db.member.findUnique({ where: { id: f.targetMember.id } }), null);
    assert.equal(await db.session.count({ where: { userId: f.target.id } }), 0);
    assert.equal(await db.account.count({ where: { userId: f.target.id } }), 0);
    assert.ok(await db.client.findUnique({ where: { id: f.client.id } }));
    assert.ok(await db.serviceRequest.findUnique({ where: { id: f.request.id } }));
    assert.equal((await db.project.findUniqueOrThrow({ where: { id: f.project.id } })).createdByMemberId, null);
    const proposal = await db.proposal.findUniqueOrThrow({ where: { id: f.proposal.id } });
    assert.equal(proposal.createdByMemberId, null);
    assert.equal(proposal.stripeInvoiceId, f.proposal.stripeInvoiceId);
    const task = await db.task.findUniqueOrThrow({ where: { id: f.task.id }, include: { project: true, createdBy: { include: { user: true } } } });
    assert.equal(task.createdByMemberId, null);
    assert.equal(task.createdBy, null);
    assert.match(createTaskAssignedEmailTemplate({ task, assigneeName: 'Member', projectUrl: 'https://example.test/project' }).text, /Deleted user/);
    assert.equal((await db.taskComment.findUniqueOrThrow({ where: { id: f.comment.id } })).memberId, null);
    assert.equal(await db.taskAssignee.count({ where: { memberId: f.targetMember.id } }), 0);
    assert.equal(await db.memberProject.count({ where: { memberId: f.targetMember.id } }), 0);
    assert.equal(await db.media.count({ where: { targetId: { in: [f.project.id, f.task.id] } } }), 2);
    assert.equal(await db.chatHistory.count({ where: { channelId: f.project.id } }), 1);
  });
}

test('MySQL: deleting a client still cascades its owned business data', { skip: !connection }, async () => {
  const f = await fixture('CLIENT');
  await f.remove();
  assert.equal(await db.user.findUnique({ where: { id: f.target.id } }), null);
  assert.equal(await db.client.findUnique({ where: { id: f.client.id } }), null);
  assert.equal(await db.serviceRequest.findUnique({ where: { id: f.request.id } }), null);
  assert.equal(await db.project.findUnique({ where: { id: f.project.id } }), null);
  assert.equal(await db.task.findUnique({ where: { id: f.task.id } }), null);
  assert.equal(await db.proposal.findUnique({ where: { id: f.proposal.id } }), null);
  assert.equal(await db.media.count({ where: { targetId: { in: [f.project.id, f.task.id] } } }), 0);
  assert.equal(await db.chatHistory.count({ where: { channelId: f.project.id } }), 0);
  assert.ok(await db.user.findUnique({ where: { id: f.actor.id } }));
});
