import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service.js";
import { registerSchema, loginSchema } from "./auth.validation.js";
import { ApiSuccessResponse } from "../../shared/types/index.js";
import { AuthResponseData, UserResponse } from "./auth.types.js";
import { AppError } from "../../middleware/errorHandler.js";

// Controller handling HTTP requests for the Auth domain
export class AuthController {
  // Handle new user registration
  public async register(
    req: Request,
    res: Response<ApiSuccessResponse<AuthResponseData>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const validatedInput = registerSchema.parse(req.body);
      const result = await authService.register(validatedInput);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Handle user login and access token issuance
  public async login(
    req: Request,
    res: Response<ApiSuccessResponse<AuthResponseData>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const validatedInput = loginSchema.parse(req.body);
      const result = await authService.login(validatedInput);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Retrieve details of currently authenticated user session
  public async me(
    req: Request,
    res: Response<ApiSuccessResponse<{ user: UserResponse }>>,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Authentication required", 401, "UNAUTHORIZED");
      }

      res.status(200).json({
        success: true,
        data: {
          user: req.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
