---
name: business-intent-comments
description: Apply concise business-intent comments in JavaScript/TypeScript code when CRUD flows include side effects, guards, cross-module actions, notifications, emails, or business rules. Use when adding or reviewing comments around backend services, controllers, auth hooks, notification/email flows, validation gates, and database writes.
---

# Business Intent Comments

Use this skill to keep comments useful and consistent in application code.

## Rule

Comment business intent, not obvious code.

Add a comment when a CRUD flow performs extra work such as:

- sending email
- creating notifications
- checking a business rule before saving
- syncing another module
- changing related domain state
- calling an external service

Do not comment normal CRUD that is already clear from the code.

## Pattern

Use one short sentence above the important action:

```ts
// [Action] to [business purpose].
```

Examples:

```ts
// Send email to tell admin about the new service request.
await sendTemplateEmail(...);
```

```ts
// Create client profile after invitation is accepted.
await clientService.createClient(payload);
```

```ts
// Mark matching lead as qualified after user joins.
await leadService.updateLeadByEmail(...);
```

```ts
// Create notification to tell manager about the new service request.
await notificationService.create(...);
```

```ts
// Make sure only clients can create service requests.
if (!client) {
  throw createHttpError(...);
}
```

## Avoid

Do not repeat the code:

```ts
// Call sendTemplateEmail.
await sendTemplateEmail(...);
```

```ts
// Create request.
await prisma.serviceRequest.create(...);
```

Do not write vague comments:

```ts
// Send notification email.
```

Prefer purpose-specific comments:

```ts
// Send email to tell admin about the new service request.
```

## Discipline

- Keep comments in simple English.
- Keep comments close to the action.
- Update or remove comments when behavior changes.
- Prefer no comment over a stale or obvious comment.
- Use JSDoc only for public/shared APIs where function purpose, parameters, or return value are not obvious.
