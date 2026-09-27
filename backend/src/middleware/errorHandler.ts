import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../shared/utils/logger.js";
import { ApiErrorResponse } from "../shared/types/index.js";

// Custom Application Error with explicit HTTP status code and error domain code
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode: number = 400, code: string = "BAD_REQUEST") {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// Global express error handling middleware
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response<ApiErrorResponse>,
  _next: NextFunction
): void {
  // Handle known application errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  // Handle Zod schema validation errors cleanly
  if (err instanceof ZodError) {
    const formattedIssues = err.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(", ");
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: formattedIssues || "Input validation failed",
      },
    });
    return;
  }

  // Log unexpected errors internally for debugging without exposing internals to client
  logger.error(err, "Unhandled server error caught by global errorHandler");

  // Rule 14: Never leak raw DB errors or stack traces into API responses
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected internal server error occurred. Please try again later.",
    },
  });
}
