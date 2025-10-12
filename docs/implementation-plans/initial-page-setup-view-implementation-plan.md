# View Implementation Plan: Initial Page Setup

## 1. Overview

The Initial Page Setup view is the first-time user experience for creating a personal page. It appears when an authenticated user accesses `/app` but doesn't have an existing page (GET /api/pages returns 404). The view allows users to configure their page's URL slug, select a visual theme, and optionally upload initial YAML content. Users can also download a YAML template for offline editing. Upon successful page creation, the user transitions to the Admin Dashboard.

This implementation reuses existing components and hooks from the dashboard to maintain consistency and reduce code duplication.

## 2. View Routing

- **Path**: `/app` (conditional render based on page existence check)
- **Access Control**: Authenticated users only (enforced by middleware)
- **Routing Logic**:
  - GET /api/pages returns 404 → Render Initial Page Setup
  - GET /api/pages returns 200 → Render Admin Dashboard
  - GET /api/pages returns 401 → Redirect to landing page
  - GET /api/pages returns 500+ → Show error state with retry

## 3. Component Structure

```
InitialPageSetup (React component, client:load)
├── AppHeader (reused from dashboard)
│   ├── Brand/Logo
│   └── LogoutButton
└── Main Content
    └── Card (shadcn/ui)
        ├── CardHeader
        │   ├── CardTitle: "Create Your Personal Page"
        │   └── CardDescription: Instructions text
        ├── CardContent
        │   └── Form (inline structure)
        │       ├── URL Slug Field
        │       │   ├── Label
        │       │   ├── Input (shadcn/ui)
        │       │   ├── URL Preview Link
        │       │   └── Error Message (conditional)
        │       ├── Theme Select Field
        │       │   ├── Label
        │       │   ├── Select (shadcn/ui)
        │       │   └── Error Message (conditional)
        │       ├── YAML File Upload Section
        │       │   ├── Label: "Page Content (Optional)"
        │       │   ├── FileUploadButton (reused from shared)
        │       │   └── Template Download Button
        │       └── ErrorList (conditional, reused from shared)
        └── CardFooter
            └── CreatePageButton (with loading state)
└── Toast (Sonner, via useToast hook)
```

## 4. Component Details

### InitialPageSetup

- **Component description**: Main container component for the initial page setup flow. Manages form state, handles page creation via POST /api/pages, and coordinates the transition to the Admin Dashboard after success. Reuses patterns from PageSettingsCard and PageContentCard.

- **Main elements**:
  - AppHeader component at top
  - Card component containing form fields
  - URL input field with preview
  - Theme select dropdown
  - Optional YAML file upload using FileUploadButton
  - Template download button
  - ErrorList for server validation errors
  - Create Page button with loading state
  - Toast notifications via useToast

- **Handled interactions**:
  - URL slug input changes (clear errors on change)
  - Theme selection changes
  - YAML file upload (via FileUploadButton)
  - Template download button click
  - Form submission (create page)
  - Success notification and automatic navigation to dashboard
  - Error display and recovery

- **Handled validation**:
  - Client only displays errors returned from API

- **Types**:
  - `CreatePageCommand` (API request)
  - `PageCreateResponseDto` (API response)
  - `ErrorResponse` (API error)
  - `ValidationErrorDetail[]` (server validation errors)
  - Local state types (see Types section)

- **Props**:
  ```typescript
  {
    baseUrl: string;  // Origin URL for API calls and preview
  }
  ```

### Reused Components

#### AppHeader
- **Source**: Existing dashboard component
- **Purpose**: Top navigation with brand and logout
- **Usage**: No changes needed, use as-is

#### FileUploadButton
- **Source**: `@/components/shared/FileUploadButton`
- **Purpose**: Handle YAML file selection and reading
- **Props**:
  ```typescript
  {
    onUpload: (fileContent: string) => Promise<void>;
    accept: ".yaml,.yml";
    disabled: boolean;
    children: "Upload YAML";
  }
  ```
- **Features**:
  - Built-in file reading with FileReader
  - Loading state with spinner
  - Automatic input reset after upload

