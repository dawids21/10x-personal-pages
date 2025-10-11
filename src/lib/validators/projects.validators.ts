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

/**
 * Validation schema for updating project data.
 * Used in POST /api/projects/{id}/data request validation.
 */
export const updateProjectDataSchema = z.object({
  data: z.string().min(1, "Data cannot be empty"),
});

/**
 * Validation schema for a single project order entry.
 */
const projectOrderEntrySchema = z.object({
  project_id: z.string().min(1, "Project ID is required").max(100, "Project ID must be at most 100 characters"),
  display_order: z.number().int("Display order must be an integer").nonnegative("Display order must be non-negative"),
});

/**
 * Validation schema for reordering projects.
 * Used in PUT /api/projects/reorder request validation.
 */
export const reorderProjectsSchema = z
  .object({
    project_orders: z.array(projectOrderEntrySchema).min(1, "At least one project is required"),
  })
  .refine(
    (data) => {
      const ids = data.project_orders.map((p) => p.project_id);
      return ids.length === new Set(ids).size;
    },
    {
      message: "Duplicate project_id values are not allowed",
      path: ["project_orders"],
    }
  );

/**
 * Validation schema for project data structure.
 * Used to validate parsed YAML content.
 */
export const projectDataSchema = z
  .object({
    name: z.string().min(1, "Project name is required").max(100, "Project name must not exceed 100 characters"),
    description: z.string().min(1, "Description is required").max(500, "Description must not exceed 500 characters"),
    tech_stack: z.string().max(500, "Tech stack must not exceed 500 characters").optional(),
    prod_link: z.string().max(100, "Production link must not exceed 100 characters").optional(),
    start_date: z.date().optional(),
    end_date: z.date().optional(),
  })
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        return data.end_date >= data.start_date;
      }
      return true;
    },
    { message: "End date must be after or equal to start date", path: ["end_date"] }
  );
