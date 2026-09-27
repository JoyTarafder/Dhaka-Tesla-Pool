import { PoolStatus, RideStatus, MembershipStatus } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import { validateRideTransition, validatePoolTransition } from "../../shared/utils/transitions.js";
import { fareService } from "../fares/fare.service.js";
import { findMatchingCorridor } from "./pool.corridors.js";
import { PoolResponse, PoolMemberResponse, DriverPaymentHistoryResponse } from "./pool.types.js";

export class PoolService {
  // Format pool database record into structured API response
  // Rule 12 exception: pool is a Prisma result with deep nested includes (vehicle, memberships,
  // passenger). Prisma does not export a named type for this query shape; `any` is unavoidable here.
  public formatPool(pool: any): PoolResponse {
    // Rule 12 exception: same reasoning — m is a single membership row with nested relations.
    const members: PoolMemberResponse[] = (pool.memberships || []).map((m: any) => ({
      membershipId: m.id,
      rideRequestId: m.rideRequestId,
      passengerId: m.rideRequest?.passengerId || "",
      passengerName: m.rideRequest?.passenger?.name || "Passenger",
      pickupZone: m.rideRequest?.pickupZone || "",
      destinationZone: m.rideRequest?.destinationZone || "",
      seatsReserved: m.seatsReserved,
      fareAmountPoisha: m.fareAmountPoisha,
      formattedFare: fareService.formatPoisha(m.fareAmountPoisha),
      membershipStatus: m.membershipStatus,
      joinedAt: m.joinedAt,
    }));

    return {
      id: pool.id,
      vehicleId: pool.vehicleId,
      vehicleName: pool.vehicle?.name || "Bullet",
      driverId: pool.driverId,
      driverName: pool.vehicle?.driver?.name || "Driver",
      status: pool.status,
      totalCapacity: pool.totalCapacity,
      occupiedSeats: pool.occupiedSeats,
      availableSeats: pool.totalCapacity - pool.occupiedSeats,
      pickupZone: pool.pickupZone,
      routeCode: pool.routeCode,
      members,
      createdAt: pool.createdAt,
      updatedAt: pool.updatedAt,
    };
  }

  // Transactional capacity-safe ride matching logic (Architecture.md §8 & PRD.md §6)
  public async matchOrCreatePool(rideRequestId: string): Promise<PoolResponse> {
    const ride = await prisma.rideRequest.findUnique({
      where: { id: rideRequestId },
      include: { passenger: true },
    });

    if (!ride) {
      throw new AppError("Ride request not found", 404, "RIDE_NOT_FOUND");
    }

    if (ride.status !== RideStatus.REQUESTED) {
      throw new AppError(
        `Ride request is in ${ride.status} status and cannot be matched`,
        400,
        "INVALID_RIDE_STATUS"
      );
    }

    // Determine compatible corridor
    const corridor = findMatchingCorridor(ride.pickupZone, ride.destinationZone);
    const routeCode = corridor ? corridor.code : `${ride.pickupZone}_TO_${ride.destinationZone}`;

    // Execute atomic matching transaction ensuring sum(seats) <= capacity
    const matchedPoolId = await prisma.$transaction(async (tx) => {
      // 1. Look for existing pool accepting passengers along this corridor
      const existingCandidate = await tx.pool.findFirst({
        where: {
          pickupZone: ride.pickupZone,
          routeCode,
          status: PoolStatus.MATCHING,
        },
        orderBy: { createdAt: "asc" },
      });

      if (existingCandidate) {
        // Atomic conditional update (Architecture.md §8 Solution B):
        // Increments occupied_seats ONLY if occupied_seats + requestedSeats <= total_capacity
        const updateResult = await tx.pool.updateMany({
          where: {
            id: existingCandidate.id,
            status: PoolStatus.MATCHING,
            occupiedSeats: {
              lte: existingCandidate.totalCapacity - ride.seatCount,
            },
          },
          data: {
            occupiedSeats: {
              increment: ride.seatCount,
            },
          },
        });

        // If count === 0, another concurrent transaction claimed the last seat (Shirin race condition)
        if (updateResult.count === 0) {
          throw new AppError(
            "The remaining seats on this vehicle were just booked by another passenger",
            409,
            "POOL_CAPACITY_EXCEEDED"
          );
        }

        // Create pool membership
        await tx.poolMembership.create({
          data: {
            poolId: existingCandidate.id,
            rideRequestId: ride.id,
            seatsReserved: ride.seatCount,
            fareAmountPoisha: ride.fareAmountPoisha,
            membershipStatus: MembershipStatus.ACTIVE,
          },
        });

        // Validate and transition ride status (Rule 10)
        validateRideTransition(ride.status, RideStatus.MATCHED);

        await tx.rideRequest.update({
          where: { id: ride.id },
          data: { status: RideStatus.MATCHED },
        });

        // Log audit history
        await tx.rideStatusHistory.create({
          data: {
            rideRequestId: ride.id,
            poolId: existingCandidate.id,
            fromStatus: ride.status,
            toStatus: RideStatus.MATCHED,
            changedByUserId: ride.passengerId,
            reason: `Matched into existing pool ${existingCandidate.id}`,
          },
        });

        return existingCandidate.id;
      }

      // 2. No matching pool exists; find an online vehicle ready for assignment
      const onlineVehicle = await tx.vehicle.findFirst({
        where: {
          isOnline: true,
          pools: {
            none: {
              status: {
                in: [
                  PoolStatus.MATCHING,
                  PoolStatus.ACCEPTED,
                  PoolStatus.DRIVER_ARRIVED,
                  PoolStatus.STARTED,
                ],
              },
            },
          },
        },
        include: { driver: true },
      });

      if (!onlineVehicle) {
        throw new AppError(
          "No available online vehicles currently in this area. Please retry shortly.",
          503,
          "NO_VEHICLE_AVAILABLE"
        );
      }

      if (ride.seatCount > onlineVehicle.capacity) {
        throw new AppError(
          `Requested ${ride.seatCount} seats, which exceeds vehicle capacity of ${onlineVehicle.capacity}`,
          400,
          "CAPACITY_EXCEEDS_VEHICLE"
        );
      }

      // Create new pool container
      const newPool = await tx.pool.create({
        data: {
          vehicleId: onlineVehicle.id,
          driverId: onlineVehicle.driverId,
          status: PoolStatus.MATCHING,
          totalCapacity: onlineVehicle.capacity,
          occupiedSeats: ride.seatCount,
          pickupZone: ride.pickupZone,
          routeCode,
        },
      });

      // Create pool membership
      await tx.poolMembership.create({
        data: {
          poolId: newPool.id,
          rideRequestId: ride.id,
          seatsReserved: ride.seatCount,
          fareAmountPoisha: ride.fareAmountPoisha,
          membershipStatus: MembershipStatus.ACTIVE,
        },
      });

      // Transition ride status
      validateRideTransition(ride.status, RideStatus.MATCHED);

      await tx.rideRequest.update({
        where: { id: ride.id },
        data: { status: RideStatus.MATCHED },
      });

      await tx.rideStatusHistory.create({
        data: {
          rideRequestId: ride.id,
          poolId: newPool.id,
          fromStatus: ride.status,
          toStatus: RideStatus.MATCHED,
          changedByUserId: ride.passengerId,
          reason: `Created new pool container for vehicle ${onlineVehicle.name}`,
        },
      });

      return newPool.id;
    });

    return this.getPoolById(matchedPoolId);
  }

