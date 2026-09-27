import { z } from "zod";

export const createRideRequestSchema = z
  .object({
    pickupZone: z.string().min(1, "Pickup zone is required"),
    destinationZone: z.string().min(1, "Destination zone is required"),
    seatCount: z.number().int().min(1, "At least 1 seat is required").max(3, "Maximum 3 seats for Bullet"),
    paymentMethod: z.enum(["CASH", "ONLINE", "TESLA_PAY"]).optional(),
  })
  .refine((data) => data.pickupZone !== data.destinationZone, {
    message: "Pickup zone and destination zone must be different",
    path: ["destinationZone"],
  });


export const cancelRideSchema = z.object({
  reason: z.string().max(250).optional(),
});
