import { Request, Response, NextFunction } from "express";
import { PoolStatus } from "@prisma/client";
import { poolService } from "./pool.service.js";
import { ApiSuccessResponse } from "../../shared/types/index.js";
import { PoolResponse } from "./pool.types.js";
import { AppError } from "../../middleware/errorHandler.js";

export class PoolController {
  // Get active pool assigned to the authenticated driver
  public async getDriverPool(
    req: Request,
    res: Response<ApiSuccessResponse<{ pool: PoolResponse | null }>>,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Authentication required", 401, "UNAUTHORIZED");
      }

      const pool = await poolService.getDriverActivePool(req.user.id);

      res.status(200).json({
        success: true,
        data: { pool },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get specific pool by ID
  public async getPoolById(
    req: Request,
    res: Response<ApiSuccessResponse<{ pool: PoolResponse }>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const pool = await poolService.getPoolById(req.params.id as string);

      res.status(200).json({
        success: true,
        data: { pool },
      });
    } catch (error) {
      next(error);
    }
  }

  // Manually trigger pooling match for a ride request
  public async matchRide(
    req: Request,
    res: Response<ApiSuccessResponse<{ pool: PoolResponse }>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const pool = await poolService.matchOrCreatePool(req.params.rideRequestId as string);

      res.status(200).json({
        success: true,
        data: { pool },
      });
    } catch (error) {
      next(error);
    }
  }

  // Driver accepts the pool container
  public async acceptPool(
    req: Request,
    res: Response<ApiSuccessResponse<{ pool: PoolResponse }>>,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Authentication required", 401, "UNAUTHORIZED");
      }

      const pool = await poolService.transitionPoolLifecycle(
        req.user.id,
        req.params.id as string,
        PoolStatus.ACCEPTED,
        req.user.role
      );

      res.status(200).json({
        success: true,
        data: { pool },
      });
    } catch (error) {
      next(error);
    }
  }

  // Driver marks arrival at the pickup zone
  public async arrivePool(
    req: Request,
    res: Response<ApiSuccessResponse<{ pool: PoolResponse }>>,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Authentication required", 401, "UNAUTHORIZED");
      }

      const pool = await poolService.transitionPoolLifecycle(
        req.user.id,
        req.params.id as string,
        PoolStatus.DRIVER_ARRIVED,
        req.user.role
      );

      res.status(200).json({
        success: true,
        data: { pool },
      });
    } catch (error) {
      next(error);
    }
  }

  // Driver starts the trip (locks passenger cancellation)
  public async startPool(
    req: Request,
    res: Response<ApiSuccessResponse<{ pool: PoolResponse }>>,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Authentication required", 401, "UNAUTHORIZED");
      }

      const pool = await poolService.transitionPoolLifecycle(
        req.user.id,
        req.params.id as string,
        PoolStatus.STARTED,
        req.user.role
      );

      res.status(200).json({
        success: true,
        data: { pool },
      });
    } catch (error) {
      next(error);
    }
  }

  // Driver completes the trip at destination
  public async completePool(
    req: Request,
    res: Response<ApiSuccessResponse<{ pool: PoolResponse }>>,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Authentication required", 401, "UNAUTHORIZED");
      }

      const pool = await poolService.transitionPoolLifecycle(
        req.user.id,
        req.params.id as string,
        PoolStatus.COMPLETED,
        req.user.role
      );

      res.status(200).json({
        success: true,
        data: { pool },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const poolController = new PoolController();
