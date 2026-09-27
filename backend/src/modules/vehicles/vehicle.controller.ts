import { Request, Response, NextFunction } from "express";
import { vehicleService } from "./vehicle.service.js";
import { updateAvailabilitySchema } from "./vehicle.validation.js";
import { ApiSuccessResponse } from "../../shared/types/index.js";
import { VehicleResponse } from "./vehicle.types.js";
import { AppError } from "../../middleware/errorHandler.js";

// Controller handling driver vehicle endpoints
export class VehicleController {
  // Fetch vehicle details for the authenticated driver
  public async getVehicle(
    req: Request,
    res: Response<ApiSuccessResponse<{ vehicle: VehicleResponse }>>,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Authentication required", 401, "UNAUTHORIZED");
      }

      const vehicle = await vehicleService.getDriverVehicle(req.user.id);

      res.status(200).json({
        success: true,
        data: { vehicle },
      });
    } catch (error) {
      next(error);
    }
  }

  // Toggle online/offline status for driver's vehicle
  public async updateAvailability(
    req: Request,
    res: Response<ApiSuccessResponse<{ vehicle: VehicleResponse }>>,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Authentication required", 401, "UNAUTHORIZED");
      }

      const validated = updateAvailabilitySchema.parse(req.body);
      const vehicle = await vehicleService.updateAvailability(req.user.id, validated.isOnline);

      res.status(200).json({
        success: true,
        data: { vehicle },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const vehicleController = new VehicleController();
