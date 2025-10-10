# API Endpoint Implementation Plan: Projects Management

## 1. Endpoint Overview

This implementation plan covers five REST API endpoints for managing user projects in the Personal Pages application:

1. **POST /api/projects** - Create a new project with server-generated slug
2. **GET /api/projects** - List all projects for authenticated user
3. **GET /api/projects/{project_id}** - Retrieve a single project
4. **PUT /api/projects/{project_id}** - Update project name
5. **DELETE /api/projects/{project_id}** - Delete a project

Projects are subpages of user portfolios that showcase individual work items. Each project has a unique server-generated `project_id` slug, a human-readable name, display order, and optional YAML data. Projects have a composite primary key of `(user_id, project_id)` ensuring slug uniqueness within user scope.

**Key Business Rules:**
- Users can only create projects if they have a main page (enforced by foreign key constraint)
- `project_id` is automatically generated from `project_name` and cannot be changed after creation
- Projects are publicly readable but only modifiable by their owner
- Projects are sorted by `display_order` for consistent presentation

## 2. Request Details

### 2.1. POST /api/projects

- **HTTP Method**: `POST`
- **URL Structure**: `/api/projects`
- **Authentication**: Required (via Supabase auth)
- **Parameters**: None
- **Request Body**:
  ```typescript
  {
    "project_name": string,      // Required, max 100 characters
    "display_order": number      // Required, non-negative integer
  }
  ```
- **Content-Type**: `application/json`

### 2.2. GET /api/projects

- **HTTP Method**: `GET`
- **URL Structure**: `/api/projects`
- **Authentication**: Required
- **Parameters**: None
- **Request Body**: None

### 2.3. GET /api/projects/{project_id}

- **HTTP Method**: `GET`
- **URL Structure**: `/api/projects/{project_id}`
- **Authentication**: Required
- **Parameters**:
  - `project_id` (string, required): URL path parameter, max 100 characters
- **Request Body**: None

### 2.4. PUT /api/projects/{project_id}

- **HTTP Method**: `PUT`
- **URL Structure**: `/api/projects/{project_id}`
- **Authentication**: Required
- **Parameters**:
  - `project_id` (string, required): URL path parameter, max 100 characters
- **Request Body**:
  ```typescript
  {
    "project_name": string      // Required, max 100 characters
  }
  ```
- **Content-Type**: `application/json`

### 2.5. DELETE /api/projects/{project_id}

- **HTTP Method**: `DELETE`
- **URL Structure**: `/api/projects/{project_id}`
- **Authentication**: Required
- **Parameters**:
  - `project_id` (string, required): URL path parameter, max 100 characters
- **Request Body**: None

## 3. Used Types

All types are defined in `src/types.ts`:

### 3.1. DTOs (Data Transfer Objects)

```typescript
/**
 * Project DTO (excludes YAML data field and timestamps)
 * Used in: GET /api/projects, GET /api/projects/{id}
 */
export type ProjectDto = Pick<ProjectEntity, "user_id" | "project_id" | "project_name" | "display_order">;

/**
 * Response DTO after creating a project
 * Used in: POST /api/projects response
 */
export type ProjectCreateResponseDto = Pick<
  ProjectEntity,
  "user_id" | "project_id" | "project_name" | "display_order" | "created_at" | "updated_at"
>;
```

### 3.2. Command Models

```typescript
/**
 * Command for creating a new project
 * Used in: POST /api/projects request
 */
export interface CreateProjectCommand {
  /** Name of the project (max 100 chars) */
  project_name: string;
  /** Display order for the project (non-negative integer) */
  display_order: number;
}

/**
 * Command for updating a project's name
 * Used in: PUT /api/projects/{id} request
 */
export interface UpdateProjectNameCommand {
  /** New project name (max 100 chars) */
  project_name: string;
}
```

### 3.3. Error Response

