import type {
  CreateProjectCommand,
  ProjectCreateResponseDto,
  ProjectData,
  ProjectDto,
  ProjectOrderEntry,
  UpdateProjectNameCommand,
} from "@/types.ts";
import { PageNotFoundError } from "../errors/pages.errors";
import { ProjectNotFoundError } from "../errors/projects.errors";
import { InvalidYamlError } from "../errors/shared.errors";
import type { SupabaseClient } from "@supabase/supabase-js";
import { dump, load } from "js-yaml";
import { projectDataSchema } from "../validators/projects.validators";
import { z } from "zod";

/**
 * Creates a new project for a user.
 * Automatically generates a unique project_id slug from the project_name.
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param command - Create project command with project_name and display_order
 * @returns Created project with timestamps
 * @throws {PageNotFoundError} If user has no main page (foreign key violation)
 * @throws {Error} For other database errors
 */
export async function createProject(
  supabase: SupabaseClient,
  userId: string,
  command: CreateProjectCommand
): Promise<ProjectCreateResponseDto> {
  /**
   * Generates a URL-safe slug from a project name.
   * Converts to lowercase, replaces special characters with hyphens,
   * removes consecutive hyphens, and trims hyphens from ends.
   */
  function generateProjectSlug(projectName: string): string {
    return projectName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remove special chars
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
  }

  /**
   * Finds a unique slug for a project by appending numeric suffixes if needed.
   * Checks if the base slug exists, and if so, tries slug-2, slug-3, etc.
   */
  async function findUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let attempt = 1;
    const MAX_ATTEMPTS = 100;

    while (attempt <= MAX_ATTEMPTS) {
      // Check if slug exists for this user
      const { data, error } = await supabase
        .from("projects")
        .select("project_id")
        .eq("user_id", userId)
        .eq("project_id", slug)
        .maybeSingle();

      if (error) {
        throw new Error(`Database error while checking slug uniqueness: ${error.message}`);
      }

      // If slug doesn't exist, it's unique
      if (!data) {
        return slug;
      }

      // Append numeric suffix and try again
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    throw new Error("Unable to generate unique slug after maximum attempts");
  }

  // Generate unique slug
  const baseSlug = generateProjectSlug(command.project_name);
  const uniqueSlug = await findUniqueSlug(baseSlug);

  // Attempt to insert the new project
  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      project_id: uniqueSlug,
      project_name: command.project_name,
      display_order: command.display_order,
    })
    .select("user_id, project_id, project_name, display_order, created_at, updated_at")
    .single();

  if (error) {
    // Check if error is due to foreign key violation on user_id (user has no page)
    // The constraint references public.pages(user_id)
    if (error.code === "23503" && error.message.includes("user_id")) {
      throw new PageNotFoundError();
    }
    throw new Error(`Database error while creating project: ${error.message}`);
  }

  return data;
}

/**
 * Retrieves all projects for a user, ordered by display_order.
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @returns Array of projects (empty if none)
 * @throws {Error} For database errors
 */
export async function getUserProjects(supabase: SupabaseClient, userId: string): Promise<ProjectDto[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("user_id, project_id, project_name, display_order")
    .eq("user_id", userId)
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(`Database error while fetching projects: ${error.message}`);
  }

  return data || [];
}

/**
 * Retrieves a single project by user_id and project_id.
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param projectId - Project ID slug
 * @returns Project data
 * @throws {ProjectNotFoundError} If project not found or not owned by user
 * @throws {Error} For other database errors
 */
export async function getProjectById(supabase: SupabaseClient, userId: string, projectId: string): Promise<ProjectDto> {
  const { data, error } = await supabase
    .from("projects")
    .select("user_id, project_id, project_name, display_order")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) {
    throw new Error(`Database error while fetching project: ${error.message}`);
  }

  if (!data) {
    throw new ProjectNotFoundError();
  }

  return data;
}

/**
 * Updates a project's name.
 * Note: project_id cannot be changed after creation.
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param projectId - Project ID slug
 * @param command - Update command with new project_name
 * @returns Updated project data
 * @throws {ProjectNotFoundError} If project not found or not owned by user
 * @throws {Error} For other database errors
 */
export async function updateProjectName(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  command: UpdateProjectNameCommand
): Promise<ProjectDto> {
  const { data, error } = await supabase
    .from("projects")
    .update({
      project_name: command.project_name,
    })
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .select("user_id, project_id, project_name, display_order")
    .maybeSingle();

  if (error) {
    throw new Error(`Database error while updating project: ${error.message}`);
  }

  if (!data) {
    throw new ProjectNotFoundError();
  }

  return data;
}

