<conversation_summary>
<decisions>

1. **YAML Validation Strategy**: Server-side validation with separate endpoints for uploading pages and projects YAML
   documents
2. **API Endpoint Structure**: RESTful design with clear separation between authentication, page management, project
   management, and templates
3. **YAML Upload Format**: Accept YAML as plain text in request body, send to server and validate
4. **Template Downloads**: Use `Content-Type: application/x-yaml` and `Content-Disposition: attachment` with appropriate
   filenames
5. **Slug Generation**: Server-side deterministic algorithm with automatic suffix appending for conflicts
6. **Authentication**: Supabase Auth session-based via cookies, accessed through `context.locals.supabase`
7. **URL Validation**: Dedicated `/api/pages/url` POST endpoint that validates, checks uniqueness, and updates URL
8. **Error Response Format**: Standardized JSON error objects with code, message, and details array
9. **Rate Limiting**: Not implemented for MVP
10. **Project Reordering**: Dedicated `/api/projects/reorder` PUT endpoint with atomic updates
11. **Response Formats**: 201 for CREATE (with resource), 200 for UPDATE (with resource), 204 for DELETE, 200 for GET (
    with resource) - no wrapper objects
12. **Theme Validation**: Hardcoded enum on server-side
13. **Template Types**: Two templates (page, project); current user data via GET on `/api/pages/data` and
    `/api/projects/{project_id}/data`
14. **Slug Conflicts**: Server automatically appends suffix, returns 200 OK
15. **Bulk Operations**: Not supported in MVP
16. **Cascade Delete**: Database-level CASCADE already configured, API returns 204 No Content
17. **Public Page Viewing**: Implemented as `[url].astro` with server-side rendering (not an API endpoint)
    </decisions>

<matched_recommendations>

1. **Server-Side YAML Validation**: Essential for security and data integrity, prevents malicious data from reaching
   database
2. **RESTful Endpoint Structure**: Separates concerns and aligns with one-to-one (user-page) and one-to-many (
   page-projects) relationships
3. **YAML as Plain Text**: Simplifies server-side processing, allows better error reporting with line numbers
4. **Deterministic Slug Generation**: Ensures consistent, predictable URLs while maintaining uniqueness using
   name-to-slug conversion with collision handling
5. **Supabase Auth Integration**: Leverages built-in session management via cookies, RLS policies automatically enforce
   authorization
6. **Standardized Error Responses**: Provides clarity for client-side error handling with specific field-level
   validation errors
7. **Project Reordering Endpoint**: Allows atomic updates in single transaction, prevents race conditions
8. **Database CASCADE Delete**: Automatic cleanup of related projects when page is deleted
9. **Server-Side Rendering for Public Pages**: More performant than API endpoint for publicly accessible content
   </matched_recommendations>

<api_planning_summary>

# API Specification Summary

## Authentication & Authorization

- **Method**: Supabase Auth with session-based authentication via cookies
- **Protected Endpoints**: All `/api/pages/*` and `/api/projects/*` endpoints require authentication
- **Authorization**: Row-Level Security (RLS) policies enforce data access at database level
- **User Access**: Retrieved via `context.locals.supabase.auth.getUser()` in Astro API routes
- **Public Access**: Public page viewing via `[url].astro` requires no authentication

## API Endpoints

### Authentication

- `/api/auth/*` - Handled by Supabase Auth

### Pages Management

- `GET /api/pages` - Retrieve current user's page (200 OK)
- `POST /api/pages` - Create page (201 Created) - requires `url` and `theme`, `data` optional
- `PUT /api/pages` - Update theme only (200 OK)
- `DELETE /api/pages` - Delete page and cascade to projects (204 No Content)

### Page URL Management

- `POST /api/pages/url` - Validate URL availability and update (200 OK or error)
    - Body: `{ "url": "desired-url" }`
    - Validates format (3-30 chars, lowercase alphanumeric + hyphens, no leading/trailing hyphens, no consecutive
      hyphens)
    - Checks uniqueness and reserved words

### Page Data Management

