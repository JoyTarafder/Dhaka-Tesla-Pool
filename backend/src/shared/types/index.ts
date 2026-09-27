// Standard API response contracts across the entire Dhaka Tesla Pool platform

// Successful API response contract
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

// Error details payload
export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

// Standardized failed API response contract (per security.md and AGENTS.md Rule 14)
export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
}

// Union type for all API responses
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
