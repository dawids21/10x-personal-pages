# Authentication API Plan (Revised v2)

This document specifies only the APIs required to deliver the trimmed Authentication feature per updated feedback. It aligns with the existing tech stack (Astro + Supabase) and the current database schema (docs/db-plan.md). It uses the Supabase server client via context.locals.supabase for server-side flows and removes endpoints and capabilities explicitly excluded in feedback.

1. Feature Overview

Scope for this plan:
- Email/password sign up with email verification link delivery
- Email/password sign in
- Resend verification for unverified sessions
- Logout (optional server endpoint)
- Verification handled by an SSR page (not an API endpoint) that exchanges the verification code and redirects

Out of scope for this plan (removed per feedback):
- Account deletion
- Password reset (request and completion)
- Service role admin client usage
- /api/auth/me endpoint (verification status is checked during server-side page rendering)

Core user workflows:
- Sign up: User submits email/password on /. Server creates the account and sends a verification email. User sees a “check your email” message.
- Verify (SSR): The user clicks the verification link; an SSR page at /auth/callback exchanges the code for a session and redirects to the dashboard.
- Sign in: User signs in via server API; a session cookie is established and the UI navigates to the dashboard.
- Resend verification: Unverified, authenticated users can request a resend.
- Access control: Public routes are "/" and "/page/*". All else is protected; verification is enforced at page render time via middleware/server rendering.

2. API Endpoints

Conventions:
- Implement as Astro endpoints under src/pages/api/auth/*.
- Use context.locals.supabase (server client) for session-bound operations; do not use any service role admin client.
- JSON responses use application/json; charset=utf-8.
- For all 4xx errors, use the ErrorResponse type defined in src/types.ts.

2.1 POST /api/auth/sign-up

Purpose
- Registers a new user with email/password and initiates an email verification flow.

Authentication/Authorization
- Public (no session required).

Request
- Body
  {
    "email": "user@example.com",
    "password": "StrongP@ssw0rd!"
  }

Response
- 200 OK
  {
    "status": "verification_required"
  }
- 400 Bad Request (invalid email/password format)
  {
    "error": { "code": "invalid_request", "message": "Email or password invalid" }
  }
- 409 Conflict (email already registered)
  {
    "error": { "code": "conflict", "message": "Email already in use" }
  }
- 500 Internal Server Error
  {
    "error": { "code": "internal_error", "message": "Unexpected error" }
  }

Notes
- Call locals.supabase.auth.signUp({ email, password, options: { emailRedirectTo: APP_URL + "/auth/callback?type=signup" } }).

2.2 POST /api/auth/sign-in

Purpose
- Authenticates a user with email/password and sets the session cookie on the server.

Authentication/Authorization
- Public (no session required).

Request
- Body
  {
    "email": "user@example.com",
    "password": "StrongP@ssw0rd!"
  }

Response
- 200 OK
  {
    "next": "/app"
  }
- 401 Unauthorized (invalid credentials)
  {
    "error": { "code": "unauthorized", "message": "Invalid credentials" }
  }
- 500 Internal Server Error
  {
    "error": { "code": "internal_error", "message": "Unexpected error" }
  }

Notes
- Call locals.supabase.auth.signInWithPassword({ email, password }).
- Do not leak whether the user is verified here; protected content will enforce verification during SSR rendering.

2.3 POST /api/auth/resend-verification

Purpose
- Resends a verification email to the current unverified session’s user. Session-based to avoid email enumeration.

Authentication/Authorization
- Requires a valid Supabase session cookie.
- If already verified, respond 204 (no-op).

Request
- No parameters or body.

Response
- 204 No Content
- 401 Unauthorized (no session)
  {
    "error": { "code": "unauthorized", "message": "Authentication required" }
  }
- 500 Internal Server Error
  {
    "error": { "code": "internal_error", "message": "Unexpected error" }
  }

Notes
- Call locals.supabase.auth.resend({ type: "signup" }).

2.4 POST /api/auth/sign-out (optional)

Purpose
- Clears the session cookie server-side. Client-side sign-out via SDK is also acceptable; this endpoint centralizes SSR flows.

Authentication/Authorization
- Requires a valid Supabase session cookie.

Request
- No body.

Response
- 204 No Content
- 401 Unauthorized
  {
    "error": { "code": "unauthorized", "message": "Authentication required" }
  }
- 500 Internal Server Error
  {
    "error": { "code": "internal_error", "message": "Unexpected error" }
  }

Notes
- Recommend CSRF protections: validate Origin/Referer == APP_URL.

3. Data Models

3.1 Request/Response Types

- Use ErrorResponse from src/types.ts for all 4xx client errors.
  - Shape:
    {
      "error": {
        "code": "string",
        "message": "string",
        "details": [ { "field": "string", "issue": "string" } ]?
      }
    }

Examples

- 409 Conflict (sign-up)
  {
    "error": { "code": "conflict", "message": "Email already in use" }
  }

- 400 Bad Request (sign-up validation)
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

- 401 Unauthorized (sign-in)
  {
    "error": { "code": "unauthorized", "message": "Invalid credentials" }
  }

Success payloads

- POST /api/auth/sign-up (200)
  { "status": "verification_required" }

- POST /api/auth/sign-in (200)
  { "next": "/app" }

4. Integration Points

4.1 Supabase Auth (Server SDK via locals.supabase)
- Sign up: locals.supabase.auth.signUp with emailRedirectTo = APP_URL + "/auth/callback?type=signup".
- Sign in: locals.supabase.auth.signInWithPassword; cookie set via server integration.
- Resend verification: locals.supabase.auth.resend({ type: "signup" }).
- Sign out (optional): locals.supabase.auth.signOut.

Environment variables:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- APP_URL

4.2 Middleware and Page Rendering
- Public routes: "/" and "/page/*" do not require auth.
- Protected routes (dashboard, protected APIs) require a valid session.
- Verification enforcement: Perform check during server-side page rendering; deny access when email_confirmed_at is not set and render an interstitial or redirect as per app UX.
- No /api/auth/me endpoint; session and verification status are derived server-side during SSR.

5. Technical Considerations

5.1 Security
- Email enumeration:
  - sign-up may return conflict for already-registered email; optionally downscope to a generic invalid_request if strict enumeration safety is desired.
  - resend-verification is session-bound and accepts no email parameter.

6. Endpoint Specifications Summary

POST /api/auth/sign-up
- Desc: Create user and send verification email.
- Auth: Public.
- 200, 400, 409, 429, 500.

POST /api/auth/sign-in
- Desc: Authenticate and set session cookie.
- Auth: Public.
- 200, 401, 429, 500.

POST /api/auth/resend-verification
- Desc: Resend verification to current session’s user.
- Auth: Session required.
- 204, 401, 429, 500.

POST /api/auth/sign-out (optional)
- Desc: Clear session cookie.
- Auth: Session required.
- 204, 401, 500.