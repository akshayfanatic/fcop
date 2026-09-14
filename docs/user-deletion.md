# Admin user deletion

The Users table calls `authClient.admin.removeUser({ userId })` through
`POST /api/auth/admin/remove-user`. The identifier is the account's user ID,
not the organization membership ID.

`organizationAdmin` exposes only this operation from Better Auth's Admin plugin.
Authorization comes from current database `Member.role` values: the caller must
have `ADMIN` in every organization the target belongs to. Other global Admin
endpoints and a separate `User.role` are not enabled. Self-deletion and deletion
of accounts outside the caller's administered organizations are rejected.

Deletion runs in one serializable Prisma transaction. Domain cleanup and Better
Auth's session, account, and user removal use the same transaction adapter.
The direct `@better-auth/core` dependency supplies `runWithAdapter`, which the
installed `better-auth` package does not re-export.

Deleting staff preserves client-owned projects, tasks, proposals, invoice records,
attachments, and task comments. The database sets creator references and comment
author references to null. Staff memberships, assignments, sessions, and accounts
are deleted. Missing creators display as "Deleted user" in task-assignment emails.

If the deleted member has a Client profile, database cascades remove that client's
requests, projects, tasks, and proposals. Ownership is determined by the Client
relationship, not the role string. Media rows and chat histories for those owned
resources have no parent foreign keys, so they are cleaned explicitly. Matching
leads, invitations, and verification records are also removed. Messages by the
deleted member are removed from surviving conversations; other authors' messages
remain.

The UI composes its confirmation actions inside the shared `ActionDialog` and
uses `useActionDialog` to close after success. Failures remain visible in the dialog.

After commit, the local chat server disconnects the deleted user's sockets and
removes participants from deleted channels. This notification is process-local;
a multi-instance deployment requires shared event delivery for immediate socket
disconnection across instances.

This operation deletes database records. It does not delete externally hosted
Cloudinary files, Stripe customers, or Stripe invoices, and does not cancel
external billing.

Apply `20260909120000_preserve_client_work_on_staff_deletion` before deploying the
updated backend. It makes Project, Task, and Proposal creator foreign keys
nullable with `ON DELETE SET NULL`. Deploy the backend before the frontend.

Unit tests exercise permissions, the Better Auth HTTP endpoint, and rollback.
`tests/staff-deletion.integration.test.ts` tests actual MySQL cascades through the
HTTP endpoint for ADMIN, MANAGER, MEMBER, and CLIENT targets. It requires
`USER_DELETION_TEST_DATABASE_URL` pointing to a migrated local database named
`fcop_deletion_test`; it skips otherwise. Only use disposable fixtures there.
