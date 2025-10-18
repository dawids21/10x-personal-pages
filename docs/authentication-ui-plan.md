# UI Plan for Authentication (Supabase Auth)

## 1. Feature UI Overview
This plan defines the user interface for email/password authentication using Supabase Auth, consolidating Sign In and Sign Up on the public landing page (/), enforcing access control for protected routes (/app and APIs), and introducing an SSR verification callback page (/auth/callback). The UI includes:
- Landing page with Auth Tabs (Sign In, Sign Up) and a post-sign-up "Check your email" interstitial.
- Verification callback page that processes the email verification link and redirects to /app or shows a verification error.
- Sign in form that displays an error message when attempting to sign in with an unverified email address.
- Dashboard header with Logout control.
- Middleware/SSR gating that ensures only verified sessions can access protected views/APIs.

The UI emphasizes accessibility (WCAG 2.1 AA), security (generic error messaging, no email enumeration beyond what's specified), and integration with existing UI structure and patterns.

## 2. Integration Points
- Entry points:
    - Public landing page (/) with Auth Tabs (Sign In/Sign Up).
    - Verification link from email leads to /auth/callback (SSR).
- Exit points:
    - After successful Sign In → /app (Dashboard Entry).
    - After successful verification → /app (Dashboard Entry).
    - After Logout → / (Landing).
- Navigation changes or additions:
    - Add /auth/callback page (SSR) for verification handling and redirection.
    - No “Login” button in public headers; authentication UX is embedded on /.
    - Active Sign In tab enforced when unauthenticated users are redirected from protected routes to /.
- Existing views that need modifications:
    - Landing (/) page: integrate Auth Tabs and interstitial state.
    - Dashboard header (AppHeader): implement Logout button to call POST /api/auth/sign-out and redirect to /.

## 3. New/Modified Views and Components

1) Landing Page with Auth Tabs
- View path: /
- Type: Existing view modification
- Main purpose:
    - Provide consolidated Sign In and Sign Up experiences via tabs on the landing page. Show “Check your email” interstitial post sign-up.
- Key information to display:
    - App branding and short tagline.
    - Two tabs: Sign In and Sign Up.
    - After successful sign-up submission: interstitial message advising to check email for verification.
- Key UI elements and interactions:
    - AuthTabs (new): keyboard-accessible tabs with clear focus states and aria-controls/aria-selected.
    - SignInForm (new): email, password, Submit → POST /api/auth/sign-in; on 200 navigate to /app; show generic error on 401; show email verification message on 403.
    - SignUpForm (new): email, password, Submit → POST /api/auth/sign-up; on 200 show "Check your email" interstitial; show inline errors for 400/409.
    - CheckEmailInterstitial (new): replaces forms after sign-up success; provides guidance on next steps.
    - Tab activation logic:
        - Default to Sign In when redirected from protected routes.
        - Preserve tab via query or hash (e.g., ?auth=signin|signup).
    - Validation and state:
        - Disable submit during request, show loading indicator via aria-busy and role="status".
        - Inline error descriptions linked with aria-describedby.
- Reusable components from existing library:
    - Button, Input, Label, Card, Toast (success/info), Dialog (if needed).
- New components needed:
    - AuthTabs, SignInForm, SignUpForm, CheckEmailInterstitial.
- UX, accessibility, and security considerations:
    - WCAG-compliant labels, error text, and focus management (focus first invalid field on error).
    - Generic error message for invalid credentials (401).
    - Clear message for unverified email (403): "Please verify your email address before signing in. Check your inbox for the verification link."
    - Password field masked; prevent autofill issues with proper attributes.
    - Rate-limiting feedback (when surfaced by backend) displayed as non-blocking toast or inline alert.

2) Verification Callback Page
- View path: /auth/callback
- Type: New SSR view
- Main purpose:
    - Exchange the verification code from the email link, finalize verification, and redirect to /app; show error state if invalid/expired.
- Key information to display:
    - Loading state while processing verification.
    - On success: immediate redirect to /app.
    - On error: clear message directing user to sign up again or contact support.
- Key UI elements and interactions:
    - StatusIndicator with role="status" while exchanging code.
    - On error state:
        - VerificationErrorMessage (safe copy: "Verification link is invalid or expired. Please sign up again.").
        - Link back to / for Sign Up.
- Reusable components:
    - Button, Alert, Spinner/Status.
- New components needed:
    - None.
- UX, accessibility, and security considerations:
    - No sensitive details disclosed; generic failure copy.
    - Focus management: set focus to error headline on failure.
    - aria-live=”polite” for asynchronous status updates.

3) Dashboard Header (Logout)
- Component: AppHeader (existing)
- Type: Existing component modification
- Main purpose:
    - Provide a visible Logout control on protected pages.
- Key information to display:
    - Brand/logo link to /.
    - Logout button with clear icon and accessible label.
- Key UI elements and interactions:
    - Logout button → POST /api/auth/sign-out; on 204 redirect to /.
    - Confirm not required for logout; instant action.
- Reusable components:
    - Button.
- New components needed:
    - None.
