import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { Role } from "@prisma/client";
import { app } from "../../app.js";
import { prisma } from "../../db/prisma.js";
import { authService } from "../auth/auth.service.js";

describe("Phase 3 — Vehicle / Driver Module Tests", () => {
  const mockDriver = {
    id: "driver-jashim-uuid",
    name: "Jashim",
    email: "jashim@example.com",
    role: Role.DRIVER,
    passwordHash: "hash",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPassenger = {
    id: "passenger-nusrat-uuid",
    name: "Nusrat",
    email: "nusrat@example.com",
    role: Role.PASSENGER,
    passwordHash: "hash",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBulletVehicle = {
    id: "vehicle-bullet-uuid",
    driverId: mockDriver.id,
    name: "Bullet",
    registrationNumber: "DHK-TESLA-001",
    capacity: 3,
    isOnline: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const driverToken = authService.generateToken({
    userId: mockDriver.id,
    email: mockDriver.email,
    role: mockDriver.role,
  });

  const passengerToken = authService.generateToken({
    userId: mockPassenger.id,
    email: mockPassenger.email,
    role: mockPassenger.role,
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/driver/vehicle", () => {
    it("should allow driver Jashim to fetch their assigned vehicle Bullet", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(mockDriver);
      vi.spyOn(prisma.vehicle, "findFirst").mockResolvedValue(mockBulletVehicle);

      const response = await request(app)
        .get("/api/driver/vehicle")
        .set("Authorization", `Bearer ${driverToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.vehicle).toEqual({
        id: mockBulletVehicle.id,
        driverId: mockDriver.id,
        name: "Bullet",
        registrationNumber: "DHK-TESLA-001",
        capacity: 3,
        isOnline: true,
        createdAt: mockBulletVehicle.createdAt.toISOString(),
        updatedAt: mockBulletVehicle.updatedAt.toISOString(),
      });
    });

    it("should return 403 Forbidden when a passenger tries to access driver vehicle endpoint", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(mockPassenger);

      const response = await request(app)
        .get("/api/driver/vehicle")
        .set("Authorization", `Bearer ${passengerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("FORBIDDEN");
    });

    it("should return 401 when no token is provided", async () => {
      const response = await request(app).get("/api/driver/vehicle");
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("UNAUTHORIZED");
    });

    it("should return 404 if driver has no registered vehicle", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(mockDriver);
      vi.spyOn(prisma.vehicle, "findFirst").mockResolvedValue(null);

      const response = await request(app)
        .get("/api/driver/vehicle")
        .set("Authorization", `Bearer ${driverToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VEHICLE_NOT_FOUND");
    });
  });

  describe("PATCH /api/driver/availability", () => {
    it("should toggle driver vehicle availability status between online and offline", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(mockDriver);
      vi.spyOn(prisma.vehicle, "findFirst").mockResolvedValue(mockBulletVehicle);
      vi.spyOn(prisma.vehicle, "update").mockResolvedValue({
        ...mockBulletVehicle,
        isOnline: false,
      });

      const response = await request(app)
        .patch("/api/driver/availability")
        .set("Authorization", `Bearer ${driverToken}`)
        .send({ isOnline: false });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.vehicle.isOnline).toBe(false);
    });

    it("should reject invalid availability payload with 400 validation error", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(mockDriver);

      const response = await request(app)
        .patch("/api/driver/availability")
        .set("Authorization", `Bearer ${driverToken}`)
        .send({ isOnline: "invalid-type" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject passenger attempting to toggle vehicle availability with 403 Forbidden", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(mockPassenger);

      const response = await request(app)
        .patch("/api/driver/availability")
        .set("Authorization", `Bearer ${passengerToken}`)
        .send({ isOnline: true });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("FORBIDDEN");
    });
  });
});
