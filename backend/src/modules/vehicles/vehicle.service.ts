import { prisma } from "../../db/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import { VehicleResponse } from "./vehicle.types.js";

// Service handling vehicle management and driver availability controls
export class VehicleService {
  // Retrieve vehicle assigned to the authenticated driver
  public async getDriverVehicle(driverId: string): Promise<VehicleResponse> {
    const vehicle = await prisma.vehicle.findFirst({
      where: { driverId },
    });

    if (!vehicle) {
      throw new AppError("No vehicle registered for this driver", 404, "VEHICLE_NOT_FOUND");
    }

    return vehicle;
  }

  // Toggle vehicle online/offline availability, enforcing driver ownership
  public async updateAvailability(driverId: string, isOnline: boolean): Promise<VehicleResponse> {
    const vehicle = await prisma.vehicle.findFirst({
      where: { driverId },
    });

    if (!vehicle) {
      throw new AppError("No vehicle registered for this driver", 404, "VEHICLE_NOT_FOUND");
    }

    const updated = await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { isOnline },
    });

    return updated;
  }
}

export const vehicleService = new VehicleService();
