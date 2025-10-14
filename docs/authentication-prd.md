# Product Requirements Document (PRD) - Authentication (Supabase Auth)

## 1. Feature Overview

The Authentication feature introduces secure, email/password-based user authentication using Supabase Auth. The solution
will:

- Allow users to register, verify their email, log in, and log out.
- Protect all application views and API endpoints except the public landing page at "/" and public content pages at "/page/*".
- Consolidate sign-in and sign-up flows into the landing page via tabs/sections.
- Require email verification prior to accessing any authenticated content or API.
- Provide post-sign-up interstitial feedback ("Check your email") and redirect verified users directly to the dashboard.
- Enforce that template downloads and authoring actions are available only to authenticated users.
- Maintain accessibility (WCAG 2.1 AA) and English-only copy for MVP.

## 2. User Problem

Currently, the app lacks real authentication. This prevents secure, personalized access to the dashboard and upload
features and does not allow for a real multi-user environment. Users cannot safely manage their own content or protect
administrative operations like YAML uploads, project management, or account settings. The absence of access control also
creates security and privacy risks. This feature addresses these constraints by enabling secure account creation,
session management, route protection, and email verification.

## 3. Functional Requirements

### 3.1 Authentication methods and flows

- Email + password only for MVP (no OAuth, no magic links).
- Sign-up with required email verification prior to accessing protected areas and APIs.
- Sign-in with email and password; if the account is unverified, show a verification-required message and offer resend
  verification.
- Sign-out invalidates the current session and returns the user to the public landing page.

### 3.2 Access control and routing

- Public routes: "/" and "/page/*" (user main page and project pages).
- Protected routes and APIs: all other views (e.g., dashboard) and endpoints require an authenticated, verified session.
- Unauthenticated access to protected routes results in redirect to "/" with focus on Sign In tab.
- Unverified users signed in who attempt to access protected content see a verification-required interstitial and cannot
  proceed until verified.
- YAML template download and any authoring operations are only available to authenticated users.

### 3.3 UX behavior and navigation

- The landing page "/" includes tabs/sections for Sign In and Sign Up.
- After sign-up, show an interstitial "Check your email" confirmation.
- After email verification, redirect users directly to the dashboard.
- The public site header does not include a login button (auth UX is on "/").
- The dashboard header shows a visible "Logout" control.
- English-only UI and emails for MVP, with structure that supports future localization.

### 3.4 Email and verification

- Verification emails are sent upon registration.
- On invalid/expired verification links, display clear, safe error messages and allow re-initiation of the
  flow (resend verification).
- Resend verification email is available for unverified users.

### 3.5 Security, sessions, and compliance

- Sessions are managed by Supabase Auth; details (persistence, cookie policies, secure flags) will be defined in
  technical specs.
- Follow WCAG 2.1 AA accessibility principles for all auth UIs (labels, keyboard navigation, focus states, error
  messaging).

### 3.6 Redirects and app state

- Define redirect URLs for verification success/error in technical specs.
- Post-auth flows:
    - After sign-in: dashboard.
    - After verification: dashboard.
    - After logout: "/".

## 4. Feature Boundaries

### 4.1 In scope (MVP)

- Email/password authentication using Supabase Auth.
- Email verification via email links.
- Route and API protection (public vs protected).
- Landing page auth UX with tabs for Sign In and Sign Up.
- Post-sign-up interstitial ("Check your email").
- Redirects after auth events (defined in tech specs).
- English-only copy; WCAG 2.1 AA compliance for auth flows.
- Restrict YAML template download and authoring actions to authenticated users.

### 4.2 Out of scope (MVP)

- OAuth providers, magic links, and social logins.
- Admin/backoffice capabilities.
- Multilingual support beyond English.
- Advanced support tooling (helpdesk, ticketing).
- Custom email sender domain configuration beyond a minimal working setup.
- Advanced fraud detection beyond basic rate limiting/brute-force protections.
- Password reset and recovery flows.
- Self-serve account deletion.

## 5. User Stories

### AUTH-001 - Sign Up, Verification Requirement, and Redirect

- Description: As a new user, I want to register with email/password, be required to verify my email before accessing
  protected content, and be redirected to the dashboard after successful verification.
- Acceptance Criteria:
    - Given I am on "/" and select the Sign Up tab,
    - When I submit a valid email and a strong password,
    - Then my account is created using Supabase Auth,
    - And I see a "Check your email" interstitial instructing me to verify my email.
    - Given my account is created but not verified,
    - When I attempt to access any protected page or API,
    - Then I am blocked and shown a verification-required message (with an option to resend verification),
    - And I cannot proceed until verification is complete.
    - Given I receive a verification email,
    - When I click the valid verification link,
    - Then my email is marked as verified,
    - And I am redirected to the dashboard.

### AUTH-002 - Sign In

- Description: As a returning user, I want to sign in with email and password to manage my content.
- Acceptance Criteria:
    - Given I am on "/" and I select the Sign In tab,
    - When I submit valid credentials,
    - Then I am authenticated via Supabase Auth,
    - And I am redirected to the dashboard.

### AUTH-003 - Sign Out

- Description: As an authenticated user, I want to sign out to end my session securely.
- Acceptance Criteria:
    - Given I am signed in and on any protected page,
    - When I click "Logout" in the dashboard header,
    - Then my session is terminated,
    - And I am redirected to "/".

### AUTH-004 - Access Control: Public and Protected Routes

- Description: As a visitor, I want public routes to be accessible without auth and protected routes to require
  authentication.
- Acceptance Criteria:
    - Given I am not authenticated,
    - When I visit "/" or any "/page/*" URL,
    - Then the pages load without requiring authentication.
    - Given I am not authenticated,
    - When I visit any protected route (e.g., dashboard) or call protected APIs,
    - Then I am redirected to "/",
    - And the Sign In tab is active.

### AUTH-005 - Invalid Credentials Error

- Description: As a user, I want clear feedback if I enter invalid sign-in credentials.
- Acceptance Criteria:
    - Given I am on the Sign In tab,
    - When I submit an invalid email/password combination,
    - Then I see a non-specific error message indicating the credentials are invalid,
    - And I remain on the Sign In tab with inputs preserved as safe.

### AUTH-006 - Consolidated Auth UX on Landing Page

- Description: As a user, I want all auth flows on "/" to reduce friction and confusion.
- Acceptance Criteria:
    - Given I visit "/",
    - When I need to sign in or sign up,
    - Then I can accomplish both flows via tabs/sections on the same page.

## 6. Success Metrics

- No additional feature-specific success metrics beyond the global PRD metrics.
