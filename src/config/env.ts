import dotenv from "dotenv";
import { toLogLevel, toOrigins, toPort } from "../utils/env-parser.js";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  logLevel: toLogLevel(process.env.LOG_LEVEL),
  port: toPort(process.env.PORT, 5000),
  corsOrigins: toOrigins(process.env.CORS_ORIGIN, [
    "http://192.168.29.204:3000",
    "http://localhost:3000"
  ]),
  betterAuthUrl: process.env.BETTER_AUTH_URL ?? "http://localhost:5000",
  betterAuthSecret:
    process.env.BETTER_AUTH_SECRET ?? "dev-better-auth-secret-change-before-production",
  databaseUrl: process.env.DATABASE_URL ?? "mysql://root@localhost:3306/fcop"
};
