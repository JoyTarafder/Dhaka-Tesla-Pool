import { Router, Request, Response, NextFunction } from "express";
import { DHAKA_ZONES } from "../zones/zones.data.js";
import { fareService } from "./fare.service.js";
import { fareEstimateSchema } from "./fare.validation.js";

export const fareRouter: Router = Router();

// Public endpoint to retrieve predefined Dhaka zones
fareRouter.get("/zones", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: { zones: DHAKA_ZONES },
  });
});

// Public endpoint to estimate ride fare in integer poisha
fareRouter.post("/estimate", (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = fareEstimateSchema.parse(req.body);
    const estimation = fareService.calculateFare(
      validated.pickupZone,
      validated.destinationZone,
      validated.seatCount,
      validated.isPooled
    );

    res.status(200).json({
      success: true,
      data: estimation,
    });
  } catch (error) {
    next(error);
  }
});
