# FCOP Backend

Express + TypeScript + ESM backend with Prisma, MySQL, and Better Auth.

## Local Setup

Use Node 22:

```bash
nvm use
```

Install deps:

```bash
npm install
```

Create a local MySQL database:

```sql
CREATE DATABASE fcop;
```

Set `DATABASE_URL` in `.env`:

```env
DATABASE_URL=mysql://root:password@localhost:3306/fcop
BETTER_AUTH_URL=http://localhost:5000
BETTER_AUTH_SECRET=change-this-secret-at-least-32-chars
```

Create tables with Prisma:

```bash
npm run prisma:migrate -- --name init
```

Run backend:

```bash
npm run dev
```

API runs on:

```txt
http://localhost:5000
```

## Auth Routes

Register:

```http
POST /api/auth/sign-up/email
```

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}
```

Login:

```http
POST /api/auth/sign-in/email
```

```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

Current user:

```http
GET /api/auth/get-session
```
