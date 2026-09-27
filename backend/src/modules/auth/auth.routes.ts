import { Router } from "express";
import { authController } from "./auth.controller.js";
import { authenticate } from "../../middleware/auth.js";

export const authRouter: Router = Router();

// Public routes for user registration and authentication
authRouter.post("/register", (req, res, next) => authController.register(req, res, next));
authRouter.post("/login", (req, res, next) => authController.login(req, res, next));

// Protected route to fetch current authenticated user profile
authRouter.get("/me", authenticate, (req, res, next) => authController.me(req, res, next));
