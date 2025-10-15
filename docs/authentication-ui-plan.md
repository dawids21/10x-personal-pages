# UI Plan for Authentication (Supabase Auth)

## 1. Feature UI Overview
This plan defines the user interface for email/password authentication using Supabase Auth, consolidating Sign In and Sign Up on the public landing page (/), enforcing access control for protected routes (/app and APIs), and introducing an SSR verification callback page (/auth/callback). The UI includes:
- Landing page with Auth Tabs (Sign In, Sign Up) and a post-sign-up “Check your email” interstitial.
- Verification callback page that processes the email verification link and redirects to /app or shows a verification error with the ability to resend verification.
- Unverified Interstitial shown when an authenticated but unverified user attempts to access protected content.
- Dashboard header with Logout control.
- Middleware/SSR gating that ensures only verified sessions can access protected views/APIs.

The UI emphasizes accessibility (WCAG 2.1 AA), security (generic error messaging, no email enumeration beyond what’s specified), and integration with existing UI structure and patterns.

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
    - /app: handle unverified state by rendering Unverified Interstitial instead of dashboard content.

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
    - SignInForm (new): email, password, Submit → POST /api/auth/sign-in; on 200 navigate to /app; show generic error on 401.
    - SignUpForm (new): email, password, Submit → POST /api/auth/sign-up; on 200 show “Check your email” interstitial; show inline errors for 400/409.
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
    - Generic error message for invalid credentials; do not disclose verification state here.
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
    - On error: clear message with option to re-initiate verification (Resend).
- Key UI elements and interactions:
    - StatusIndicator with role="status" while exchanging code.
    - On error state:
        - VerificationErrorMessage (safe copy: “Verification link is invalid or expired.”).
        - ResendVerificationButton (new) calling POST /api/auth/resend-verification if session exists; otherwise link to Sign In tab on /.
        - Link back to / for Sign In if no session.
- Reusable components:
    - Button, Alert, Spinner/Status.
- New components needed:
    - ResendVerificationButton (shared with Unverified Interstitial).
- UX, accessibility, and security considerations:
    - No sensitive details disclosed; generic failure copy.
    - Focus management: set focus to error headline on failure.
    - aria-live=”polite” for asynchronous status updates.

3) Unverified Interstitial (Protected Gate)
- View path: Rendered within /app when user is authenticated but unverified
- Type: New view fragment
- Main purpose:
    - Inform user that email is not verified and block access to dashboard content until verified.
- Key information to display:
    - “Your email is not verified” message.
    - Button to resend verification email.
    - Guidance to check inbox/spam and to try again.
- Key UI elements and interactions:
    - InterstitialCard with concise copy.
    - ResendVerificationButton → POST /api/auth/resend-verification; show success toast on 204.
    - “Back to landing” link if user opts to sign out and start over.
- Reusable components:
    - Card, Button, Toast, Link.
- New components needed:
    - ResendVerificationButton (shared).
- UX, accessibility, and security considerations:
    - Focus trap not required (not modal), but ensure initial focus on title or resend button.
    - Disable resend button during request; show success toast on completion.

4) Dashboard Header (Logout)
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

5) Redirect Behavior and Route Gate
- View path: /app (and protected endpoints)
- Type: Existing view behavior specification
- Main purpose:
    - Ensure unauthenticated users are redirected to / with Sign In tab active; ensure unverified users see the Unverified Interstitial instead of dashboard.
- Key information to display:
    - Loading skeleton while session/verification status is checked SSR-side.
- Key UI elements and interactions:
    - Minimal “Checking your session…” status indicator.
    - If verified: render Initial Page Setup or Admin Dashboard as defined in existing UI plan.
    - If unverified: render Unverified Interstitial.
- Reusable components:
    - Spinner/Status, Toast.
- New components needed:
    - None (behavioral integration).
- UX, accessibility, and security considerations:
    - Fast feedback on state; aria-live for status.

