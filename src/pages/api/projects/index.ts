import type { APIRoute } from "astro";
import { createProjectSchema } from "@/lib/validators/projects.validators.ts";
import * as projectsService from "@/lib/services/projects.service.ts";
import type { CreateProjectCommand, ErrorResponse } from "@/types.ts";
import { handleApiError } from "@/lib/utils/error-handler.utils.ts";

/**
 * POST /api/projects - Create a new project for the authenticated user
 *
 * @param request - Contains the project creation data (project_name, display_order)
 * @param locals - Astro context with Supabase client
 * @returns 201 Created with project data, or error response
 */
export const POST: APIRoute = async ({ request, locals }) => {
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
    const validationResult = createProjectSchema.safeParse(body);

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

    // 3. Call service to create project
    const command: CreateProjectCommand = validationResult.data;
    const result = await projectsService.createProject(locals.supabase, user.id, command);

    // 4. Return success response
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * GET /api/projects - Retrieve all projects for the authenticated user
 *
 * @param locals - Astro context with Supabase client
 * @returns 200 OK with array of projects, or error response
 */
export const GET: APIRoute = async ({ locals }) => {
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

    // 2. Call service to get projects
    const projects = await projectsService.getUserProjects(locals.supabase, user.id);

    // 3. Return success response
    return new Response(JSON.stringify(projects), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleApiError(error);
  }
};
