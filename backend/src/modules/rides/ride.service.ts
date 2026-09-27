import { RideStatus, Role, MembershipStatus, PoolStatus } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import { fareService } from "../fares/fare.service.js";
import { validateRideTransition } from "../../shared/utils/transitions.js";
import { CreateRideRequestInput, RideRequestResponse } from "./ride.types.js";
import { poolService } from "../pools/pool.service.js";

export class RideService {
  // Format ride request model with human-readable BDT currency representation
  public formatRide(ride: {
    id: string;
    passengerId: string;
    pickupZone: string;
    destinationZone: string;
    seatCount: number;
    estimatedDistanceKm: number;
    fareAmountPoisha: number;
    status: RideStatus;
    createdAt: Date;
    updatedAt: Date;
    cancelledAt: Date | null;
    // Rule 12 exception: Prisma's optional include result for payment has no exported named type;
    // using `any` here avoids reimplementing internal Prisma relation types.
    payment?: { method: any; status: any } | null;
  }): RideRequestResponse {
    return {
      id: ride.id,
      passengerId: ride.passengerId,
      pickupZone: ride.pickupZone,
      destinationZone: ride.destinationZone,
      seatCount: ride.seatCount,
      estimatedDistanceKm: ride.estimatedDistanceKm,
      fareAmountPoisha: ride.fareAmountPoisha,
      status: ride.status,
      createdAt: ride.createdAt,
      updatedAt: ride.updatedAt,
      cancelledAt: ride.cancelledAt,
      formattedFare: fareService.formatWholeTaka(ride.fareAmountPoisha),
      paymentMethod: ride.payment?.method || "CASH",
    };
  }

  // Create a new ride request for authenticated passenger
  public async createRideRequest(
    passengerId: string,
    input: CreateRideRequestInput
  ): Promise<RideRequestResponse> {
    // Check if passenger already has an active ride (PRD.md §11 assumption)
    const activeRide = await prisma.rideRequest.findFirst({
      where: {
        passengerId,
        status: {
          in: [
            RideStatus.REQUESTED,
            RideStatus.MATCHED,
            RideStatus.ACCEPTED,
            RideStatus.DRIVER_ARRIVED,
            RideStatus.STARTED,
          ],
        },
      },
    });

    if (activeRide) {
      throw new AppError(
        "You already have an active ride request. Complete or cancel it first.",
        400,
        "ACTIVE_RIDE_EXISTS"
      );
    }

    // Calculate fare in integer poisha (Rule 13)
    const fare = fareService.calculateFare(input.pickupZone, input.destinationZone, input.seatCount, true);

    const paymentMethodEnum =
      input.paymentMethod === "ONLINE" || input.paymentMethod === "TESLA_PAY"
        ? "TESLA_PAY"
        : "CASH";

    const newRide = await prisma.rideRequest.create({
      data: {
        passengerId,
        pickupZone: input.pickupZone,
        destinationZone: input.destinationZone,
        seatCount: input.seatCount,
        estimatedDistanceKm: fare.distanceKm,
        fareAmountPoisha: fare.finalFarePoisha,
        status: RideStatus.REQUESTED,
        payment: {
          create: {
            method: paymentMethodEnum,
            amountPoisha: fare.finalFarePoisha,
            status: paymentMethodEnum === "TESLA_PAY" ? "PAID" : "PENDING",
            transactionReference:
              paymentMethodEnum === "TESLA_PAY" ? `TXN-${Date.now().toString(36).toUpperCase()}` : null,
            paidAt: paymentMethodEnum === "TESLA_PAY" ? new Date() : null,
          },
        },
      },
      include: {
        payment: true,
      },
    });

    // Attempt automatic pooling matching into compatible vehicle/pool
    try {
      await poolService.matchOrCreatePool(newRide.id);
      const matchedRide = await prisma.rideRequest.findUnique({
        where: { id: newRide.id },
        include: { payment: true },
      });
      if (matchedRide) {
        return this.formatRide(matchedRide);
      }
    } catch {
      // If no vehicle is currently online or pool capacity full, ride safely remains in REQUESTED status
    }

    return this.formatRide(newRide);
  }

  // Fetch current active ride and past ride history for passenger
  public async getPassengerRides(passengerId: string): Promise<{
    activeRide: RideRequestResponse | null;
    history: RideRequestResponse[];
  }> {
    const rides = await prisma.rideRequest.findMany({
      where: { passengerId },
      include: { payment: true },
      orderBy: { createdAt: "desc" },
    });


    const formatted = rides.map((r) => this.formatRide(r));
    const active = formatted.find(
      (r) =>
        r.status === RideStatus.REQUESTED ||
        r.status === RideStatus.MATCHED ||
        r.status === RideStatus.ACCEPTED ||
        r.status === RideStatus.DRIVER_ARRIVED ||
        r.status === RideStatus.STARTED
    ) || null;

    const history = formatted.filter((r) => r.id !== active?.id);

    return {
      activeRide: active,
      history,
    };
  }