#### ErrorList
- **Source**: `@/components/shared/ErrorList`
- **Purpose**: Display server validation errors
- **Props**:
  ```typescript
  {
    errors: ValidationErrorDetail[];
    onClear?: () => void;
  }
  ```
- **Features**:
  - Accessible error display with role="alert"
  - Formatted list showing field and issue
  - Optional clear button

#### Shadcn/ui Components
- **Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter**: Form container
- **Input**: URL slug text input
- **Select, SelectTrigger, SelectContent, SelectItem, SelectValue**: Theme selection
- **Button**: Actions (create page, download template)
- **Label**: Form field labels

#### Toast (via useToast hook)
- **Source**: `@/components/dashboard/hooks/useToast`
- **Purpose**: Success/error notifications
- **Usage**:
  ```typescript
  const { showSuccess, showError } = useToast();
  showSuccess("Your page has been created successfully!");
  showError("Failed to create page. Please try again.");
  ```

## 5. Types

### Existing Types (from src/types.ts)

**CreatePageCommand** - API request DTO for POST /api/pages:
```typescript
{
  url: string;        // URL slug
  theme: string;      // Theme identifier: 'ocean' | 'earth'
  data?: string;      // Optional YAML content as string
}
```

**PageCreateResponseDto** - API response DTO for POST /api/pages (201):
```typescript
{
  user_id: string;    // Supabase user ID
  url: string;        // Created URL slug
  theme: string;      // Selected theme
}
```

**ErrorResponse** - API error response for 4xx/5xx errors:
```typescript
{
  error: {
    code: string;                        // Error code identifier
    message: string;                     // Human-readable error message
    details?: ValidationErrorDetail[];   // Optional field-level validation errors
  }
}
```

**ValidationErrorDetail** - Individual validation error:
```typescript
{
  field: string;      // Name of the field that failed validation
  issue: string;      // Description of the validation issue
}
```

**Theme** - Type alias for available themes:
```typescript
type Theme = 'ocean' | 'earth';
```

### New Types Required

**InitialPageSetupProps** - Component props:
```typescript
interface InitialPageSetupProps {
  baseUrl: string;  // Origin URL for API calls and preview
}
```

**FormState** - Local form state:
```typescript
interface FormState {
  url: string;              // User-entered URL slug
  theme: Theme;             // Selected theme ('ocean' or 'earth')
  yamlContent: string;      // Text content of uploaded YAML file
}
```

**SubmissionState** - Tracks form submission status:
```typescript
interface SubmissionState {
  isSubmitting: boolean;                         // True during API call
  serverErrors: ValidationErrorDetail[] | null;  // Server validation errors
  urlError: string | null;                       // URL-specific error (e.g., conflict)
  generalError: string | null;                   // General error (network, 500, etc.)
}
```

## 6. State Management

### Component State Structure

The InitialPageSetup component manages state using React hooks (useState). State is organized into logical groups:

```typescript
// Form input values
const [formState, setFormState] = useState<FormState>({
  url: '',
  theme: 'ocean',
  yamlContent: ''
});

// Submission and error state
const [submissionState, setSubmissionState] = useState<SubmissionState>({
  isSubmitting: false,
  serverErrors: null,
  urlError: null,
  generalError: null
});

// Toast hook for notifications
const { showSuccess, showError } = useToast();
```

### State Update Patterns

**Form input changes:**
```typescript
const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setFormState(prev => ({ ...prev, url: e.target.value }));
  // Clear related errors
  setSubmissionState(prev => ({
    ...prev,
    urlError: null,
    serverErrors: null,
    generalError: null
  }));
};

const handleThemeChange = (value: string) => {
  setFormState(prev => ({ ...prev, theme: value as Theme }));
};
```

**YAML file upload:**
```typescript
const handleYamlUpload = async (fileContent: string) => {
  setFormState(prev => ({ ...prev, yamlContent: fileContent }));
  setSubmissionState(prev => ({ ...prev, serverErrors: null }));
};
```

## 7. API Integration

### Endpoint 1: Download YAML Template

**Request:**
- Method: GET
- URL: `/api/templates/page`
- Headers: None required (browser handles)
- Body: None

