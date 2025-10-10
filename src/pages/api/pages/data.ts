import type { APIRoute } from "astro";
import { updatePageDataSchema } from "@/lib/validators/pages.validators.ts";
import * as pagesService from "@/lib/services/pages.service.ts";
import type { ErrorResponse, UpdatePageDataCommand } from "@/types.ts";
import { handleApiError } from "@/lib/utils/error-handler.utils.ts";

/**
 * POST /api/pages/data - Update the authenticated user's page YAML data
 *
 * @param request - Contains the YAML data as a string
 * @param locals - Astro context with Supabase client
 * @returns 200 OK with success message, or error response
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
    const validationResult = updatePageDataSchema.safeParse(body);

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

    const command: UpdatePageDataCommand = validationResult.data;

    // 3. Parse and validate YAML data
    const parsedData = await pagesService.parseAndValidateYaml(command.data);

    // 4. Update page data in database
    await pagesService.updatePageData(locals.supabase, user.id, parsedData);

    // 5. Return success response
    return new Response(
      JSON.stringify({
        message: "Page data updated successfully",
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
 * GET /api/pages/data - Download the authenticated user's page data as a YAML file
 *
 * @param locals - Astro context with Supabase client
 * @returns 200 OK with YAML file, 404 if not found, or error response
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

    // 2. Get page data (returns null if no data exists, throws if no page)
    const pageData = await pagesService.getPageData(locals.supabase, user.id);

    // 3. Convert data to YAML (pageData can be null if page exists but has no data)
    const yamlContent = pagesService.convertToYaml(pageData);

    // 4. Return YAML file as attachment
    return new Response(yamlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/yaml",
        "Content-Disposition": 'attachment; filename="page.yaml"',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
};
