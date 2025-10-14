# Authentication API Implementation Plan

## 1. Endpoint Overview

This implementation plan covers four REST API endpoints for user authentication:

- **POST /api/auth/sign-up**: Register new users with email/password and initiate email verification
- **POST /api/auth/sign-in**: Authenticate existing users and establish session cookies
- **POST /api/auth/resend-verification**: Resend verification emails to unverified users
- **POST /api/auth/sign-out**: Clear session cookies and log users out

All endpoints use Supabase Auth via `context.locals.supabase` (server client) and follow the ErrorResponse type from `src/types.ts` for error handling. Endpoints reuse the existing error handling pattern with custom error classes and the `handleApiError` utility.

## 2. Request Details

### 2.1 POST /api/auth/sign-up

- **HTTP Method**: POST
- **URL Structure**: `/api/auth/sign-up`
- **Authentication**: Public (no session required)
- **Content-Type**: `application/json; charset=utf-8`
- **Parameters**:
  - Required: None
  - Optional: None
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "StrongP@ssw0rd!"
  }
  ```

### 2.2 POST /api/auth/sign-in

- **HTTP Method**: POST
- **URL Structure**: `/api/auth/sign-in`
- **Authentication**: Public (no session required)
- **Content-Type**: `application/json; charset=utf-8`
- **Parameters**:
  - Required: None
  - Optional: None
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "StrongP@ssw0rd!"
  }
  ```

### 2.3 POST /api/auth/resend-verification

- **HTTP Method**: POST
- **URL Structure**: `/api/auth/resend-verification`
- **Authentication**: Requires valid Supabase session cookie
- **Content-Type**: N/A
- **Parameters**: None
- **Request Body**: None (empty body)

### 2.4 POST /api/auth/sign-out

- **HTTP Method**: POST
- **URL Structure**: `/api/auth/sign-out`
- **Authentication**: Requires valid Supabase session cookie
- **Content-Type**: N/A
- **Parameters**: None
- **Request Body**: None (empty body)

## 3. Used Types

### 3.1 New Types to Add to `src/types.ts`

```typescript
// ============================================================================
// Authentication Command Models
// ============================================================================

/**
 * Command for user sign-up
 * Used in: POST /api/auth/sign-up request
 */
export interface SignUpCommand {
  /** User's email address */
  email: string;
  /** User's password (min 8 characters) */
  password: string;
}

/**
 * Command for user sign-in
 * Used in: POST /api/auth/sign-in request
 */
export interface SignInCommand {
  /** User's email address */
  email: string;
  /** User's password */
  password: string;
}

// ============================================================================
// Authentication Response DTOs
// ============================================================================

/**
 * Response after successful sign-up
 * Used in: POST /api/auth/sign-up response
 */
export interface SignUpResponse {
  /** Status indicating verification is required */
  status: "verification_required";
}

/**
 * Response after successful sign-in
 * Used in: POST /api/auth/sign-in response
 */
export interface SignInResponse {
  /** URL to redirect user to after sign-in */
  next: string;
}
```

### 3.2 Existing Types from `src/types.ts`

- **ErrorResponse**: Used for all 4xx client errors
- **ValidationErrorDetail**: Used for detailed validation errors in ErrorResponse

## 4. Response Details

### 4.1 POST /api/auth/sign-up

**Success Response (200 OK)**:
```json
{
  "status": "verification_required"
}
```

**Error Responses**:
- **400 Bad Request** (invalid email/password format):
  ```json
  {
    "error": {
      "code": "invalid_request",
      "message": "Input validation failed",
      "details": [
        { "field": "email", "issue": "Invalid email format" },
        { "field": "password", "issue": "Must be at least 8 characters" }
      ]
    }
  }
  ```

- **409 Conflict** (email already registered):
  ```json
  {
    "error": {
      "code": "conflict",
      "message": "Email already in use"
    }
  }
  ```