**Implementation:**
```typescript
const handleDownloadTemplate = () => {
  window.location.href = '/api/templates/page';
};
```

**Response:**
- Success: YAML file download
- Browser automatically saves file

### Endpoint 2: Create Page

**Request:**
- Method: POST
- URL: `/api/pages`
- Headers:
  ```
  Content-Type: application/json
  ```
- Credentials: include (for session cookies)
- Body: `CreatePageCommand`
  ```json
  {
    "url": "john-doe",
    "theme": "ocean",
    "data": "name: John Doe\nbio: Software developer..."  // optional
  }
  ```

**Response Success (201 Created):**
```json
{
  "user_id": "uuid-here",
  "url": "john-doe",
  "theme": "ocean"
}
```
Type: `PageCreateResponseDto`

**Response Error (400 Bad Request - Validation Error):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "bio",
        "issue": "'bio' is a required field but was not found"
      },
      {
        "field": "name",
        "issue": "'name' must be a non-empty string"
      }
    ]
  }
}
```
Type: `ErrorResponse`

**Response Error (409 Conflict - URL Taken):**
```json
{
  "error": {
    "code": "URL_ALREADY_TAKEN",
    "message": "This URL is already taken. Please choose another."
  }
}
```
Type: `ErrorResponse`

**Response Error (500 Internal Server Error):**
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred. Please try again."
  }
}
```
Type: `ErrorResponse`

## 8. User Interactions

### Interaction 1: Page Load
**User Action:** User navigates to /app (first time, no page exists)
**System Response:**
1. Astro middleware checks authentication
2. app.astro fetches GET /api/pages
3. Receives 404 response
4. Renders InitialPageSetup component
5. Form displays with default values (url: '', theme: 'ocean')

### Interaction 2: Download Template
**User Action:** Clicks "Download Template" button
**System Response:**
1. Triggers GET /api/templates/page via window.location.href
2. Browser downloads template.yaml file
3. User can edit file offline
**Validation:** None
**Error Handling:** Browser handles download

### Interaction 3: Enter URL Slug
**User Action:** Types in URL slug input field
**System Response:**
1. onChange updates formState.url
2. URL preview updates: `{baseUrl}/page/{slug}`
3. Previous errors cleared
**Validation:** None (server-side only)
**Error Handling:** Display server errors after submission

### Interaction 4: Select Theme
**User Action:** Opens theme dropdown and selects a theme
**System Response:**
1. onValueChange updates formState.theme
2. Dropdown shows selected theme
**Validation:** None (dropdown only shows valid options)

### Interaction 5: Upload YAML File
**User Action:** Clicks "Upload YAML" button, selects file
**System Response:**
1. FileUploadButton opens file picker
2. User selects .yaml or .yml file
3. Component reads file content using FileReader
4. Shows loading spinner during read
5. On success: stores content in formState.yamlContent
6. Button shows "Uploading..." then returns to "Upload YAML"
**Validation:** File reading handled by FileUploadButton
**Error Handling:**
- FileReader errors handled by FileUploadButton
- Server validates YAML schema on form submission

### Interaction 6: Submit Form (Success)
**User Action:** Clicks "Create Page" button
**System Response:**
1. Disable button, show loading spinner: "Creating..."
2. Send POST /api/pages with CreatePageCommand
3. Receive 201 Created response
4. Show success toast: "Your page has been created successfully!"
5. After 1.5s delay, navigate to /app (full page reload)
6. app.astro refetches GET /api/pages, now returns 200
7. AdminDashboard renders
**Validation:** All server-side
**Error Handling:** See Interaction 7 and 8

### Interaction 7: Submit Form (Validation Error)
**User Action:** Clicks "Create Page" with invalid YAML
**System Response:**
1. Send POST /api/pages
2. Receive 400 Bad Request with ValidationErrorDetail[]
3. Re-enable button
4. Display ErrorList with all validation errors
5. Show toast error: "Failed to create page. Please try again."
**Example Errors:**
- Field: "bio", Issue: "'bio' is a required field but was not found"
- Field: "name", Issue: "'name' must be a non-empty string"
**User Recovery:**
- Download template for reference
- Edit YAML file offline
- Re-upload corrected file
- Submit again

