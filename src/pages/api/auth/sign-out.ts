import type { APIRoute } from "astro";
import * as authService from "@/lib/services/auth.service";
import type { ErrorResponse } from "@/types";
import { handleApiError } from "@/lib/utils/error-handler.utils";

/**
 * POST /api/auth/sign-out - Sign out the current user
 *
 * @param locals - Astro context with Supabase client
 * @returns 204 No Content on success, or error response
 */
export const POST: APIRoute = async ({ locals }) => {
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

    // 2. Call service to sign out user (throws custom errors)
    await authService.signOut(locals.supabase);

    // 3. Return success response (no content)
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
};
