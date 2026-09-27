import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Role, User } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { env } from "../../config/env.js";
import { AppError } from "../../middleware/errorHandler.js";
import { RegisterInput, LoginInput } from "./auth.validation.js";
import { AuthResponseData, JwtUserPayload, UserResponse } from "./auth.types.js";

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = "24h";

// Service responsible for user authentication, password security, and JWT tokens
export class AuthService {
  // Strip sensitive password hash before exposing user data
  public sanitizeUser(user: User): UserResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // Issue signed JWT access token containing minimal identity payload
  public generateToken(payload: JwtUserPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: TOKEN_EXPIRY,
    });
  }

  // Verify and decode JWT token returning the typed identity payload
  public verifyToken(token: string): JwtUserPayload {
    try {
      return jwt.verify(token, env.JWT_SECRET) as JwtUserPayload;
    } catch {
      throw new AppError("Invalid or expired authentication token", 401, "UNAUTHORIZED");
    }
  }

  // Register a new user ensuring unique email and secure password hashing
  public async register(input: RegisterInput): Promise<AuthResponseData> {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new AppError("A user with this email address already exists", 409, "EMAIL_ALREADY_EXISTS");
    }

    // Hash password with bcrypt before storage
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const newUser = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role ?? Role.PASSENGER,
      },
    });

    const token = this.generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    return {
      user: this.sanitizeUser(newUser),
      token,
    };
  }

  // Authenticate user credentials and return new session token
  public async login(input: LoginInput): Promise<AuthResponseData> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    // Use generic error message to avoid email enumeration
    if (!user) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  // Fetch current user details by user ID
  public async getUserById(userId: string): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    return this.sanitizeUser(user);
  }
}

export const authService = new AuthService();
