import dotenv from "dotenv";

dotenv.config();

const toPort = (value: string | undefined, fallback: number) => {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 ? port : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: toPort(process.env.PORT, 5000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  betterAuthUrl: process.env.BETTER_AUTH_URL ?? "http://localhost:5000",
  betterAuthSecret:
    process.env.BETTER_AUTH_SECRET ?? "dev-better-auth-secret-change-before-production",
  databaseUrl: process.env.DATABASE_URL ?? "mysql://root@localhost:3306/fcop"
};