- **500 Internal Server Error**:
  ```json
  {
    "error": {
      "code": "internal_error",
      "message": "Unexpected error"
    }
  }
  ```

### 4.2 POST /api/auth/sign-in

**Success Response (200 OK)**:
```json
{
  "next": "/app"
}
```

**Error Responses**:
- **401 Unauthorized** (invalid credentials):
  ```json
  {
    "error": {
      "code": "unauthorized",
      "message": "Invalid credentials"
    }
  }
  ```

- **500 Internal Server Error**:
  ```json
  {
    "error": {
      "code": "internal_error",
      "message": "Unexpected error"
    }
  }
  ```

### 4.3 POST /api/auth/resend-verification

**Success Response**: `204 No Content` (no body)

**Error Responses**:
- **401 Unauthorized** (no session):
  ```json
  {
    "error": {
      "code": "unauthorized",
      "message": "Authentication required"
    }
  }
  ```

- **500 Internal Server Error**:
  ```json
  {
    "error": {
      "code": "internal_error",
      "message": "Unexpected error"
    }
  }
  ```

### 4.4 POST /api/auth/sign-out

**Success Response**: `204 No Content` (no body)

**Error Responses**:
- **401 Unauthorized** (no session):
  ```json
  {
    "error": {
      "code": "unauthorized",
      "message": "Authentication required"
    }
  }
  ```

- **500 Internal Server Error**:
  ```json
  {
    "error": {
      "code": "internal_error",
      "message": "Unexpected error"
    }
  }
  ```

## 5. Data Flow

### 5.1 Sign-Up Flow

1. Client sends POST request to `/api/auth/sign-up` with email and password
2. Endpoint validates request body using Zod schema
3. Endpoint calls auth service
4. Service calls `locals.supabase.auth.signUp()` with:
   - `email`: User's email
   - `password`: User's password
   - `options.emailRedirectTo`: `{request_origin}/auth/callback?type=signup`
5. Supabase creates user account in `auth.users` table
6. Supabase sends verification email to user
7. Endpoint returns 200 with `{ status: "verification_required" }`
8. Client displays "check your email" message to user

**External Services**:
- Supabase Auth API
- Email service (via Supabase)

**Database Tables**:
- `auth.users` (managed by Supabase)

### 5.2 Sign-In Flow

1. Client sends POST request to `/api/auth/sign-in` with email and password
2. Endpoint validates request body using Zod schema
3. Endpoint calls auth service
4. Service calls `locals.supabase.auth.signInWithPassword()` with email and password
5. Supabase validates credentials against `auth.users` table
6. If valid, Supabase creates session and sets session cookies via server integration
7. Endpoint returns 200 with `{ next: "/app" }`
8. Client navigates to `/app` (dashboard)

**External Services**:
- Supabase Auth API

**Database Tables**:
- `auth.users` (managed by Supabase)

### 5.3 Resend Verification Flow

1. Client sends POST request to `/api/auth/resend-verification`
2. Endpoint checks for valid session via `locals.supabase.auth.getUser()`
3. If no session, return 401
4. Endpoint calls auth service
5. Service calls `locals.supabase.auth.resend({ type: "signup" })`
6. Supabase sends verification email to session's user
7. Endpoint returns 204 No Content

**Note**: If user is already verified, this is a no-op and still returns 204

**External Services**:
- Supabase Auth API
- Email service (via Supabase)

**Database Tables**:
- `auth.users` (managed by Supabase)

### 5.4 Sign-Out Flow

1. Client sends POST request to `/api/auth/sign-out`
2. Endpoint checks for valid session via `locals.supabase.auth.getUser()`
3. If no session, return 401
4. Endpoint calls auth service
5. Service calls `locals.supabase.auth.signOut()`
6. Supabase invalidates session and clears session cookies
7. Endpoint returns 204 No Content

**External Services**:
- Supabase Auth API

**Database Tables**:
- `auth.users` (managed by Supabase)

## 6. Security Considerations

### 6.1 Authentication and Authorization

