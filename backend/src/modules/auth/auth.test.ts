import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { app } from "../../app.js";
import { prisma } from "../../db/prisma.js";
import { authService } from "./auth.service.js";

describe("Phase 2 — Auth Module Tests", () => {
  const mockPassenger = {
    id: "user-nusrat-1",
    name: "Nusrat",
    email: "nusrat@example.com",
    passwordHash: "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyPrj1fXJj3uW01E8L8C6X4.1m7p4zC6", // mocked hash
    role: Role.PASSENGER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDriver = {
    id: "user-jashim-1",
    name: "Jashim",
    email: "jashim@example.com",
    passwordHash: "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyPrj1fXJj3uW01E8L8C6X4.1m7p4zC6",
    role: Role.DRIVER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("POST /api/auth/register", () => {
    it("should register a new passenger, returning token and sanitized user without passwordHash", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(null);
      vi.spyOn(prisma.user, "create").mockResolvedValue(mockPassenger);

      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Nusrat",
          email: "nusrat@example.com",
          password: "password123",
          role: "PASSENGER",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("token");
      expect(response.body.data.user).toEqual({
        id: mockPassenger.id,
        name: mockPassenger.name,
        email: mockPassenger.email,
        role: mockPassenger.role,
        createdAt: mockPassenger.createdAt.toISOString(),
        updatedAt: mockPassenger.updatedAt.toISOString(),
      });
      // Security check: passwordHash must NEVER be returned
      expect(response.body.data.user).not.toHaveProperty("passwordHash");
      expect(response.body.data.user).not.toHaveProperty("password_hash");
    });

    it("should reject registration with 409 if email is already taken", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(mockPassenger);

      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Nusrat Duplicate",
          email: "nusrat@example.com",
          password: "password123",
          role: "PASSENGER",
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("EMAIL_ALREADY_EXISTS");
    });

    it("should reject invalid inputs with 400 validation error", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "N", // too short
          email: "not-an-email",
          password: "123", // too short (< 6)
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /api/auth/login", () => {
    it("should authenticate valid credentials and issue JWT token", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(mockPassenger);
      vi.spyOn(bcrypt, "compare").mockResolvedValue(true as never);

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nusrat@example.com",
          password: "password123",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("token");
      expect(response.body.data.user.email).toBe("nusrat@example.com");
      expect(response.body.data.user).not.toHaveProperty("passwordHash");
    });

    it("should reject invalid password with 401", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(mockPassenger);
      vi.spyOn(bcrypt, "compare").mockResolvedValue(false as never);

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nusrat@example.com",
          password: "wrongpassword",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("should reject non-existent user with 401 generic error", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(null);

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "unknown@example.com",
          password: "password123",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return authenticated user profile when Bearer token is provided", async () => {
      const token = authService.generateToken({
        userId: mockPassenger.id,
        email: mockPassenger.email,
        role: mockPassenger.role,
      });

      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(mockPassenger);

      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(mockPassenger.id);
      expect(response.body.data.user.email).toBe(mockPassenger.email);
    });

    it("should reject request with 401 when Authorization header is missing", async () => {
      const response = await request(app).get("/api/auth/me");
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("UNAUTHORIZED");
    });

    it("should reject request with 401 when token is invalid or corrupted", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-garbage-token");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("UNAUTHORIZED");
    });
  });
});
