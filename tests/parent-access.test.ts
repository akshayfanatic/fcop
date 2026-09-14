import assert from 'node:assert/strict';
import { afterEach, mock, test, type Mock } from 'node:test';
import { auth } from '../src/lib/auth/auth.js';
import { prisma } from '../src/lib/prisma.js';
import { taskCommentService } from '../src/services/task-comment.service.js';
import { taskService } from '../src/services/task.service.js';
import { taskMediaService } from '../src/services/task-media.service.js';
import { projectMediaService } from '../src/services/project-media.service.js';
import { proposalService } from '../src/services/proposal.service.js';
import { saveChatMessage } from '../src/lib/chat/history.js';
import type { ChatMessage } from '../src/lib/chat/schemas.js';
import { getProjectAccessWhere } from '../src/utils/project/project-access.js';
import { getVisibleTaskWhere } from '../src/utils/task/task-access.js';
import { getServiceRequestAccessWhere } from '../src/utils/service-request/service-request-access.js';
import type { getSessionMember } from '../src/lib/auth/session.js';

type Member = Awaited<ReturnType<typeof getSessionMember>>;
const member = {
  id: 'member-a',
  userId: 'user-a',
  organizationId: 'org-a',
  role: 'MEMBER',
  createdAt: new Date(),
  user: { id: 'user-a', name: 'Member', email: 'member@example.test', image: null },
  client: null
} satisfies Member;

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

function session(role = 'MEMBER') {
  mock.method(auth.api, 'getSession', async () => ({ user: { id: 'user-a' }, session: { activeOrganizationId: 'org-a' } }));
  stub(prisma.member, 'findFirst', async () => ({ ...member, role }));
}
const task = { id: 'task-a', projectId: 'project-a', assignees: [{ memberId: member.id }] };
afterEach(() => {
  for (const restore of restoreStubs.splice(0).reverse()) restore();
  mock.restoreAll();
});

test('an in-flight message cannot recreate history for a deleted author or channel', async () => {
  for (const missing of ['author', 'project', 'service-request']) {
    const upsert = mock.fn();
    stub(prisma, '$transaction', async (callback: (tx: unknown) => Promise<void>) =>
      callback({
        member: { findUnique: async () => (missing === 'author' ? null : { id: 'member-a' }) },
        project: { findUnique: async () => (missing === 'project' ? null : { id: 'project-a' }) },
        serviceRequest: { findUnique: async () => null },
        chatHistory: { upsert }
      })
    );
    await assert.rejects(
      saveChatMessage({
        authorMemberId: 'member-a',
        channel: {
          type: missing === 'service-request' ? 'service-request' : 'project',
          id: 'parent-a'
        }
      } as ChatMessage),
      { code: 'CHAT_NOT_FOUND' }
    );
    assert.equal(upsert.mock.callCount(), 0);
  }
});

test('admin project filters and descendant task filters always contain the organization boundary', () => {
  assert.deepEqual(getProjectAccessWhere({ ...member, role: 'ADMIN' }), { client: { member: { organizationId: 'org-a' } } });
  assert.deepEqual(getVisibleTaskWhere({ ...member, role: 'ADMIN' }).project, getProjectAccessWhere({ ...member, role: 'ADMIN' }));
  assert.deepEqual(getVisibleTaskWhere(member).assignees, { some: { memberId: 'member-a' } });
  assert.deepEqual(getServiceRequestAccessWhere({ ...member, role: 'ADMIN' }), { client: { member: { organizationId: 'org-a' } } });
  assert.equal(getServiceRequestAccessWhere({ ...member, role: 'CLIENT' }).clientId, '__no_client_request_access__');
});

