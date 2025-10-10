import type { Database } from "./db/database.types";

// ============================================================================
// Database Entity Type Aliases
// ============================================================================

/** Page entity from database */
type PageEntity = Database["public"]["Tables"]["pages"]["Row"];

/** Project entity from database */
type ProjectEntity = Database["public"]["Tables"]["projects"]["Row"];

// ============================================================================
// Page DTOs
// ============================================================================

/**
 * Page configuration DTO (excludes YAML data field)
 * Used in: GET /api/pages
 */
export type PageDto = Pick<PageEntity, "user_id" | "url" | "theme" | "created_at" | "updated_at">;

/**
 * Response DTO after creating a page
 * Used in: POST /api/pages response
 */
export type PageCreateResponseDto = Pick<PageEntity, "user_id" | "url" | "theme">;

/**
 * Command for creating a new page
 * Used in: POST /api/pages request
 */
export interface CreatePageCommand {
  /** Desired URL slug (3-30 chars, lowercase alphanumeric and hyphens) */
  url: string;
  /** Theme identifier */
  theme: string;
  /** Optional initial YAML content for the page */
  data?: string;
}

/**
 * Command for updating page theme
 * Used in: PUT /api/pages request
 */
export interface UpdatePageThemeCommand {
  /** New theme identifier */
  theme: string;
}

/**
 * Command for validating and updating page URL
 * Used in: POST /api/pages/url request
 */
export interface UpdatePageUrlCommand {
  /** New URL slug */
  url: string;
}

/**
 * Command for validating and updating page YAML data
 * Used in: POST /api/pages/data request
 */
export interface UpdatePageDataCommand {
  /** YAML content as string */
  data: string;
}

/**
 * Contact information entry
 */
export interface ContactInfo {
  label: string;
  value: string;
}

/**
 * Experience entry
 */
export interface Experience {
  job_title: string;
  job_description?: string;
}

/**
 * Education entry
 */
export interface Education {
  school_title: string;
  school_description?: string;
}

/**
 * Skill entry
 */
export interface Skill {
  name: string;
}

/**
 * Page data structure
 * Used for storing and retrieving page content
 */
export interface PageData {
  name: string;
  bio: string;
  contact_info?: ContactInfo[];
  experience?: Experience[];
  education?: Education[];
  skills?: Skill[];
}

// ============================================================================
// Project DTOs
// ============================================================================

/**
 * Project DTO (excludes YAML data field and timestamps)
 * Used in: GET /api/projects, GET /api/projects/{id}
 */
export type ProjectDto = Pick<ProjectEntity, "user_id" | "project_id" | "project_name" | "display_order">;

/**
 * Response DTO after creating a project
 * Used in: POST /api/projects response
 */
export type ProjectCreateResponseDto = Pick<
  ProjectEntity,
  "user_id" | "project_id" | "project_name" | "display_order" | "created_at" | "updated_at"
>;

/**
 * Command for creating a new project
 * Used in: POST /api/projects request
 */
export interface CreateProjectCommand {
  /** Name of the project (max 100 chars) */
  project_name: string;
  /** Display order for the project (non-negative integer) */
  display_order: number;
}

/**
 * Command for updating a project's name
 * Used in: PUT /api/projects/{id} request
 */
export interface UpdateProjectNameCommand {
  /** New project name (max 100 chars) */
  project_name: string;
}

/**
 * Command for validating and updating project YAML data
 * Used in: POST /api/projects/{id}/data request
 */
export interface UpdateProjectDataCommand {
  /** YAML content as string */
  data: string;
}

/**
 * Single project order entry for reordering
 */
export interface ProjectOrderEntry {
  /** Unique identifier of the project */
  project_id: string;
  /** New display order value */
  display_order: number;
}

/**
 * Command for reordering projects
 * Used in: PUT /api/projects/reorder request
 */
export interface ReorderProjectsCommand {
  /** Array of project IDs with their new display orders */
  project_orders: ProjectOrderEntry[];
}

// ============================================================================
// Error Response Types
// ============================================================================

/**
 * Validation error detail
 */
export interface ValidationErrorDetail {
  /** Field name that failed validation */
  field: string;
  /** Description of the validation issue */
  issue: string;
}

/**
 * Standard error response structure
 * Used for all 4xx client errors
 */
export interface ErrorResponse {
  error: {
    /** Error code identifier */
    code: string;
    /** Human-readable error message */
    message: string;
    /** Optional array of validation error details */
    details?: ValidationErrorDetail[];
  };
}
