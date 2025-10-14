import type { ErrorResponse } from "@/types.ts";
import {
  PageAlreadyExistsError,
  PageNotFoundError,
  ReservedUrlError,
  UrlAlreadyTakenError,
} from "../errors/pages.errors";
import { ProjectNotFoundError } from "../errors/projects.errors";
import { InvalidYamlError } from "../errors/shared.errors";
import {
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  AuthenticationRequiredError,
  AuthServiceError,
} from "../errors/auth.errors";

/**
 * Centralized error handler for API endpoints.
 * Maps custom error types to appropriate HTTP responses with proper status codes.
 *
 * @param error - The error to handle
 * @returns HTTP Response with appropriate status code and error body
 */
export function handleApiError(error: unknown): Response {
  // Handle known custom errors
  if (error instanceof PageAlreadyExistsError) {
    return new Response(
      JSON.stringify({
        error: {
          code: "PAGE_ALREADY_EXISTS",
          message: error.message,
        },
      } as ErrorResponse),
      { status: 409, headers: { "Content-Type": "application/json" } }
    );
  }

  if (error instanceof UrlAlreadyTakenError) {
    return new Response(
      JSON.stringify({
        error: {
          code: "URL_ALREADY_TAKEN",
          message: error.message,
        },
      } as ErrorResponse),
      { status: 409, headers: { "Content-Type": "application/json" } }
    );
  }

  if (error instanceof PageNotFoundError) {
    return new Response(
      JSON.stringify({
        error: {
          code: "PAGE_NOT_FOUND",
          message: error.message,
        },
      } as ErrorResponse),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  if (error instanceof InvalidYamlError) {
    return new Response(
      JSON.stringify({
        error: {
          code: "INVALID_YAML",
          message: error.message,
          details: error.details,
        },
      } as ErrorResponse),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (error instanceof ReservedUrlError) {
    return new Response(
      JSON.stringify({
        error: {
          code: "RESERVED_URL",
          message: error.message,
        },
      } as ErrorResponse),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (error instanceof ProjectNotFoundError) {
    return new Response(
      JSON.stringify({
        error: {
          code: "PROJECT_NOT_FOUND",
          message: error.message,
        },
      } as ErrorResponse),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  if (error instanceof EmailAlreadyRegisteredError) {
    return new Response(
      JSON.stringify({
        error: {
          code: "EMAIL_ALREADY_REGISTERED",
          message: error.message,
        },
      } as ErrorResponse),
      { status: 409, headers: { "Content-Type": "application/json" } }
    );
  }

  if (error instanceof InvalidCredentialsError) {
    return new Response(
      JSON.stringify({
        error: {
          code: "INVALID_CREDENTIALS",
          message: error.message,
        },
      } as ErrorResponse),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  if (error instanceof AuthenticationRequiredError) {
    return new Response(
      JSON.stringify({
        error: {
          code: "AUTHENTICATION_REQUIRED",
          message: error.message,
        },
      } as ErrorResponse),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  if (error instanceof AuthServiceError) {
    return new Response(
      JSON.stringify({
        error: {
          code: "AUTH_SERVICE_ERROR",
          message: error.message,
        },
      } as ErrorResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Handle unknown errors
  return new Response(
    JSON.stringify({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      },
    } as ErrorResponse),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}
