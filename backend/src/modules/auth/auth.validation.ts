import { z } from "zod";
import { Role } from "@prisma/client";

// Input schema for new user registration
export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters long").max(100),
  email: z.string().trim().email("Invalid email format").toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters long").max(100),
  role: z.nativeEnum(Role).default(Role.PASSENGER),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// Input schema for user authentication
export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email format").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
