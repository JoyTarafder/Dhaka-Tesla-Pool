import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { authService } from "../modules/auth/auth.service.js";
import { UserResponse } from "../modules/auth/auth.types.js";
import { AppError } from "./errorHandler.js";

// Extend Express Request interface to include authenticated user details
declare global {
  namespace Express {
    interface Request {
      user?: UserResponse;
    }
  }
}

// Authentication middleware to verify JWT access tokens
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next(new AppError("Authentication token is required", 401, "UNAUTHORIZED"));
    return;
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    next(new AppError("Authentication token is malformed", 401, "UNAUTHORIZED"));
    return;
  }

  try {
    const payload = authService.verifyToken(token);
    const user = await authService.getUserById(payload.userId);
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

// Authorization middleware to enforce Role-Based Access Control (RBAC)
export function requireRole(allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError("Authentication required", 401, "UNAUTHORIZED"));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError("Forbidden: insufficient permissions for this action", 403, "FORBIDDEN"));
      return;
    }

    next();
  };
}
