import { Request, Response, NextFunction } from "express";
import { rideService } from "./ride.service.js";
import { createRideRequestSchema, cancelRideSchema } from "./ride.validation.js";
import { ApiSuccessResponse } from "../../shared/types/index.js";
import { RideRequestResponse } from "./ride.types.js";
import { AppError } from "../../middleware/errorHandler.js";

// Derive audit history item type directly from the service to avoid any[]
type RideHistoryItem = Awaited<ReturnType<typeof rideService.getRideHistory>>[number];

export class RideController {
  // Create a new ride request
  public async createRide(
    req: Request,
    res: Response<ApiSuccessResponse<{ ride: RideRequestResponse }>>,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Authentication required", 401, "UNAUTHORIZED");
      }

      const validated = createRideRequestSchema.parse(req.body);
      const ride = await rideService.createRideRequest(req.user.id, validated);

      res.status(201).json({
        success: true,
        data: { ride },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get active ride and ride history for current passenger
  public async getMyRides(
    req: Request,
    res: Response<
      ApiSuccessResponse<{
        activeRide: RideRequestResponse | null;
        history: RideRequestResponse[];
      }>
    >,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Authentication required", 401, "UNAUTHORIZED");
      }

      const data = await rideService.getPassengerRides(req.user.id);

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get single ride request by ID with ownership enforcement
  public async getRideById(
    req: Request,
    res: Response<ApiSuccessResponse<{ ride: RideRequestResponse }>>,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Authentication required", 401, "UNAUTHORIZED");
      }

      const ride = await rideService.getRideById(req.user.id, req.user.role, req.params.id as string);

      res.status(200).json({
        success: true,
        data: { ride },
      });
    } catch (error) {
      next(error);
    }
  }

  // Cancel ride request
  public async cancelRide(
    req: Request,
    res: Response<ApiSuccessResponse<{ ride: RideRequestResponse }>>,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Authentication required", 401, "UNAUTHORIZED");
      }

      const validated = cancelRideSchema.parse(req.body);
      const ride = await rideService.cancelRideRequest(
        req.user.id,
        req.params.id as string,
        validated.reason
      );

      res.status(200).json({
        success: true,
        data: { ride },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get status audit history for a ride request (Architecture.md §4)
  public async getRideHistory(
    req: Request,
    res: Response<ApiSuccessResponse<{ history: RideHistoryItem[] }>>,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Authentication required", 401, "UNAUTHORIZED");
      }

      const history = await rideService.getRideHistory(
        req.user.id,
        req.user.role,
        req.params.id as string
      );

      res.status(200).json({
        success: true,
        data: { history },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const rideController = new RideController();