### Interaction 8: Submit Form (URL Conflict)
**User Action:** Clicks "Create Page" with already-taken URL
**System Response:**
1. Send POST /api/pages
2. Receive 409 Conflict response
3. Display error near URL input: "This URL is already taken. Please choose another."
4. Focus URL input
**User Recovery:**
- Enter different URL slug
- Submit again

### Interaction 9: Submit Form (Server Error)
**User Action:** Clicks "Create Page", server returns 500
**System Response:**
1. Receive 500 response or network error
2. Display error toast: "Failed to create page. Please try again."
3. Re-enable form for retry
**User Recovery:**
- Check connection
- Click Create Page again

### Interaction 10: Clear Errors
**User Action:** Modifies form after seeing errors
**System Response:**
1. URL input change clears all errors
2. ErrorList can be manually cleared via X button
3. Form returns to clean state for resubmission

## 9. Conditions and Validation
All validation is server-side

**Error Response (400):**
```json
{
  "error": {
    "code": "INVALID_YAML",
    "message": "YAML validation failed",
    "details": [
      { "field": "name", "issue": "'name' is a required field but was not found" },
      { "field": "bio", "issue": "'bio' is a required field but was not found" }
    ]
  }
}
```

**UI Handling:**
- Display ErrorList component with all field errors
- Provide template download link for reference
- Keep form active for file re-upload

### Form Submission Validation
**Component:** InitialPageSetup
**When:** Before POST /api/pages
**Conditions:**
- URL must not be empty (basic check)
- Theme must be selected (always true with default)
- Form must not already be submitting
**Effect on UI:**
- Disable submit button if URL empty
- Disable submit button during submission
- Show loading state

## 10. Error Handling

### Error Category 1: Server Validation Errors

**Error 1.1: YAML Schema Validation Failure (400)**
- **Trigger:** Server validates YAML and finds missing/invalid fields
- **Detection:** 400 response with error.code === 'INVALID_YAML' or 'VALIDATION_ERROR'
- **Handling:**
  - Parse error.details array
  - Display ErrorList component
  - Show all field-level errors
  - Keep form active
  - Provide template download link
- **User Recovery:**
  - Download template for reference
  - Edit YAML file offline
  - Re-upload corrected file
- **Example Display:**
  ```
  Please fix the following errors:
  • bio: 'bio' is a required field but was not found
  • name: 'name' must be a non-empty string
  ```

**Error 1.2: URL Already Taken (409)**
- **Trigger:** User submits URL that exists in database
- **Detection:** 409 Conflict response or error.code === 'URL_CONFLICT' or 'URL_ALREADY_TAKEN'
- **Handling:**
  - Display error near URL input field
  - Highlight URL field with destructive color
  - Focus URL input
  - Keep other form data intact
- **User Recovery:** Enter different URL slug, resubmit
- **Example Message:** "This URL is already taken. Please choose another."

**Error 1.3: Reserved URL (400)**
- **Trigger:** User submits reserved URL (e.g., 'api', 'admin')
- **Detection:** 400 response with error.code === 'RESERVED_URL'
- **Handling:**
  - Display error near URL input
  - Focus URL input
- **User Recovery:** Choose different URL
- **Example Message:** "This URL is reserved and cannot be used."

**Error 1.4: Invalid URL Format (400)**
- **Trigger:** URL doesn't match server pattern
- **Detection:** 400 response with error.code === 'VALIDATION_ERROR' and field === 'url'
- **Handling:**
  - Display error near URL input
  - Show server error message
- **User Recovery:** Modify URL to match requirements
- **Example Message:** "Invalid URL format. Use only lowercase letters, numbers, and hyphens."

### Error Category 2: Network and Server Errors

**Error 2.1: Network Failure**
- **Trigger:** Fetch request fails (no response from server)
- **Detection:** Catch block in fetch promise
- **Handling:**
  - Display error toast
  - Set generalError state
  - Keep form active for retry
  - Log error to console
- **User Recovery:** Check internet connection, retry
- **Example Message:** "Network error. Please check your connection and try again."

