import type { APIRoute } from "astro";
import { signInSchema } from "@/lib/validators/auth.validators";
import * as authService from "@/lib/services/auth.service";
import type { SignInCommand, SignInResponse, ErrorResponse } from "@/types";
import { handleApiError } from "@/lib/utils/error-handler.utils";

/**
 * POST /api/auth/sign-in - Authenticate a user
 *
 * @param request - Contains email and password
 * @param locals - Astro context with Supabase client
 * @returns 200 OK with redirect URL, or error response
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const validationResult = signInSchema.safeParse(body);

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

    const command: SignInCommand = validationResult.data;

    // 2. Call service to sign in user (throws custom errors)
    await authService.signIn(locals.supabase, command.email, command.password);

    // 3. Return success response
    const response: SignInResponse = {
      next: "/app",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleApiError(error);
  }
};
