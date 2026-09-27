import { Router } from "express";
import { Role } from "@prisma/client";
import { vehicleController } from "./vehicle.controller.js";
import { poolController } from "../pools/pool.controller.js";
import { authenticate, requireRole } from "../../middleware/auth.js";

export const driverVehicleRouter: Router = Router();

// Protect all driver vehicle endpoints: must be authenticated and have DRIVER role
driverVehicleRouter.use(authenticate, requireRole([Role.DRIVER]));

// Retrieve assigned vehicle details
driverVehicleRouter.get("/vehicle", (req, res, next) => vehicleController.getVehicle(req, res, next));

// Toggle online/offline status
driverVehicleRouter.patch("/availability", (req, res, next) =>
  vehicleController.updateAvailability(req, res, next)
);

// Retrieve active pool assigned to driver (Architecture.md §4)
driverVehicleRouter.get("/pools", (req, res, next) => poolController.getDriverPool(req, res, next));
