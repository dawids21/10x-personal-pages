import type { APIRoute } from "astro";
import { signUpSchema } from "@/lib/validators/auth.validators";
import * as authService from "@/lib/services/auth.service";
import type { SignUpCommand, ErrorResponse } from "@/types";
import { handleApiError } from "@/lib/utils/error-handler.utils";

/**
 * POST /api/auth/sign-up - Register a new user
 *
 * @param request - Contains email and password
 * @param locals - Astro context with Supabase client
 * @returns 200 OK with verification status, or error response
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const validationResult = signUpSchema.safeParse(body);

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

    const command: SignUpCommand = validationResult.data;

    // 2. Get request origin for email redirect URL
    const requestUrl = new URL(request.url);
    const origin = requestUrl.origin;
    const emailRedirectTo = `${origin}/auth/callback?type=signup`;

    // 3. Call service to sign up user (throws custom errors)
    await authService.signUp(locals.supabase, command.email, command.password, emailRedirectTo);

    return new Response(null, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleApiError(error);
  }
};
