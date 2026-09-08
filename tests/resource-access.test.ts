import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getRolePermissionStatements, hasResourcePermission, rolePermissionStatements, resourceStatements } from '../src/lib/auth/permissions.js';
import { createOpenApiDocument } from '../src/openapi/spec.js';

// These cases lock down independent comment access and parent-owned checklist updates.
test('application resources keep CRUD and chat replaces the misleading comment permission', () => {
  assert.equal('comment' in resourceStatements, false);
  assert.equal('addOnTask' in resourceStatements, false);
  for (const resource of ['lead', 'serviceRequest', 'proposal', 'project', 'task', 'chat', 'taskComment', 'payment', 'dashboard', 'notification'] as const) {
    assert.ok(resourceStatements[resource].every((action) => ['create', 'read', 'update', 'delete'].includes(action)));
  }
  for (const permissions of Object.values(rolePermissionStatements)) {
    for (const [resource, actions] of Object.entries(permissions)) {
      const supported = resourceStatements[resource as keyof typeof resourceStatements] as readonly string[];
      assert.ok(actions.every((action) => supported.includes(action)));
    }
  }
});

test('clients can comment on visible tasks without updating the task', () => {
  assert.equal(hasResourcePermission('CLIENT', 'taskComment', 'create'), true);
  assert.equal(hasResourcePermission('CLIENT', 'task', 'update'), false);
  assert.equal(hasResourcePermission('unknown', 'taskComment', 'create'), false);
});

test('permission output merges multiple roles and fails closed for unknown roles', () => {
  assert.deepEqual(getRolePermissionStatements('unknown'), {});
  const merged = getRolePermissionStatements(' MEMBER, CLIENT, MEMBER ');
  assert.ok(merged.task?.includes('update'));
  assert.ok(merged.payment?.includes('read'));
  assert.equal(new Set(merged.task).size, merged.task?.length);
  assert.equal('comment' in merged, false);
});

test('OpenAPI derives resource names, valid actions, and explicit route permissions', () => {
  const document = createOpenApiDocument('http://localhost:3000');
  const schema = document.components.schemas.PermissionStatements;
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(Object.keys(schema.properties), Object.keys(resourceStatements));
  assert.deepEqual(schema.properties.invitation.items.enum, ['create', 'cancel']);
  assert.deepEqual(schema.properties.notification.items.enum, ['read', 'update']);
  assert.deepEqual(document.paths['/api/v1/tasks/{taskId}/comments'].post['x-requiredPermissions'], {
    taskComment: ['create']
  });
});