/**
 * Deletes a project.
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param projectId - Project ID slug
 * @throws {ProjectNotFoundError} If project not found or not owned by user
 * @throws {Error} For other database errors
 */
export async function deleteProject(supabase: SupabaseClient, userId: string, projectId: string): Promise<void> {
  const { data, error } = await supabase
    .from("projects")
    .delete()
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .select("user_id")
    .maybeSingle();

  if (error) {
    throw new Error(`Database error while deleting project: ${error.message}`);
  }

  if (!data) {
    throw new ProjectNotFoundError();
  }
}

/**
 * Parses YAML string and validates it against the project data schema.
 *
 * @param yamlString - The YAML string to parse and validate
 * @returns Validated project data object
 * @throws {InvalidYamlError} If YAML parsing or validation fails
 */
export async function parseAndValidateProjectYaml(yamlString: string): Promise<ProjectData> {
  try {
    // Parse YAML using safe load
    const parsed = load(yamlString);

    // Validate against schema and return
    return projectDataSchema.parse(parsed);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format Zod validation errors into detailed issues array
      const details = error.issues.map((e) => ({
        field: e.path.join(".") || "root",
        issue: e.message,
      }));
      throw new InvalidYamlError("The provided data is invalid.", details);
    }
    // Handle YAML parsing errors
    throw new InvalidYamlError(`Failed to parse YAML: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Updates a project's data.
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param projectId - Project ID slug
 * @param data - Validated project data object
 * @throws {ProjectNotFoundError} If project not found or not owned by user
 * @throws {Error} For database errors
 */
export async function updateProjectData(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  data: ProjectData
): Promise<void> {
  const { data: result, error } = await supabase
    .from("projects")
    .update({
      data: data,
    })
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .select("user_id")
    .maybeSingle();

  if (error) {
    throw new Error(`Database error while updating project data: ${error.message}`);
  }

  if (!result) {
    throw new ProjectNotFoundError();
  }
}

/**
 * Retrieves a project's data.
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param projectId - Project ID slug
 * @returns Project data object
 * @throws {ProjectNotFoundError} If project not found, not owned by user, or has no data
 * @throws {Error} For database errors
 */
export async function getProjectData(
  supabase: SupabaseClient,
  userId: string,
  projectId: string
): Promise<ProjectData> {
  const { data, error } = await supabase
    .from("projects")
    .select("data")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) {
    throw new Error(`Database error while fetching project data: ${error.message}`);
  }

  if (!data || !data.data) {
    throw new ProjectNotFoundError();
  }

  return data.data;
}

/**
 * Converts a project data object to YAML string.
 *
 * @param data - Project data object
 * @returns YAML string representation
 */
export function convertToYaml(data: ProjectData): string {
  return dump(data);
}

/**
 * Reorders multiple projects by updating their display_order values.
 * Verifies all projects exist and belong to the user before updating.
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param projectOrders - Array of project IDs with new display orders
 * @throws {ProjectNotFoundError} If any project not found or not owned by user
 * @throws {Error} For database errors
 */
export async function reorderProjects(
  supabase: SupabaseClient,
  userId: string,
  projectOrders: ProjectOrderEntry[]
): Promise<void> {
  // 1. Extract all project IDs
  const projectIds = projectOrders.map((p) => p.project_id);

  // 2. Fetch all projects to verify existence and ownership
  const { data: existingProjects, error: fetchError } = await supabase
    .from("projects")
    .select("project_id")
    .eq("user_id", userId)
    .in("project_id", projectIds);

  if (fetchError) {
    throw new Error(`Database error while fetching projects: ${fetchError.message}`);
  }

  // 3. Check if all projects exist
  const existingIds = new Set(existingProjects?.map((p) => p.project_id) || []);
  const missingIds = projectIds.filter((id) => !existingIds.has(id));

  if (missingIds.length > 0) {
    throw new ProjectNotFoundError();
  }

  // 4. Update each project's display_order
  for (const order of projectOrders) {
    const { error: updateError } = await supabase
      .from("projects")
      .update({ display_order: order.display_order })
      .eq("user_id", userId)
      .eq("project_id", order.project_id);

    if (updateError) {
      throw new Error(`Database error while updating project: ${updateError.message}`);
    }
  }
}
