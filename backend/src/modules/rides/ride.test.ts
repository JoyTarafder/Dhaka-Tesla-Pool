import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { Role, RideStatus } from "@prisma/client";
import { app } from "../../app.js";
import { prisma } from "../../db/prisma.js";
import { authService } from "../auth/auth.service.js";
import { poolService } from "../pools/pool.service.js";

describe("Phase 4 — Ride Request Module Tests", () => {
  const nusratUser = {
    id: "passenger-nusrat-uuid",
    name: "Nusrat",
    email: "nusrat@example.com",
    role: Role.PASSENGER,
    passwordHash: "hash",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const rafiqUser = {
    id: "passenger-rafiq-uuid",
    name: "Rafiq",
    email: "rafiq@example.com",
    role: Role.PASSENGER,
    passwordHash: "hash",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const nusratToken = authService.generateToken({
    userId: nusratUser.id,
    email: nusratUser.email,
    role: nusratUser.role,
  });

  const rafiqToken = authService.generateToken({
    userId: rafiqUser.id,
    email: rafiqUser.email,
    role: rafiqUser.role,
  });

  const mockNusratRide = {
    id: "ride-nusrat-uuid",
    passengerId: nusratUser.id,
    pickupZone: "BANANI",
    destinationZone: "MOHAKHALI",
    seatCount: 1,
    estimatedDistanceKm: 4.0,
    fareAmountPoisha: 6240, // ৳62.40
    status: RideStatus.REQUESTED,
    createdAt: new Date(),
    updatedAt: new Date(),
    cancelledAt: null,
  };

  const mockRafiqRide = {
    id: "ride-rafiq-uuid",
    passengerId: rafiqUser.id,
    pickupZone: "BANANI",
    destinationZone: "GULSHAN_1",
    seatCount: 1,
    estimatedDistanceKm: 5.0,
    fareAmountPoisha: 7200, // ৳72.00
    status: RideStatus.REQUESTED,
    createdAt: new Date(),
    updatedAt: new Date(),
    cancelledAt: null,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("POST /api/ride-requests", () => {
    it("should allow Nusrat to create a ride request with calculated integer poisha fare", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(nusratUser);
      vi.spyOn(prisma.rideRequest, "findFirst").mockResolvedValue(null);
      vi.spyOn(prisma.rideRequest, "create").mockResolvedValue(mockNusratRide);
      vi.spyOn(prisma.rideRequest, "findUnique").mockResolvedValue(mockNusratRide);
      vi.spyOn(prisma.rideStatusHistory, "create").mockResolvedValue({} as never);
      vi.spyOn(poolService, "matchOrCreatePool").mockResolvedValue({} as any);

      const response = await request(app)
        .post("/api/ride-requests")
        .set("Authorization", `Bearer ${nusratToken}`)
        .send({
          pickupZone: "BANANI",
          destinationZone: "MOHAKHALI",
          seatCount: 1,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.ride.fareAmountPoisha).toBe(6240);
      expect(response.body.data.ride.formattedFare).toBe("৳62.40");
      expect(response.body.data.ride.status).toBe("REQUESTED");
    });

    it("should prevent creating multiple concurrent active rides for the same passenger", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(nusratUser);
      vi.spyOn(prisma.rideRequest, "findFirst").mockResolvedValue(mockNusratRide);

      const response = await request(app)
        .post("/api/ride-requests")
        .set("Authorization", `Bearer ${nusratToken}`)
        .send({
          pickupZone: "BANANI",
          destinationZone: "FARMGATE",
          seatCount: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("ACTIVE_RIDE_EXISTS");
    });

    it("should reject ride request if pickup equals destination", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(nusratUser);

      const response = await request(app)
        .post("/api/ride-requests")
        .set("Authorization", `Bearer ${nusratToken}`)
        .send({
          pickupZone: "BANANI",
          destinationZone: "BANANI",
          seatCount: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /api/ride-requests/me", () => {
    it("should return passenger's active ride and history", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(nusratUser);
      vi.spyOn(prisma.rideRequest, "findMany").mockResolvedValue([mockNusratRide]);

      const response = await request(app)
        .get("/api/ride-requests/me")
        .set("Authorization", `Bearer ${nusratToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.activeRide.id).toBe(mockNusratRide.id);
      expect(response.body.data.history).toEqual([]);
    });
  });

  describe("Security: Cross-User Ownership Checks (security.md §2)", () => {
    it("should return 403 Forbidden when Nusrat attempts to view Rafiq's ride request", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(nusratUser);
      vi.spyOn(prisma.rideRequest, "findUnique").mockResolvedValue(mockRafiqRide);

      const response = await request(app)
        .get(`/api/ride-requests/${mockRafiqRide.id}`)
        .set("Authorization", `Bearer ${nusratToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("FORBIDDEN");
    });

    it("should return 403 Forbidden when Nusrat attempts to cancel Rafiq's ride request", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(nusratUser);
      vi.spyOn(prisma.rideRequest, "findUnique").mockResolvedValue(mockRafiqRide);

      const response = await request(app)
        .post(`/api/ride-requests/${mockRafiqRide.id}/cancel`)
        .set("Authorization", `Bearer ${nusratToken}`)
        .send({ reason: "Malicious attempt" });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("Cancellation & State Machine Transitions (Rule 10 & PRD.md §5)", () => {
    it("should allow passenger to cancel a ride in REQUESTED state", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(nusratUser);
      vi.spyOn(prisma.rideRequest, "findUnique").mockResolvedValue(mockNusratRide);

      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback: any) => {
        const txMock = {
          rideRequest: {
            update: vi.fn().mockResolvedValue({
              ...mockNusratRide,
              status: RideStatus.CANCELLED,
              cancelledAt: new Date(),
            }),
          },
          poolMembership: {
            update: vi.fn().mockResolvedValue({}),
            count: vi.fn().mockResolvedValue(0),
          },
          pool: {
            update: vi.fn().mockResolvedValue({}),
            findUnique: vi.fn().mockResolvedValue(null),
          },
          rideStatusHistory: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      const response = await request(app)
        .post(`/api/ride-requests/${mockNusratRide.id}/cancel`)
        .set("Authorization", `Bearer ${nusratToken}`)
        .send({ reason: "Changed plans" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.ride.status).toBe("CANCELLED");
    });

    it("should reject cancellation when ride has already STARTED (Rule 10 & PRD.md §5)", async () => {
      const startedRide = {
        ...mockNusratRide,
        status: RideStatus.STARTED,
      };

      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(nusratUser);
      vi.spyOn(prisma.rideRequest, "findUnique").mockResolvedValue(startedRide);

      const response = await request(app)
        .post(`/api/ride-requests/${mockNusratRide.id}/cancel`)
        .set("Authorization", `Bearer ${nusratToken}`)
        .send();

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("INVALID_STATUS_TRANSITION");
    });
  });

  describe("GET /api/ride-requests/:id/history (Architecture.md §4)", () => {
    it("should return chronological audit history of status transitions for Nusrat", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(nusratUser);
      vi.spyOn(prisma.rideRequest, "findUnique").mockResolvedValue(mockNusratRide);
      vi.spyOn(prisma.rideStatusHistory, "findMany").mockResolvedValue([
        {
          id: "hist-1",
          rideRequestId: mockNusratRide.id,
          poolId: null,
          fromStatus: "REQUESTED",
          toStatus: "MATCHED",
          changedByUserId: nusratUser.id,
          reason: "Matched into pool",
          createdAt: new Date("2026-09-27T10:00:00Z"),
          changedBy: { id: nusratUser.id, name: "Nusrat", role: Role.PASSENGER },
        },
        {
          id: "hist-2",
          rideRequestId: mockNusratRide.id,
          poolId: "pool-1",
          fromStatus: "MATCHED",
          toStatus: "ACCEPTED",
          changedByUserId: "driver-id",
          reason: "Driver accepted",
          createdAt: new Date("2026-09-27T10:01:00Z"),
          changedBy: { id: "driver-id", name: "Jashim", role: Role.DRIVER },
        },
      ] as any);

      const response = await request(app)
        .get(`/api/ride-requests/${mockNusratRide.id}/history`)
        .set("Authorization", `Bearer ${nusratToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.history.length).toBe(2);
      expect(response.body.data.history[0].toStatus).toBe("MATCHED");
      expect(response.body.data.history[1].toStatus).toBe("ACCEPTED");
      expect(response.body.data.history[1].changedByName).toBe("Jashim");
    });

    it("should prevent Rafiq from viewing Nusrat's ride status history (Rule 16 & 17)", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(rafiqUser);
      vi.spyOn(prisma.rideRequest, "findUnique").mockResolvedValue(mockNusratRide);

      const response = await request(app)
        .get(`/api/ride-requests/${mockNusratRide.id}/history`)
        .set("Authorization", `Bearer ${rafiqToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("FORBIDDEN");
    });
  });
});