**Error 2.2: Server Internal Error (500+)**
- **Trigger:** Server returns 500, 502, 503, etc.
- **Detection:** response.status >= 500
- **Handling:**
  - Display error toast
  - Set generalError state
  - Keep form active for retry
  - Log full error
  - Don't expose internal details
- **User Recovery:** Wait briefly, retry submission
- **Example Message:** "Something went wrong. Please try again."

### Error Category 3: File Operation Errors

**Error 3.1: File Read Failure**
- **Trigger:** FileReader fails to read file
- **Detection:** FileUploadButton handles FileReader onerror
- **Handling:**
  - FileUploadButton shows internal error
  - User sees failed upload state
  - Can retry with same or different file
- **User Recovery:** Try selecting file again
- **Note:** Handled by FileUploadButton component

## 11. Implementation Steps

### Step 1: Set up project structure
1. Create component file: `src/components/setup/InitialPageSetup.tsx`
2. Add new types to component file or shared types:
   - `InitialPageSetupProps`
   - `FormState`
   - `SubmissionState`
3. Verify AppHeader exists in `src/components/shared/` or dashboard

### Step 2: Verify existing components and hooks
1. Confirm shadcn/ui components installed:
   - Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription
   - Button
   - Input
   - Label
   - Select, SelectTrigger, SelectContent, SelectItem, SelectValue
2. Verify shared components exist:
   - `@/components/shared/FileUploadButton`
   - `@/components/shared/ErrorList`
   - `@/components/shared/AppHeader` (or create if needed)
3. Verify hooks exist:
   - `@/components/dashboard/hooks/useToast`

### Step 3: Create AppHeader component (if needed)
1. Create `src/components/shared/AppHeader.tsx` if it doesn't exist
2. Implement simple header:
   - Brand/logo text
   - Logout button using Supabase auth
3. Style with Tailwind
4. Make it reusable for both InitialPageSetup and AdminDashboard

### Step 4: Implement InitialPageSetup component

**4.1: Set up component structure and imports**
```typescript
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUploadButton } from "@/components/shared/FileUploadButton";
import { ErrorList } from "@/components/shared/ErrorList";
import { AppHeader } from "@/components/shared/AppHeader";
import { useToast } from "@/components/dashboard/hooks/useToast";
import type { CreatePageCommand, PageCreateResponseDto, ErrorResponse, ValidationErrorDetail, Theme } from "@/types";

interface InitialPageSetupProps {
  baseUrl: string;
}

interface FormState {
  url: string;
  theme: Theme;
  yamlContent: string;
}

interface SubmissionState {
  isSubmitting: boolean;
  serverErrors: ValidationErrorDetail[] | null;
  urlError: string | null;
  generalError: string | null;
}

const AVAILABLE_THEMES = [
  { value: "ocean", label: "Ocean" },
  { value: "earth", label: "Earth" },
];
```

**4.2: Initialize state**
```typescript
export function InitialPageSetup({ baseUrl }: InitialPageSetupProps) {
  const [formState, setFormState] = useState<FormState>({
    url: '',
    theme: 'ocean',
    yamlContent: ''
  });

  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    isSubmitting: false,
    serverErrors: null,
    urlError: null,
    generalError: null
  });

  const { showSuccess, showError } = useToast();

  const fullUrl = `${baseUrl}/page/${formState.url || '{your-url}'}`;
```

**4.3: Implement event handlers**
```typescript
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState(prev => ({ ...prev, url: e.target.value }));
    // Clear errors on input
    setSubmissionState(prev => ({
      ...prev,
      urlError: null,
      serverErrors: null,
      generalError: null
    }));
  };

  const handleThemeChange = (value: string) => {
    setFormState(prev => ({ ...prev, theme: value as Theme }));
  };

  const handleYamlUpload = async (fileContent: string) => {
    setFormState(prev => ({ ...prev, yamlContent: fileContent }));
    setSubmissionState(prev => ({ ...prev, serverErrors: null }));
  };

  const handleDownloadTemplate = () => {
    window.location.href = '/api/templates/page';
  };

  const clearErrors = () => {
    setSubmissionState(prev => ({ ...prev, serverErrors: null }));
  };
```

