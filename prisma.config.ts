import dotenv from 'dotenv';
import { defineConfig, env } from 'prisma/config';

const nodeEnv = process.env.NODE_ENV ?? 'development';
dotenv.config({ path: [`.env.${nodeEnv}`, '.env'] });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx src/scripts/seed.ts'
  },
  datasource: {
    url: env('DATABASE_URL')
  }
});