test('project visibility denies missing client profiles and limits staff to their projects', () => {
  assert.deepEqual(getProjectAccessWhere({ ...member, role: 'CLIENT' }), {
    client: { member: { organizationId: 'org-a' } },
    id: { in: [] }
  });
  assert.deepEqual(getProjectAccessWhere(member), {
    client: { member: { organizationId: 'org-a' } },
    OR: [{ createdByMemberId: 'member-a' }, { memberProjects: { some: { memberId: 'member-a' } } }]
  });
});

test('inaccessible parent stops comment creation before any write', async () => {
  session();
  const lookup = stub(prisma.task, 'findFirst', async () => null);
  const write = stub(prisma.taskComment, 'create', async () => {
    throw new Error('Unexpected write');
  });
  await assert.rejects(taskCommentService.createTaskComment('foreign-task', { content: 'Hello' }, {}), { code: 'TASK_NOT_FOUND' });
  assert.deepEqual(lookup.mock.calls[0].arguments[0]!.where, { id: 'foreign-task', ...getVisibleTaskWhere(member) });
  assert.equal(write.mock.callCount(), 0);
});

test('comment update rejects a child outside the requested task', async () => {
  session();
  stub(prisma.task, 'findFirst', async () => task);
  const child = stub(prisma.taskComment, 'findFirst', async () => null);
  const write = stub(prisma.taskComment, 'update', async () => {
    throw new Error('Unexpected write');
  });
  await assert.rejects(taskCommentService.updateTaskComment('task-a', 'foreign-comment', { content: 'Changed' }, {}), { code: 'TASK_COMMENT_NOT_FOUND' });
  assert.deepEqual(child.mock.calls[0].arguments[0]!.where, { id: 'foreign-comment', taskId: 'task-a' });
  assert.equal(write.mock.callCount(), 0);
});

test('comment authorship is still enforced after parent access succeeds', async () => {
  session();
  stub(prisma.task, 'findFirst', async () => task);
  stub(prisma.taskComment, 'findFirst', async () => ({ id: 'comment-a', taskId: 'task-a', memberId: 'another-member' }));
  await assert.rejects(taskCommentService.deleteTaskComment('task-a', 'comment-a', {}), { code: 'TASK_COMMENT_WRITE_FORBIDDEN' });
});

test('checklist update rejects a child from another task or project', async () => {
  session();
  stub(prisma.task, 'findFirst', async () => task);
  const child = stub(prisma.addOnTask, 'findFirst', async () => null);
  await assert.rejects(taskService.updateAddOnTaskById('task-a', 'foreign-addon', { isCompleted: true }, {}), { code: 'ADD_ON_TASK_NOT_FOUND' });
  assert.deepEqual(child.mock.calls[0].arguments[0]!.where, { id: 'foreign-addon', taskId: 'task-a', projectId: 'project-a' });
});

test('assigned member can complete a checklist item but cannot rename or create one', async () => {
  session();
  stub(prisma.task, 'findFirst', async () => task);
  stub(prisma.addOnTask, 'findFirst', async () => ({ id: 'addon-a', taskId: 'task-a', projectId: 'project-a' }));
  const write = stub(prisma.addOnTask, 'update', async (args: { data: unknown }) => args.data);
  assert.deepEqual(await taskService.updateAddOnTaskById('task-a', 'addon-a', { isCompleted: true }, {}), { isCompleted: true });
  await assert.rejects(taskService.updateAddOnTaskById('task-a', 'addon-a', { name: 'Rename', isCompleted: true }, {}), { code: 'ADD_ON_TASK_UPDATE_FORBIDDEN' });
  await assert.rejects(taskService.createAddOnTask('task-a', { name: 'New item' }, {}), { code: 'ADD_ON_TASK_CREATE_FORBIDDEN' });
  await assert.rejects(taskService.deleteAddOnTaskById('task-a', 'addon-a', {}), { code: 'ADD_ON_TASK_DELETE_FORBIDDEN' });
  assert.equal(write.mock.callCount(), 1);
});

