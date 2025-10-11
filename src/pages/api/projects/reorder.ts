import type { APIRoute } from "astro";
import { reorderProjectsSchema } from "@/lib/validators/projects.validators.ts";
import * as projectsService from "@/lib/services/projects.service.ts";
import type { ErrorResponse, ReorderProjectsCommand } from "@/types.ts";
import { handleApiError } from "@/lib/utils/error-handler.utils.ts";

/**
 * PUT /api/projects/reorder - Reorder multiple projects
 *
 * @param request - Contains array of project IDs with new display orders
 * @param locals - Astro context with Supabase client
 * @returns 200 OK on success, or error response
 */
export const PUT: APIRoute = async ({ request, locals }) => {
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
    const validationResult = reorderProjectsSchema.safeParse(body);

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

    // 3. Call service to reorder projects
    const command: ReorderProjectsCommand = validationResult.data;
    await projectsService.reorderProjects(locals.supabase, user.id, command.project_orders);

    // 4. Return success response
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleApiError(error);
  }
};
