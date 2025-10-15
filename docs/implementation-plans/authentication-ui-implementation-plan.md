# Authentication - UI Implementation Plan

## 1. Overview
**Purpose**: Implement secure, accessible email/password authentication UI using Supabase Auth, including sign-up with email verification, sign-in, sign-out, and verification callback handling.

**Feature Context**: This authentication system provides the foundation for user account management, enabling access to protected dashboard routes and API endpoints while keeping public content pages accessible to all users.

**Primary User Goal**: Users need to create accounts, verify their email addresses, securely sign in to manage their personal portfolio pages, and sign out when finished.

## 2. View Routing

### Landing Page with Authentication
**Path**: `/`
**Route Parameters**: None
**Access Control**: Public (no authentication required)
**Navigation Context**:
- Entry point for all authentication flows
- Redirect destination for unauthenticated users attempting to access protected routes
- Exit point after logout

### Verification Callback Page
**Path**: `/auth/callback`
**Route Parameters**: Query parameters: `code` (verification token), `type` (callback type)
**Access Control**: Public (handles verification before authentication)
**Navigation Context**:
- Entry from email verification link
- On success: redirect to `/app` (dashboard)
- On error: display error with link back to landing

### Dashboard (Protected)
**Path**: `/app`
**Route Parameters**: None
**Access Control**: Requires authenticated and verified session
**Navigation Context**:
- Destination after successful sign-in
- Destination after successful email verification

## 3. Component Structure

```
Landing Page (/)
├── PageLayout
│   └── AuthenticationSection
│       ├── AuthTabs
│       │   ├── TabButton (Sign In)
│       │   └── TabButton (Sign Up)
│       ├── TabPanel (Sign In) [when active]
│       │   └── SignInForm
│       │       ├── EmailInput (Shadcn Input + Label)
│       │       ├── PasswordInput (Shadcn Input + Label)
│       │       ├── ErrorDisplay
│       │       └── SubmitButton (Shadcn Button)
│       ├── TabPanel (Sign Up) [when active]
│       │   └── SignUpForm
│       │       ├── EmailInput (Shadcn Input + Label)
│       │       ├── PasswordInput (Shadcn Input + Label)
│       │       ├── PasswordRequirementsHint
│       │       ├── ErrorDisplay
│       │       └── SubmitButton (Shadcn Button)
│       └── CheckEmailInterstitial [after sign-up success]
│           ├── SuccessIcon
│           ├── MessageText
│           └── BackToSignInLink

Verification Callback Page (/auth/callback) [SSR]
├── PageLayout
│   └── VerificationResult
│       ├── ErrorState [on failure]
│       │   ├── ErrorMessage
│       │   └── BackToSignInLink
│       └── SuccessState [redirect to /app via SSR]

Dashboard (/app)
├── AppHeader
│   ├── BrandLogo (Link to /)
│   └── LogoutButton (Shadcn Button)
└── DashboardContent
```

## 4. Component Details

### AuthTabs
**Purpose**: Provide keyboard-accessible tab navigation between Sign In and Sign Up forms
**Elements**:
- Tab list container with role="tablist"
- Two tab buttons (Sign In, Sign Up) with role="tab"
- Tab panels with role="tabpanel"

**Props**: None

**State**:
- `activeTab`: `'signin' | 'signup'` - Currently active tab (defaults to 'signin')
- Managed within component

**Events**:
- Click on tab button: Switch active tab
- Arrow key navigation: Move between tabs (Left/Right arrows)
- Home/End keys: Jump to first/last tab

**Validation**: None

**Types**:
- Custom type: `AuthTab = 'signin' | 'signup'`

**Accessibility Notes**:
- aria-selected="true|false" on tab buttons
- aria-controls linking tab to panel ID
- tabindex management (0 for active, -1 for inactive)

### SignInForm
**Purpose**: Authenticate existing users with email and password

**Elements**:
- Email input field (Shadcn Input)
- Password input field (Shadcn Input)
- Submit button (Shadcn Button)
- Error message container

**Props**: None (self-contained)

**State**:
- `email`: `string` - Email input value
- `password`: `string` - Password input value
- `isSubmitting`: `boolean` - Whether form is submitting
- `error`: `string | null` - General form error message
- `fieldErrors`: `Record<string, string>` - Field-specific errors from Zod validation

