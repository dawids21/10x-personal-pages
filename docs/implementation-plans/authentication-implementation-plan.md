# Authentication API Implementation Plan

## 1. Endpoint Overview

This plan covers the implementation of four authentication endpoints that provide core user authentication functionality using Supabase Auth:

- **POST /api/auth/sign-up**: Registers a new user account with email/password and triggers email verification
- **POST /api/auth/sign-in**: Authenticates an existing user and establishes a session
- **POST /api/auth/resend-verification**: Resends verification email to authenticated but unverified users
- **POST /api/auth/sign-out**: Terminates the current user session

All endpoints integrate with Supabase Auth via `context.locals.supabase` server client and follow the ErrorResponse pattern defined in `src/types.ts`.

## 2. Request Details

### 2.1 POST /api/auth/sign-up

- **HTTP Method**: POST
- **URL Structure**: `/api/auth/sign-up`
- **Authentication**: Public (no session required)
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
- **Parameters**:
  - Required: None
  - Optional: None
- **Request Body**: None (empty body)

### 2.4 POST /api/auth/sign-out

- **HTTP Method**: POST
- **URL Structure**: `/api/auth/sign-out`
- **Authentication**: Requires valid Supabase session cookie
- **Parameters**:
  - Required: None
  - Optional: None
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
  /** User's password (minimum 8 characters) */
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
// Authentication Response Types
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
  /** Next route to navigate to (typically "/app") */
  next: string;
}
```

### 3.2 Existing Types to Use

- `ErrorResponse` from `src/types.ts` for all 4xx and 5xx error responses

## 4. Response Details

### 4.1 POST /api/auth/sign-up

**Success Response (200 OK):**
```json
{
  "status": "verification_required"
}
```

**Error Responses:**

- **400 Bad Request** (invalid input):
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

**Success Response (200 OK):**
```json
{
  "next": "/app"
}
```

**Error Responses:**

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

**Success Response:**
- **204 No Content** (no body)

**Error Responses:**

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

**Success Response:**
- **204 No Content** (no body)

**Error Responses:**

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
3. Endpoint builds redirect URL using `context.url.origin + "/auth/callback?type=signup"`
4. Endpoint calls `authService.signUp(email, password, redirectUrl)`
5. Service calls `locals.supabase.auth.signUp()` with:
   - email
   - password
   - options: `{ emailRedirectTo: <redirectUrl> }`
6. Supabase creates user in `auth.users` table
7. Supabase sends verification email to user
8. Service returns success status
9. Endpoint returns 200 with `{ status: "verification_required" }`

**Error Path:**
- If email exists: Supabase returns error → Service maps to 409 Conflict
- If validation fails: Endpoint returns 400 with validation details
- If Supabase fails: Service maps to 500 Internal Server Error

### 5.2 Sign-In Flow

1. Client sends POST request to `/api/auth/sign-in` with email and password
2. Endpoint validates request body using Zod schema
3. Endpoint calls `authService.signIn(email, password)`
4. Service calls `locals.supabase.auth.signInWithPassword({ email, password })`
5. Supabase validates credentials against `auth.users`
6. Supabase sets session cookie automatically (handled by Supabase SSR)
7. Service returns session data
8. Endpoint returns 200 with `{ next: "/app" }`

**Error Path:**
- If credentials invalid: Supabase returns error → Service maps to 401 Unauthorized
- If validation fails: Endpoint returns 400 with validation details
- If Supabase fails: Service maps to 500 Internal Server Error

### 5.3 Resend Verification Flow

1. Client sends POST request to `/api/auth/resend-verification`
2. Endpoint retrieves session from `locals.supabase.auth.getUser()`
3. If no session: Return 401 Unauthorized
4. Endpoint calls `authService.resendVerification()`
5. Service calls `locals.supabase.auth.resend({ type: "signup" })`
6. Supabase sends verification email
7. Service returns success
8. Endpoint returns 204 No Content

**Error Path:**
- If no session: Endpoint returns 401 Unauthorized
- If Supabase fails: Service maps to 500 Internal Server Error

### 5.4 Sign-Out Flow

1. Client sends POST request to `/api/auth/sign-out`
2. Endpoint retrieves session from `locals.supabase.auth.getUser()`
3. If no session: Return 401 Unauthorized
4. Endpoint calls `authService.signOut()`
5. Service calls `locals.supabase.auth.signOut()`
6. Supabase clears session cookie
7. Service returns success
8. Endpoint returns 204 No Content

**Error Path:**
- If no session: Endpoint returns 401 Unauthorized
- If Supabase fails: Service maps to 500 Internal Server Error

## 6. Security Considerations

### 6.1 Authentication & Authorization

- **Public endpoints** (sign-up, sign-in): No authentication required
- **Protected endpoints** (resend-verification, sign-out): Require valid Supabase session
- Session validation performed via `locals.supabase.auth.getUser()`

### 6.2 Input Validation

**Email validation:**
- Use Zod's `.email()` validator for format checking
- Normalize email to lowercase before processing

**Password validation:**
- Minimum 8 characters (Supabase default)
- Consider additional requirements: uppercase, lowercase, numbers, special characters
- Never log or expose passwords in responses

### 6.3 Email Enumeration

- **Sign-up**: Returns 409 Conflict if email exists (acceptable per spec, mild enumeration risk)
- **Resend verification**: Session-bound, accepts no email parameter (no enumeration risk)
- **Sign-in**: Generic "Invalid credentials" message (no indication of whether email exists)

## 7. Error Handling

### 7.1 Validation Errors (400 Bad Request)

**Trigger conditions:**
- Missing required fields (email, password)
- Invalid email format
- Password too short

**Implementation:**
```typescript
const signUpSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Must be at least 8 characters")
});
```

**Response format:**
Use `ErrorResponse` type with `details` array for field-level errors.

### 7.2 Authentication Errors

**401 Unauthorized:**
- No session for protected endpoints
- Invalid session token
- Sign-in with wrong credentials

### 7.3 Business Logic Errors

**409 Conflict:**
- Email already registered during sign-up

### 7.4 Server Errors (500)

**Trigger conditions:**
- Supabase connection failure
- Email delivery failure
- Unexpected Supabase errors

**Implementation:**
- Log detailed error to console with structured format
- Return generic error message to client (don't leak internal details)
- Include error tracking ID for debugging

### 7.5 Supabase Error Mapping

Create utility function to map Supabase errors to application errors:

```typescript
function mapSupabaseAuthError(error: AuthError): ErrorResponse {
  // Map specific Supabase error codes to application error codes
  // Examples:
  // - "user_already_exists" → 409 Conflict
  // - "invalid_credentials" → 401 Unauthorized
  // - Network errors → 500 Internal Server Error
}
```
## 8. Implementation Steps

### Step 1: Add Type Definitions

**File**: `src/types.ts`

Add the following type definitions at the end of the file:

```typescript
// ============================================================================
// Authentication Command Models
// ============================================================================