- **Sign-up and Sign-in**: Public endpoints, no authentication required
- **Resend verification and Sign-out**: Require valid Supabase session cookie
- Session validation performed via `locals.supabase.auth.getUser()`

### 6.2 Input Validation

All input validation using Zod schemas:

```typescript
// src/lib/validators/auth.validators.ts
import { z } from 'zod';

export const signUpSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters")
});
```

### 6.3 Cookie Security

Session cookies set by Supabase server client with options:
- `httpOnly: true` - Prevents JavaScript access
- `secure: true` - HTTPS only
- `sameSite: 'lax'` - Protection against some cross-site attacks
- `path: '/'` - Available site-wide

Configuration in `src/db/supabase.client.ts`:
```typescript
export const cookieOptions: CookieOptionsWithName = {
  path: '/',
  secure: true,
  httpOnly: true,
  sameSite: 'lax',
};
```

## 7. Error Handling

### 7.1 Validation Errors (400)

**Trigger**: Invalid request body format or failed Zod validation

**Response**:
```json
{
  "error": {
    "code": "invalid_request",
    "message": "Input validation failed",
    "details": [
      { "field": "email", "issue": "Invalid email format" }
    ]
  }
}
```

**Implementation**:
```typescript
try {
  const body = signUpSchema.parse(await request.json());
} catch (error) {
  if (error instanceof z.ZodError) {
    return new Response(
      JSON.stringify({
        error: {
          code: "invalid_request",
          message: "Input validation failed",
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            issue: e.message
          }))
        }
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

### 7.2 Conflict Errors (409)

**Trigger**: Email already registered during sign-up

**Response**:
```json
{
  "error": {
    "code": "conflict",
    "message": "Email already in use"
  }
}
```

**Implementation**:
```typescript
const { data, error } = await supabase.auth.signUp({ email, password, options });

if (error) {
  if (error.message.includes('already registered')) {
    return new Response(
      JSON.stringify({
        error: {
          code: "conflict",
          message: "Email already in use"
        }
      }),
      { status: 409, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

### 7.3 Unauthorized Errors (401)

**Trigger**: Invalid credentials (sign-in) or missing session (resend-verification, sign-out)

**Response**:
```json
{
  "error": {
    "code": "unauthorized",
    "message": "Invalid credentials"
  }
}
```

**Implementation**:
```typescript
// For sign-in
if (error || !data.user) {
  return new Response(
    JSON.stringify({
      error: {
        code: "unauthorized",
        message: "Invalid credentials"
      }
    }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );
}

// For session-required endpoints
const { data: { user }, error } = await supabase.auth.getUser();
if (!user) {
  return new Response(
    JSON.stringify({
      error: {
        code: "unauthorized",
        message: "Authentication required"
      }
    }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );
}
```

### 7.4 Internal Server Errors (500)

**Trigger**: Supabase errors, network failures, unexpected exceptions

**Response**:
```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

**Implementation**:
```typescript
// Custom errors thrown by services are caught by handleApiError
try {
  // ... endpoint logic
  await authService.signUp(...);
} catch (error) {
  return handleApiError(error);
}
```
## 8. Implementation Steps

### Step 0: Install Required Dependencies

Ensure the `@supabase/ssr` package is installed:

```bash
npm install @supabase/ssr @supabase/supabase-js
```

### Step 1: Update Supabase Client to Support SSR

**File**: `src/db/supabase.client.ts`

Replace the current content with the following to add SSR support with proper cookie management:

```typescript
import { createClient } from "@supabase/supabase-js";
import type { AstroCookies } from "astro";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

// Client-side Supabase client (existing)
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Cookie options for SSR
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
};

// Helper function to parse cookie header
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

// Server-side Supabase client factory for SSR
export const createSupabaseServerInstance = (context: {
  headers: Headers;
  cookies: AstroCookies;
}) => {
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          context.cookies.set(name, value, options)
        );
      },
    },
  });

  return supabase;
};
```

**Note**: This preserves the existing `supabaseClient` export while adding the `createSupabaseServerInstance` function needed for authentication.

### Step 2: Update Middleware to Use Server Instance

**File**: `src/middleware/index.ts`

Replace the current content with the following to properly handle authentication in middleware:

```typescript
import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client";

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  // Auth API endpoints
  "/api/auth/sign-up",
  "/api/auth/sign-in",
  "/api/auth/resend-verification",
  "/api/auth/sign-out",
  // Add other public paths as needed (e.g., landing page, public pages)
  "/",
  "/page/*",
];

