# API Endpoint Implementation Plan: Pages Resource

## 1. Endpoint Overview

The Pages resource manages personal pages for authenticated users. This implementation covers four RESTful endpoints
that handle the complete lifecycle of a user's personal page, including creation, retrieval, theme updates, and
deletion.

**Key Characteristics:**

- One-to-one relationship: Each user can have exactly one personal page
- All operations require authentication via Supabase auth
- Public read access for published pages (per RLS policies)
- Database-level enforcement of URL uniqueness
- Cascade deletion of associated projects when page is deleted

**Endpoints:**

1. `POST /api/pages` - Create a new personal page
2. `GET /api/pages` - Retrieve page configuration
3. `PUT /api/pages` - Update page theme
4. `DELETE /api/pages` - Delete user's page

## 2. Request Details

### 2.1 Create User Page

- **HTTP Method**: `POST`
- **URL Structure**: `/api/pages`
- **Authentication**: Required (Supabase session)
- **Parameters**:
  - Required:
    - `url` (string): URL slug, 3-30 characters, lowercase alphanumeric and hyphens only
    - `theme` (string): Theme identifier
  - Optional:
    - `data` (string): Initial YAML content for the page
- **Request Body**:
  ```json
  {
    "url": "my-awesome-page",
    "theme": "theme-1",
    "data": "name: John Doe\nbio: A software developer."
  }
  ```

### 2.2 Get User Page

- **HTTP Method**: `GET`
- **URL Structure**: `/api/pages`
- **Authentication**: Required (Supabase session)
- **Parameters**: None (uses authenticated user ID)
- **Request Body**: None

### 2.3 Update Page Theme

- **HTTP Method**: `PUT`
- **URL Structure**: `/api/pages`
- **Authentication**: Required (Supabase session)
- **Parameters**:
  - Required:
    - `theme` (string): New theme identifier
- **Request Body**:
  ```json
  {
    "theme": "theme-2"
  }
  ```

### 2.4 Delete User Page

- **HTTP Method**: `DELETE`
- **URL Structure**: `/api/pages`
- **Authentication**: Required (Supabase session)
- **Parameters**: None (uses authenticated user ID)
- **Request Body**: None

## 3. Used Types

All types are defined in `src/types.ts`:

### DTOs (Data Transfer Objects)

**PageDto** - Used for GET response:

```typescript
export type PageDto = Pick<PageEntity, "user_id" | "url" | "theme" | "created_at" | "updated_at">;
```

**PageCreateResponseDto** - Used for POST and PUT responses:

```typescript
export type PageCreateResponseDto = Pick<PageEntity, "user_id" | "url" | "theme">;
```

### Command Models

**CreatePageCommand** - Used for POST request:

```typescript
export interface CreatePageCommand {
  url: string;
  theme: string;
  data?: string;
}
```

**UpdatePageThemeCommand** - Used for PUT request:

```typescript
export interface UpdatePageThemeCommand {
  theme: string;
}
```

### Error Types

**ErrorResponse** - Used for all error responses:

```typescript
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: ValidationErrorDetail[];
  };
}
```

## 4. Response Details

### 4.1 Create User Page (POST)

**Success Response (201 Created):**

```json
{
  "user_id": "uuid-string",
  "url": "my-awesome-page",
  "theme": "theme-1"
}
```

**Error Responses:**

- `400 Bad Request`: Invalid input (URL format, theme, YAML)
- `401 Unauthorized`: Not authenticated
- `409 Conflict`: Page already exists for user or URL already taken
- `500 Internal Server Error`: Database error

### 4.2 Get User Page (GET)

**Success Response (200 OK):**

