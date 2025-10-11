# API Endpoint Implementation Plan: Reorder Projects

## 1. Endpoint Overview

The `PUT /api/projects/reorder` endpoint enables authenticated users to update the display order of multiple projects. This endpoint is designed to support drag-and-drop reordering functionality in the UI, allowing users to reorganize their project portfolio efficiently.

**Key Characteristics:**
- Bulk update: Multiple projects can be reordered in one request
- Authorization: Users can only reorder their own projects
- Sequential updates: Projects are updated one by one

## 2. Request Details

- **HTTP Method**: `PUT`
- **URL Path**: `/api/projects/reorder`
- **Content-Type**: `application/json`
- **Authentication**: Required (Supabase session via secure cookies)

### Parameters

**Required:**
- **Body Parameters** (JSON):
  - `project_orders` (array of objects): List of projects with their new display orders
    - `project_id` (string): Unique identifier of the project (1-100 characters)
    - `display_order` (number): New display order value (non-negative integer)

**Optional:**
- None

### Request Body Schema

```json
{
  "project_orders": [
    {
      "project_id": "my-first-project",
      "display_order": 0
    },
    {
      "project_id": "another-project",
      "display_order": 1
    },
    {
      "project_id": "third-project",
      "display_order": 2
    }
  ]
}
```

### Validation Rules

1. `project_orders` must be a non-empty array
2. Each `project_id` must be a non-empty string (max 100 characters)
3. Each `display_order` must be a non-negative integer (>= 0)
4. No duplicate `project_id` values are allowed in the array
5. All projects must belong to the authenticated user
6. All projects must exist in the database

## 3. Used Types

### Command Models (from `src/types.ts`)

```typescript
// Already defined in types.ts
export interface ReorderProjectsCommand {
  project_orders: ProjectOrderEntry[];
}

export interface ProjectOrderEntry {
  project_id: string;
  display_order: number;
}
```

### Response Types

```typescript
// Success response: 200 OK with empty body
// No specific DTO needed for success case

// Error response: Use existing ErrorResponse type
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: ValidationErrorDetail[];
  };
}
```

## 4. Response Details

### Success Response

**Status Code**: `200 OK`

**Body**: Empty or minimal success indicator
```json
{}
```

**Headers**:
- `Content-Type: application/json`

### Error Responses

#### 400 Bad Request
**Scenarios:**
- Invalid JSON payload
- Missing required fields
- Invalid data types
- Negative display_order values
- Empty project_orders array
- Duplicate project_id values
- Project doesn't belong to the authenticated user

**Example Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The provided data is invalid.",
    "details": [
      {
        "field": "project_orders[0].display_order",
        "issue": "Number must be greater than or equal to 0"
      }
    ]
  }
}
```

#### 401 Unauthorized
**Scenarios:**
- No valid authentication session
- Expired session token

**Example Response:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required."
  }
}
```

#### 404 Not Found
**Scenarios:**
- One or more specified project_id values don't exist

**Example Response:**
```json
{
  "error": {
    "code": "PROJECT_NOT_FOUND",
    "message": "One or more projects were not found.",
    "details": [
      {
        "field": "project_orders[1].project_id",
        "issue": "Project 'non-existent-project' does not exist"
      }
    ]
  }
}
```

#### 500 Internal Server Error
**Scenarios:**
- Database connection failure
- Unexpected server errors

**Example Response:**
```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## 5. Data Flow

```
1. Client Request
   ↓
2. Astro Middleware
   - Verify session from cookies
   - Extract user_id from auth context
   ↓
3. API Route Handler (src/pages/api/projects/reorder.ts)
   - Check authentication
   - Parse request body
   ↓
4. Input Validation
   - Validate against Zod schema
   - Check for duplicate project_ids
   - Return 400 if validation fails
   ↓
5. Service Layer (src/lib/services/projects.service.ts)
   - Fetch all specified projects
   - Verify all projects exist (404 if not)
   - Verify all projects belong to user (404 if not)
   - Update display_order for each project sequentially
   ↓
6. Response
   - Return 200 OK on success
   - Return appropriate error on failure