**4.4: Implement form submission**
```typescript
  const handleCreatePage = async () => {
    // Basic empty check
    if (!formState.url.trim()) {
      setSubmissionState(prev => ({
        ...prev,
        urlError: 'Please enter a URL for your page'
      }));
      return;
    }

    setSubmissionState(prev => ({ ...prev, isSubmitting: true }));

    const command: CreatePageCommand = {
      url: formState.url,
      theme: formState.theme,
      ...(formState.yamlContent && { data: formState.yamlContent }),
    };

    try {
      const response = await fetch(`${baseUrl}/api/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();

        // Handle URL conflicts
        if (
          errorData.error.code === 'URL_ALREADY_TAKEN' ||
          errorData.error.code === 'RESERVED_URL'
        ) {
          setSubmissionState(prev => ({
            ...prev,
            isSubmitting: false,
            urlError: errorData.error.message,
          }));
          return;
        }

        // Handle YAML validation errors
        if (response.status === 400) {
          const errorData = await response.json();
          if (isErrorResponse(errorData) && errorData.error.code === "INVALID_YAML") {
            setErrors(getValidationErrors(errorData));
          }
          return;
        }

        // General error
        setSubmissionState(prev => ({
          ...prev,
          isSubmitting: false,
          generalError: errorData.error.message,
        }));
        showError(errorData.error.message || 'Failed to create page. Please try again.');
        return;
      }

      // Success
      const result: PageCreateResponseDto = await response.json();
      showSuccess('Your page has been created successfully!');

      // Navigate to dashboard after delay
      setTimeout(() => {
        window.location.href = '/app';
      }, 1500);
    } catch (err) {
      setSubmissionState(prev => ({
        ...prev,
        isSubmitting: false,
        generalError: 'Network error. Please check your connection.',
      }));
      showError('Failed to create page. Please try again.');
      console.error('Page creation error:', err);
    }
  };