**Events**:
- Form submit: Validates inputs with Zod, calls POST /api/auth/sign-in, handles response
- Input change: Updates form state, clears field-specific errors

**Validation** (using Zod):
- Email: Required, valid email format
- Password: Required, minimum 1 character
- Submit disabled during API request

**Types**:
- Request: `SignInCommand`
- Response: 200 with empty body | `ErrorResponse`
- Internal state: Component state (no shared type needed)

**Error Handling**:
- 401: Display "Invalid email or password"
- 500: Display "An unexpected error occurred. Please try again."
- Network error: Display "Network error. Please check your connection."

### SignUpForm
**Purpose**: Register new users with email and password

**Elements**:
- Email input field (Shadcn Input)
- Password input field (Shadcn Input)
- Password requirements hint text
- Submit button (Shadcn Button)
- Error message container

**Props**:
- `onSuccess`: `() => void` - Callback to show CheckEmailInterstitial

**State**:
- `email`: `string` - Email input value
- `password`: `string` - Password input value
- `isSubmitting`: `boolean` - Whether form is submitting
- `error`: `string | null` - General form error message
- `fieldErrors`: `Record<string, string>` - Field-specific errors from Zod validation

**Events**:
- Form submit: Validates inputs with Zod, calls POST /api/auth/sign-up, handles response
- Input change: Updates form state, clears field-specific errors

**Validation** (using Zod):
- Email: Required, valid email format, max 255 chars
- Password: Required, minimum 8 characters, max 72 chars
- Password hint displayed: "Include uppercase, lowercase, and numbers for better security"
- Submit disabled during API request

**Types**:
- Request: `SignUpCommand`
- Response: 200 with empty body | `ErrorResponse`
- Internal state: Component state (no shared type needed)

**Error Handling**:
- 400: Display "Invalid email or password format" with field-specific details if provided
- 409: Display "This email is already registered. Try signing in instead." with link to Sign In tab
- 500: Display "An unexpected error occurred. Please try again."
- Network error: Display "Network error. Please check your connection."

### CheckEmailInterstitial
**Purpose**: Display post-sign-up guidance instructing user to check email for verification link

**Elements**:
- Success icon
- Heading: "Check your email"
- Message: "We sent a verification link to your email address. Click the link to complete your registration."
- Secondary message: "Didn't receive the email? Check your spam folder."
- Link to return to Sign In tab

**Props**: None

**Events**:
- Click "Back to Sign In": Switches to Sign In tab

**Validation**: None

**Types**: None

### AppHeader (Modified)
**Purpose**: Provide navigation and logout functionality for authenticated users

**Elements**:
- Brand logo/link (to /)
- Logout button (Shadcn Button) with icon

**Props**:
- `userName`: `string | undefined` - Optional user name for display

**Events**:
- Click Logout: Calls POST /api/auth/sign-out, redirects to / on success

**Validation**: None

**Types**: None

**Error Handling**:
- 401/500: Show toast error but still redirect to / (client-side cleanup)
- Network error: Show toast and redirect to /

### VerificationCallbackPage
**Purpose**: SSR page to handle email verification code exchange and redirect

**Elements**:
- Error state: Error message + Back to Sign In link
- Success: Immediate redirect to /app (no UI shown, handled in SSR)

**Props**: None (SSR page)

**Logic** (SSR):
- On page load: Exchange verification code with Supabase Auth
- On success: 302 redirect to /app
- On error: Render error state

**Validation**: None (handled by Supabase)

**Types**: Supabase auth types

**Error Messages**:
- Invalid/expired token: "This verification link is invalid or expired. Please return to the landing page and sign up again."
- Already verified: Redirect to /app
- Other errors: "Verification failed. Please try again or sign up with a new account."

## 5. Type Definitions

### DTOs (from API - defined in src/types.ts)

**SignUpCommand**:
```typescript
{
  email: string,      // User's email address
  password: string    // User's password (min 8 chars)
}
```

**SignInCommand**:
```typescript
{
  email: string,      // User's email address
  password: string    // User's password
}
```

**ErrorResponse**:
```typescript
{
  error: {
    code: string,                      // Error code (e.g., "invalid_request", "conflict")
    message: string,                   // Human-readable error message
    details?: ValidationErrorDetail[]  // Optional field-specific validation errors
  }
}
```

**ValidationErrorDetail**:
```typescript
{
  field: string,  // Name of the field that failed validation
  issue: string   // Description of the validation issue
}
```

