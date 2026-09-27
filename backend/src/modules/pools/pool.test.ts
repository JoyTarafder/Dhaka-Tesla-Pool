import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { Role, RideStatus, PoolStatus, MembershipStatus } from "@prisma/client";
import { app } from "../../app.js";
import { prisma } from "../../db/prisma.js";
import { poolService } from "./pool.service.js";
import { authService } from "../auth/auth.service.js";

describe("Phase 5 — Pooling & Concurrency Protection Tests", () => {
  const jashimDriver = {
    id: "driver-jashim-id",
    name: "Jashim",
    email: "jashim@example.com",
    role: Role.DRIVER,
    passwordHash: "hash",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const bulletVehicle = {
    id: "vehicle-bullet-id",
    driverId: jashimDriver.id,
    name: "Bullet",
    registrationNumber: "DHK-TESLA-001",
    capacity: 3,
    isOnline: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    driver: jashimDriver,
  };

  const nusratPassenger = {
    id: "passenger-nusrat-id",
    name: "Nusrat",
    email: "nusrat@example.com",
    role: Role.PASSENGER,
  };

  const rafiqPassenger = {
    id: "passenger-rafiq-id",
    name: "Rafiq",
    email: "rafiq@example.com",
    role: Role.PASSENGER,
  };

  const shirinPassenger = {
    id: "passenger-shirin-id",
    name: "Shirin",
    email: "shirin@example.com",
    role: Role.PASSENGER,
  };

  const nusratRide = {
    id: "ride-nusrat-id",
    passengerId: nusratPassenger.id,
    pickupZone: "BANANI",
    destinationZone: "MOHAKHALI",
    seatCount: 1,
    estimatedDistanceKm: 4.0,
    fareAmountPoisha: 6240,
    status: RideStatus.REQUESTED,
    passenger: nusratPassenger,
  };

  const rafiqRide = {
    id: "ride-rafiq-id",
    passengerId: rafiqPassenger.id,
    pickupZone: "BANANI",
    destinationZone: "GULSHAN_1",
    seatCount: 1,
    estimatedDistanceKm: 5.0,
    fareAmountPoisha: 7200,
    status: RideStatus.REQUESTED,
    passenger: rafiqPassenger,
  };

  const shirinRide = {
    id: "ride-shirin-id",
    passengerId: shirinPassenger.id,
    pickupZone: "BANANI",
    destinationZone: "GULSHAN_2",
    seatCount: 2, // Requests 2 seats when only 1 is left!
    estimatedDistanceKm: 3.0,
    fareAmountPoisha: 8160,
    status: RideStatus.REQUESTED,
    passenger: shirinPassenger,
  };

  const driverToken = authService.generateToken({
    userId: jashimDriver.id,
    email: jashimDriver.email,
    role: jashimDriver.role,
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Corridor Compatibility & Pool Creation", () => {
    it("should create a new pool container for Nusrat on Bullet when no pool exists", async () => {
      vi.spyOn(prisma.rideRequest, "findUnique").mockResolvedValue(nusratRide as any);

      // Mock transaction execution
      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback: any) => {
        const txMock = {
          pool: {
            findFirst: vi.fn().mockResolvedValue(null), // no existing pool
            create: vi.fn().mockResolvedValue({
              id: "pool-1",
              vehicleId: bulletVehicle.id,
              driverId: jashimDriver.id,
              status: PoolStatus.MATCHING,
              totalCapacity: 3,
              occupiedSeats: 1,
              pickupZone: "BANANI",
              routeCode: "CORRIDOR_BANANI_SOUTH",
            }),
          },
          vehicle: {
            findFirst: vi.fn().mockResolvedValue(bulletVehicle),
          },
          poolMembership: {
            create: vi.fn().mockResolvedValue({ id: "mem-1" }),
          },
          rideRequest: {
            update: vi.fn().mockResolvedValue({ ...nusratRide, status: RideStatus.MATCHED }),
          },
          rideStatusHistory: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      vi.spyOn(poolService, "getPoolById").mockResolvedValue({
        id: "pool-1",
        vehicleId: bulletVehicle.id,
        vehicleName: "Bullet",
        driverId: jashimDriver.id,
        driverName: "Jashim",
        status: PoolStatus.MATCHING,
        totalCapacity: 3,
        occupiedSeats: 1,
        availableSeats: 2,
        pickupZone: "BANANI",
        routeCode: "CORRIDOR_BANANI_SOUTH",
        members: [
          {
            membershipId: "mem-1",
            rideRequestId: nusratRide.id,
            passengerId: nusratPassenger.id,
            passengerName: "Nusrat",
            pickupZone: "BANANI",
            destinationZone: "MOHAKHALI",
            seatsReserved: 1,
            fareAmountPoisha: 6240,
            formattedFare: "৳62.40",
            membershipStatus: MembershipStatus.ACTIVE,
            joinedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const pool = await poolService.matchOrCreatePool(nusratRide.id);

      expect(pool.occupiedSeats).toBe(1);
      expect(pool.availableSeats).toBe(2);
      expect(pool.members[0]?.passengerName).toBe("Nusrat");
      expect(pool.members[0]?.formattedFare).toBe("৳62.40");
    });

    it("should allow Rafiq (Banani -> Gulshan 1) to join Nusrat's pool along the same corridor", async () => {
      vi.spyOn(prisma.rideRequest, "findUnique").mockResolvedValue(rafiqRide as any);

      const existingNusratPool = {
        id: "pool-1",
        vehicleId: bulletVehicle.id,
        driverId: jashimDriver.id,
        status: PoolStatus.MATCHING,
        totalCapacity: 3,
        occupiedSeats: 1, // Nusrat has 1 seat
        pickupZone: "BANANI",
        routeCode: "CORRIDOR_BANANI_SOUTH",
      };

      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback: any) => {
        const txMock = {
          pool: {
            findFirst: vi.fn().mockResolvedValue(existingNusratPool),
            updateMany: vi.fn().mockResolvedValue({ count: 1 }), // Atomic reservation succeeds
          },
          poolMembership: {
            create: vi.fn().mockResolvedValue({ id: "mem-2" }),
          },
          rideRequest: {
            update: vi.fn().mockResolvedValue({ ...rafiqRide, status: RideStatus.MATCHED }),
          },
          rideStatusHistory: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      vi.spyOn(poolService, "getPoolById").mockResolvedValue({
        id: "pool-1",
        vehicleId: bulletVehicle.id,
        vehicleName: "Bullet",
        driverId: jashimDriver.id,
        driverName: "Jashim",
        status: PoolStatus.MATCHING,
        totalCapacity: 3,
        occupiedSeats: 2,
        availableSeats: 1,
        pickupZone: "BANANI",
        routeCode: "CORRIDOR_BANANI_SOUTH",
        members: [
          {
            membershipId: "mem-1",
            rideRequestId: nusratRide.id,
            passengerId: nusratPassenger.id,
            passengerName: "Nusrat",
            pickupZone: "BANANI",
            destinationZone: "MOHAKHALI",
            seatsReserved: 1,
            fareAmountPoisha: 6240,
            formattedFare: "৳62.40",
            membershipStatus: MembershipStatus.ACTIVE,
            joinedAt: new Date(),
          },
          {
            membershipId: "mem-2",
            rideRequestId: rafiqRide.id,
            passengerId: rafiqPassenger.id,
            passengerName: "Rafiq",
            pickupZone: "BANANI",
            destinationZone: "GULSHAN_1",
            seatsReserved: 1,
            fareAmountPoisha: 7200,
            formattedFare: "৳72.00",
            membershipStatus: MembershipStatus.ACTIVE,
            joinedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const pool = await poolService.matchOrCreatePool(rafiqRide.id);

      expect(pool.occupiedSeats).toBe(2);
      expect(pool.availableSeats).toBe(1);
      expect(pool.members.length).toBe(2);
      expect(pool.members[1]?.passengerName).toBe("Rafiq");
      expect(pool.members[1]?.formattedFare).toBe("৳72.00");
    });
  });

  describe("Transactional Capacity & Overbooking Prevention (The Shirin Concurrency Test)", () => {
    it("should reject Shirin with 409 Conflict when requested seats exceed remaining capacity", async () => {
      vi.spyOn(prisma.rideRequest, "findUnique").mockResolvedValue(shirinRide as any);

      const fullPool = {
        id: "pool-1",
        vehicleId: bulletVehicle.id,
        driverId: jashimDriver.id,
        status: PoolStatus.MATCHING,
        totalCapacity: 3,
        occupiedSeats: 2, // Only 1 seat left, Shirin wants 2
        pickupZone: "BANANI",
        routeCode: "CORRIDOR_BANANI_SOUTH",
      };

      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback: any) => {
        const txMock = {
          pool: {
            findFirst: vi.fn().mockResolvedValue(fullPool),
            // Atomic update fails because 2 + 2 > 3 (updateMany returns count: 0)
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
        };
        return callback(txMock);
      });

      await expect(poolService.matchOrCreatePool(shirinRide.id)).rejects.toThrowError(
        "The remaining seats on this vehicle were just booked by another passenger"
      );
    });
  });

  describe("Driver Pool Dashboard Query", () => {
    it("GET /api/driver/pools should return the active pool and assigned passengers for driver Jashim", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(jashimDriver);

      const mockPoolWithMembers = {
        id: "pool-1",
        vehicleId: bulletVehicle.id,
        driverId: jashimDriver.id,
        status: PoolStatus.MATCHING,
        totalCapacity: 3,
        occupiedSeats: 2,
        pickupZone: "BANANI",
        routeCode: "CORRIDOR_BANANI_SOUTH",
        createdAt: new Date(),
        updatedAt: new Date(),
        vehicle: bulletVehicle,
        memberships: [
          {
            id: "mem-1",
            rideRequestId: nusratRide.id,
            seatsReserved: 1,
            fareAmountPoisha: 6240,
            membershipStatus: MembershipStatus.ACTIVE,
            joinedAt: new Date(),
            rideRequest: {
              ...nusratRide,
              passenger: nusratPassenger,
            },
          },
          {
            id: "mem-2",
            rideRequestId: rafiqRide.id,
            seatsReserved: 1,
            fareAmountPoisha: 7200,
            membershipStatus: MembershipStatus.ACTIVE,
            joinedAt: new Date(),
            rideRequest: {
              ...rafiqRide,
              passenger: rafiqPassenger,
            },
          },
        ],
      };

      vi.spyOn(prisma.pool, "findFirst").mockResolvedValue(mockPoolWithMembers as any);

      const response = await request(app)
        .get("/api/driver/pools")
        .set("Authorization", `Bearer ${driverToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pool.occupiedSeats).toBe(2);
      expect(response.body.data.pool.availableSeats).toBe(1);
      expect(response.body.data.pool.members.length).toBe(2);
      expect(response.body.data.pool.members[0].passengerName).toBe("Nusrat");
      expect(response.body.data.pool.members[1].passengerName).toBe("Rafiq");
    });
  });

  describe("Phase 6 — Pool Lifecycle Transitions (PRD.md §5 & Architecture.md §4)", () => {
    const activeMatchingPool = {
      id: "pool-lifecycle-1",
      vehicleId: bulletVehicle.id,
      driverId: jashimDriver.id,
      status: PoolStatus.MATCHING,
      totalCapacity: 3,
      occupiedSeats: 2,
      pickupZone: "BANANI",
      routeCode: "CORRIDOR_BANANI_SOUTH",
      createdAt: new Date(),
      updatedAt: new Date(),
      vehicle: bulletVehicle,
      memberships: [
        {
          id: "mem-1",
          rideRequestId: nusratRide.id,
          seatsReserved: 1,
          fareAmountPoisha: 6240,
          membershipStatus: MembershipStatus.ACTIVE,
          joinedAt: new Date(),
          rideRequest: {
            ...nusratRide,
            status: RideStatus.MATCHED,
            passenger: nusratPassenger,
          },
        },
      ],
    };

    it("POST /api/pools/:id/accept should transition pool and member rides from MATCHED to ACCEPTED", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(jashimDriver);
      vi.spyOn(prisma.pool, "findUnique").mockResolvedValue(activeMatchingPool as any);

      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback: any) => {
        const txMock = {
          pool: { update: vi.fn().mockResolvedValue({ ...activeMatchingPool, status: PoolStatus.ACCEPTED }) },
          rideRequest: { update: vi.fn().mockResolvedValue({ ...nusratRide, status: RideStatus.ACCEPTED }) },
          rideStatusHistory: { create: vi.fn().mockResolvedValue({}) },
        };
        return callback(txMock);
      });

      vi.spyOn(poolService, "getPoolById").mockResolvedValue({
        ...activeMatchingPool,
        vehicleName: "Bullet",
        driverName: "Jashim",
        status: PoolStatus.ACCEPTED,
        availableSeats: 1,
        members: [
          {
            membershipId: "mem-1",
            rideRequestId: nusratRide.id,
            passengerId: nusratPassenger.id,
            passengerName: "Nusrat",
            pickupZone: "BANANI",
            destinationZone: "MOHAKHALI",
            seatsReserved: 1,
            fareAmountPoisha: 6240,
            formattedFare: "৳62.40",
            membershipStatus: MembershipStatus.ACTIVE,
            joinedAt: new Date(),
          },
        ],
      } as any);

      const response = await request(app)
        .post(`/api/pools/${activeMatchingPool.id}/accept`)
        .set("Authorization", `Bearer ${driverToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pool.status).toBe("ACCEPTED");
    });

    it("POST /api/pools/:id/arrive should transition pool from ACCEPTED to DRIVER_ARRIVED", async () => {
      const acceptedPool = {
        ...activeMatchingPool,
        status: PoolStatus.ACCEPTED,
        memberships: [
          {
            ...activeMatchingPool.memberships[0],
            rideRequest: { ...nusratRide, status: RideStatus.ACCEPTED },
          },
        ],
      };

      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(jashimDriver);
      vi.spyOn(prisma.pool, "findUnique").mockResolvedValue(acceptedPool as any);

      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback: any) => {
        const txMock = {
          pool: { update: vi.fn().mockResolvedValue({ ...acceptedPool, status: PoolStatus.DRIVER_ARRIVED }) },
          rideRequest: { update: vi.fn().mockResolvedValue({ ...nusratRide, status: RideStatus.DRIVER_ARRIVED }) },
          rideStatusHistory: { create: vi.fn().mockResolvedValue({}) },
        };
        return callback(txMock);
      });

      vi.spyOn(poolService, "getPoolById").mockResolvedValue({
        ...acceptedPool,
        vehicleName: "Bullet",
        driverName: "Jashim",
        status: PoolStatus.DRIVER_ARRIVED,
        availableSeats: 1,
        members: [],
      } as any);

      const response = await request(app)
        .post(`/api/pools/${activeMatchingPool.id}/arrive`)
        .set("Authorization", `Bearer ${driverToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pool.status).toBe("DRIVER_ARRIVED");
    });

    it("POST /api/pools/:id/start should transition pool to STARTED", async () => {
      const arrivedPool = {
        ...activeMatchingPool,
        status: PoolStatus.DRIVER_ARRIVED,
        memberships: [
          {
            ...activeMatchingPool.memberships[0],
            rideRequest: { ...nusratRide, status: RideStatus.DRIVER_ARRIVED },
          },
        ],
      };

      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(jashimDriver);
      vi.spyOn(prisma.pool, "findUnique").mockResolvedValue(arrivedPool as any);

      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback: any) => {
        const txMock = {
          pool: { update: vi.fn().mockResolvedValue({ ...arrivedPool, status: PoolStatus.STARTED, startedAt: new Date() }) },
          rideRequest: { update: vi.fn().mockResolvedValue({ ...nusratRide, status: RideStatus.STARTED }) },
          rideStatusHistory: { create: vi.fn().mockResolvedValue({}) },
        };
        return callback(txMock);
      });

      vi.spyOn(poolService, "getPoolById").mockResolvedValue({
        ...arrivedPool,
        vehicleName: "Bullet",
        driverName: "Jashim",
        status: PoolStatus.STARTED,
        availableSeats: 1,
        members: [],
      } as any);

      const response = await request(app)
        .post(`/api/pools/${activeMatchingPool.id}/start`)
        .set("Authorization", `Bearer ${driverToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pool.status).toBe("STARTED");
    });

    it("POST /api/pools/:id/complete should transition pool and memberships to COMPLETED", async () => {
      const startedPool = {
        ...activeMatchingPool,
        status: PoolStatus.STARTED,
        memberships: [
          {
            ...activeMatchingPool.memberships[0],
            rideRequest: { ...nusratRide, status: RideStatus.STARTED },
          },
        ],
      };

      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(jashimDriver);
      vi.spyOn(prisma.pool, "findUnique").mockResolvedValue(startedPool as any);

      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback: any) => {
        const txMock = {
          pool: { update: vi.fn().mockResolvedValue({ ...startedPool, status: PoolStatus.COMPLETED, completedAt: new Date() }) },
          rideRequest: { update: vi.fn().mockResolvedValue({ ...nusratRide, status: RideStatus.COMPLETED }) },
          poolMembership: { update: vi.fn().mockResolvedValue({}) },
          rideStatusHistory: { create: vi.fn().mockResolvedValue({}) },
        };
        return callback(txMock);
      });

      vi.spyOn(poolService, "getPoolById").mockResolvedValue({
        ...startedPool,
        vehicleName: "Bullet",
        driverName: "Jashim",
        status: PoolStatus.COMPLETED,
        availableSeats: 1,
        members: [],
      } as any);

      const response = await request(app)
        .post(`/api/pools/${activeMatchingPool.id}/complete`)
        .set("Authorization", `Bearer ${driverToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pool.status).toBe("COMPLETED");
    });

    it("should reject lifecycle transition if attempted by an unauthorized driver (Rule 16 & 17)", async () => {
      const otherDriverToken = authService.generateToken({
        userId: "different-driver-id",
        email: "other@example.com",
        role: Role.DRIVER,
      });

      vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
        id: "different-driver-id",
        email: "other@example.com",
        role: Role.DRIVER,
      } as any);
      vi.spyOn(prisma.pool, "findUnique").mockResolvedValue(activeMatchingPool as any);

      const response = await request(app)
        .post(`/api/pools/${activeMatchingPool.id}/accept`)
        .set("Authorization", `Bearer ${otherDriverToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("FORBIDDEN");
    });

    it("should reject invalid status jump per Rule 10 transition rules (e.g. MATCHING to STARTED)", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(jashimDriver);
      vi.spyOn(prisma.pool, "findUnique").mockResolvedValue(activeMatchingPool as any);

      // Attempting to start trip directly when pool is in MATCHING state
      const response = await request(app)
        .post(`/api/pools/${activeMatchingPool.id}/start`)
        .set("Authorization", `Bearer ${driverToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("INVALID_STATUS_TRANSITION");
    });
  });
});