- UX, accessibility, and security considerations:
    - Button has aria-label and visible text.
    - Ensure focus styles visible.
    - Maintain keyboard activation support (Enter/Space).

4) Redirect Behavior and Route Gate
- View path: /app (and protected endpoints)
- Type: Existing view behavior specification
- Main purpose:
    - Ensure unauthenticated users are redirected to / with Sign In tab active.
- Key information to display:
    - Loading skeleton while session status is checked SSR-side.
- Key UI elements and interactions:
    - Minimal "Checking your session…" status indicator.
    - If verified session: render Initial Page Setup or Admin Dashboard as defined in existing UI plan.
    - If no session: redirect to / with Sign In tab active.
- Reusable components:
    - Spinner/Status, Toast.
- New components needed:
    - None (behavioral integration).
- UX, accessibility, and security considerations:
    - Fast feedback on state; aria-live for status.

Requirement-to-UI mapping (highlights):
- Sign Up and verification required → SignUpForm + CheckEmailInterstitial + /auth/callback.
- Sign In → SignInForm on / with redirect to /app; blocked for unverified users with 403 error message.
- Sign Out → AppHeader Logout.
- Public routes → "/" and "/page/*" unaffected; no login button in public headers.
- Protected routes/APIs → Route gate logic in /app, redirect to / if no session.
- Verification errors → Error message on /auth/callback directing user to sign up again.
- Consolidated auth UX → AuthTabs on landing page.

## 4. User Flow for This Feature

Primary flows:
- Sign Up:
    1) User navigates to / and switches to Sign Up tab.
    2) Submit email/password → POST /api/auth/sign-up.
    3) On 200: replace forms with CheckEmailInterstitial; instruct user to verify via email link.
    4) User clicks email link → /auth/callback exchanges code; on success, redirect to /app; on error, show error directing user to sign up again.
- Sign In:
    1) User navigates to / (Sign In tab default).
    2) Submit email/password → POST /api/auth/sign-in.
    3) On 200: redirect to /app.
    4) On 403: show error message "Please verify your email address before signing in. Check your inbox for the verification link."
- Logout:
    1) From any protected view, click Logout in AppHeader.
    2) POST /api/auth/sign-out.
    3) On 204: redirect to /.

Guard/redirect flows:
- Unauthenticated visiting protected route (/app or protected API):
    - Redirect to / with Sign In tab active (via query/hash).
- Unverified user attempting to sign in:
    - Sign in blocked with 403 error; error message directs user to verify email.

Error and edge flows:
- Invalid credentials (Sign In): generic error shown inline; inputs preserved except password.
- Unverified email (Sign In): 403 error with clear message directing user to verify email; inputs preserved except password.
- Sign Up validation (400) or conflict (409): inline field-level errors; focus first error.
- Verification link invalid/expired on /auth/callback: error view with guidance to sign up again.

## 5. Feature-Specific Components

New reusable components:
- AuthTabs
    - Accessible tabs switching between Sign In and Sign Up.
- SignInForm
    - Email, password; POST /api/auth/sign-in; redirects to /app on 200; shows error on 401/403.
- SignUpForm
    - Email, password; POST /api/auth/sign-up; shows CheckEmailInterstitial on success.
- CheckEmailInterstitial
    - Post-sign-up guidance UI.

Reusable from existing library:
- Button, Input, Label, Card, Toast, Spinner/Status, Dialog/AlertDialog (if needed for any confirmations).

## 6. Testing and Edge Cases

Key UI scenarios to test:
- Happy path:
    - Sign Up → CheckEmailInterstitial → valid email link → /auth/callback → redirect /app → dashboard visible.
    - Sign In with verified account → /app dashboard visible.
    - Logout → redirect to /.
- Error states:
    - Sign In with invalid credentials (401) → generic error; ensure tab remains Sign In; password cleared; email preserved.
    - Sign In with unverified email (403) → clear error message directing to verify email; password cleared; email preserved.
    - Sign Up with invalid email/password (400) → inline field errors with proper aria-describedby.
    - Sign Up with existing email (409) → appropriate non-enumerating error; focus on error summary/field.
    - /auth/callback with invalid/expired link → error view with link to / (Sign Up).
- Loading states:
    - Disable submit buttons and show role="status" during API calls.
    - /auth/callback shows exchanging state before redirect or error.
    - /app shows brief checking state before rendering dashboard.
- Empty states:
    - Initial landing with no prior state shows Sign In tab by default.
    - CheckEmailInterstitial replaces forms completely after successful sign-up.
- Permission/access scenarios:
    - Unauthenticated visiting /app → redirect to / with Sign In tab active.
    - Unverified user attempting sign in → 403 error with verification reminder.
    - Public pages at / and /page/* are accessible without auth.
- Edge cases specific to this feature:
    - Rapid repeated submits (debounce UI or disable during request).
    - Rate limiting responses surfaced from backend (429) display as inline alert/toast.
    - Network failures show retry affordance; maintain form input state.
    - Ensure no header "Login" exists on public pages; all auth is on /.
- Focus management for tab switches, error states, and interstitials (focus first actionable control).