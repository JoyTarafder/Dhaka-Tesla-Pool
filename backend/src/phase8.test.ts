import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { Role, RideStatus, PoolStatus, MembershipStatus } from "@prisma/client";
import { app } from "./app.js";
import { prisma } from "./db/prisma.js";
import { authService } from "./modules/auth/auth.service.js";
import { fareService } from "./modules/fares/fare.service.js";
import { poolService } from "./modules/pools/pool.service.js";
import { validateRideTransition, validatePoolTransition } from "./shared/utils/transitions.js";

/**
 * Phase 8 — Consolidated Test Suite for Dhaka Tesla Pool MVP
 * 
 * Verifies the 6 key risk areas defined in Phase.md §Phase 8 and security.md §8:
 * 1. Fare calculation (Integer poisha arithmetic, exact reference fares)
 * 2. Status transition validity (Central state machine enforcement)
 * 3. Capacity enforcement (Database transaction level constraint: <= 3 seats)
 * 4. Ownership & authorization (Cross-user security, RBAC, password leakage prevention)
 * 5. Cancellation rules (State locks, atomic seat rollback, idempotency)
 * 6. Concurrency (Simultaneous race conditions, the Shirin last-seat test)
 */

describe("Phase 8 — Core Engine & Security Verification Suite", () => {
  // Cast entities per PRD.md §3 and Memory.md §2
  const jashimDriver = {
    id: "driver-jashim-uuid",
    name: "Jashim",
    email: "jashim@example.com",
    role: Role.DRIVER,
    passwordHash: "$2b$10$encryptedpasswordhashforjashimdriver",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const otherDriver = {
    id: "driver-kabir-uuid",
    name: "Kabir",
    email: "kabir@example.com",
    role: Role.DRIVER,
    passwordHash: "$2b$10$encryptedpasswordhashforkabirdriver",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const bulletVehicle = {
    id: "vehicle-bullet-uuid",
    driverId: jashimDriver.id,
    name: "Bullet",
    registrationNumber: "DHK-TESLA-001",
    capacity: 3, // Bullet's fixed 3-seat capacity
    isOnline: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    driver: jashimDriver,
  };

  const nusratPassenger = {
    id: "passenger-nusrat-uuid",
    name: "Nusrat",
    email: "nusrat@example.com",
    role: Role.PASSENGER,
    passwordHash: "$2b$10$encryptedpasswordhashfornusrat",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const rafiqPassenger = {
    id: "passenger-rafiq-uuid",
    name: "Rafiq",
    email: "rafiq@example.com",
    role: Role.PASSENGER,
    passwordHash: "$2b$10$encryptedpasswordhashforrafiq",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const shirinPassenger = {
    id: "passenger-shirin-uuid",
    name: "Shirin",
    email: "shirin@example.com",
    role: Role.PASSENGER,
    passwordHash: "$2b$10$encryptedpasswordhashforshirin",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const nusratToken = authService.generateToken({
    userId: nusratPassenger.id,
    email: nusratPassenger.email,
    role: nusratPassenger.role,
  });

  const rafiqToken = authService.generateToken({
    userId: rafiqPassenger.id,
    email: rafiqPassenger.email,
    role: rafiqPassenger.role,
  });

  const jashimToken = authService.generateToken({
    userId: jashimDriver.id,
    email: jashimDriver.email,
    role: jashimDriver.role,
  });

  const otherDriverToken = authService.generateToken({
    userId: otherDriver.id,
    email: otherDriver.email,
    role: otherDriver.role,
  });

  const nusratRide = {
    id: "ride-nusrat-uuid",
    passengerId: nusratPassenger.id,
    pickupZone: "BANANI",
    destinationZone: "MOHAKHALI",
    seatCount: 1,
    estimatedDistanceKm: 4.0,
    fareAmountPoisha: 6200, // ৳62
    status: RideStatus.REQUESTED,
    createdAt: new Date(),
    updatedAt: new Date(),
    cancelledAt: null,
    passenger: nusratPassenger,
  };

  const rafiqRide = {
    id: "ride-rafiq-uuid",
    passengerId: rafiqPassenger.id,
    pickupZone: "BANANI",
    destinationZone: "GULSHAN_1",
    seatCount: 1,
    estimatedDistanceKm: 5.0,
    fareAmountPoisha: 7200, // ৳72
    status: RideStatus.REQUESTED,
    createdAt: new Date(),
    updatedAt: new Date(),
    cancelledAt: null,
    passenger: rafiqPassenger,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. FARE CALCULATION TESTS (PRD.md §7, Rule 13)
  // =========================================================================
  describe("1. Fare Calculation & Integer Poisha Arithmetic", () => {
    it("should calculate exact reference fare for Nusrat (Banani -> Mohakhali, 4.0km, 1 seat, pooled)", () => {
      const fare = fareService.calculateFare("BANANI", "MOHAKHALI", 1, true);

      // Verify strict integer arithmetic (Rule 13)
      expect(Number.isInteger(fare.baseFarePoisha)).toBe(true);
      expect(Number.isInteger(fare.distanceChargePoisha)).toBe(true);
      expect(Number.isInteger(fare.grossFarePoisha)).toBe(true);
      expect(Number.isInteger(fare.discountPoisha)).toBe(true);
      expect(Number.isInteger(fare.finalFarePoisha)).toBe(true);

      // Verify PRD reference values
      expect(fare.distanceKm).toBe(4.0);
      expect(fare.baseFarePoisha).toBe(3000); // ৳30.00 base fare
      expect(fare.distanceChargePoisha).toBe(4800); // 4km * ৳12 = ৳48.00
      expect(fare.grossFarePoisha).toBe(7800); // ৳30 + ৳48 = ৳78.00
      expect(fare.discountPoisha).toBe(1560); // 20% discount = ৳15.60
      expect(fare.finalFarePoisha).toBe(6200); // ৳62 (rounded down from 62.40 per whole-number policy)
      expect(fare.formattedBdt.finalFare).toBe("৳62");
    });

    it("should calculate exact reference fare for Rafiq (Banani -> Gulshan 1, 5.0km, 1 seat, pooled)", () => {
      const fare = fareService.calculateFare("BANANI", "GULSHAN_1", 1, true);

      expect(fare.distanceKm).toBe(5.0);
      expect(fare.baseFarePoisha).toBe(3000); // ৳30.00 base fare
      expect(fare.distanceChargePoisha).toBe(6000); // 5km * ৳12 = ৳60.00
      expect(fare.grossFarePoisha).toBe(9000); // ৳30 + ৳60 = ৳90.00
      expect(fare.discountPoisha).toBe(1800); // 20% discount = ৳18.00
      expect(fare.finalFarePoisha).toBe(7200); // ৳72
      expect(fare.formattedBdt.finalFare).toBe("৳72");
    });

    it("should calculate correct gross fare without pooling discount for unpooled rides", () => {
      const soloFare = fareService.calculateFare("BANANI", "MOHAKHALI", 1, false);
      expect(soloFare.discountPoisha).toBe(0);
      expect(soloFare.finalFarePoisha).toBe(7800); // ৳78
      expect(soloFare.formattedBdt.finalFare).toBe("৳78");
    });

    it("should scale distance charge proportionally for multi-seat requests", () => {
      // 2 seats for Banani -> Mohakhali
      const twoSeatFare = fareService.calculateFare("BANANI", "MOHAKHALI", 2, true);
      expect(twoSeatFare.baseFarePoisha).toBe(6000); // 3000 * 2
      expect(twoSeatFare.distanceChargePoisha).toBe(9600); // 4800 * 2
      expect(twoSeatFare.grossFarePoisha).toBe(15600);
      expect(twoSeatFare.discountPoisha).toBe(3120); // 20% of 15600
      // Unrounded: 15600 - 3120 = 12480 (124.80). Since .80 >= .51, rounds up to 12500 (৳125)
      expect(twoSeatFare.finalFarePoisha).toBe(12500); // ৳125
      expect(twoSeatFare.formattedBdt.finalFare).toBe("৳125");
    });


    it("should reject invalid zone requests (same origin/dest or invalid seat counts)", () => {
      expect(() => fareService.calculateFare("BANANI", "BANANI", 1, true)).toThrowError(
        "Pickup zone and destination zone cannot be the same"
      );
      expect(() => fareService.calculateFare("BANANI", "MOHAKHALI", 0, true)).toThrowError(
        "Requested seats must be between 1 and 3"
      );
      expect(() => fareService.calculateFare("BANANI", "MOHAKHALI", 4, true)).toThrowError(
        "Requested seats must be between 1 and 3"
      );
    });
  });

  // =========================================================================
  // 2. STATUS TRANSITION VALIDITY TESTS (PRD.md §5, Rule 10)
  // =========================================================================
  describe("2. Status Transition Validity (Central State Machine)", () => {
    it("should permit the full happy-path lifecycle progression for ride requests", () => {
      // Full progression: REQUESTED -> MATCHED -> ACCEPTED -> DRIVER_ARRIVED -> STARTED -> COMPLETED
      expect(() => validateRideTransition(RideStatus.REQUESTED, RideStatus.MATCHED)).not.toThrow();
      expect(() => validateRideTransition(RideStatus.MATCHED, RideStatus.ACCEPTED)).not.toThrow();
      expect(() => validateRideTransition(RideStatus.ACCEPTED, RideStatus.DRIVER_ARRIVED)).not.toThrow();
      expect(() => validateRideTransition(RideStatus.DRIVER_ARRIVED, RideStatus.STARTED)).not.toThrow();
      expect(() => validateRideTransition(RideStatus.STARTED, RideStatus.COMPLETED)).not.toThrow();
    });

    it("should permit cancellation from valid pre-trip ride states", () => {
      expect(() => validateRideTransition(RideStatus.REQUESTED, RideStatus.CANCELLED)).not.toThrow();
      expect(() => validateRideTransition(RideStatus.MATCHED, RideStatus.CANCELLED)).not.toThrow();
      expect(() => validateRideTransition(RideStatus.ACCEPTED, RideStatus.CANCELLED)).not.toThrow();
      expect(() => validateRideTransition(RideStatus.DRIVER_ARRIVED, RideStatus.CANCELLED)).not.toThrow();
    });

    it("should strictly forbid passenger cancellation once ride has STARTED (Rule 10 & PRD.md §5)", () => {
      expect(() => validateRideTransition(RideStatus.STARTED, RideStatus.CANCELLED)).toThrowError(
        "Invalid ride status transition from STARTED to CANCELLED"
      );
    });

    it("should strictly forbid illegal status skip transitions", () => {
      expect(() => validateRideTransition(RideStatus.REQUESTED, RideStatus.STARTED)).toThrowError(
        "Invalid ride status transition from REQUESTED to STARTED"
      );
      expect(() => validateRideTransition(RideStatus.REQUESTED, RideStatus.COMPLETED)).toThrowError(
        "Invalid ride status transition from REQUESTED to COMPLETED"
      );
      expect(() => validateRideTransition(RideStatus.MATCHED, RideStatus.STARTED)).toThrowError(
        "Invalid ride status transition from MATCHED to STARTED"
      );
      expect(() => validateRideTransition(RideStatus.ACCEPTED, RideStatus.COMPLETED)).toThrowError(
        "Invalid ride status transition from ACCEPTED to COMPLETED"
      );
    });

    it("should strictly forbid transitions out of terminal states (COMPLETED, CANCELLED)", () => {
      expect(() => validateRideTransition(RideStatus.COMPLETED, RideStatus.CANCELLED)).toThrowError();
      expect(() => validateRideTransition(RideStatus.COMPLETED, RideStatus.STARTED)).toThrowError();
      expect(() => validateRideTransition(RideStatus.CANCELLED, RideStatus.ACCEPTED)).toThrowError();
      expect(() => validateRideTransition(RideStatus.CANCELLED, RideStatus.MATCHED)).toThrowError();
    });

    it("should enforce pool status transitions correctly", () => {
      expect(() => validatePoolTransition(PoolStatus.MATCHING, PoolStatus.ACCEPTED)).not.toThrow();
      expect(() => validatePoolTransition(PoolStatus.ACCEPTED, PoolStatus.DRIVER_ARRIVED)).not.toThrow();
      expect(() => validatePoolTransition(PoolStatus.DRIVER_ARRIVED, PoolStatus.STARTED)).not.toThrow();
      expect(() => validatePoolTransition(PoolStatus.STARTED, PoolStatus.COMPLETED)).not.toThrow();

      // Illegal pool jump
      expect(() => validatePoolTransition(PoolStatus.MATCHING, PoolStatus.STARTED)).toThrowError(
        "Invalid pool status transition from MATCHING to STARTED"
      );
    });
  });

  // =========================================================================
  // 3. CAPACITY ENFORCEMENT TESTS (Architecture.md §8, Rule 1)
  // =========================================================================
  describe("3. Capacity Enforcement & Vehicle Limits", () => {
    it("should safely allocate seats when within Bullet's 3-seat limit", async () => {
      vi.spyOn(prisma.rideRequest, "findUnique").mockResolvedValue(nusratRide as any);

      // Bullet currently has 1 occupied seat (Nusrat), Rafiq requests 1 seat
      const currentPool = {
        id: "pool-cap-1",
        vehicleId: bulletVehicle.id,
        driverId: jashimDriver.id,
        status: PoolStatus.MATCHING,
        totalCapacity: 3,
        occupiedSeats: 1,
        pickupZone: "BANANI",
        routeCode: "CORRIDOR_BANANI_SOUTH",
      };

      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback) => {
        const txMock = {
          pool: {
            findFirst: vi.fn().mockResolvedValue(currentPool),
            updateMany: vi.fn().mockResolvedValue({ count: 1 }), // Atomic condition met (1 + 1 <= 3)
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
        id: "pool-cap-1",
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
        members: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const pool = await poolService.matchOrCreatePool(rafiqRide.id);
      expect(pool.occupiedSeats).toBe(2);
      expect(pool.availableSeats).toBe(1);
    });

    it("should reject booking when request would breach total capacity (2 occupied + 2 requested > 3)", async () => {
      const shirinRideOverCapacity = {
        id: "ride-shirin-overcap",
        passengerId: shirinPassenger.id,
        pickupZone: "BANANI",
        destinationZone: "GULSHAN_2",
        seatCount: 2,
        status: RideStatus.REQUESTED,
      };

      vi.spyOn(prisma.rideRequest, "findUnique").mockResolvedValue(shirinRideOverCapacity as any);

      const nearlyFullPool = {
        id: "pool-cap-2",
        vehicleId: bulletVehicle.id,
        driverId: jashimDriver.id,
        status: PoolStatus.MATCHING,
        totalCapacity: 3,
        occupiedSeats: 2, // Only 1 seat remains!
        pickupZone: "BANANI",
        routeCode: "CORRIDOR_BANANI_SOUTH",
      };

      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback) => {
        const txMock = {
          pool: {
            findFirst: vi.fn().mockResolvedValue(nearlyFullPool),
            // Atomic update fails because 2 + 2 > 3
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
        };
        return callback(txMock);
      });

      await expect(poolService.matchOrCreatePool(shirinRideOverCapacity.id)).rejects.toThrowError(
        "The remaining seats on this vehicle were just booked by another passenger"
      );
    });
  });

  // =========================================================================
  // 4. OWNERSHIP & AUTHORIZATION TESTS (security.md §2 & §8)
  // =========================================================================
  describe("4. Ownership & Authorization Security Checks", () => {
    it("should return 403 Forbidden when Nusrat attempts to view Rafiq's ride request", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(nusratPassenger);
      vi.spyOn(prisma.rideRequest, "findUnique").mockResolvedValue(rafiqRide as any);

      const response = await request(app)
        .get(`/api/ride-requests/${rafiqRide.id}`)
        .set("Authorization", `Bearer ${nusratToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("FORBIDDEN");
    });

    it("should return 403 Forbidden when Nusrat attempts to cancel Rafiq's ride request", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(nusratPassenger);
      vi.spyOn(prisma.rideRequest, "findUnique").mockResolvedValue(rafiqRide as any);

      const response = await request(app)
        .post(`/api/ride-requests/${rafiqRide.id}/cancel`)
        .set("Authorization", `Bearer ${nusratToken}`)
        .send({ reason: "Unauthorized attempt" });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("FORBIDDEN");
    });

    it("should return 403 Forbidden when Rafiq attempts to view Nusrat's status history audit trail", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(rafiqPassenger);
      vi.spyOn(prisma.rideRequest, "findUnique").mockResolvedValue(nusratRide as any);

      const response = await request(app)
        .get(`/api/ride-requests/${nusratRide.id}/history`)
        .set("Authorization", `Bearer ${rafiqToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("FORBIDDEN");
    });

    it("should return 403 Forbidden when an unauthorized driver attempts to accept another driver's pool", async () => {
      const activePool = {
        id: "pool-jashim-1",
        vehicleId: bulletVehicle.id,
        driverId: jashimDriver.id, // Assigned to Jashim
        status: PoolStatus.MATCHING,
        totalCapacity: 3,
        occupiedSeats: 1,
        pickupZone: "BANANI",
        routeCode: "CORRIDOR_BANANI_SOUTH",
        memberships: [],
      };

      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(otherDriver);
      vi.spyOn(prisma.pool, "findUnique").mockResolvedValue(activePool as any);

      const response = await request(app)
        .post(`/api/pools/${activePool.id}/accept`)
        .set("Authorization", `Bearer ${otherDriverToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("FORBIDDEN");
    });

    it("should return 403 Forbidden when a passenger attempts to call driver endpoints", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(nusratPassenger);

      const response = await request(app)
        .get("/api/driver/pools")
        .set("Authorization", `Bearer ${nusratToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("FORBIDDEN");
    });

    it("should return 401 Unauthorized when an unauthenticated request hits protected routes", async () => {
      const response = await request(app).get("/api/ride-requests/me");
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("UNAUTHORIZED");
    });

    it("should never expose password hashes in API responses (security.md §1)", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(nusratPassenger);

      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${nusratToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user.passwordHash).toBeUndefined();
      expect(response.body.data.user.password).toBeUndefined();
    });
  });

  // =========================================================================
  // 5. CANCELLATION RULES & SEAT ROLLBACK TESTS (PRD.md §5, security.md §5)
  // =========================================================================
  describe("5. Cancellation Rules & Atomic Seat Rollback", () => {
    it("should allow Nusrat to cancel ride in REQUESTED state and record audit history", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(nusratPassenger);
      vi.spyOn(prisma.rideRequest, "findUnique").mockResolvedValue(nusratRide as any);

      let historyCreated = false;
      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback) => {
        const txMock = {
          rideRequest: {
            update: vi.fn().mockResolvedValue({
              ...nusratRide,
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
            create: vi.fn().mockImplementation(() => {
              historyCreated = true;
              return Promise.resolve({});
            }),
          },
        };
        return callback(txMock);
      });

      const response = await request(app)
        .post(`/api/ride-requests/${nusratRide.id}/cancel`)
        .set("Authorization", `Bearer ${nusratToken}`)
        .send({ reason: "Plans changed" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.ride.status).toBe("CANCELLED");
      expect(historyCreated).toBe(true);
    });

    it("should atomically release pool seats when a pooled ride is cancelled", async () => {
      const activeMatchedRide = {
        ...nusratRide,
        status: RideStatus.MATCHED,
        membership: {
          id: "mem-nusrat",
          poolId: "pool-active-1",
          seatsReserved: 1,
          membershipStatus: MembershipStatus.ACTIVE,
        },
      };


      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(nusratPassenger);
      vi.spyOn(prisma.rideRequest, "findUnique").mockResolvedValue(activeMatchedRide as any);

      let decrementedSeats = 0;
      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback) => {
        const txMock = {
          rideRequest: {
            update: vi.fn().mockResolvedValue({ ...activeMatchedRide, status: RideStatus.CANCELLED }),
          },
          poolMembership: {
            update: vi.fn().mockResolvedValue({}),
            count: vi.fn().mockResolvedValue(1), // other member still active
          },
          pool: {
            update: vi.fn().mockImplementation((args: { data: { occupiedSeats: { decrement: number } } }) => {
              decrementedSeats = args.data.occupiedSeats.decrement;
              return Promise.resolve({});
            }),
            findUnique: vi.fn().mockResolvedValue(null),
          },
          rideStatusHistory: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      const response = await request(app)
        .post(`/api/ride-requests/${nusratRide.id}/cancel`)
        .set("Authorization", `Bearer ${nusratToken}`);

      expect(response.status).toBe(200);
      expect(decrementedSeats).toBe(1); // 1 seat released back to Bullet!
    });

    it("should prevent double-cancellation (idempotency safety)", async () => {
      const cancelledRide = {
        ...nusratRide,
        status: RideStatus.CANCELLED,
      };

      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(nusratPassenger);
      vi.spyOn(prisma.rideRequest, "findUnique").mockResolvedValue(cancelledRide as any);

      const response = await request(app)
        .post(`/api/ride-requests/${nusratRide.id}/cancel`)
        .set("Authorization", `Bearer ${nusratToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("INVALID_STATUS_TRANSITION");
    });
  });

  // =========================================================================
  // 6. CONCURRENCY & RACE CONDITIONS (The Shirin Last-Seat Test)
  // =========================================================================
  describe("6. Concurrency Protection & The Shirin Last-Seat Race", () => {
    it("should safely handle concurrent booking attempts for the final available seat", async () => {
      // Vehicle has capacity 3.
      // Already occupied: 2 seats (Nusrat has 1, Rafiq has 1).
      // Exactly 1 seat remaining.
      const poolWithOneSeatLeft = {
        id: "pool-concurrency-1",
        vehicleId: bulletVehicle.id,
        driverId: jashimDriver.id,
        status: PoolStatus.MATCHING,
        totalCapacity: 3,
        occupiedSeats: 2,
        pickupZone: "BANANI",
        routeCode: "CORRIDOR_BANANI_SOUTH",
      };

      let atomicExecCount = 0;

      // Mock database atomic conditional execution:
      // The first call succeeds (count: 1); the second simultaneous call fails (count: 0)
      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback) => {
        const txMock = {
          pool: {
            findFirst: vi.fn().mockResolvedValue(poolWithOneSeatLeft),
            updateMany: vi.fn().mockImplementation(() => {
              atomicExecCount++;
              if (atomicExecCount === 1) {
                return Promise.resolve({ count: 1 }); // Winner claims the 3rd seat
              } else {
                return Promise.resolve({ count: 0 }); // Loser rejected because 2 + 1 > 2 remaining
              }
            }),
          },
          poolMembership: {
            create: vi.fn().mockResolvedValue({ id: "mem-concurrency" }),
          },
          rideRequest: {
            update: vi.fn().mockResolvedValue({ id: "ride-matched", status: RideStatus.MATCHED }),
          },
          rideStatusHistory: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      vi.spyOn(prisma.rideRequest, "findUnique")
        .mockResolvedValueOnce({
          id: "ride-racer-1",
          passengerId: shirinPassenger.id,
          seatCount: 1,
          pickupZone: "BANANI",
          destinationZone: "GULSHAN_2",
          status: RideStatus.REQUESTED,
        } as any)
        .mockResolvedValueOnce({
          id: "ride-racer-2",
          passengerId: "passenger-other-id",
          seatCount: 1,
          pickupZone: "BANANI",
          destinationZone: "MOHAKHALI",
          status: RideStatus.REQUESTED,
        } as any);

      vi.spyOn(poolService, "getPoolById").mockResolvedValue({
        id: "pool-concurrency-1",
        vehicleId: bulletVehicle.id,
        vehicleName: "Bullet",
        driverId: jashimDriver.id,
        driverName: "Jashim",
        status: PoolStatus.MATCHING,
        totalCapacity: 3,
        occupiedSeats: 3,
        availableSeats: 0,
        pickupZone: "BANANI",
        routeCode: "CORRIDOR_BANANI_SOUTH",
        members: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Fire both booking requests concurrently via Promise.all
      const results = await Promise.allSettled([
        poolService.matchOrCreatePool("ride-racer-1"),
        poolService.matchOrCreatePool("ride-racer-2"),
      ]);

      // Exactly ONE request must succeed and ONE must be rejected with conflict
      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");

      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);

      const rejectionReason = (rejected[0] as PromiseRejectedResult).reason;
      expect(rejectionReason.message).toContain("The remaining seats on this vehicle were just booked");
      expect(rejectionReason.statusCode).toBe(409);
    });
  });
});
