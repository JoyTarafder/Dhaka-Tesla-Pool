import { RideStatus, PoolStatus } from "@prisma/client";
import { AppError } from "../../middleware/errorHandler.js";

// Allowed transition state map for individual passenger ride requests (PRD.md §5)
export const ALLOWED_RIDE_TRANSITIONS: Record<RideStatus, RideStatus[]> = {
  REQUESTED: [RideStatus.MATCHED, RideStatus.CANCELLED],
  MATCHED: [RideStatus.ACCEPTED, RideStatus.CANCELLED],
  ACCEPTED: [RideStatus.DRIVER_ARRIVED, RideStatus.CANCELLED],
  DRIVER_ARRIVED: [RideStatus.STARTED, RideStatus.CANCELLED],
  STARTED: [RideStatus.COMPLETED], // Passengers CANNOT cancel once ride has STARTED
  COMPLETED: [], // Terminal state
  CANCELLED: [], // Terminal state
};

// Allowed transition state map for shared pools
export const ALLOWED_POOL_TRANSITIONS: Record<PoolStatus, PoolStatus[]> = {
  MATCHING: [PoolStatus.ACCEPTED, PoolStatus.CANCELLED],
  ACCEPTED: [PoolStatus.DRIVER_ARRIVED, PoolStatus.CANCELLED],
  DRIVER_ARRIVED: [PoolStatus.STARTED, PoolStatus.CANCELLED],
  STARTED: [PoolStatus.COMPLETED],
  COMPLETED: [],
  CANCELLED: [],
};

// Central transition function enforcing valid state moves per AGENTS.md Rule 10
export function validateRideTransition(currentStatus: RideStatus, nextStatus: RideStatus): void {
  const allowed = ALLOWED_RIDE_TRANSITIONS[currentStatus];

  if (!allowed || !allowed.includes(nextStatus)) {
    throw new AppError(
      `Invalid ride status transition from ${currentStatus} to ${nextStatus}`,
      400,
      "INVALID_STATUS_TRANSITION"
    );
  }
}

// Central transition function for pools
export function validatePoolTransition(currentStatus: PoolStatus, nextStatus: PoolStatus): void {
  const allowed = ALLOWED_POOL_TRANSITIONS[currentStatus];

  if (!allowed || !allowed.includes(nextStatus)) {
    throw new AppError(
      `Invalid pool status transition from ${currentStatus} to ${nextStatus}`,
      400,
      "INVALID_STATUS_TRANSITION"
    );
  }
}
