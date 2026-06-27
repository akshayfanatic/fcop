import cors from "cors";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { env } from "./config/env.js";
import { auth } from "./lib/auth.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found-handler.js";
import { healthRouter } from "./routes/health.js";

export const app = express();
const authHandler = toNodeHandler(auth);

app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true
  })
);

app.all("/api/auth/*", async (req, res) => {
  await authHandler(req, res);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/health", healthRouter);

app.use(notFoundHandler);
app.use(errorHandler);
