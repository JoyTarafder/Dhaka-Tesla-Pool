import express, { Express, Request, Response } from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { errorHandler, AppError } from "./middleware/errorHandler.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { driverVehicleRouter } from "./modules/vehicles/vehicle.routes.js";
import { fareRouter } from "./modules/fares/fare.routes.js";
import { rideRouter } from "./modules/rides/ride.routes.js";
import { poolRouter } from "./modules/pools/pool.routes.js";

// Initialize and configure Express application
export const app: Express = express();

// Configure CORS with allowed frontend origin
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

// Parse incoming JSON payloads with safe body size limit
app.use(express.json({ limit: "1mb" }));

// System health check endpoint per Architecture.md §4
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "dhaka-tesla-pool-backend",
    timestamp: new Date().toISOString(),
  });
});

// Mount modular API routers
app.use("/api/auth", authRouter);
app.use("/api/driver", driverVehicleRouter);
app.use("/api/fares", fareRouter);
app.use("/api/ride-requests", rideRouter);
app.use("/api/pools", poolRouter);

// Catch-all for unknown routes returning standard 404 error
app.use((req: Request, _res: Response, next) => {
  next(new AppError(`Route ${req.method} ${req.path} not found`, 404, "NOT_FOUND"));
});

// Attach centralized error handling middleware
app.use(errorHandler);