### Zod Schemas (new - for client-side validation)

**SignInSchema**:
```typescript
z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required")
})
```

**SignUpSchema**:
```typescript
z.object({
  email: z.string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(255, "Email is too long"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long")
})
```

## 6. State Management

**Approach**: React Component State (no custom hooks for form management)

**State Variables**:

**In SignInForm**:
- `email: string` - Email input value
- `password: string` - Password input value
- `isSubmitting: boolean` - Whether form is submitting
- `error: string | null` - General form error message
- `fieldErrors: Record<string, string>` - Field-specific validation errors

**In SignUpForm**:
- `email: string` - Email input value
- `password: string` - Password input value
- `isSubmitting: boolean` - Whether form is submitting
- `error: string | null` - General form error message
- `fieldErrors: Record<string, string>` - Field-specific validation errors

**In AuthTabs**:
- `activeTab: 'signin' | 'signup'` - Currently active tab (defaults to 'signin')

**In AuthenticationSection** (parent component managing interstitial):
- `showCheckEmail: boolean` - Whether to show CheckEmailInterstitial after sign-up success

## 7. API Integration

### POST /api/auth/sign-up
- **Method**: POST
- **Path**: `/api/auth/sign-up`
- **Request Type**: `SignUpCommand`
- **Response Type**: 200 with empty body | `ErrorResponse` (400, 409, 500)
- **Trigger**: User submits SignUpForm with valid inputs
- **Success Handler** (200):
  - Call onSuccess callback to show CheckEmailInterstitial
  - Clear form state
- **Error Handlers**:
  - 400: Display "Invalid email or password format" with field details if available
  - 409: Display "This email is already registered" with link to Sign In tab
  - 500: Display "An unexpected error occurred. Please try again."
  - Network: Display "Network error. Please check your connection."

### POST /api/auth/sign-in
- **Method**: POST
- **Path**: `/api/auth/sign-in`
- **Request Type**: `SignInCommand`
- **Response Type**: 200 with empty body | `ErrorResponse` (401, 500)
- **Trigger**: User submits SignInForm with valid inputs
- **Success Handler** (200):
  - Navigate to `/app`
  - Clear form state