Requirement-to-UI mapping (highlights):
- Sign Up and verification required → SignUpForm + CheckEmailInterstitial + /auth/callback + Unverified Interstitial.
- Sign In → SignInForm on / with redirect to /app.
- Sign Out → AppHeader Logout.
- Public routes → “/” and “/page/*” unaffected; no login button in public headers.
- Protected routes/APIs → Route gate logic in /app, show Unverified Interstitial if needed.
- Resend verification → ResendVerificationButton in callback error and unverified interstitial.
- Consolidated auth UX → AuthTabs on landing page.

## 4. User Flow for This Feature

Primary flows:
- Sign Up:
    1) User navigates to / and switches to Sign Up tab.
    2) Submit email/password → POST /api/auth/sign-up.
    3) On 200: replace forms with CheckEmailInterstitial; instruct user to verify via email link.
    4) User clicks email link → /auth/callback exchanges code; on success, redirect to /app; on error, show error with option to resend (if session).
- Sign In:
    1) User navigates to / (Sign In tab default).
    2) Submit email/password → POST /api/auth/sign-in.
    3) On 200: redirect to /app.
    4) At /app SSR: if verified → proceed; if unverified → show Unverified Interstitial with Resend button.
- Logout:
    1) From any protected view, click Logout in AppHeader.
    2) POST /api/auth/sign-out.
    3) On 204: redirect to /.

Guard/redirect flows:
- Unauthenticated visiting protected route (/app or protected API):
    - Redirect to / with Sign In tab active (via query/hash).
- Unverified authenticated visiting /app:
    - Render Unverified Interstitial; access blocked until verified.

Error and edge flows:
- Invalid credentials (Sign In): generic error shown inline; inputs preserved except password.
- Sign Up validation (400) or conflict (409): inline field-level errors; focus first error.
- Verification link invalid/expired on /auth/callback: error view with Resend button (if session) or guidance to Sign In (if no session).
- Resend verification:
    - While request in-flight: disable button, show loading.
    - On success (204): show toast (“Verification email sent”).

## 5. Feature-Specific Components

New reusable components:
- AuthTabs
    - Accessible tabs switching between Sign In and Sign Up.
- SignInForm
    - Email, password; POST /api/auth/sign-in; redirects to /app.
- SignUpForm
    - Email, password; POST /api/auth/sign-up; shows CheckEmailInterstitial on success.
- CheckEmailInterstitial
    - Post-sign-up guidance UI.
- ResendVerificationButton
    - POST /api/auth/resend-verification; shared between /auth/callback error state and Unverified Interstitial.
- UnverifiedInterstitial
    - Rendered in /app for authenticated but unverified users; includes Resend button and guidance.

Reusable from existing library:
- Button, Input, Label, Card, Toast, Spinner/Status, Dialog/AlertDialog (if needed for any confirmations).

## 6. Testing and Edge Cases

Key UI scenarios to test:
- Happy path:
    - Sign Up → CheckEmailInterstitial → valid email link → /auth/callback → redirect /app → dashboard visible.
    - Sign In with verified account → /app dashboard visible.
    - Logout → redirect to /.
- Error states:
    - Sign In with invalid credentials → generic error; ensure tab remains Sign In; password cleared; email preserved.
    - Sign Up with invalid email/password (400) → inline field errors with proper aria-describedby.
    - Sign Up with existing email (409) → appropriate non-enumerating error; focus on error summary/field.
    - /auth/callback with invalid/expired link → error view; Resend button if session exists; link to / (Sign In) if no session.
- Loading states:
    - Disable submit buttons and show role="status" during API calls.
    - /auth/callback shows exchanging state before redirect or error.
    - /app shows brief checking state before rendering dashboard or unverified interstitial.
- Empty states:
    - Initial landing with no prior state shows Sign In tab by default.
    - CheckEmailInterstitial replaces forms completely after successful sign-up.
- Permission/access scenarios:
    - Unauthenticated visiting /app → redirect to / with Sign In tab active.
    - Authenticated but unverified visiting /app → Unverified Interstitial only.
    - Public pages at / and /page/* are accessible without auth.
- Edge cases specific to this feature:
    - Rapid repeated submits (debounce UI or disable during request).
    - Rate limiting responses surfaced from backend (429) display as inline alert/toast.
    - Network failures show retry affordance; maintain form input state.
    - Resend verification success is silent (204) → show toast and keep button disabled momentarily to prevent spamming.
    - Ensure no header “Login” exists on public pages; all auth is on /.
- Focus management for tab switches, error states, and interstitials (focus first actionable control).