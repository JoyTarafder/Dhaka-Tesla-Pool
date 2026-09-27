// API client helper for communication between Next.js frontend and Express backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "PASSENGER" | "DRIVER" | "ADMIN";
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiError {
  code: string;
  message: string;
}

// Generic fetch wrapper returning typed result or throwing standardized error
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    const error: ApiError = json.error || {
      code: "UNKNOWN_ERROR",
      message: "An unexpected error occurred",
    };
    throw error;
  }

  return json.data as T;
}

// User registration
export async function apiRegister(body: {
  name: string;
  email: string;
  password: string;
  role: "PASSENGER" | "DRIVER";
}): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// User login
export async function apiLogin(body: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// Fetch current user details
export async function apiGetMe(token: string): Promise<{ user: User }> {
  return request<{ user: User }>("/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export interface Vehicle {
  id: string;
  driverId: string;
  name: string;
  registrationNumber: string;
  capacity: number;
  isOnline: boolean;
  createdAt: string;
  updatedAt: string;
}

// Fetch vehicle assigned to the authenticated driver
export async function apiGetDriverVehicle(token: string): Promise<{ vehicle: Vehicle }> {
  return request<{ vehicle: Vehicle }>("/driver/vehicle", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Toggle vehicle online/offline status
export async function apiUpdateDriverAvailability(
  token: string,
  isOnline: boolean
): Promise<{ vehicle: Vehicle }> {
  return request<{ vehicle: Vehicle }>("/driver/availability", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ isOnline }),
  });
}

export interface Zone {
  code: string;
  name: string;
  description: string;
}

export interface FareEstimate {
  pickupZone: string;
  destinationZone: string;
  distanceKm: number;
  seatCount: number;
  baseFarePoisha: number;
  distanceChargePoisha: number;
  grossFarePoisha: number;
  discountPoisha: number;
  finalFarePoisha: number;
  formattedBdt: {
    baseFare: string;
    distanceCharge: string;
    grossFare: string;
    discount: string;
    finalFare: string;
  };
}

export interface RideRequest {
  id: string;
  passengerId: string;
  pickupZone: string;
  destinationZone: string;
  seatCount: number;
  estimatedDistanceKm: number;
  fareAmountPoisha: number;
  status: "REQUESTED" | "MATCHED" | "ACCEPTED" | "DRIVER_ARRIVED" | "STARTED" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
  formattedFare: string;
}

// Fetch list of predefined Dhaka zones
export async function apiGetZones(): Promise<{ zones: Zone[] }> {
  return request<{ zones: Zone[] }>("/fares/zones", {
    method: "GET",
  });
}

// Estimate fare in integer poisha
export async function apiEstimateFare(
  pickupZone: string,
  destinationZone: string,
  seatCount: number
): Promise<FareEstimate> {
  return request<FareEstimate>("/fares/estimate", {
    method: "POST",
    body: JSON.stringify({ pickupZone, destinationZone, seatCount, isPooled: true }),
  });
}

// Create a new ride request with chosen payment method
export async function apiCreateRideRequest(
  token: string,
  pickupZone: string,
  destinationZone: string,
  seatCount: number,
  paymentMethod?: "CASH" | "ONLINE"
): Promise<{ ride: RideRequest }> {
  return request<{ ride: RideRequest }>("/ride-requests", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ pickupZone, destinationZone, seatCount, paymentMethod }),
  });
}


// Fetch current passenger's active ride and past history
export async function apiGetMyRides(
  token: string
): Promise<{ activeRide: RideRequest | null; history: RideRequest[] }> {
  return request<{ activeRide: RideRequest | null; history: RideRequest[] }>("/ride-requests/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Cancel a passenger ride request
export async function apiCancelRide(
  token: string,
  rideId: string,
  reason?: string
): Promise<{ ride: RideRequest }> {
  return request<{ ride: RideRequest }>(`/ride-requests/${rideId}/cancel`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reason }),
  });
}

export interface PoolMember {
  membershipId: string;
  rideRequestId: string;
  passengerId: string;
  passengerName: string;
  pickupZone: string;
  destinationZone: string;
  seatsReserved: number;
  fareAmountPoisha: number;
  formattedFare: string;
  membershipStatus: "ACTIVE" | "CANCELLED" | "COMPLETED";
  joinedAt: string;
}

export interface Pool {
  id: string;
  vehicleId: string;
  vehicleName: string;
  driverId: string;
  driverName: string;
  status: "MATCHING" | "ACCEPTED" | "DRIVER_ARRIVED" | "STARTED" | "COMPLETED" | "CANCELLED";
  totalCapacity: number;
  occupiedSeats: number;
  availableSeats: number;
  pickupZone: string;
  routeCode: string;
  members: PoolMember[];
  createdAt: string;
  updatedAt: string;
}

// Fetch active pool assigned to driver
export async function apiGetDriverPools(
  token: string
): Promise<{ pool: Pool | null }> {
  return request<{ pool: Pool | null }>("/driver/pools", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Driver accepts the pool container
export async function apiAcceptPool(token: string, poolId: string): Promise<{ pool: Pool }> {
  return request<{ pool: Pool }>(`/pools/${poolId}/accept`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Driver marks arrival at pickup zone
export async function apiArrivePool(token: string, poolId: string): Promise<{ pool: Pool }> {
  return request<{ pool: Pool }>(`/pools/${poolId}/arrive`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Driver starts trip (locks passenger cancellation)
export async function apiStartPool(token: string, poolId: string): Promise<{ pool: Pool }> {
  return request<{ pool: Pool }>(`/pools/${poolId}/start`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Driver completes trip at destination
export async function apiCompletePool(token: string, poolId: string): Promise<{ pool: Pool }> {
  return request<{ pool: Pool }>(`/pools/${poolId}/complete`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export interface RideStatusHistoryItem {
  id: string;
  rideRequestId: string;
  poolId: string | null;
  fromStatus: string;
  toStatus: string;
  changedByUserId: string;
  changedByName: string;
  reason: string | null;
  createdAt: string;
}

// Fetch status audit history for a ride
export async function apiGetRideHistory(
  token: string,
  rideId: string
): Promise<{ history: RideStatusHistoryItem[] }> {
  return request<{ history: RideStatusHistoryItem[] }>(`/ride-requests/${rideId}/history`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export interface DriverTripPaymentItem {
  passengerName: string;
  pickupZone: string;
  destinationZone: string;
  seats: number;
  farePoisha: number;
  formattedFare: string;
  paymentMethod: "CASH" | "TESLA_PAY" | string;
  paymentStatus: string;
}

export interface DriverTripHistory {
  poolId: string;
  completedAt: string | null;
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

// Fetch payment and completed trip history for driver console
export async function apiGetDriverPaymentHistory(
  token: string
): Promise<DriverPaymentHistoryResponse> {
  return request<DriverPaymentHistoryResponse>("/driver/payment-history", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}