- **Error Handlers**:
  - 401: Display "Invalid email or password" (generic, don't leak verification status)
  - 500: Display "An unexpected error occurred. Please try again."
  - Network: Display "Network error. Please check your connection."

### POST /api/auth/sign-out
- **Method**: POST
- **Path**: `/api/auth/sign-out`
- **Request Type**: None (empty body)
- **Response Type**: 204 (no content) | `ErrorResponse` (401, 500)
- **Trigger**: User clicks Logout button in AppHeader
- **Success Handler** (204):
  - Navigate to `/` (landing page)
  - Clear any client-side auth state
- **Error Handlers**:
  - 401: Navigate to `/` anyway (session expired is expected)
  - 500: Show toast "Error signing out" but still navigate to `/`
  - Network: Show toast and navigate to `/`

### Supabase Auth SDK - Email Verification (SSR)
- **Method**: SSR call: `supabase.auth.exchangeCodeForSession(code)`
- **Trigger**: User lands on `/auth/callback?code=...` from email link
- **Success Handler**:
  - Set session cookie
  - 302 redirect to `/app`
- **Error Handlers**:
  - Invalid/expired code: Render error state with link to landing page
  - Already verified: Redirect to `/app`
  - Other errors: Render generic error with link to landing page

## 8. User Interactions

### Sign Up Flow
1. **Navigate to Landing Page**:
   - **Trigger**: User visits `/` or is redirected from protected route
   - **Validation**: None
   - **API Call**: None
   - **UI Update**: Render landing page with AuthTabs (Sign In tab active by default)
   - **Error State**: N/A

2. **Select Sign Up Tab**:
   - **Trigger**: User clicks "Sign Up" tab button or keyboard navigation
   - **Validation**: None
   - **API Call**: None
   - **UI Update**: Switch to Sign Up tab panel, move focus to email input
   - **Error State**: N/A

3. **Fill Sign Up Form**:
   - **Trigger**: User types in email and password fields
   - **Validation**: Real-time Zod validation on blur (email format, password length)
   - **API Call**: None
   - **UI Update**: Clear field errors as user types, show/hide password requirements hint
   - **Error State**: Display inline validation errors below fields with aria-describedby

4. **Submit Sign Up Form**:
   - **Trigger**: User clicks Submit button or presses Enter
   - **Validation**: Zod schema validation (email format, password min 8 chars)
   - **API Call**: POST /api/auth/sign-up
   - **UI Update**:
     - Disable submit button, show loading spinner
     - Set aria-busy="true" on form
     - On success: Hide form, show CheckEmailInterstitial
     - On error: Display error message, re-enable form, focus first invalid field
   - **Error State**:
     - 400: "Invalid email or password format"
     - 409: "This email is already registered. Try signing in instead."
     - 500: "An unexpected error occurred. Please try again."

### Sign In Flow
1. **Navigate to Landing Page**:
   - **Trigger**: User visits `/`, redirected from protected route, or clicks "Back to Sign In" from CheckEmailInterstitial
   - **Validation**: None
   - **API Call**: None
   - **UI Update**: Render landing page with Sign In tab active (default)
   - **Error State**: N/A

2. **Fill Sign In Form**:
   - **Trigger**: User types in email and password fields
   - **Validation**: Zod validation on blur (email format, password required)
   - **API Call**: None
   - **UI Update**: Clear field errors as user types
   - **Error State**: Display inline validation errors

3. **Submit Sign In Form**:
   - **Trigger**: User clicks Submit button or presses Enter
   - **Validation**: Zod schema validation (email format, password not empty)
   - **API Call**: POST /api/auth/sign-in
   - **UI Update**:
     - Disable submit button, show loading spinner
     - Set aria-busy="true" on form
     - On success (200): Navigate to /app
     - On error: Display error message, re-enable form
   - **Error State**:
     - 401: "Invalid email or password"
     - 500: "An unexpected error occurred. Please try again."

### Email Verification Flow
1. **Receive Verification Email**:
   - **Trigger**: User signs up successfully
   - **Validation**: None
   - **API Call**: None (email sent by Supabase)
   - **UI Update**: CheckEmailInterstitial displayed with instructions
   - **Error State**: N/A

2. **Click Verification Link**:
   - **Trigger**: User clicks link in email
   - **Validation**: None
   - **API Call**: SSR - Supabase exchangeCodeForSession
   - **UI Update**:
     - On success: Redirect to /app (SSR, no loading state shown)
     - On error: Render error state with message and link to landing page
   - **Error State**: "This verification link is invalid or expired. Please return to the landing page and sign up again."

### Protected Route Access Flow
1. **Attempt to Access Protected Route (Unauthenticated)**:
   - **Trigger**: User navigates to `/app` without session
   - **Validation**: Middleware checks for valid session (SSR)
   - **API Call**: None
   - **UI Update**: Redirect to `/`
   - **Error State**: N/A (expected behavior)

2. **Attempt to Access Protected Route (Unverified)**:
   - **Trigger**: User navigates to `/app` with session but unverified email
   - **Validation**: Middleware checks `user.email_confirmed_at` (SSR)
   - **API Call**: None
   - **UI Update**: Redirect to `/`
   - **Error State**: N/A (expected behavior)

3. **Access Protected Route (Verified)**:
   - **Trigger**: User navigates to `/app` with verified session
   - **Validation**: Middleware confirms valid session and verified email (SSR)
   - **API Call**: None
   - **UI Update**: Render dashboard content with AppHeader (including Logout button)
   - **Error State**: N/A

### Logout Flow
1. **Click Logout Button**:
   - **Trigger**: User clicks Logout button in AppHeader
   - **Validation**: None (button only visible when authenticated)
   - **API Call**: POST /api/auth/sign-out
   - **UI Update**:
     - Show loading state on button
     - On success (204): Navigate to `/`
     - On error: Show toast error but still navigate to `/`
   - **Error State**:
     - 401/500: Toast: "Error signing out" (still redirect to clear client state)

## 9. Validation & Conditions

### Client-Side Validation (Zod)

**SignUpForm**:
- **Email field**:
  - Required: "Email is required" (`.min(1)`)
  - Valid format: "Please enter a valid email address" (`.email()`)
  - Max length 255 chars: "Email is too long" (`.max(255)`)
- **Password field**:
  - Required: "Password is required" (implicit in `.min(8)`)
  - Min length 8 chars: "Password must be at least 8 characters" (`.min(8)`)
  - Max length 72 chars: "Password is too long" (`.max(72)`)
  - Hint text (not validated): "Include uppercase, lowercase, and numbers for better security"

**SignInForm**:
- **Email field**:
  - Required: "Email is required" (`.min(1)`)
  - Valid format: "Please enter a valid email address" (`.email()`)
- **Password field**:
  - Required: "Password is required" (`.min(1)`)

### API Preconditions

**POST /api/auth/sign-up**:
- **Email not already registered**:
  - Check: API returns 409 if exists
  - Action: Display "This email is already registered" with link to Sign In tab
- **Password meets Supabase requirements**:
  - Check: API returns 400 if invalid
  - Action: Display "Invalid password format" with details

**POST /api/auth/sign-in**:
- **Valid credentials**:
  - Check: API returns 401 if invalid
  - Action: Display generic "Invalid email or password"
- **User exists and verified**:
  - Check: API returns 401 if user doesn't exist or not verified
  - Action: Display generic "Invalid email or password" (don't leak verification status)

### UI State Conditions

**Submit Button (Forms)**:
- **Enabled**: Form is valid (Zod validation passes) AND not currently submitting
- **Disabled**: Form is invalid OR isSubmitting === true
- **Loading**: isSubmitting === true (show spinner icon)

**CheckEmailInterstitial**:
- **Visible**: SignUpForm submission succeeded (200 response received)
- **Hidden**: User clicks "Back to Sign In" or navigates away

**Sign In Tab (Active by Default)**:
- **Active**: Default state when landing page loads
- **Inactive**: User manually switches to Sign Up tab

## 10. Error Handling

### Sign Up Errors

**Invalid Email/Password Format (400)**:
- **Detection**: API returns 400 with code "invalid_request"
- **User Feedback**: "Invalid email or password format" (general) OR field-specific errors from details array
- **Recovery Action**: User corrects input and resubmits

**Email Already Registered (409)**:
- **Detection**: API returns 409 with code "conflict"
- **User Feedback**: "This email is already registered. Try signing in instead." (with clickable "Sign In" link)
- **Recovery Action**: User clicks link to switch to Sign In tab OR enters different email

**Server Error (500)**:
- **Detection**: API returns 500 with code "internal_error"
- **User Feedback**: "An unexpected error occurred. Please try again."
- **Recovery Action**: User waits briefly and resubmits

**Network Error**:
- **Detection**: Fetch throws error (network timeout, no connection)
- **User Feedback**: "Network error. Please check your connection and try again."
- **Recovery Action**: User checks connection and retries

### Sign In Errors

**Invalid Credentials (401)**:
- **Detection**: API returns 401 with code "unauthorized"
- **User Feedback**: "Invalid email or password" (generic, doesn't reveal if user exists or email is unverified)
- **Recovery Action**: User re-enters credentials OR switches to Sign Up if they don't have an account

**Server Error (500)**:
- **Detection**: API returns 500
- **User Feedback**: "An unexpected error occurred. Please try again."
- **Recovery Action**: User waits and retries

**Network Error**:
- **Detection**: Fetch throws error
- **User Feedback**: "Network error. Please check your connection and try again."
- **Recovery Action**: User checks connection and retries

### Verification Callback Errors

**Invalid or Expired Verification Link**:
- **Detection**: Supabase exchangeCodeForSession fails with invalid token error (SSR)
- **User Feedback**: "This verification link is invalid or expired. Please return to the landing page and sign up again."
- **Recovery Action**: Click link to return to landing page

**Already Verified**:
- **Detection**: User clicks verification link but email_confirmed_at is already set
- **User Feedback**: None (silent success)
- **Recovery Action**: Automatic redirect to /app (SSR)

**Server Error**:
- **Detection**: Supabase returns unexpected error (SSR)
- **User Feedback**: "Verification failed. Please try again or sign up with a new account."
- **Recovery Action**: Click link to return to landing page

### Logout Errors

**Session Expired (401)**:
- **Detection**: API returns 401
- **User Feedback**: None (expected scenario)
- **Recovery Action**: Automatic redirect to `/` (client-side cleanup already done)

**Server Error (500)**:
- **Detection**: API returns 500
- **User Feedback**: Toast: "Error signing out, but your session has been cleared locally"
- **Recovery Action**: Automatic redirect to `/` anyway (clear client state)

### Global Error Handling

**Unexpected Errors**:
- Any unhandled error in React components caught by Error Boundary
- Display: "Something went wrong. Please refresh the page."
- Logging: Log error to console (and monitoring service in production)
- Recovery: User refreshes page

**Session Expiration During Use**:
- Supabase SDK automatically refreshes tokens
- On refresh failure: Redirect to `/` with message "Your session has expired"
- User must sign in again

## 11. Implementation Steps

1. **Setup Authentication Type Definitions**
   - [ ] Verify SignUpCommand, SignInCommand exist in `src/types.ts`
   - [ ] Create Zod schemas: SignInSchema, SignUpSchema in separate validation file

2. **Build Reusable Authentication Components**
   - [ ] Create `src/components/auth/AuthTabs.tsx` with accessible tab implementation
     - [ ] Default to Sign In tab on load
     - [ ] Implement keyboard navigation (Arrow keys, Home, End)
   - [ ] Create `src/components/auth/SignInForm.tsx`
     - [ ] Implement form state directly in component (email, password, isSubmitting, error, fieldErrors)
     - [ ] Use Zod SignInSchema for validation
     - [ ] Handle form submission with POST /api/auth/sign-in
     - [ ] Navigate to /app on success (200)
   - [ ] Create `src/components/auth/SignUpForm.tsx`
     - [ ] Implement form state directly in component
     - [ ] Use Zod SignUpSchema for validation
     - [ ] Handle form submission with POST /api/auth/sign-up
     - [ ] Call onSuccess prop on success (200)
   - [ ] Create `src/components/auth/CheckEmailInterstitial.tsx`
     - [ ] Display success message and instructions
     - [ ] Link to switch back to Sign In tab
   - [ ] Add ARIA attributes and keyboard navigation to all components

3. **Update Landing Page**
   - [ ] Modify `src/pages/index.astro` to include AuthenticationSection
   - [ ] Add AuthTabs component with Sign In and Sign Up panels
   - [ ] Integrate SignInForm and SignUpForm components
   - [ ] Handle CheckEmailInterstitial display after sign-up success (state in parent)
   - [ ] Test responsive layout and mobile experience

4. **Create Verification Callback Page**
   - [ ] Create `src/pages/auth/callback.astro` as SSR page
   - [ ] Implement SSR code exchange logic using Supabase Auth
   - [ ] On success: 302 redirect to `/app` (no loading state, pure SSR)
   - [ ] On error: Render error state UI with link back to landing page
   - [ ] Handle edge cases (already verified → redirect to /app, invalid code → error state, expired code → error state)

5. **Update Dashboard and Header**
   - [ ] Modify `src/components/AppHeader.tsx` to include Logout button
   - [ ] Implement logout handler calling POST /api/auth/sign-out
   - [ ] Update `src/pages/app.astro` to check authentication and verification status (SSR)
   - [ ] Ensure proper redirect to `/` for unauthenticated or unverified users

6. **Implement Middleware for Route Protection**
   - [ ] Update `src/middleware/index.ts` to check authentication status
   - [ ] Add session verification check using Supabase Auth
   - [ ] Add email verification check (email_confirmed_at)
   - [ ] Implement redirect logic for unauthenticated or unverified users to `/`
   - [ ] Allow public routes: `/`, `/page/*`, `/auth/callback`

7. **Styling and Theming**
   - [ ] Apply Tailwind CSS styles following project conventions
   - [ ] Ensure consistent use of Shadcn/ui components (Button, Input, Label, Toast)
   - [ ] Implement focus states for keyboard navigation
   - [ ] Add loading spinners and disabled states
   - [ ] Test dark mode compatibility (if applicable)

8. **Accessibility Testing**
   - [ ] Test keyboard navigation (Tab, Arrow keys, Enter, Escape)
   - [ ] Verify screen reader announcements (NVDA/JAWS)
   - [ ] Check ARIA attributes (aria-label, aria-describedby, aria-live, aria-busy)
   - [ ] Ensure sufficient color contrast (WCAG 2.1 AA)
   - [ ] Test focus management (visible focus indicators, logical order)
   - [ ] Run automated accessibility audit (axe DevTools)

9. **Error Handling and Validation**
   - [ ] Implement all Zod validation schemas
   - [ ] Add error message displays with proper ARIA
   - [ ] Test all error scenarios (400, 401, 409, 500, network errors)
   - [ ] Implement focus management on form errors
   - [ ] Add user-friendly error messages

10. **Integration Testing**
    - [ ] Test complete sign-up flow (form → email → verification → dashboard)
    - [ ] Test complete sign-in flow (form → dashboard)
    - [ ] Test logout flow (dashboard → landing)
    - [ ] Test protected route access (authenticated+verified, unauthenticated, authenticated+unverified)
    - [ ] Test tab switching between Sign In and Sign Up
    - [ ] Test session expiration scenarios
    - [ ] Test verification callback error scenarios

11. **Documentation and Cleanup**
    - [ ] Document component props and usage
    - [ ] Update project README with authentication setup instructions
    - [ ] Remove any console.logs or debug code
    - [ ] Run linter and fix any warnings

## 12. Implementation Notes

### Dependencies
- **Supabase Auth SDK** (`@supabase/ssr`): Already installed, used for authentication
- **Zod**: Install if not present (`npm install zod`)
- **Shadcn/ui Components**: Button, Input, Label, Toast, Card (verify all are installed)
- **React 19**: Already part of tech stack
- **Astro 5**: Already part of tech stack, used for SSR pages and middleware

### Potential Challenges

**Challenge 1: Unverified Users Cannot Sign In**
- **Issue**: Unverified users attempting to sign in will receive 401 error (same as invalid credentials)
- **Solution**: Display generic "Invalid email or password" message; user must complete verification flow first; middleware redirects unverified sessions to landing page

**Challenge 2: Tab Switching**
- **Issue**: Users need to switch between Sign In and Sign Up forms
- **Solution**: Implement simple component state to track active tab; no URL persistence needed; always default to Sign In on page load

**Challenge 3: Focus Management for Accessibility**
- **Issue**: Screen reader users need focus moved to errors and important state changes
- **Solution**: Use refs to programmatically focus first invalid field on form error; use aria-live regions for dynamic messages; manage tabindex for custom tabs

**Challenge 4: SSR Verification Callback**
- **Issue**: Verification code exchange must happen server-side for security; no loading state needed
- **Solution**: Create `/auth/callback.astro` as SSR page; use `Astro.locals.supabase` to exchange code immediately; redirect or render error state based on result; no client-side loading UI

**Challenge 5: Secure Error Messages**
- **Issue**: Error messages should not leak whether a user exists or is verified
- **Solution**: Sign-in 401 returns generic "Invalid email or password"; only sign-up 409 reveals email existence (acceptable for UX); no verification status leaked

**Challenge 6: CSRF Protection for Logout**
- **Issue**: Logout endpoint needs CSRF protection
- **Solution**: API endpoint validates Origin/Referer header matches APP_URL; use POST method (not GET); rely on Supabase session cookie security

**Challenge 7: Client-Side Validation with Zod**
- **Issue**: Need to validate form inputs before API submission and show field-specific errors
- **Solution**: Use Zod schemas for validation; call `.safeParse()` on form submission; map Zod errors to fieldErrors state; display inline errors with aria-describedby

### Performance Considerations
- **Code Splitting**: React components lazy-loaded via Astro's client directives (client:load for auth forms on landing page)
- **Form Validation**: Validate on blur to provide immediate feedback without excessive re-renders
- **Session Check**: Cache session check result in middleware to avoid repeated Supabase calls during same request
- **SSR Verification**: Pure SSR redirect on verification success (no JavaScript needed for success case)

### Accessibility Requirements
- **WCAG 2.1 AA Compliance**: All auth UI must meet Level AA standards
- **Keyboard Navigation**: Full keyboard support (Tab, Arrow keys, Enter, Escape)
- **Screen Reader Support**: Proper ARIA labels, landmarks, live regions, and descriptions
- **Focus Management**: Visible focus indicators (2px outline); logical focus order; programmatic focus on errors
- **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Error Identification**: aria-describedby links error messages to form fields; aria-invalid on invalid inputs
- **Loading States**: aria-busy and role="status" for async operations

### Security Considerations
- **Password Handling**: Never log or expose passwords; use type="password"; autocomplete attributes
- **HTTPS Only**: All auth operations over HTTPS (enforced by Supabase and hosting)
- **XSS Prevention**: Sanitize all user input; use React's built-in XSS protection
- **CSRF Protection**: Validate Origin/Referer headers on state-changing operations
- **Session Security**: Rely on Supabase's secure cookie handling; httpOnly, secure, sameSite flags
- **Error Messages**: Generic messages that don't reveal sensitive information (user existence, verification status)