```

### Database Operations

1. **Fetch Projects** (Verification):
   ```sql
   SELECT user_id, project_id
   FROM projects
   WHERE user_id = $1 AND project_id = ANY($2)
   ```

2. **Update Each Project** (Sequential):
   ```sql
   -- For each project in the list
   UPDATE projects
   SET display_order = $1
   WHERE user_id = $2 AND project_id = $3
   ```
   Note: The `updated_at` column is automatically updated by the database trigger.

## 6. Security Considerations

### Authentication
- **Mechanism**: Supabase session-based authentication via secure HTTP-only cookies
- **Verification**: Middleware checks for valid session before route handler executes
- **Action**: Return 401 if no valid session exists

### Authorization
- **Database Level**: PostgreSQL RLS policies enforce user_id matching
- **Application Level**: Service layer explicitly verifies project ownership by filtering results using user_id

### Input Sanitization
- **Validation**: Zod schema validates all input types and constraints
- **SQL Injection**: Supabase client uses parameterized queries
- **XSS Prevention**: JSON response format prevents script injection

## 7. Error Handling

### Existing Error Classes

The project already has error handling infrastructure:

**From `src/lib/errors/projects.errors.ts`:**
```typescript
export class ProjectNotFoundError extends Error {
  constructor(message = "Project not found") {
    super(message);
    this.name = "ProjectNotFoundError";
  }
}
```

**From `src/lib/utils/error-handler.utils.ts`:**
- `handleApiError()` - Centralized error handler that maps custom errors to HTTP responses
- Already handles `ProjectNotFoundError` → 404 response with "PROJECT_NOT_FOUND" code

### Error Handling Strategy

| Error Type | Status Code | Response Code | Handler |
|------------|-------------|---------------|---------|
| Zod Validation Failed | 400 | VALIDATION_ERROR | Manual handling in route |
| Empty Array | 400 | VALIDATION_ERROR | Caught by Zod schema |
| Duplicate IDs | 400 | VALIDATION_ERROR | Caught by Zod refine |
| No Session | 401 | UNAUTHORIZED | Manual handling in route |
| Projects Not Found | 404 | PROJECT_NOT_FOUND | Use existing `ProjectNotFoundError` + `handleApiError()` |
| DB Connection Error | 500 | INTERNAL_SERVER_ERROR | Caught by `handleApiError()` |

### Implementation Notes

- Use existing `ProjectNotFoundError` from `src/lib/errors/projects.errors.ts`
- Use existing `handleApiError()` from `src/lib/utils/error-handler.utils.ts` for service layer errors
- Handle authentication and validation errors directly in the route handler
- No need to create additional error classes or response builders

## 8. Performance Considerations

### Database Performance

**Query Optimization:**
- Composite primary key (user_id, project_id) provides efficient lookup
- Sequential updates are acceptable for typical project counts (usually < 20 projects)
- Each update is a simple primary key lookup with minimal overhead

**Index Usage:**
- Primary key index on (user_id, project_id) ensures fast updates
- The `updated_at` trigger runs automatically without manual intervention

### Scalability

**Concurrent Requests:**
- Multiple users can reorder independently (different user_id)
- Same user concurrent reorders: last write wins for each project
- No locking mechanism needed due to simple update operations

## 9. Implementation Steps

### Step 1: Add Zod Validation Schema
**File**: `src/lib/validators/projects.validators.ts`

Add the reorder validation schema to the existing validators file:

```typescript
/**
 * Validation schema for a single project order entry.
 */
const projectOrderEntrySchema = z.object({
  project_id: z.string().min(1, "Project ID is required").max(100, "Project ID must be at most 100 characters"),
  display_order: z.number().int("Display order must be an integer").nonnegative("Display order must be non-negative"),
});

/**
 * Validation schema for reordering projects.
 * Used in PUT /api/projects/reorder request validation.
 */
export const reorderProjectsSchema = z
  .object({
    project_orders: z.array(projectOrderEntrySchema).min(1, "At least one project is required"),
  })
  .refine(
    (data) => {
      const ids = data.project_orders.map((p) => p.project_id);
      return ids.length === new Set(ids).size;
    },
    {
      message: "Duplicate project_id values are not allowed",
      path: ["project_orders"],
    }
  );
```

### Step 2: Add Service Method
**File**: `src/lib/services/projects.service.ts`

Add the `reorderProjects` function to the existing service file:

```typescript
/**
 * Reorders multiple projects by updating their display_order values.
 * Verifies all projects exist and belong to the user before updating.
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param projectOrders - Array of project IDs with new display orders
 * @throws {ProjectNotFoundError} If any project not found or not owned by user
 * @throws {Error} For database errors
 */
export async function reorderProjects(
  supabase: SupabaseClient,
  userId: string,
  projectOrders: ProjectOrderEntry[]
): Promise<void> {
  // 1. Extract all project IDs
  const projectIds = projectOrders.map((p) => p.project_id);

  // 2. Fetch all projects to verify existence and ownership
  const { data: existingProjects, error: fetchError } = await supabase
    .from("projects")
    .select("project_id")
    .eq("user_id", userId)
    .in("project_id", projectIds);

  if (fetchError) {
    throw new Error(`Database error while fetching projects: ${fetchError.message}`);
  }

  // 3. Check if all projects exist
  const existingIds = new Set(existingProjects?.map((p) => p.project_id) || []);
  const missingIds = projectIds.filter((id) => !existingIds.has(id));

  if (missingIds.length > 0) {
    throw new ProjectNotFoundError();
  }

  // 4. Update each project's display_order
  for (const order of projectOrders) {
    const { error: updateError } = await supabase
      .from("projects")
      .update({ display_order: order.display_order })
      .eq("user_id", userId)
      .eq("project_id", order.project_id);

    if (updateError) {
      throw new Error(`Database error while updating project: ${updateError.message}`);
    }
  }
}
```

### Step 3: Create API Route Handler
**File**: `src/pages/api/projects/reorder.ts` (new file)

Create the API endpoint following the existing pattern from `src/pages/api/projects/index.ts`:

```typescript
import type { APIRoute } from "astro";
import { reorderProjectsSchema } from "@/lib/validators/projects.validators.ts";
import * as projectsService from "@/lib/services/projects.service.ts";
import type { ErrorResponse, ReorderProjectsCommand } from "@/types.ts";
import { handleApiError } from "@/lib/utils/error-handler.utils.ts";

/**
 * PUT /api/projects/reorder - Reorder multiple projects
 *
 * @param request - Contains array of project IDs with new display orders
 * @param locals - Astro context with Supabase client
 * @returns 200 OK on success, or error response
 */
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
    const validationResult = reorderProjectsSchema.safeParse(body);

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

    // 3. Call service to reorder projects
    const command: ReorderProjectsCommand = validationResult.data;
    await projectsService.reorderProjects(locals.supabase, user.id, command.project_orders);

    // 4. Return success response
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleApiError(error);
  }
};
```

### Step 4: Import Required Types
**File**: `src/lib/services/projects.service.ts`

Add the import for `ProjectOrderEntry` type at the top of the file:

```typescript
import type {
  CreateProjectCommand,
  ProjectCreateResponseDto,
  ProjectData,
  ProjectDto,
  ProjectOrderEntry, // Add this import
  UpdateProjectNameCommand,
} from "@/types.ts";
```