import { describe, it, expect, vi } from "vitest";
import express from "express";
import request from "supertest";
import { Role } from "@prisma/client";
import { authenticate, requireRole } from "./auth.js";
import { authService } from "../modules/auth/auth.service.js";
import { prisma } from "../db/prisma.js";
import { errorHandler } from "./errorHandler.js";

describe("Role-Based Access Control (RBAC) Middleware", () => {
  const driverUser = {
    id: "driver-jashim",
    name: "Jashim",
    email: "jashim@example.com",
    role: Role.DRIVER,
    passwordHash: "hash",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const passengerUser = {
    id: "passenger-nusrat",
    name: "Nusrat",
    email: "nusrat@example.com",
    role: Role.PASSENGER,
    passwordHash: "hash",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Test server with role-guarded route
  const testApp = express();
  testApp.use(express.json());
  testApp.get("/driver-only", authenticate, requireRole([Role.DRIVER]), (_req, res) => {
    res.status(200).json({ success: true, message: "Welcome driver Jashim" });
  });
  testApp.use(errorHandler);

  it("should permit access when user possesses the required DRIVER role", async () => {
    const token = authService.generateToken({
      userId: driverUser.id,
      email: driverUser.email,
      role: driverUser.role,
    });

    vi.spyOn(prisma.user, "findUnique").mockResolvedValue(driverUser);

    const response = await request(testApp)
      .get("/driver-only")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("should reject access with 403 Forbidden when passenger attempts to access driver endpoint", async () => {
    const token = authService.generateToken({
      userId: passengerUser.id,
      email: passengerUser.email,
      role: passengerUser.role,
    });

    vi.spyOn(prisma.user, "findUnique").mockResolvedValue(passengerUser);

    const response = await request(testApp)
      .get("/driver-only")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });
});