export interface SignUpCommand {
  email: string;
  password: string;
}

export interface SignInCommand {
  email: string;
  password: string;
}

// ============================================================================
// Authentication Response Types
// ============================================================================

export interface SignUpResponse {
  status: "verification_required";
}

export interface SignInResponse {
  next: string;
}
```

### Step 2: Create Zod Validation Schemas

**File**: `src/lib/validators/auth.validators.ts` (new file)

```typescript
import { z } from "zod";

export const signUpSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase(),
  password: z.string().min(8, "Must be at least 8 characters"),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});
```

### Step 3: Create Authentication Service

**File**: `src/lib/services/auth.service.ts` (new file)

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SignUpResponse, SignInResponse } from "../../types";

export class AuthService {
  constructor(private supabase: SupabaseClient) {}

  async signUp(
    email: string,
    password: string,
    redirectUrl: string
  ): Promise<SignUpResponse> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      throw this.mapSupabaseError(error);
    }

    return { status: "verification_required" };
  }

  async signIn(email: string, password: string): Promise<SignInResponse> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw this.mapSupabaseError(error);
    }

    return { next: "/app" };
  }

  async resendVerification(): Promise<void> {
    const { error } = await this.supabase.auth.resend({
      type: "signup",
    });

    if (error) {
      throw this.mapSupabaseError(error);
    }
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw this.mapSupabaseError(error);
    }
  }

  private mapSupabaseError(error: any): Error {
    // Map Supabase errors to HTTP errors
    // Implementation details in Step 4
    console.error("Supabase auth error:", error);

    if (error.message?.includes("already registered")) {
      const err = new Error("Email already in use");
      (err as any).status = 409;
      (err as any).code = "conflict";
      return err;
    }

    if (error.message?.includes("Invalid login credentials")) {
      const err = new Error("Invalid credentials");
      (err as any).status = 401;
      (err as any).code = "unauthorized";
      return err;
    }

    const err = new Error("Unexpected error");
    (err as any).status = 500;
    (err as any).code = "internal_error";
    return err;
  }
}
```

### Step 4: Implement POST /api/auth/sign-up

**File**: `src/pages/api/auth/sign-up.ts` (new file)