test('unassigned members cannot update checklist items even when the task lookup returns a record', async () => {
  session();
  stub(prisma.task, 'findFirst', async () => ({ ...task, assignees: [] }));
  const child = stub(prisma.addOnTask, 'findFirst', async () => {
    throw new Error('Unexpected child lookup');
  });
  await assert.rejects(taskService.updateAddOnTaskById('task-a', 'addon-a', { isCompleted: true }, {}), { code: 'TASK_UPDATE_FORBIDDEN' });
  assert.equal(child.mock.callCount(), 0);
});

test('management can rename, create, and delete checklist items without being assigned', async () => {
  session('MANAGER');
  stub(prisma.task, 'findFirst', async () => ({ ...task, assignees: [] }));
  stub(prisma.addOnTask, 'findFirst', async () => ({ id: 'addon-a', taskId: 'task-a', projectId: 'project-a' }));
  stub(prisma.addOnTask, 'count', async () => 0);
  stub(prisma.addOnTask, 'update', async (args: { data: unknown }) => args.data);
  stub(prisma.addOnTask, 'create', async (args: { data: unknown }) => args.data);
  stub(prisma.addOnTask, 'delete', async () => ({ id: 'addon-a' }));
  assert.deepEqual(await taskService.updateAddOnTaskById('task-a', 'addon-a', { name: 'Renamed' }, {}), { name: 'Renamed' });
  assert.deepEqual(await taskService.createAddOnTask('task-a', { name: 'New' }, {}), { taskId: 'task-a', projectId: 'project-a', name: 'New' });
  assert.deepEqual(await taskService.deleteAddOnTaskById('task-a', 'addon-a', {}), { id: 'addon-a' });
});

test('attachment deletion requires both the parent id and target type', async () => {
  session('ADMIN');
  stub(prisma.task, 'findFirst', async () => task);
  const child = stub(prisma.media, 'findFirst', async () => null);
  await assert.rejects(taskMediaService.deleteTaskMedia('task-a', 'foreign-media', {}), { code: 'MEDIA_NOT_FOUND' });
  assert.deepEqual(child.mock.calls[0].arguments[0]!.where, { id: 'foreign-media', targetType: 'TASK', targetId: 'task-a' });
});

test('inaccessible project blocks media lookup', async () => {
  session('ADMIN');
  const parent = stub(prisma.project, 'findFirst', async () => null);
  const child = stub(prisma.media, 'findFirst', async () => {
    throw new Error('Unexpected child lookup');
  });
  await assert.rejects(projectMediaService.deleteProjectMedia('foreign-project', 'media-a', {}), { code: 'PROJECT_NOT_FOUND' });
  assert.deepEqual(parent.mock.calls[0].arguments[0]!.where, { id: 'foreign-project', client: { member: { organizationId: 'org-a' } } });
  assert.equal(child.mock.callCount(), 0);
});

test('proposal access checks its service request organization even for an admin', async () => {
  session('ADMIN');
  const parent = stub(prisma.serviceRequest, 'findFirst', async () => null);
  await assert.rejects(proposalService.getProposal('foreign-request', {}), { code: 'SERVICE_REQUEST_NOT_FOUND' });
  assert.deepEqual(parent.mock.calls[0].arguments[0]!.where, { id: 'foreign-request', client: { member: { organizationId: 'org-a' } } });
});

test('comment author can edit a child after parent and ownership checks', async () => {
  session();
  stub(prisma.task, 'findFirst', async () => task);
  stub(prisma.taskComment, 'findFirst', async () => ({ id: 'comment-a', taskId: 'task-a', memberId: member.id }));
  const write = stub(prisma.taskComment, 'update', async () => ({ id: 'comment-a', content: 'Updated' }));
  assert.deepEqual(await taskCommentService.updateTaskComment('task-a', 'comment-a', { content: 'Updated' }, {}), { id: 'comment-a', content: 'Updated' });
  assert.equal(write.mock.callCount(), 1);
});