export const onRequest = defineMiddleware(
  async ({ locals, cookies, url, request, redirect }, next) => {
    // Create Supabase server instance with cookie support
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Make supabase available to all routes via locals
    locals.supabase = supabase;

    // Check if path is public
    const isPublicPath = PUBLIC_PATHS.some((path) => {
      if (path.endsWith("/*")) {
        return url.pathname.startsWith(path.slice(0, -2));
      }
      return url.pathname === path;
    });

    if (isPublicPath) {
      return next();
    }

    // Get user session for protected routes
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      locals.user = {
        email: user.email,
        id: user.id,
      };
    } else {
      // Redirect to login for protected routes
      return redirect("/auth/login");
    }

    return next();
  }
);
```

**Note**: This middleware now:
- Creates a server instance with proper cookie management
- Assigns it to `locals.supabase` for use in endpoints
- Handles authentication for protected routes
- Includes auth API endpoints in public paths

### Step 3: Update TypeScript Definitions

**File**: `src/env.d.ts`

Update or create this file to include proper types for `locals`:

```typescript
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    supabase: import("@supabase/supabase-js").SupabaseClient<
      import("./db/database.types").Database
    >;
    user?: {
      email: string | undefined;
      id: string;
    };
  }
}
```

### Step 4: Add Type Definitions

**File**: `src/types.ts`

Add the following types after the existing type definitions:

```typescript
// ============================================================================
// Authentication Command Models
// ============================================================================

/**
 * Command for user sign-up
 * Used in: POST /api/auth/sign-up request
 */
export interface SignUpCommand {
  /** User's email address */
  email: string;
  /** User's password (min 8 characters) */
  password: string;
}

/**
 * Command for user sign-in
 * Used in: POST /api/auth/sign-in request
 */
export interface SignInCommand {
  /** User's email address */
  email: string;
  /** User's password */
  password: string;
}

// ============================================================================
// Authentication Response DTOs
// ============================================================================

/**
 * Response after successful sign-up
 * Used in: POST /api/auth/sign-up response
 */
export interface SignUpResponse {
  /** Status indicating verification is required */
  status: "verification_required";
}

/**
 * Response after successful sign-in
 * Used in: POST /api/auth/sign-in response
 */
export interface SignInResponse {
  /** URL to redirect user to after sign-in */
  next: string;
}
```

### Step 5: Create Validation Schemas

**File**: `src/lib/validators/auth.validators.ts` (new file)

```typescript
import { z } from "zod";

/**
 * Validation schema for sign-up requests.
 * Used in POST /api/auth/sign-up request validation.
 */
export const signUpSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/**
 * Validation schema for sign-in requests.
 * Used in POST /api/auth/sign-in request validation.
 */
export const signInSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
```

### Step 6: Create Authentication Error Classes

**File**: `src/lib/errors/auth.errors.ts` (new file)

```typescript
/**
 * Error thrown when email is already registered during sign-up.
 */
export class EmailAlreadyRegisteredError extends Error {
  constructor(message = "Email already in use") {
    super(message);
    this.name = "EmailAlreadyRegisteredError";
  }
}

/**
 * Error thrown when sign-in credentials are invalid.
 */
export class InvalidCredentialsError extends Error {
  constructor(message = "Invalid credentials") {
    super(message);
    this.name = "InvalidCredentialsError";
  }
}

/**
 * Error thrown when authentication is required but not provided.
 */
