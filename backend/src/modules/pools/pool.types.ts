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