  // Retrieve single pool with complete vehicle and member details
  public async getPoolById(poolId: string): Promise<PoolResponse> {
    const pool = await prisma.pool.findUnique({
      where: { id: poolId },
      include: {
        vehicle: {
          include: { driver: true },
        },
        memberships: {
          include: {
            rideRequest: {
              include: { passenger: true },
            },
          },
        },
      },
    });

    if (!pool) {
      throw new AppError("Pool not found", 404, "POOL_NOT_FOUND");
    }

    return this.formatPool(pool);
  }

  // Retrieve currently active pool assigned to driver
  public async getDriverActivePool(driverId: string): Promise<PoolResponse | null> {
    const pool = await prisma.pool.findFirst({
      where: {
        driverId,
        status: {
          in: [
            PoolStatus.MATCHING,
            PoolStatus.ACCEPTED,
            PoolStatus.DRIVER_ARRIVED,
            PoolStatus.STARTED,
          ],
        },
      },
      include: {
        vehicle: {
          include: { driver: true },
        },
        memberships: {
          include: {
            rideRequest: {
              include: { passenger: true },
            },
          },
        },
      },
    });

    if (!pool) {
      return null;
    }

    return this.formatPool(pool);
  }

  // Execute driver-driven pool lifecycle transitions with cascade to ride requests (PRD.md §5 & Architecture.md §4)
  public async transitionPoolLifecycle(
    driverId: string,
    poolId: string,
    targetStatus: PoolStatus,
    userRole: string = "DRIVER"
  ): Promise<PoolResponse> {
    const pool = await prisma.pool.findUnique({
      where: { id: poolId },
      include: {
        vehicle: true,
        memberships: {
          where: { membershipStatus: MembershipStatus.ACTIVE },
          include: {
            rideRequest: {
              include: { passenger: true },
            },
          },
        },
      },
    });

    if (!pool) {
      throw new AppError("Pool not found", 404, "POOL_NOT_FOUND");
    }

    // Authorization: only the assigned driver or an admin may transition this pool
    if (pool.driverId !== driverId && userRole !== "ADMIN") {
      throw new AppError(
        "Forbidden: You are not the assigned driver for this vehicle pool",
        403,
        "FORBIDDEN"
      );
    }

    // Central validation for pool transition (Rule 10)
    validatePoolTransition(pool.status, targetStatus);

    // Map target pool status to corresponding ride request target status
    const rideTargetStatusMap: Partial<Record<PoolStatus, RideStatus>> = {
      [PoolStatus.ACCEPTED]: RideStatus.ACCEPTED,
      [PoolStatus.DRIVER_ARRIVED]: RideStatus.DRIVER_ARRIVED,
      [PoolStatus.STARTED]: RideStatus.STARTED,
      [PoolStatus.COMPLETED]: RideStatus.COMPLETED,
    };

    const targetRideStatus = rideTargetStatusMap[targetStatus];
    if (!targetRideStatus) {
      throw new AppError(
        `Unsupported pool lifecycle target status: ${targetStatus}`,
        400,
        "INVALID_TARGET_STATUS"
      );
    }

    // Validate that each active member's ride request can legally transition (Rule 10)
    for (const member of pool.memberships) {
      validateRideTransition(member.rideRequest.status, targetRideStatus);
    }

    // Execute atomic update across pool, member requests, and audit logs
    await prisma.$transaction(async (tx) => {
      const now = new Date();

      // 1. Update pool status and timestamps
      await tx.pool.update({
        where: { id: pool.id },
        data: {
          status: targetStatus,
          ...(targetStatus === PoolStatus.STARTED ? { startedAt: now } : {}),
          ...(targetStatus === PoolStatus.COMPLETED ? { completedAt: now } : {}),
        },
      });

      // 2. Cascade status updates to each active ride request
      for (const member of pool.memberships) {
        await tx.rideRequest.update({
          where: { id: member.rideRequestId },
          data: { status: targetRideStatus },
        });

        // If completed, update membership status and settle pending payment records
        if (targetStatus === PoolStatus.COMPLETED) {
          await tx.poolMembership.update({
            where: { id: member.id },
            data: {
              membershipStatus: MembershipStatus.COMPLETED,
              leftAt: now,
            },
          });

          // Settle any pending cash or online payment as PAID upon completed trip
          if (tx.payment?.updateMany) {
            await tx.payment.updateMany({
              where: {
                rideRequestId: member.rideRequestId,
                status: "PENDING",
              },
              data: {
                status: "PAID",
                paidAt: now,
              },
            });
          }
        }

        // Record immutable audit history entry (Architecture.md §5)
        await tx.rideStatusHistory.create({
          data: {
            rideRequestId: member.rideRequestId,
            poolId: pool.id,
            fromStatus: member.rideRequest.status,
            toStatus: targetRideStatus,
            changedByUserId: driverId,
            reason: `Driver transitioned pool to ${targetStatus}`,
          },
        });
      }
    });

    return this.getPoolById(pool.id);
  }