```typescript
/**
 * Standard error response structure
 * Used for all 4xx client errors
 */
export interface ErrorResponse {
  error: {
    /** Error code identifier */
    code: string;
    /** Human-readable error message */
    message: string;
    /** Optional array of validation error details */
    details?: ValidationErrorDetail[];
  };
}

export interface ValidationErrorDetail {
  /** Field name that failed validation */
  field: string;
  /** Description of the validation issue */
  issue: string;
}
```

## 4. Response Details

### 4.1. POST /api/projects

**Success Response (201 Created):**
```json
{
  "user_id": "uuid-string",
  "project_id": "my-first-project",
  "project_name": "My First Project",
  "display_order": 0,
  "created_at": "2025-10-10T12:00:00Z",
  "updated_at": "2025-10-10T12:00:00Z"
}
```

**Error Responses:**
- **400 Bad Request**: Validation errors
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Request validation failed",
      "details": [
        { "field": "project_name", "issue": "String must contain at most 100 character(s)" }
      ]
    }
  }
  ```
- **401 Unauthorized**: Not authenticated
  ```json
  {
    "error": {
      "code": "UNAUTHORIZED",
      "message": "Authentication required"
    }
  }
  ```
- **404 Not Found**: User has no main page (foreign key violation)
  ```json
  {
    "error": {
      "code": "PAGE_NOT_FOUND",
      "message": "No page found for this user"
    }
  }
  ```

### 4.2. GET /api/projects

**Success Response (200 OK):**
```json
[
  {
    "user_id": "uuid-string",
    "project_id": "my-first-project",
    "project_name": "My First Project",
    "display_order": 0
  },
  {
    "user_id": "uuid-string",
    "project_id": "another-project",
    "project_name": "Another Project",
    "display_order": 1
  }
]
```

**Error Responses:**
- **401 Unauthorized**: Not authenticated

### 4.3. GET /api/projects/{project_id}

**Success Response (200 OK):**
```json
{
  "user_id": "uuid-string",
  "project_id": "my-first-project",
  "project_name": "My First Project",
  "display_order": 0
}
```

**Error Responses:**
- **401 Unauthorized**: Not authenticated
- **404 Not Found**: Project not found or not owned by user
  ```json
  {
    "error": {
      "code": "PROJECT_NOT_FOUND",
      "message": "Project not found"
    }
  }
  ```

### 4.4. PUT /api/projects/{project_id}

**Success Response (200 OK):**
```json
{
  "user_id": "uuid-string",
  "project_id": "my-first-project",
  "project_name": "My Renamed Project",
  "display_order": 0
}
```

**Error Responses:**
- **400 Bad Request**: Validation errors
- **401 Unauthorized**: Not authenticated
- **404 Not Found**: Project not found

### 4.5. DELETE /api/projects/{project_id}

**Success Response (204 No Content):**
- Empty response body

**Error Responses:**
- **401 Unauthorized**: Not authenticated
- **404 Not Found**: Project not found

## 5. Data Flow

### 5.1. POST /api/projects

```
Client Request
    ↓
API Route (/api/projects/index.ts - POST handler)
    ↓
1. Extract user_id from context.locals.supabase.auth
2. Validate authentication (401 if not authenticated)
3. Parse and validate request body with Zod schema
    ↓ (validation fails)
    → Return 400 with validation details
    ↓ (validation succeeds)
4. Call ProjectsService.createProject(supabase, user_id, command)
    ↓
Service Layer (src/lib/services/projects.service.ts)
    ↓
5. Generate project_id slug from project_name
    - Lowercase transformation
    - Replace spaces/special chars with hyphens
    - Remove consecutive hyphens
    - Trim hyphens from ends
6. Check for slug conflicts (query projects table)
    ↓ (conflict found)
    → Append numeric suffix (-2, -3, etc.) and retry
    ↓ (unique slug)
7. Insert project into database
    ↓ (foreign key violation - code 23503)
    → Service catches error and throws PageNotFoundError
    ↓ (success)
8. Return created project with timestamps
    ↓
API Route
    ↓
9. Return 201 with ProjectCreateResponseDto
    ↓
Client Response
```

### 5.2. GET /api/projects

```
Client Request
    ↓
API Route (/api/projects/index.ts - GET handler)
    ↓