```json
{
  "user_id": "uuid-string",
  "url": "my-awesome-page",
  "theme": "theme-1",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**

- `401 Unauthorized`: Not authenticated
- `404 Not Found`: No page found for user
- `500 Internal Server Error`: Database error

### 4.3 Update Page Theme (PUT)

**Success Response (200 OK):**

```json
{
  "user_id": "uuid-string",
  "url": "my-awesome-page",
  "theme": "theme-2"
}
```

**Error Responses:**

- `400 Bad Request`: Invalid theme
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: No page found for user
- `500 Internal Server Error`: Database error

### 4.4 Delete User Page (DELETE)

**Success Response (204 No Content):**

- Empty body

**Error Responses:**

- `401 Unauthorized`: Not authenticated
- `404 Not Found`: No page found for user
- `500 Internal Server Error`: Database error

## 5. Data Flow

### 5.1 Create Page Flow

1. **Request Reception**: Astro API endpoint receives POST request at `/api/pages`
2. **Authentication Check**: Extract and verify Supabase session from `context.locals.supabase`
3. **Request Validation**: Validate request body against `CreatePageCommand` schema using Zod
4. **Service Call**: Call `pagesService.createPage()` with validated command
5. **Business Logic**:
   - Check if user already has a page (enforce one-to-one)
   - Validate URL uniqueness
   - Insert new page record into `pages` table (YAML validation will be implemented later)
6. **Response**: Return `PageCreateResponseDto` with 201 status

### 5.2 Get Page Flow

1. **Request Reception**: Astro API endpoint receives GET request at `/api/pages`
2. **Authentication Check**: Extract and verify Supabase session
3. **Service Call**: Call `pagesService.getPageByUserId()` with user ID
4. **Data Retrieval**: Query `pages` table for user's page (exclude `data` field)
5. **Response**: Return `PageDto` with 200 status, or 404 if not found

### 5.3 Update Theme Flow

1. **Request Reception**: Astro API endpoint receives PUT request at `/api/pages`
2. **Authentication Check**: Extract and verify Supabase session
3. **Request Validation**: Validate request body against `UpdatePageThemeCommand` schema
4. **Service Call**: Call `pagesService.updatePageTheme()` with validated command
5. **Business Logic**:
   - Verify page exists for user
   - Update `theme` field and `updated_at` timestamp
6. **Response**: Return `PageCreateResponseDto` with 200 status

### 5.4 Delete Page Flow

1. **Request Reception**: Astro API endpoint receives DELETE request at `/api/pages`
2. **Authentication Check**: Extract and verify Supabase session
3. **Service Call**: Call `pagesService.deletePage()` with user ID
4. **Business Logic**:
   - Verify page exists for user
   - Delete page record (cascades to projects via FK constraint)
5. **Response**: Return empty body with 204 status

## 6. Security Considerations

### 6.1 Authentication

- **Requirement**: All endpoints require valid Supabase authentication session
- **Implementation**: Use `context.locals.supabase.auth.getUser()` to verify session
- **Error Handling**: Return 401 Unauthorized if session is invalid or missing

### 6.2 Authorization

- **RLS Policies**: Supabase Row-Level Security enforces:
  - `pages_select_policy`: Public read access (for published pages)
  - `pages_insert_policy`: Users can only create their own page (`auth.uid() = user_id`)
  - `pages_update_policy`: Users can only update their own page
  - `pages_delete_policy`: Users can only delete their own page
- **Implementation**: Pass authenticated user ID from session to all service methods

### 6.3 Input Validation

**URL Validation:**

- Pattern: `^[a-z0-9-]+$` (lowercase alphanumeric and hyphens only)
- Length: 3-30 characters
- Uniqueness: Enforced at database level with unique constraint

**Theme Validation:**

- Non-empty string
- Consider implementing theme whitelist validation if theme list is finite

**YAML Data Validation:**

- Optional field
- Validate YAML syntax using a YAML parser
- Implement size limit to prevent DOS attacks (e.g., max 100KB)
- Store as-is; sanitization required during render to prevent XSS

### 6.4 Potential Security Threats

**URL Slug Squatting:**

- No reserved words protection specified
- Consider implementing reserved URL list (admin, api, login, etc.)

**YAML Bomb/DOS:**

- Implement request body size limits
- Set maximum YAML payload size (e.g., 100KB)
- Consider timeout for YAML parsing

## 7. Error Handling

### 7.1 Validation Errors (400)

**Trigger Conditions:**

- URL format invalid (not matching `^[a-z0-9-]+$`)
- URL length outside 3-30 character range
- Missing required fields (`url`, `theme`)
- Invalid YAML syntax in `data` field
- Invalid theme identifier

**Response Format:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "url",
        "issue": "URL must be 3-30 characters and contain only lowercase letters, numbers, and hyphens"
      }
    ]
  }
}
```

