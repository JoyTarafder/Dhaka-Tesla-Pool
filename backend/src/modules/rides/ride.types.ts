import { RideStatus } from "@prisma/client";

export interface CreateRideRequestInput {
  pickupZone: string;
  destinationZone: string;
  seatCount: number;
  paymentMethod?: "CASH" | "ONLINE" | "TESLA_PAY";
}

export interface RideRequestResponse {
  id: string;
  passengerId: string;
  pickupZone: string;
  destinationZone: string;
  seatCount: number;
  estimatedDistanceKm: number;
  fareAmountPoisha: number;
  status: RideStatus;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt: Date | null;
  formattedFare: string;
  paymentMethod?: string;
}