1. Extract user_id from context.locals.supabase.auth
2. Validate authentication (401 if not authenticated)
3. Call ProjectsService.getUserProjects(supabase, user_id)
    ↓
Service Layer
    ↓
4. Query projects table
    - Filter: user_id = authenticated user
    - Sort: display_order ASC
    - Select: user_id, project_id, project_name, display_order
5. Return array of projects (empty if none)
    ↓
API Route
    ↓
6. Return 200 with ProjectDto[]
    ↓
Client Response
```

### 5.3. GET /api/projects/{project_id}

```
Client Request
    ↓
API Route (/api/projects/[project_id].ts - GET handler)
    ↓
1. Extract project_id from URL params
2. Extract user_id from context.locals.supabase.auth
3. Validate authentication (401 if not authenticated)
4. Call ProjectsService.getProjectById(supabase, user_id, project_id)
    ↓
Service Layer
    ↓
5. Query projects table
    - Filter: user_id AND project_id
    - Select: user_id, project_id, project_name, display_order
    ↓ (no rows returned)
    → Throw ProjectNotFoundError → Return 404
    ↓ (project found)
6. Return project
    ↓
API Route
    ↓
7. Return 200 with ProjectDto
    ↓
Client Response
```

### 5.4. PUT /api/projects/{project_id}

```
Client Request
    ↓
API Route (/api/projects/[project_id].ts - PUT handler)
    ↓
1. Extract project_id from URL params
2. Extract user_id from context.locals.supabase.auth
3. Validate authentication (401 if not authenticated)
4. Parse and validate request body with Zod schema
    ↓ (validation fails)
    → Return 400 with validation details
    ↓ (validation succeeds)
5. Call ProjectsService.updateProjectName(supabase, user_id, project_id, command)
    ↓
Service Layer
    ↓
6. Update projects table
    - Filter: user_id AND project_id
    - Set: project_name = new value
    - Note: updated_at automatically updated by trigger
    ↓ (no rows affected)
    → Throw ProjectNotFoundError → Return 404
    ↓ (update successful)
7. Fetch and return updated project
    ↓
API Route
    ↓
8. Return 200 with ProjectDto
    ↓
Client Response
```

### 5.5. DELETE /api/projects/{project_id}

```
Client Request
    ↓
API Route (/api/projects/[project_id].ts - DELETE handler)
    ↓
1. Extract project_id from URL params
2. Extract user_id from context.locals.supabase.auth
3. Validate authentication (401 if not authenticated)
4. Call ProjectsService.deleteProject(supabase, user_id, project_id)
    ↓
Service Layer
    ↓
5. Delete from projects table
    - Filter: user_id AND project_id
    ↓ (no rows affected)
    → Throw ProjectNotFoundError → Return 404
    ↓ (delete successful)
6. Return void
    ↓
API Route
    ↓
7. Return 204 No Content
    ↓
Client Response
```

## 6. Security Considerations

### 6.1. Authentication

**Implementation:**
- All endpoints require authenticated user via Supabase auth
- Extract user ID from `context.locals.supabase.auth.getUser()`
- Return 401 if authentication fails

**Code Pattern:**
```typescript
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
```

### 6.2. Authorization

**RLS Policies Enforced:**
- **SELECT**: Public read access (RLS policy: `true`)
- **INSERT**: Users can only insert projects with their own `user_id` (RLS policy: `auth.uid() = user_id`)
- **UPDATE**: Users can only update their own projects (RLS policy: `auth.uid() = user_id`)
- **DELETE**: Users can only delete their own projects (RLS policy: `auth.uid() = user_id`)

**Note:** Even though RLS allows public SELECT, API endpoints should require authentication for consistency and to enable user-specific filtering.

### 6.3. Input Validation

**Zod Schemas:**

```typescript
// Create project validation
const createProjectSchema = z.object({
  project_name: z.string().min(1, "Project name is required").max(100, "Project name must be at most 100 characters").trim(),
  display_order: z.number().int("Display order must be an integer").nonnegative("Display order must be non-negative")
});

