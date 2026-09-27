import { Router } from "express";
import { Role } from "@prisma/client";
import { poolController } from "./pool.controller.js";
import { authenticate, requireRole } from "../../middleware/auth.js";

export const poolRouter: Router = Router();

// Retrieve pool details
poolRouter.get("/:id", authenticate, (req, res, next) =>
  poolController.getPoolById(req, res, next)
);

// Trigger matching for a ride request
poolRouter.post("/match/:rideRequestId", authenticate, (req, res, next) =>
  poolController.matchRide(req, res, next)
);

// Driver Pool Lifecycle endpoints (Architecture.md §4 & PRD.md §5)
poolRouter.post("/:id/accept", authenticate, requireRole([Role.DRIVER, Role.ADMIN]), (req, res, next) =>
  poolController.acceptPool(req, res, next)
);

poolRouter.post("/:id/arrive", authenticate, requireRole([Role.DRIVER, Role.ADMIN]), (req, res, next) =>
  poolController.arrivePool(req, res, next)
);

poolRouter.post("/:id/start", authenticate, requireRole([Role.DRIVER, Role.ADMIN]), (req, res, next) =>
  poolController.startPool(req, res, next)
);

poolRouter.post("/:id/complete", authenticate, requireRole([Role.DRIVER, Role.ADMIN]), (req, res, next) =>
  poolController.completePool(req, res, next)
);