  // Retrieve payment and completed trip history for driver (integer-only poisha arithmetic per Rule 13)
  public async getDriverPaymentHistory(driverId: string): Promise<DriverPaymentHistoryResponse> {
    const completedPools = await prisma.pool.findMany({
      where: {
        driverId,
        status: PoolStatus.COMPLETED,
      },
      include: {
        vehicle: true,
        memberships: {
          include: {
            rideRequest: {
              include: {
                passenger: true,
                payment: true,
              },
            },
          },
        },
      },
      orderBy: {
        completedAt: "desc",
      },
    });

    const trips = completedPools.map((pool) => {
      // Calculate pool-level aggregated seat and fare metrics
      const breakdown = pool.memberships.map((m) => {
        const farePoisha = m.fareAmountPoisha;
        return {
          passengerName: m.rideRequest?.passenger?.name || "Passenger",
          pickupZone: m.rideRequest?.pickupZone || pool.pickupZone,
          destinationZone: m.rideRequest?.destinationZone || "",
          seats: m.seatsReserved,
          farePoisha,
          formattedFare: fareService.formatPoisha(farePoisha),
          paymentMethod: m.rideRequest?.payment?.method || "CASH",
          paymentStatus: m.rideRequest?.payment?.status || "PAID",
        };
      });

      // Integer arithmetic only (Rule 13)
      const totalFarePoisha = breakdown.reduce((sum, item) => sum + item.farePoisha, 0);
      const totalSeats = breakdown.reduce((sum, item) => sum + item.seats, 0);

      return {
        poolId: pool.id,
        completedAt: pool.completedAt,
        pickupZone: pool.pickupZone,
        routeCode: pool.routeCode,
        totalPassengers: breakdown.length,
        totalSeats,
        totalFarePoisha,
        formattedTotalFare: fareService.formatPoisha(totalFarePoisha),
        breakdown,
      };
    });

    // Compute lifetime driver summary stats (integer-only arithmetic per Rule 13)
    const totalEarningsPoisha = trips.reduce((sum, trip) => sum + trip.totalFarePoisha, 0);
    const totalPassengersServed = trips.reduce((sum, trip) => sum + trip.totalPassengers, 0);

    return {
      summary: {
        totalTrips: trips.length,
        totalEarningsPoisha,
        formattedTotalEarnings: fareService.formatPoisha(totalEarningsPoisha),
        totalPassengersServed,
      },
      trips,
    };
  }
}

export const poolService = new PoolService();
