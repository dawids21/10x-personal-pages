import type { APIRoute } from "astro";
import { createPageSchema, updatePageThemeSchema } from "@/lib/validators/pages.validators.ts";
import * as pagesService from "../../lib/services/pages.service";
import type { CreatePageCommand, ErrorResponse, UpdatePageThemeCommand } from "@/types.ts";
import { handleApiError } from "@/lib/utils/error-handler.utils.ts";

/**
 * POST /api/pages - Create a new personal page for the authenticated user
 *
 * @param request - Contains the page creation data (url, theme, optional data)
 * @param locals - Astro context with Supabase client
 * @returns 201 Created with page data, or error response
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
    const validationResult = createPageSchema.safeParse(body);

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

    // 3. Call service to create page
    const command: CreatePageCommand = validationResult.data;
    const result = await pagesService.createPage(locals.supabase, user.id, command);

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
 * GET /api/pages - Retrieve the authenticated user's page configuration
 *
 * @param locals - Astro context with Supabase client
 * @returns 200 OK with page data, 404 if not found, or error response
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

    // 2. Call service to get page
    const page = await pagesService.getPageByUserId(locals.supabase, user.id);

    // 3. Return success response
    return new Response(JSON.stringify(page), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * PUT /api/pages - Update the theme of the authenticated user's page
 *
 * @param request - Contains the new theme data
 * @param locals - Astro context with Supabase client
 * @returns 200 OK with updated page data, or error response
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
    const validationResult = updatePageThemeSchema.safeParse(body);

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

    // 3. Call service to update page theme
    const command: UpdatePageThemeCommand = validationResult.data;
    const result = await pagesService.updatePageTheme(locals.supabase, user.id, command);

    // 4. Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * DELETE /api/pages - Delete the authenticated user's page
 *
 * @param locals - Astro context with Supabase client
 * @returns 204 No Content on success, 404 if not found, or error response
 */
export const DELETE: APIRoute = async ({ locals }) => {
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

    // 2. Call service to delete page
    await pagesService.deletePage(locals.supabase, user.id);

    // 3. Return success response (no content)
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
};