export class AuthenticationRequiredError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "AuthenticationRequiredError";
  }
}

/**
 * Error thrown when Supabase auth operation fails unexpectedly.
 */
export class AuthServiceError extends Error {
  constructor(message = "Authentication service error") {
    super(message);
    this.name = "AuthServiceError";
  }
}
```

### Step 7: Update Error Handler Utility

**File**: `src/lib/utils/error-handler.utils.ts`

Add the following import and error handling cases after the existing imports:

```typescript
import {
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  AuthenticationRequiredError,
  AuthServiceError,
} from "../errors/auth.errors";
```

Then add these cases in the `handleApiError` function before the "Handle unknown errors" comment:

```typescript
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
```

### Step 8: Create Authentication Service

**File**: `src/lib/services/auth.service.ts` (new file)

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import {
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  AuthServiceError,
} from "@/lib/errors/auth.errors";

type SupabaseServerClient = SupabaseClient<Database>;

/**
 * Sign up a new user with email and password.
 * Throws EmailAlreadyRegisteredError if email is already in use.
 * Throws AuthServiceError for other Supabase errors.
 */
export async function signUp(
  supabase: SupabaseServerClient,
  email: string,
  password: string,
  emailRedirectTo: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
    },
  });

  if (error) {
    // Check if email is already registered
    if (
      error.message.includes("already registered") ||
      error.message.includes("User already registered")
    ) {
      throw new EmailAlreadyRegisteredError();
    }
    throw new AuthServiceError(error.message);
  }

  return data;
}

/**
 * Sign in an existing user with email and password.
 * Throws InvalidCredentialsError if credentials are invalid.
 * Throws AuthServiceError for other Supabase errors.
 */
export async function signIn(
  supabase: SupabaseServerClient,
  email: string,
  password: string
) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    throw new InvalidCredentialsError();
  }

  return data;
}

/**
 * Resend verification email to current session's user.
 * Throws AuthServiceError if resend fails.
 */
export async function resendVerification(supabase: SupabaseServerClient) {
  const { error } = await supabase.auth.resend({ type: "signup" });

  if (error) {
    throw new AuthServiceError(error.message);
  }
}

/**
 * Sign out the current user.
 * Throws AuthServiceError if sign-out fails.
 */
export async function signOut(supabase: SupabaseServerClient) {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new AuthServiceError(error.message);
  }
}
```

### Step 9: Implement POST /api/auth/sign-up

**File**: `src/pages/api/auth/sign-up.ts` (new file)

```typescript
import type { APIRoute } from "astro";
import { signUpSchema } from "@/lib/validators/auth.validators";
import * as authService from "@/lib/services/auth.service";
import type { SignUpCommand, SignUpResponse, ErrorResponse } from "@/types";
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
    await authService.signUp(
      locals.supabase,
      command.email,
      command.password,
      emailRedirectTo
    );

    // 4. Return success response
    const response: SignUpResponse = {
      status: "verification_required",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleApiError(error);
  }
};
```

### Step 10: Implement POST /api/auth/sign-in

**File**: `src/pages/api/auth/sign-in.ts` (new file)

```typescript
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
    await authService.signIn(
      locals.supabase,
      command.email,
      command.password
    );

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
```

### Step 11: Implement POST /api/auth/resend-verification

**File**: `src/pages/api/auth/resend-verification.ts` (new file)

```typescript
import type { APIRoute } from "astro";
import * as authService from "@/lib/services/auth.service";
import type { ErrorResponse } from "@/types";
import { handleApiError } from "@/lib/utils/error-handler.utils";

/**
 * POST /api/auth/resend-verification - Resend verification email
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

    // 2. Call service to resend verification (throws custom errors)
    await authService.resendVerification(locals.supabase);

    // 3. Return success response (no content)
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
};
```

### Step 12: Implement POST /api/auth/sign-out

**File**: `src/pages/api/auth/sign-out.ts` (new file)

```typescript
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
```