```

**4.5: Implement render method**
```typescript
  return (
    <>
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>Create Your Personal Page</CardTitle>
            <CardDescription>
              Set up your page URL and theme. You can optionally upload your YAML content now or add it later from the
              dashboard.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* URL Section */}
            <div className="space-y-2">
              <Label htmlFor="page-url">Page URL</Label>
              <Input
                id="page-url"
                type="text"
                value={formState.url}
                onChange={handleUrlChange}
                placeholder="your-page-url"
                className={submissionState.urlError ? "border-destructive" : ""}
                disabled={submissionState.isSubmitting}
              />
              {submissionState.urlError && (
                <p className="text-sm text-destructive" role="alert">
                  {submissionState.urlError}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Your page will be available at:{" "}
                <span className="font-medium text-foreground">{fullUrl}</span>
              </p>
            </div>

            {/* Theme Section */}
            <div className="space-y-2">
              <Label htmlFor="page-theme">Theme</Label>
              <Select value={formState.theme} onValueChange={handleThemeChange} disabled={submissionState.isSubmitting}>
                <SelectTrigger id="page-theme">
                  <SelectValue placeholder="Select a theme" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_THEMES.map((theme) => (
                    <SelectItem key={theme.value} value={theme.value}>
                      {theme.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* YAML Upload Section */}
            <div className="space-y-2">
              <Label>Page Content (Optional)</Label>
              <p className="text-sm text-muted-foreground">
                Upload your YAML file now or skip this step and add it later from the dashboard.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleDownloadTemplate} disabled={submissionState.isSubmitting}>
                  Download Template
                </Button>
                <FileUploadButton
                  onUpload={handleYamlUpload}
                  accept=".yaml,.yml"
                  disabled={submissionState.isSubmitting}
                >
                  Upload YAML
                </FileUploadButton>
              </div>
              {formState.yamlContent && (
                <p className="text-sm text-muted-foreground">
                  ✓ YAML file loaded ({formState.yamlContent.length} characters)
                </p>
              )}
            </div>

            {/* Validation Errors */}
            {submissionState.serverErrors && submissionState.serverErrors.length > 0 && (
              <ErrorList errors={submissionState.serverErrors} onClear={clearErrors} />
            )}
          </CardContent>

          <CardFooter>
            <Button
              onClick={handleCreatePage}
              disabled={submissionState.isSubmitting || !formState.url.trim()}
              className="w-full"
            >
              {submissionState.isSubmitting ? (
                <>
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creating...
                </>
              ) : (
                "Create Page"
              )}
            </Button>
          </CardFooter>
        </Card>
      </main>
    </>
  );
}
```

### Step 5: Integrate with app.astro

**5.1: Update app.astro routing logic**
1. Open `src/pages/app.astro`
2. Import InitialPageSetup component
3. Add conditional rendering for showInitialSetup state
4. Update the logic to handle 404 response:

```astro
---
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { InitialPageSetup } from "@/components/setup/InitialPageSetup";
import type { PageDto } from "@/types";
import "@/styles/global.css";

// Check authentication
const { data: userData, error: authError } = await Astro.locals.supabase.auth.getUser();

if (authError || !userData?.user) {
  return Astro.redirect("/");
}

// Fetch page data
let pageData: PageDto | null = null;
let showInitialSetup = false;
let fetchError: string | null = null;

try {
  const response = await fetch(`${Astro.url.origin}/api/pages`, {
    headers: {
      cookie: Astro.request.headers.get("cookie") || "",
    },
  });

  if (response.status === 404) {
    // User doesn't have a page yet - show initial setup
    showInitialSetup = true;
  } else if (response.status === 401) {
    return Astro.redirect("/");
  } else if (response.ok) {
    pageData = await response.json();
  } else {
    fetchError = "Failed to load page data";
  }
} catch (err) {
  console.error("Error fetching page data:", err);
  fetchError = "Failed to load page data";
}
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dashboard - Personal Pages</title>
  </head>
  <body>
    {
      fetchError ? (
        <div class="flex min-h-screen items-center justify-center">
          <div class="text-center">
            <h1 class="mb-4 text-2xl font-bold">Error</h1>
            <p class="text-muted-foreground">{fetchError}</p>
            <a href="/" class="mt-4 inline-block text-primary hover:underline">
              Go back to home
            </a>
          </div>
        </div>
      ) : showInitialSetup ? (
        <InitialPageSetup client:load baseUrl={Astro.url.origin} />
      ) : pageData ? (
        <AdminDashboard client:load initialPage={pageData} baseUrl={Astro.url.origin} />
      ) : (
        <div class="flex min-h-screen items-center justify-center">
          <div class="text-center">
            <div class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p class="text-muted-foreground">Loading...</p>
          </div>
        </div>
      )
    }
  </body>
</html>
```

### Step 6: Styling and responsive design

**6.1: Apply consistent Tailwind styles**
1. Use spacing scale: space-y-6, space-y-2, gap-2
2. Apply max-width to Card: max-w-2xl
3. Center Card: mx-auto
4. Responsive padding: px-4 py-8
5. Ensure form fields stack on mobile (default flex-col)

**6.2: Match dashboard theme**
1. Use same color variables as PageSettingsCard
2. Consistent button styling
3. Match card styling
4. Use muted-foreground for helper text
5. Use destructive color for errors

**6.3: Loading states**
1. Spinner in button during submission
2. Disabled state styling on all inputs
3. FileUploadButton has built-in loading state

### Step 7: Accessibility enhancements

**7.1: ARIA attributes**
1. Add `aria-invalid={!!submissionState.urlError}` to URL input
2. Add `aria-describedby` linking inputs to helper text
3. Error messages have `role="alert"` (already in inline errors)
4. ErrorList has `role="alert"` and `aria-live="polite"` (built-in)
5. Toast uses Sonner's built-in aria-live regions

**7.2: Focus management**
1. Ensure logical tab order through form
2. Consider focusing URL input on URL conflict error
3. FileUploadButton is keyboard accessible

**7.3: Labels and descriptions**
1. All form fields have associated Label components
2. Helper text provides additional context
3. Button text clearly describes action
4. Loading states announce changes ("Creating...")

### Step 10: Code quality and polish

**10.1: Linter**
1. Check linting and fix errors