- `POST /api/pages/data` - Validate and update page YAML data (200 OK)
    - Accepts YAML as plain text
    - Validates against Zod schema
    - Updates `data` JSONB column
- `GET /api/pages/data` - Download current user's page data as YAML
    - Returns YAML file with user's actual data

### Projects Management

- `GET /api/projects` - List user's projects ordered by display_order (200 OK)
- `POST /api/projects` - Create project (201 Created) - requires `project_name` and `display_order`
    - Auto-generates `project_id` slug from `project_name`
    - Handles collisions by appending numeric suffix
- `GET /api/projects/{project_id}` - Get single project (200 OK)
- `PUT /api/projects/{project_id}` - Update project_name only (200 OK)
- `DELETE /api/projects/{project_id}` - Delete project (204 No Content)

### Project Data Management

- `POST /api/projects/{project_id}/data` - Validate and update project YAML data (200 OK)
    - Accepts YAML as plain text
    - Validates against Zod schema
    - Updates `data` JSONB column
- `GET /api/projects/{project_id}/data` - Download project data as YAML

### Project Reordering

- `PUT /api/projects/reorder` - Update display_order for multiple projects (200 OK)
    - Body: `{ "project_orders": [{ "project_id": "...", "display_order": 0 }, ...] }`
    - Validates all projects belong to authenticated user
    - Atomic transaction for all updates

### Templates

- `GET /api/templates/{type}` - Download YAML templates
    - Types: `page`, `project`
    - Returns empty templates with comprehensive comments
    - Headers: `Content-Type: application/x-yaml`, `Content-Disposition: attachment; filename="..."`

## Data Schemas

### Page Data YAML Schema (Zod)

```yaml
name: string (required, max 100 chars)
bio: string (required, max 500 chars)
contact_info: (optional, array)
  - label: string (required, max 50 chars)
    value: string (required, max 100 chars)
experience: (optional, array)
  - job_title: string (required, max 100 chars)
    job_description: string (optional, max 500 chars)
education: (optional, array)
  - school_title: string (required, max 100 chars)
    school_description: string (optional, max 300 chars)
skills: (optional, array)
          - name: string (required, max 50 chars)
```

### Project Data YAML Schema (Zod)

```yaml
name: string (required, max 100 chars)
description: string (required, max 500 chars)
tech_stack: string (optional, max 500 chars)
prod_link: string (optional, max 100 chars)
start_date: string (optional, ISO date format YYYY-MM-DD)
end_date: string (optional, ISO date format YYYY-MM-DD, must be after start_date)
```

## HTTP Status Codes

- **200 OK**: Successful GET or UPDATE operations, returns resource
- **201 Created**: Successful CREATE operations, returns created resource
- **204 No Content**: Successful DELETE operations, no response body
- **400 Bad Request**: Validation errors, malformed requests
- **401 Unauthorized**: Missing or invalid authentication
- **404 Not Found**: Resource doesn't exist
- **409 Conflict**: URL already exists (for pages)
- **500 Internal Server Error**: Server-side errors

## Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [
      {
        "field": "field_name",
        "issue": "Specific validation issue"
      }
    ]
  }
}
```

## Slug Generation Algorithm

1. Convert project_name to lowercase
2. Replace spaces and special characters with hyphens
3. Remove consecutive hyphens
4. Truncate to 100 characters
5. Check uniqueness within user's projects
6. If collision exists, append numeric suffix (-2, -3, etc.)
7. Return generated project_id in response

## Implementation Notes

- **Reserved Words**: Maintain list of reserved URLs (admin, api, auth, help, about, etc.)
- **Theme Enum**: Define available themes server-side (e.g., modern, minimal, creative, professional)
- **File Organization**: API routes in `src/pages/api/`, services in `src/lib/services/`, types in `src/types.ts`
- **Middleware**: Use Astro middleware for authentication checks
- **Environment Variables**: Access via `import.meta.env`
  </api_planning_summary>

<unresolved_issues>
None identified. All major API design decisions have been made and clarified. Implementation can proceed with the
specifications outlined above.
</unresolved_issues>
</conversation_summary>