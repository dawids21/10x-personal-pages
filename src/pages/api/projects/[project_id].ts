import type { APIRoute } from "astro";
import { updateProjectNameSchema } from "@/lib/validators/projects.validators.ts";
import * as projectsService from "@/lib/services/projects.service.ts";
import type { UpdateProjectNameCommand, ErrorResponse } from "@/types.ts";
import { handleApiError } from "@/lib/utils/error-handler.utils.ts";

/**
 * GET /api/projects/{project_id} - Retrieve a single project
 *
 * @param params - Contains project_id
 * @param locals - Astro context with Supabase client
 * @returns 200 OK with project data, 404 if not found, or error response
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

    // 2. Extract project_id from params
    const projectId = params.project_id;
    if (!projectId) {
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_REQUEST",
            message: "Project ID is required",
          },
        } as ErrorResponse),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Call service to get project
    const project = await projectsService.getProjectById(locals.supabase, user.id, projectId);

    // 4. Return success response
    return new Response(JSON.stringify(project), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * PUT /api/projects/{project_id} - Update a project's name
 *
 * @param params - Contains project_id
 * @param request - Contains the new project name
 * @param locals - Astro context with Supabase client
 * @returns 200 OK with updated project data, or error response
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
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

    // 2. Extract project_id from params
    const projectId = params.project_id;
    if (!projectId) {
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_REQUEST",
            message: "Project ID is required",
          },
        } as ErrorResponse),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Parse and validate request body
    const body = await request.json();
    const validationResult = updateProjectNameSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Request validation failed",
            details: validationResult.error.errors.map((err) => ({
              field: err.path.join("."),
              issue: err.message,
            })),
          },
        } as ErrorResponse),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Call service to update project
    const command: UpdateProjectNameCommand = validationResult.data;
    const result = await projectsService.updateProjectName(locals.supabase, user.id, projectId, command);

    // 5. Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * DELETE /api/projects/{project_id} - Delete a project
 *
 * @param params - Contains project_id
 * @param locals - Astro context with Supabase client
 * @returns 204 No Content on success, 404 if not found, or error response
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
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

    // 2. Extract project_id from params
    const projectId = params.project_id;
    if (!projectId) {
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_REQUEST",
            message: "Project ID is required",
          },
        } as ErrorResponse),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Call service to delete project
    await projectsService.deleteProject(locals.supabase, user.id, projectId);

    // 4. Return success response (no content)
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
};
