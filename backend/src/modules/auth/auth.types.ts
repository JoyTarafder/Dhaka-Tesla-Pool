import { Role } from "@prisma/client";

// Public sanitized representation of user without sensitive password hash
export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

// Auth payload returned upon successful login or registration
export interface AuthResponseData {
  user: UserResponse;
  token: string;
}

// Token payload encoded inside JWT
export interface JwtUserPayload {
  userId: string;
  email: string;
  role: Role;
}
