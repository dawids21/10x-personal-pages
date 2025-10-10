import { z } from "zod";

/**
 * Validation schema for creating a new page.
 * Used in POST /api/pages request validation.
 */
export const createPageSchema = z.object({
  url: z
    .string()
    .min(3, "URL must be at least 3 characters")
    .max(30, "URL must not exceed 30 characters")
    .regex(/^[a-z0-9-]+$/, "URL must contain only lowercase letters, numbers, and hyphens"),
  theme: z.string().min(1, "Theme is required"),
  data: z.string().optional(),
});

/**
 * Validation schema for updating page theme.
 * Used in PUT /api/pages request validation.
 */
export const updatePageThemeSchema = z.object({
  theme: z.string().min(1, "Theme is required"),
});
