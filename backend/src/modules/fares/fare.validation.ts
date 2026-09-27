import { z } from "zod";

export const fareEstimateSchema = z.object({
  pickupZone: z.string().min(1, "Pickup zone is required"),
  destinationZone: z.string().min(1, "Destination zone is required"),
  seatCount: z.number().int().min(1).max(3).default(1),
  isPooled: z.boolean().default(true),
});

export type FareEstimateInput = z.infer<typeof fareEstimateSchema>;
