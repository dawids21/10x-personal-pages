import { z } from "zod";

/**
 * Validation schema for sign-up requests.
 */
export const signUpSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(255, "Email is too long"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72, "Password is too long"),
});

/**
 * Validation schema for sign-in requests.
 */
export const signInSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
