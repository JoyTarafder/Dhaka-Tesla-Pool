// Public sanitized representation of a vehicle
export interface VehicleResponse {
  id: string;
  driverId: string;
  name: string;
  registrationNumber: string;
  capacity: number;
  isOnline: boolean;
  createdAt: Date;
  updatedAt: Date;
}

