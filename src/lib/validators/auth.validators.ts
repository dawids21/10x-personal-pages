import { z } from "zod";

/**
 * Validation schema for sign-up requests.
 * Used in POST /api/auth/sign-up request validation.
 */
export const signUpSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/**
 * Validation schema for sign-in requests.
 * Used in POST /api/auth/sign-in request validation.
 */
export const signInSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
