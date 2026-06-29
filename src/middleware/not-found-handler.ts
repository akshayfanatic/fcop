import type { Request, Response } from "express";
import { ApiResponse, HttpStatus } from "../utils/api-response.js";

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(HttpStatus.NOT_FOUND).json(
    ApiResponse({
      success: false,
      status: HttpStatus.NOT_FOUND,
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      error: {
        code: "NOT_FOUND"
      }
    })
  );
};
