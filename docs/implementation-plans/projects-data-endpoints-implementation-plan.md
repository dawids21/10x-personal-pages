# API Endpoint Implementation Plan: Project Data (YAML)

## 1. Endpoint Overview

Implementation of two related endpoints for managing project YAML data:
- **POST `/api/projects/{project_id}/data`**: Validates and updates project YAML data
- **GET `/api/projects/{project_id}/data`**: Downloads project YAML data as file

Both endpoints follow the same patterns as the pages data endpoints, using Supabase authentication and RLS for authorization.

## 2. Request/Response Details

### POST `/api/projects/{project_id}/data`
- **Input**: JSON body with `data` field containing YAML string
- **Output**: `{ message: "Project data updated successfully" }` (200 OK)
- **Errors**: 400 (validation), 401 (auth), 404 (not found), 500 (server)

### GET `/api/projects/{project_id}/data`
- **Input**: URL parameter `project_id`
- **Output**: YAML file with `Content-Disposition: attachment; filename="{project_id}.yaml"`
- **Errors**: 401 (auth), 404 (not found), 500 (server)

## 3. Required Types and Schemas

### Add to `src/types.ts` (in Project DTOs section):
```typescript
export interface ProjectData {
  name: string;
  description: string;
  tech_stack?: string;
  prod_link?: string;
  start_date?: string; // YYYY-MM-DD
  end_date?: string;   // YYYY-MM-DD
}
```

### Add to `src/lib/validators/projects.validators.ts`:
```typescript
// Request body validation
export const updateProjectDataSchema = z.object({
  data: z.string().min(1, "Data cannot be empty"),
});

// YAML content validation
export const projectDataSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
  description: z.string().min(1, "Description is required").max(500),
  tech_stack: z.string().max(500).optional(),
  prod_link: z.string().max(100).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be YYYY-MM-DD format").optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be YYYY-MM-DD format").optional()
}).refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return new Date(data.end_date) >= new Date(data.start_date);
    }
    return true;
  },
  { message: "End date must be after or equal to start date", path: ["end_date"] }
);
```

### Add to `src/lib/errors/projects.errors.ts`:
```typescript
export class InvalidYamlError extends Error {
  constructor(message = "Invalid YAML syntax") {
    super(message);
    this.name = "InvalidYamlError";
  }
}
```

### Update `src/lib/utils/error-handler.utils.ts`:
Import and handle `InvalidYamlError` from projects.errors (map to INVALID_YAML code, 400 status)

## 4. Service Layer Functions

Add to `src/lib/services/projects.service.ts`:

```typescript
// 1. Parse and validate YAML in single function (like pages service)
export async function parseAndValidateProjectYaml(yamlString: string): Promise<ProjectData>
// - Use js-yaml load()
// - Catch parsing errors and ZodError
// - Throw InvalidYamlError with descriptive message

// 2. Update project data
export async function updateProjectData(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  data: ProjectData
): Promise<void>
// - Update projects.data with JSONB object
// - Throw ProjectNotFoundError if no rows updated

// 3. Get project data
export async function getProjectData(
  supabase: SupabaseClient,
  userId: string,
  projectId: string
): Promise<ProjectData>
// - Select data field from projects
// - Throw ProjectNotFoundError if project not found or data is null

// 4. Convert to YAML
export function convertToYaml(data: ProjectData): string
// - Use js-yaml dump()
```

## 5. API Endpoint Implementation

Create `src/pages/api/projects/[project_id]/data.ts`:

### POST Handler:
1. Extract user from `locals.supabase.auth.getUser()` → 401 if none
2. Parse request JSON body
3. Validate with `updateProjectDataSchema.safeParse()` → 400 with details if fails
4. Extract `project_id` from `Astro.params`
5. Call `parseAndValidateProjectYaml()` (catches InvalidYamlError via handleApiError)
6. Call `updateProjectData()` (catches ProjectNotFoundError via handleApiError)
7. Return 200 with success message
8. Wrap in try-catch, use `handleApiError()` for error responses

### GET Handler:
1. Extract user from `locals.supabase.auth.getUser()` → 401 if none
2. Extract `project_id` from `Astro.params`
3. Call `getProjectData()` (throws ProjectNotFoundError if not found)
4. Call `convertToYaml()` to serialize
5. Return 200 with headers:
   - `Content-Type: text/yaml`
   - `Content-Disposition: attachment; filename="{project_id}.yaml"`
6. Wrap in try-catch, use `handleApiError()` for error responses

## 6. Security Considerations

- **Authentication**: Supabase session validation via `locals.supabase.auth.getUser()`
- **Authorization**: RLS policies enforce user can only access their own projects
- **YAML Parsing**: Use `js-yaml` safe load to prevent code execution
- **Input Validation**: Zod schemas enforce field constraints (max lengths, date formats)
- **Date Logic**: Cross-field validation ensures end_date >= start_date

## 7. Error Handling

All errors handled via centralized `handleApiError()` utility:

| Error Type | HTTP Code | Error Code |
|------------|-----------|------------|
| No authentication | 401 | UNAUTHORIZED |
| Invalid request body | 400 | VALIDATION_ERROR |
| Invalid YAML syntax/validation | 400 | INVALID_YAML |
| Project not found | 404 | PROJECT_NOT_FOUND |
| Database/unexpected errors | 500 | INTERNAL_SERVER_ERROR |

## 8. Implementation Steps

1. **Add `ProjectData` interface** to `src/types.ts`
2. **Add validation schemas** to `src/lib/validators/projects.validators.ts`
3. **Add `InvalidYamlError`** to `src/lib/errors/projects.errors.ts`
4. **Update error handler** in `src/lib/utils/error-handler.utils.ts` to import and handle projects InvalidYamlError
5. **Add service functions** to `src/lib/services/projects.service.ts`:
   - `parseAndValidateProjectYaml()`
   - `updateProjectData()`
   - `getProjectData()`
   - `convertToYaml()`
6. **Create API endpoint file** at `src/pages/api/projects/[project_id]/data.ts` with POST and GET exports