// Update project name validation
const updateProjectNameSchema = z.object({
  project_name: z.string().min(1, "Project name is required").max(100, "Project name must be at most 100 characters").trim()
});
```

**Validation Flow:**
1. Parse request body with Zod
2. On validation error, return 400 with detailed error messages
3. Use validated data for database operations

### 6.4. Slug Generation

**Implementation:**
```typescript
function generateSlug(projectName: string): string {
  return projectName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with single
    .replace(/^-|-$/g, '');    // Remove leading/trailing hyphens
}
```

### 6.5. Foreign Key Validation

**Business Rule:**
- Users must have a main page before creating projects
- Enforced by foreign key constraint `projects.user_id → pages.user_id`

**Error Handling:**
- Catch PostgreSQL foreign key violation errors (code `23503`)
- Throw `PageNotFoundError` to be handled by error handler
- Return user-friendly 404 message

## 7. Error Handling

### 7.1. Error Response Format

All errors follow the standardized `ErrorResponse` type:

```typescript
{
  error: {
    code: string,
    message: string,
    details?: ValidationErrorDetail[]
  }
}
```

### 7.2. Error Scenarios by Endpoint

#### POST /api/projects

| Status | Code | Scenario | Message |
|--------|------|----------|---------|
| 400 | VALIDATION_ERROR | Invalid project_name or display_order | "Request validation failed" |
| 401 | UNAUTHORIZED | No authentication token | "Authentication required" |
| 404 | PAGE_NOT_FOUND | User has no main page (FK violation) | "No page found for this user" |
| 500 | INTERNAL_SERVER_ERROR | Unexpected database or server error | "An unexpected error occurred" |

#### GET /api/projects

| Status | Code | Scenario | Message |
|--------|------|----------|---------|
| 401 | UNAUTHORIZED | No authentication token | "Authentication required" |
| 500 | INTERNAL_SERVER_ERROR | Database error | "An unexpected error occurred" |

#### GET /api/projects/{project_id}

| Status | Code | Scenario | Message |
|--------|------|----------|---------|
| 401 | UNAUTHORIZED | No authentication token | "Authentication required" |
| 404 | PROJECT_NOT_FOUND | Project doesn't exist or not owned by user | "Project not found" |
| 500 | INTERNAL_SERVER_ERROR | Database error | "An unexpected error occurred" |

#### PUT /api/projects/{project_id}

| Status | Code | Scenario | Message |
|--------|------|----------|---------|
| 400 | VALIDATION_ERROR | Invalid project_name | "Request validation failed" |
| 401 | UNAUTHORIZED | No authentication token | "Authentication required" |
| 404 | PROJECT_NOT_FOUND | Project doesn't exist or not owned by user | "Project not found" |
| 500 | INTERNAL_SERVER_ERROR | Database error | "An unexpected error occurred" |

#### DELETE /api/projects/{project_id}

| Status | Code | Scenario | Message |
|--------|------|----------|---------|
| 401 | UNAUTHORIZED | No authentication token | "Authentication required" |
| 404 | PROJECT_NOT_FOUND | Project doesn't exist or not owned by user | "Project not found" |
| 500 | INTERNAL_SERVER_ERROR | Database error | "An unexpected error occurred" |

### 7.3. Error Handling Pattern

Use centralized error handler from `src/lib/utils/error-handler.utils.ts`:

```typescript
import { handleApiError } from "@/lib/utils/error-handler.utils.ts";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Business logic
  } catch (error) {
    return handleApiError(error);
  }
};
```

## 8. Implementation Steps

### Step 1: Create Project Error Classes

**File**: `src/lib/errors/projects.errors.ts`

```typescript
/**
 * Error thrown when attempting to access, update, or delete a project that doesn't exist.
 */
export class ProjectNotFoundError extends Error {
  constructor(message = "Project not found") {
    super(message);
    this.name = "ProjectNotFoundError";
  }
}
```

**Note:** `PageNotFoundError` already exists in `src/lib/errors/pages.errors.ts` and will be reused for foreign key violations.

### Step 2: Update Error Handler

**File**: `src/lib/utils/error-handler.utils.ts`

Add handling for `ProjectNotFoundError`:

```typescript
import { ProjectNotFoundError } from "../errors/projects.errors";