### 7.2 Authentication Errors (401)

**Trigger Conditions:**

- Missing Supabase session
- Expired session token
- Invalid session token

**Response Format:**

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

### 7.3 Not Found Errors (404)

**Trigger Conditions:**

- GET: User has no page in database
- PUT: User has no page to update
- DELETE: User has no page to delete

**Response Format:**

```json
{
  "error": {
    "code": "PAGE_NOT_FOUND",
    "message": "No page found for this user"
  }
}
```

### 7.4 Conflict Errors (409)

**Trigger Conditions:**

- POST: User already has a page (one-to-one constraint)
- POST: URL slug already taken by another user

**Response Format:**

```json
{
  "error": {
    "code": "PAGE_ALREADY_EXISTS",
    "message": "A page already exists for this user"
  }
}
```

Or:

```json
{
  "error": {
    "code": "URL_ALREADY_TAKEN",
    "message": "This URL is already in use"
  }
}
```

### 7.5 Server Errors (500)

**Trigger Conditions:**

- Database connection failures
- Unexpected database errors
- Supabase service errors

**Response Format:**

```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

**Logging:**

- Log full error details server-side
- Do not expose internal error details to client
- Include request ID for tracing

## 8. Performance Considerations

### 8.1 Database Optimization

**Indexes:**

- `pages_url_idx` (UNIQUE): Optimizes URL uniqueness checks and lookups by URL
- Primary key on `user_id`: Optimizes lookups by user

**Query Optimization:**

- GET requests should use `select()` with explicit column list, excluding `data` field
- Use single-row operations (no batch queries needed for these endpoints)

## 9. Implementation Steps

### Step 1: Create Pages Service

**File:** `src/lib/services/pages.service.ts`

**Methods to implement:**

1. `createPage(supabase: SupabaseClient, userId: string, command: CreatePageCommand): Promise<PageCreateResponseDto>`
   - Check if user already has a page
   - Insert page record (YAML validation will be implemented later)
   - Return created page data

2. `getPageByUserId(supabase: SupabaseClient, userId: string): Promise<PageDto | null>`
   - Query pages table by user_id
   - Exclude `data` field from selection
   - Return page or null

3. `updatePageTheme(supabase: SupabaseClient, userId: string, command: UpdatePageThemeCommand): Promise<PageCreateResponseDto>`
   - Verify page exists
   - Update theme and updated_at
   - Return updated page data

4. `deletePage(supabase: SupabaseClient, userId: string): Promise<boolean>`
   - Delete page by user_id
   - Return success/failure

**Error Handling:**

- Throw typed errors for different scenarios (NotFound, AlreadyExists, etc.)
- Let endpoint handlers catch and transform to HTTP responses

### Step 2: Create Zod Validation Schemas

**File:** `src/lib/validators/pages.validators.ts`

**Schemas to create:**

1. `createPageSchema`:

   ```typescript
   import { z } from "zod";

   export const createPageSchema = z.object({
     url: z
       .string()
       .min(3, "URL must be at least 3 characters")
       .max(30, "URL must not exceed 30 characters")
       .regex(/^[a-z0-9-]+$/, "URL must contain only lowercase letters, numbers, and hyphens"),
     theme: z.string().min(1, "Theme is required"),
     data: z.string().optional(),
   });
   ```

2. `updatePageThemeSchema`:
   ```typescript
   export const updatePageThemeSchema = z.object({
     theme: z.string().min(1, "Theme is required"),
   });
   ```

### Step 3: Implement POST /api/pages Endpoint

**File:** `src/pages/api/pages.ts`

**Implementation:**

```typescript
import type { APIRoute } from "astro";
import { createPageSchema } from "../../../lib/validators/pages.validators";
import * as pagesService from "../../../lib/services/pages.service";
import type { CreatePageCommand, PageCreateResponseDto, ErrorResponse } from "../../../types";

