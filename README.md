# FCOP Backend

Express + TypeScript backend for FCOP.

## Stack

- Node.js
- Express
- TypeScript
- Prisma
- MySQL
- Better Auth

## Setup

```bash
nvm use
npm install
```

Create a `.env` file from `.env.example` and fill in local values.

## Database

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

## Development

```bash
npm run dev
```

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run typecheck
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```