```typescript
import type { APIRoute } from "astro";
import { signUpSchema } from "../../../lib/validators/auth.validators";
import { AuthService } from "../../../lib/services/auth.service";
import type { ErrorResponse, SignUpResponse } from "../../../types";

export const POST: APIRoute = async (context) => {
  try {
    // Parse and validate request body
    const body = await context.request.json();
    const validation = signUpSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.errors.map((err) => ({
        field: err.path.join("."),
        issue: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: {
            code: "invalid_request",
            message: "Input validation failed",
            details: errors,
          },
        } satisfies ErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        }
      );
    }

    // Build redirect URL using request origin
    const redirectUrl = `${context.url.origin}/auth/callback?type=signup`;

    // Call auth service
    const authService = new AuthService(context.locals.supabase);
    const result = await authService.signUp(
      validation.data.email,
      validation.data.password,
      redirectUrl
    );

    return new Response(JSON.stringify(result satisfies SignUpResponse), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (error: any) {
    console.error("Sign-up error:", error);

    const status = error.status || 500;
    const code = error.code || "internal_error";
    const message = error.message || "Unexpected error";

    return new Response(
      JSON.stringify({
        error: { code, message },
      } satisfies ErrorResponse),
      {
        status,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }
};
```

### Step 5: Implement POST /api/auth/sign-in

**File**: `src/pages/api/auth/sign-in.ts` (new file)

```typescript
import type { APIRoute } from "astro";
import { signInSchema } from "../../../lib/validators/auth.validators";
import { AuthService } from "../../../lib/services/auth.service";
import type { ErrorResponse, SignInResponse } from "../../../types";

export const POST: APIRoute = async (context) => {
  try {
    // Parse and validate request body
    const body = await context.request.json();
    const validation = signInSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.errors.map((err) => ({
        field: err.path.join("."),
        issue: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: {
            code: "invalid_request",
            message: "Input validation failed",
            details: errors,
          },
        } satisfies ErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        }
      );
    }

    // Call auth service
    const authService = new AuthService(context.locals.supabase);
    const result = await authService.signIn(
      validation.data.email,
      validation.data.password
    );

    return new Response(JSON.stringify(result satisfies SignInResponse), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (error: any) {
    console.error("Sign-in error:", error);

    const status = error.status || 500;
    const code = error.code || "internal_error";
    const message = error.message || "Unexpected error";

    return new Response(
      JSON.stringify({
        error: { code, message },
      } satisfies ErrorResponse),
      {
        status,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }
};
```

### Step 6: Implement POST /api/auth/resend-verification

**File**: `src/pages/api/auth/resend-verification.ts` (new file)

```typescript
import type { APIRoute } from "astro";
import { AuthService } from "../../../lib/services/auth.service";
import type { ErrorResponse } from "../../../types";

export const POST: APIRoute = async (context) => {
  try {
    // Check for valid session
    const {
      data: { user },
      error: userError,
    } = await context.locals.supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: {
            code: "unauthorized",
            message: "Authentication required",
          },
        } satisfies ErrorResponse),
        {
          status: 401,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        }
      );
    }

    // Call auth service
    const authService = new AuthService(context.locals.supabase);
    await authService.resendVerification();

    return new Response(null, {
      status: 204,
    });
  } catch (error: any) {
    console.error("Resend verification error:", error);

    const status = error.status || 500;
    const code = error.code || "internal_error";
    const message = error.message || "Unexpected error";

    return new Response(
      JSON.stringify({
        error: { code, message },
      } satisfies ErrorResponse),
      {
        status,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }
};
```

### Step 7: Implement POST /api/auth/sign-out

**File**: `src/pages/api/auth/sign-out.ts` (new file)

```typescript
import type { APIRoute } from "astro";
import { AuthService } from "../../../lib/services/auth.service";
import type { ErrorResponse } from "../../../types";

export const POST: APIRoute = async (context) => {
  try {
    // Check for valid session
    const {
      data: { user },
      error: userError,
    } = await context.locals.supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: {
            code: "unauthorized",
            message: "Authentication required",
          },
        } satisfies ErrorResponse),
        {
          status: 401,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        }
      );
    }

    // Call auth service
    const authService = new AuthService(context.locals.supabase);
    await authService.signOut();

    return new Response(null, {
      status: 204,
    });
  } catch (error: any) {
    console.error("Sign-out error:", error);

    const status = error.status || 500;
    const code = error.code || "internal_error";
    const message = error.message || "Unexpected error";

    return new Response(
      JSON.stringify({
        error: { code, message },
      } satisfies ErrorResponse),
      {
        status,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }
};
```

### Step 8: Update Environment Variables

**File**: `.env.example` or documentation

Add required environment variables:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

**Note:** The application URL is automatically detected from `context.url.origin` at runtime, so no APP_URL environment variable is needed.