  // Fetch specific ride details with strict ownership verification (security.md §2)
  public async getRideById(
    userId: string,
    userRole: Role,
    rideId: string
  ): Promise<RideRequestResponse> {
    const ride = await prisma.rideRequest.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new AppError("Ride request not found", 404, "RIDE_NOT_FOUND");
    }

    // Security check: Passenger can ONLY view their own ride (security.md §2)
    if (userRole === Role.PASSENGER && ride.passengerId !== userId) {
      throw new AppError("Forbidden: You can only view your own ride requests", 403, "FORBIDDEN");
    }

    return this.formatRide(ride);
  }

  // Cancel ride request with state machine transition validation & pool seat rollback (Rule 10 & PRD.md §5)
  public async cancelRideRequest(
    passengerId: string,
    rideId: string,
    reason: string = "Cancelled by passenger"
  ): Promise<RideRequestResponse> {
    const ride = await prisma.rideRequest.findUnique({
      where: { id: rideId },
      include: { membership: true },
    });

    if (!ride) {
      throw new AppError("Ride request not found", 404, "RIDE_NOT_FOUND");
    }

    // Ownership check: passengers can only cancel their own ride
    if (ride.passengerId !== passengerId) {
      throw new AppError("Forbidden: You cannot cancel another passenger's ride", 403, "FORBIDDEN");
    }

    // Rule 10: State transition validation through central transition function
    // Crucial rule: STARTED rides cannot be cancelled
    validateRideTransition(ride.status, RideStatus.CANCELLED);

    const updatedRide = await prisma.$transaction(async (tx) => {
      const now = new Date();

      // 1. Update ride request to CANCELLED
      const resRide = await tx.rideRequest.update({
        where: { id: ride.id },
        data: {
          status: RideStatus.CANCELLED,
          cancelledAt: now,
        },
      });

      // 2. If passenger was assigned to a pool, release their seats and cancel membership
      if (ride.membership && ride.membership.membershipStatus === MembershipStatus.ACTIVE) {
        await tx.poolMembership.update({
          where: { id: ride.membership.id },
          data: {
            membershipStatus: MembershipStatus.CANCELLED,
            leftAt: now,
          },
        });

        // Decrement occupied seats in the pool container atomically
        await tx.pool.update({
          where: { id: ride.membership.poolId },
          data: {
            occupiedSeats: {
              decrement: ride.seatCount,
            },
          },
        });

        // Check if pool has any remaining active members
        const activeMembersCount = await tx.poolMembership.count({
          where: {
            poolId: ride.membership.poolId,
            membershipStatus: MembershipStatus.ACTIVE,
          },
        });

        // If all members cancelled and pool was not yet completed/started, cancel the pool container
        if (activeMembersCount === 0) {
          const pool = await tx.pool.findUnique({
            where: { id: ride.membership.poolId },
          });

          if (pool && (pool.status === PoolStatus.MATCHING || pool.status === PoolStatus.ACCEPTED)) {
            await tx.pool.update({
              where: { id: pool.id },
              data: { status: PoolStatus.CANCELLED },
            });
          }
        }
      }

      // 3. Write immutable audit log
      await tx.rideStatusHistory.create({
        data: {
          rideRequestId: ride.id,
          poolId: ride.membership?.poolId || null,
          fromStatus: ride.status,
          toStatus: RideStatus.CANCELLED,
          changedByUserId: passengerId,
          reason,
        },
      });

      return resRide;
    });

    return this.formatRide(updatedRide);
  }

  // Retrieve complete status audit history for a ride request (Architecture.md §4)
  public async getRideHistory(
    userId: string,
    userRole: Role,
    rideId: string
  ): Promise<
    Array<{
      id: string;
      rideRequestId: string;
      poolId: string | null;
      fromStatus: string;
      toStatus: string;
      changedByUserId: string;
      changedByName: string;
      reason: string | null;
      createdAt: Date;
    }>
  > {
    const ride = await prisma.rideRequest.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new AppError("Ride request not found", 404, "RIDE_NOT_FOUND");
    }

    // Ownership check: passengers can only see audit history of their own ride
    if (userRole === Role.PASSENGER && ride.passengerId !== userId) {
      throw new AppError("Forbidden: You can only view audit history of your own rides", 403, "FORBIDDEN");
    }

    const history = await prisma.rideStatusHistory.findMany({
      where: { rideRequestId: rideId },
      orderBy: { createdAt: "asc" },
      include: {
        changedBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return history.map((h) => ({
      id: h.id,
      rideRequestId: h.rideRequestId,
      poolId: h.poolId,
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      changedByUserId: h.changedByUserId,
      changedByName: h.changedBy?.name || "System",
      reason: h.reason,
      createdAt: h.createdAt,
    }));
  }
}

export const rideService = new RideService();
