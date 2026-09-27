import { Router } from "express";
import { Role } from "@prisma/client";
import { rideController } from "./ride.controller.js";
import { authenticate, requireRole } from "../../middleware/auth.js";

export const rideRouter: Router = Router();

// Create a new ride request (Passengers only)
rideRouter.post("/", authenticate, requireRole([Role.PASSENGER]), (req, res, next) =>
  rideController.createRide(req, res, next)
);

// Get current passenger's active ride and ride history
rideRouter.get("/me", authenticate, requireRole([Role.PASSENGER]), (req, res, next) =>
  rideController.getMyRides(req, res, next)
);

// Get single ride request by ID with ownership check (Passenger or Driver/Admin)
rideRouter.get("/:id", authenticate, (req, res, next) =>
  rideController.getRideById(req, res, next)
);

// Cancel a ride request (Passengers only)
rideRouter.post("/:id/cancel", authenticate, requireRole([Role.PASSENGER]), (req, res, next) =>
  rideController.cancelRide(req, res, next)
);

// Get status transition audit logs for a ride request (Architecture.md §4)
rideRouter.get("/:id/history", authenticate, (req, res, next) =>
  rideController.getRideHistory(req, res, next)
);