export const POST: APIRoute = async ({ request, locals }) => {
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

    // 2. Parse and validate request body
    const body = await request.json();
    const validationResult = createPageSchema.safeParse(body);

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

    // 3. Call service to create page
    const command: CreatePageCommand = validationResult.data;
    const result = await pagesService.createPage(locals.supabase, user.id, command);

    // 4. Return success response
    return new Response(JSON.stringify(result), { status: 201, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    // Handle specific errors (PageAlreadyExistsError, UrlAlreadyTakenError, etc.)
    // Return appropriate error responses
  }
};
```

**Error Handling:**

- Catch service-specific errors (AlreadyExists, UrlTaken)
- Map to appropriate HTTP status codes
- Log errors for debugging

### Step 4: Implement GET /api/pages Endpoint

**File:** `src/pages/api/pages.ts` (add to existing file)

**Implementation:**

```typescript
export const GET: APIRoute = async ({ locals }) => {
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

    // 2. Call service to get page
    const page = await pagesService.getPageByUserId(locals.supabase, user.id);

    if (!page) {
      return new Response(
        JSON.stringify({
          error: {
            code: "PAGE_NOT_FOUND",
            message: "No page found for this user",
          },
        } as ErrorResponse),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Return success response
    return new Response(JSON.stringify(page), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    // Handle unexpected errors
  }
};
```

### Step 5: Implement PUT /api/pages Endpoint

**File:** `src/pages/api/pages.ts` (add to existing file)

**Implementation:**

```typescript
export const PUT: APIRoute = async ({ request, locals }) => {
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

    // 2. Parse and validate request body
    const body = await request.json();
    const validationResult = updatePageThemeSchema.safeParse(body);

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

    // 3. Call service to update page theme
    const command: UpdatePageThemeCommand = validationResult.data;
    const result = await pagesService.updatePageTheme(locals.supabase, user.id, command);

    // 4. Return success response
    return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    // Handle specific errors (PageNotFoundError, etc.)
  }
};
```

### Step 6: Implement DELETE /api/pages Endpoint

**File:** `src/pages/api/pages.ts` (add to existing file)

**Implementation:**

```typescript
export const DELETE: APIRoute = async ({ locals }) => {
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

    // 2. Call service to delete page
    const deleted = await pagesService.deletePage(locals.supabase, user.id);

    if (!deleted) {
      return new Response(
        JSON.stringify({
          error: {
            code: "PAGE_NOT_FOUND",
            message: "No page found for this user",
          },
        } as ErrorResponse),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Return success response (no content)
    return new Response(null, { status: 204 });
  } catch (error) {
    // Handle unexpected errors
  }
};
```

### Step 7: Create Custom Error Classes

**File:** `src/lib/errors/pages.errors.ts`

**Classes to create:**

```typescript
export class PageAlreadyExistsError extends Error {
  constructor(message = "A page already exists for this user") {
    super(message);
    this.name = "PageAlreadyExistsError";
  }
}

export class UrlAlreadyTakenError extends Error {
  constructor(message = "This URL is already in use") {
    super(message);
    this.name = "UrlAlreadyTakenError";
  }
}

export class PageNotFoundError extends Error {
  constructor(message = "No page found for this user") {
    super(message);
    this.name = "PageNotFoundError";
  }
}

export class InvalidYamlError extends Error {
  constructor(message = "Invalid YAML syntax") {
    super(message);
    this.name = "InvalidYamlError";
  }
}
```

### Step 8: Implement Error Handler Middleware

**File:** `src/lib/utils/error-handler.utils.ts`

**Utility function:**

```typescript
import type { ErrorResponse } from "../../types";
import {
  PageAlreadyExistsError,
  UrlAlreadyTakenError,
  PageNotFoundError,
  InvalidYamlError,
} from "../errors/pages.errors";

export function handleApiError(error: unknown): Response {
  console.error("API Error:", error);

  // Handle known errors
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
        },
      } as ErrorResponse),
      { status: 400, headers: { "Content-Type": "application/json" } }
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
```