export function handleApiError(error: unknown): Response {
  // ... existing error handlers ...

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

  // ... existing unknown error handler ...
}
```

### Step 3: Create Validation Schemas

**File**: `src/lib/validators/projects.validators.ts`

```typescript
import { z } from "zod";

/**
 * Validation schema for creating a new project.
 * Used in POST /api/projects request validation.
 */
export const createProjectSchema = z.object({
  project_name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be at most 100 characters")
    .trim(),
  display_order: z
    .number()
    .int("Display order must be an integer")
    .nonnegative("Display order must be non-negative"),
});

/**
 * Validation schema for updating a project's name.
 * Used in PUT /api/projects/{id} request validation.
 */
export const updateProjectNameSchema = z.object({
  project_name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be at most 100 characters")
    .trim(),
});
```

### Step 4: Create Projects Service

**File**: `src/lib/services/projects.service.ts`

**Functions to implement:**

1. **generateProjectSlug(projectName: string): string**
   - Convert project name to URL-safe slug
   - Remove special characters, convert to lowercase
   - Replace spaces with hyphens
   - Remove consecutive hyphens and trim

2. **findUniqueSlug(supabase, userId: string, baseSlug: string): Promise<string>**
   - Check if slug exists for user
   - If conflict, append numeric suffix (-2, -3, etc.)
   - Return unique slug (max 100 attempts to prevent infinite loops)

3. **createProject(supabase, userId: string, command: CreateProjectCommand): Promise<ProjectCreateResponseDto>**
   - Generate unique project_id slug from project_name
   - Insert project into database
   - Catch foreign key violations (error code `23503`) and throw PageNotFoundError
   - Return created project with timestamps

   **Implementation example** (following pattern from `pages.service.ts`):
   ```typescript
   export async function createProject(
     supabase: SupabaseClient,
     userId: string,
     command: CreateProjectCommand
   ): Promise<ProjectCreateResponseDto> {
     // Generate unique slug
     const baseSlug = generateProjectSlug(command.project_name);
     const uniqueSlug = await findUniqueSlug(supabase, userId, baseSlug);

     // Attempt to insert the new project
     const { data, error } = await supabase
       .from("projects")
       .insert({
         user_id: userId,
         project_id: uniqueSlug,
         project_name: command.project_name,
         display_order: command.display_order,
       })
       .select("user_id, project_id, project_name, display_order, created_at, updated_at")
       .single();

     if (error) {
       // Check if error is due to foreign key violation (user has no page)
       if (error.code === "23503") {
         throw new PageNotFoundError();
       }
       throw new Error(`Database error while creating project: ${error.message}`);
     }

     return data;
   }
   ```

4. **getUserProjects(supabase, userId: string): Promise<ProjectDto[]>**
   - Query projects for user
   - Order by display_order ASC
   - Return array of ProjectDto

5. **getProjectById(supabase, userId: string, projectId: string): Promise<ProjectDto>**
   - Query single project by user_id and project_id
   - Throw ProjectNotFoundError if not found
   - Return ProjectDto

6. **updateProjectName(supabase, userId: string, projectId: string, command: UpdateProjectNameCommand): Promise<ProjectDto>**
   - Update project name
   - Throw ProjectNotFoundError if project not found
   - Return updated ProjectDto

7. **deleteProject(supabase, userId: string, projectId: string): Promise<void>**
   - Delete project by user_id and project_id
   - Throw ProjectNotFoundError if not found
   - Return void

### Step 5: Create API Route for Collection Endpoints

**File**: `src/pages/api/projects/index.ts`

**Implement POST and GET handlers following the pattern from `src/pages/api/pages.ts`:**

```typescript
import type { APIRoute } from "astro";
import { createProjectSchema } from "@/lib/validators/projects.validators";
import * as projectsService from "@/lib/services/projects.service";
import type { CreateProjectCommand, ErrorResponse } from "@/types";
import { handleApiError } from "@/lib/utils/error-handler.utils";

