import { z } from "zod";

// Zod schema for toggling driver online/offline availability
export const updateAvailabilitySchema = z.object({
  isOnline: z.boolean({
    required_error: "isOnline boolean is required",
    invalid_type_error: "isOnline must be a boolean",
  }),
});
