import cors from "cors";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { env } from "./config/env.js";
import { auth } from "./lib/auth.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found-handler.js";
import { requestLogger } from "./middleware/request-logger.js";
import { healthRouter } from "./routes/health.js";

// Creates the Express application instance.
export const app = express();

// Converts Better Auth into an Express-compatible request handler.
const authHandler = toNodeHandler(auth);

// Configures CORS for the frontend origin and credential-based auth.
app.use(
  cors({
    origin: env.corsOrigins,
    credentials: true
  })
);

// Logs each HTTP request with status, timing, and errors.
app.use(requestLogger);

// Mounts Better Auth routes before body parsers because Better Auth handles raw requests.
app.all("/api/auth/*", async (req, res) => {
  await authHandler(req, res);
});

// Parses JSON and form request bodies for application routes.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Registers application routes.
app.use("/api/health", healthRouter);

// Handles unmatched routes and centralized errors.
app.use(notFoundHandler);
app.use(errorHandler);
