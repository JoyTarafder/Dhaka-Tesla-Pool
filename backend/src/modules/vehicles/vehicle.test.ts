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

  describe("GET /api/driver/payment-history", () => {
    it("should allow driver Jashim to fetch payment and trip history", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(mockDriver);

      const mockCompletedPools = [
        {
          id: "pool-completed-1",
          vehicleId: mockBulletVehicle.id,
          driverId: mockDriver.id,
          status: "COMPLETED",
          totalCapacity: 3,
          occupiedSeats: 2,
          pickupZone: "Banani",
          routeCode: "BANANI_MOHAKHALI",
          completedAt: new Date("2026-09-28T09:30:00Z"),
          vehicle: mockBulletVehicle,
          memberships: [
            {
              id: "mem-1",
              seatsReserved: 1,
              fareAmountPoisha: 12000,
              membershipStatus: "COMPLETED",
              rideRequest: {
                passengerId: mockPassenger.id,
                pickupZone: "Banani",
                destinationZone: "Mohakhali",
                passenger: { name: "Nusrat" },
                payment: {
                  id: "pay-1",
                  method: "CASH",
                  status: "PAID",
                  amountPoisha: 12000,
                },
              },
            },
            {
              id: "mem-2",
              seatsReserved: 1,
              fareAmountPoisha: 13500,
              membershipStatus: "COMPLETED",
              rideRequest: {
                passengerId: "passenger-rafiq-uuid",
                pickupZone: "Banani",
                destinationZone: "Gulshan 1",
                passenger: { name: "Rafiq" },
                payment: {
                  id: "pay-2",
                  method: "TESLA_PAY",
                  status: "PAID",
                  amountPoisha: 13500,
                },
              },
            },
          ],
        },
      ];

      vi.spyOn(prisma.pool, "findMany").mockResolvedValue(mockCompletedPools as any);

      const response = await request(app)
        .get("/api/driver/payment-history")
        .set("Authorization", `Bearer ${driverToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.totalTrips).toBe(1);
      // Integer arithmetic check (Rule 13): 12000 + 13500 = 25500 poisha
      expect(response.body.data.summary.totalEarningsPoisha).toBe(25500);
      expect(response.body.data.summary.formattedTotalEarnings).toBe("৳255.00");
      expect(response.body.data.summary.totalPassengersServed).toBe(2);

      const trip = response.body.data.trips[0];
      expect(trip.poolId).toBe("pool-completed-1");
      expect(trip.totalFarePoisha).toBe(25500);
      expect(trip.formattedTotalFare).toBe("৳255.00");
      expect(trip.breakdown).toHaveLength(2);
      expect(trip.breakdown[0].passengerName).toBe("Nusrat");
      expect(trip.breakdown[0].paymentMethod).toBe("CASH");
      expect(trip.breakdown[1].passengerName).toBe("Rafiq");
      expect(trip.breakdown[1].paymentMethod).toBe("TESLA_PAY");
    });

    it("should return empty summary when driver has no completed trips yet", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(mockDriver);
      vi.spyOn(prisma.pool, "findMany").mockResolvedValue([]);

      const response = await request(app)
        .get("/api/driver/payment-history")
        .set("Authorization", `Bearer ${driverToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.totalTrips).toBe(0);
      expect(response.body.data.summary.totalEarningsPoisha).toBe(0);
      expect(response.body.data.summary.formattedTotalEarnings).toBe("৳0.00");
      expect(response.body.data.trips).toEqual([]);
    });

    it("should reject unauthenticated request with 401 Unauthorized", async () => {
      const response = await request(app).get("/api/driver/payment-history");
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should reject passenger accessing driver payment history with 403 Forbidden", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(mockPassenger);

      const response = await request(app)
        .get("/api/driver/payment-history")
        .set("Authorization", `Bearer ${passengerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("FORBIDDEN");
    });
  });
});