/**
 * POST /api/projects - Create a new project for the authenticated user
 *
 * @param request - Contains the project creation data (project_name, display_order)
 * @param locals - Astro context with Supabase client
 * @returns 201 Created with project data, or error response
 */
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
    const validationResult = createProjectSchema.safeParse(body);

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

    // 3. Call service to create project
    const command: CreateProjectCommand = validationResult.data;
    const result = await projectsService.createProject(locals.supabase, user.id, command);

    // 4. Return success response
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * GET /api/projects - Retrieve all projects for the authenticated user
 *
 * @param locals - Astro context with Supabase client
 * @returns 200 OK with array of projects, or error response
 */
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

    // 2. Call service to get projects
    const projects = await projectsService.getUserProjects(locals.supabase, user.id);

    // 3. Return success response
    return new Response(JSON.stringify(projects), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleApiError(error);
  }
};
```

### Step 6: Create API Route for Individual Project Endpoints

**File**: `src/pages/api/projects/[project_id].ts`

**Implement GET, PUT, and DELETE handlers following the pattern from `src/pages/api/pages.ts`:**

```typescript
import type { APIRoute } from "astro";
import { updateProjectNameSchema } from "@/lib/validators/projects.validators";
import * as projectsService from "@/lib/services/projects.service";
import type { UpdateProjectNameCommand, ErrorResponse } from "@/types";
import { handleApiError } from "@/lib/utils/error-handler.utils";

/**
 * GET /api/projects/{project_id} - Retrieve a single project
 *
 * @param params - Contains project_id
 * @param locals - Astro context with Supabase client
 * @returns 200 OK with project data, 404 if not found, or error response
 */
export const GET: APIRoute = async ({ params, locals }) => {
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

    // 2. Extract project_id from params
    const projectId = params.project_id;
    if (!projectId) {
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_REQUEST",
            message: "Project ID is required",
          },
        } as ErrorResponse),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Call service to get project
    const project = await projectsService.getProjectById(locals.supabase, user.id, projectId);

    // 4. Return success response
    return new Response(JSON.stringify(project), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * PUT /api/projects/{project_id} - Update a project's name
 *
 * @param params - Contains project_id
 * @param request - Contains the new project name
 * @param locals - Astro context with Supabase client
 * @returns 200 OK with updated project data, or error response
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
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

    // 2. Extract project_id from params
    const projectId = params.project_id;
    if (!projectId) {
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_REQUEST",
            message: "Project ID is required",
          },
        } as ErrorResponse),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Parse and validate request body
    const body = await request.json();
    const validationResult = updateProjectNameSchema.safeParse(body);

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

    // 4. Call service to update project
    const command: UpdateProjectNameCommand = validationResult.data;
    const result = await projectsService.updateProjectName(
      locals.supabase,
      user.id,
      projectId,
      command
    );

    // 5. Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * DELETE /api/projects/{project_id} - Delete a project
 *
 * @param params - Contains project_id
 * @param locals - Astro context with Supabase client
 * @returns 204 No Content on success, 404 if not found, or error response
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
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

    // 2. Extract project_id from params
    const projectId = params.project_id;
    if (!projectId) {
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_REQUEST",
            message: "Project ID is required",
          },
        } as ErrorResponse),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Call service to delete project
    await projectsService.deleteProject(locals.supabase, user.id, projectId);

    // 4. Return success response (no content)
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
};
```

---

## Implementation Checklist

- [ ] Step 1: Create project error classes in `src/lib/errors/projects.errors.ts`
- [ ] Step 2: Update error handler in `src/lib/utils/error-handler.utils.ts`
- [ ] Step 3: Create validation schemas in `src/lib/validators/projects.validators.ts`
- [ ] Step 4: Create projects service in `src/lib/services/projects.service.ts`
- [ ] Step 5: Implement POST and GET handlers in `src/pages/api/projects/index.ts`
- [ ] Step 6: Implement GET, PUT, DELETE handlers in `src/pages/api/projects/[project_id].ts`