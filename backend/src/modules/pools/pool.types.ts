import { PoolStatus, MembershipStatus } from "@prisma/client";

export interface PoolMemberResponse {
  membershipId: string;
  rideRequestId: string;
  passengerId: string;
  passengerName: string;
  pickupZone: string;
  destinationZone: string;
  seatsReserved: number;
  fareAmountPoisha: number;
  formattedFare: string;
  membershipStatus: MembershipStatus;
  joinedAt: Date;
}

export interface PoolResponse {
  id: string;
  vehicleId: string;
  vehicleName: string;
  driverId: string;
  driverName: string;
  status: PoolStatus;
  totalCapacity: number;
  occupiedSeats: number;
  availableSeats: number;
  pickupZone: string;
  routeCode: string;
  members: PoolMemberResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DriverTripPaymentItem {
  passengerName: string;
  pickupZone: string;
  destinationZone: string;
  seats: number;
  farePoisha: number;
  formattedFare: string;
  paymentMethod: string;
  paymentStatus: string;
}

export interface DriverTripHistory {
  poolId: string;
  completedAt: Date | null;
  pickupZone: string;
  routeCode: string;
  totalPassengers: number;
  totalSeats: number;
  totalFarePoisha: number;
  formattedTotalFare: string;
  breakdown: DriverTripPaymentItem[];
}

export interface DriverPaymentSummary {
  totalTrips: number;
  totalEarningsPoisha: number;
  formattedTotalEarnings: string;
  totalPassengersServed: number;
}

export interface DriverPaymentHistoryResponse {
  summary: DriverPaymentSummary;
  trips: DriverTripHistory[];
}
