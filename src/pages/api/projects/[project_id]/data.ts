import type { APIRoute } from "astro";
import { updateProjectDataSchema } from "@/lib/validators/projects.validators.ts";
import * as projectsService from "@/lib/services/projects.service.ts";
import type { ErrorResponse, UpdateProjectDataCommand } from "@/types.ts";
import { handleApiError } from "@/lib/utils/error-handler.utils.ts";

/**
 * POST /api/projects/{project_id}/data - Update a project's YAML data
 *
 * @param request - Contains the YAML data as a string
 * @param params - URL parameters containing project_id
 * @param locals - Astro context with Supabase client
 * @returns 200 OK with success message, or error response
 */
export const POST: APIRoute = async ({ request, params, locals }) => {
  try {
    // 1. Authentication check
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        } as ErrorResponse),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const validationResult = updateProjectDataSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: validationResult.error.errors.map((err) => ({
              field: err.path.join("."),
              issue: err.message,
            })),
          },
        } as ErrorResponse),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const command: UpdateProjectDataCommand = validationResult.data;

    // 3. Extract project_id from URL parameters
    const projectId = params.project_id;
    if (!projectId) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Project ID is required",
          },
        } as ErrorResponse),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Parse and validate YAML data
    const parsedData = await projectsService.parseAndValidateProjectYaml(command.data);

    // 5. Update project data in database
    await projectsService.updateProjectData(locals.supabase, user.id, projectId, parsedData);

    // 6. Return success response
    return new Response(
      JSON.stringify({
        message: "Project data updated successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * GET /api/projects/{project_id}/data - Download a project's data as a YAML file
 *
 * @param params - URL parameters containing project_id
 * @param locals - Astro context with Supabase client
 * @returns 200 OK with YAML file, 404 if not found, or error response
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Authentication check
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        } as ErrorResponse),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Extract project_id from URL parameters
    const projectId = params.project_id;
    if (!projectId) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Project ID is required",
          },
        } as ErrorResponse),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Get project data (throws ProjectNotFoundError if not found or no data)
    const projectData = await projectsService.getProjectData(locals.supabase, user.id, projectId);

    // 4. Convert data to YAML
    const yamlContent = projectsService.convertToYaml(projectData);

    // 5. Return YAML file as attachment
    return new Response(yamlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/yaml",
        "Content-Disposition": `attachment; filename="${projectId}.yaml"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
};
