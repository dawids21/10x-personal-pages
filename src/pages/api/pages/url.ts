import type { APIRoute } from "astro";
import { updatePageUrlSchema } from "@/lib/validators/pages.validators.ts";
import * as pagesService from "@/lib/services/pages.service.ts";
import type { ErrorResponse, UpdatePageUrlCommand } from "@/types.ts";
import { handleApiError } from "@/lib/utils/error-handler.utils.ts";

/**
 * POST /api/pages/url - Update the authenticated user's page URL slug
 *
 * @param request - Contains the new URL slug
 * @param locals - Astro context with Supabase client
 * @returns 200 OK with success message and updated URL, or error response
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
    const validationResult = updatePageUrlSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid URL format",
            details: validationResult.error.errors.map((err) => ({
              field: err.path.join("."),
              issue: err.message,
            })),
          },
        } as ErrorResponse),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const command: UpdatePageUrlCommand = validationResult.data;

    // 3. Check if URL is reserved (throws ReservedUrlError if reserved)
    pagesService.checkReservedUrl(command.url);

    // 4. Check URL availability (throws UrlAlreadyTakenError if taken)
    await pagesService.checkUrlAvailability(locals.supabase, command.url, user.id);

    // 5. Update page URL (throws PageNotFoundError if no page exists)
    await pagesService.updatePageUrl(locals.supabase, user.id, command.url);

    // 6. Return success response
    return new Response(
      JSON.stringify({
        message: "Page URL updated successfully",
        url: command.url,
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
