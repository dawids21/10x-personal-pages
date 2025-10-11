import { z } from "zod";

/**
 * Validation schema for creating a new project.
 * Used in POST /api/projects request validation.
 */
export const createProjectSchema = z.object({
  project_name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be at most 100 characters")
    .trim(),
  display_order: z.number().int("Display order must be an integer").nonnegative("Display order must be non-negative"),
});

/**
 * Validation schema for updating a project's name.
 * Used in PUT /api/projects/{id} request validation.
 */
export const updateProjectNameSchema = z.object({
  project_name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be at most 100 characters")
    .trim(),
});
