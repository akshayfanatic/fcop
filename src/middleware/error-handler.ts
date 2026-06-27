import type { ErrorRequestHandler } from "express";
import { env } from "../config/env.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const statusCode =
    typeof err.statusCode === "number" && err.statusCode >= 400
      ? err.statusCode
      : 500;

  res.status(statusCode).json({
    message: err.message ?? "Internal server error",
    ...(env.nodeEnv === "development" && { stack: err.stack })
  });
};
