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

/**
 * Validation schema for updating page URL.
 * Used in POST /api/pages/url request validation.
 */
export const updatePageUrlSchema = z.object({
  url: z
    .string()
    .min(3, "URL must be at least 3 characters")
    .max(30, "URL must not exceed 30 characters")
    .regex(/^[a-z0-9-]+$/, "URL must contain only lowercase letters, numbers, and hyphens"),
});

/**
 * Validation schema for updating page data.
 * Used in POST /api/pages/data request validation.
 */
export const updatePageDataSchema = z.object({
  data: z.string().min(1, "Data cannot be empty"),
});

/**
 * Validation schema for contact information.
 */
const contactInfoSchema = z.object({
  label: z.string().max(50, "Label must not exceed 50 characters"),
  value: z.string().max(100, "Value must not exceed 100 characters"),
});

/**
 * Validation schema for experience entries.
 */
const experienceSchema = z.object({
  job_title: z.string().max(100, "Job title must not exceed 100 characters"),
  job_description: z.string().max(500, "Job description must not exceed 500 characters").optional(),
});

/**
 * Validation schema for education entries.
 */
const educationSchema = z.object({
  school_title: z.string().max(100, "School title must not exceed 100 characters"),
  school_description: z.string().max(300, "School description must not exceed 300 characters").optional(),
});

/**
 * Validation schema for skill entries.
 */
const skillSchema = z.object({
  name: z.string().max(50, "Skill name must not exceed 50 characters"),
});

/**
 * Validation schema for page data structure.
 * Used to validate parsed YAML content.
 */
export const pageDataSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must not exceed 100 characters"),
  bio: z.string().min(1, "Bio is required").max(500, "Bio must not exceed 500 characters"),
  contact_info: z.array(contactInfoSchema).optional(),
  experience: z.array(experienceSchema).optional(),
  education: z.array(educationSchema).optional(),
  skills: z.array(skillSchema).optional(),
});
