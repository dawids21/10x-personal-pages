# API Endpoint Implementation Plan: Download YAML Template

## 1. Endpoint Overview

This endpoint provides downloadable YAML template files for creating pages and projects. It serves as a starting point for users who want to understand the expected data structure and create their content files. The endpoint returns static YAML templates with helpful comments explaining each field.

**Purpose**: Enable users to download blank, annotated YAML templates for either page or project data structures.

**Use Case**: Users preparing to create a page or project can download the appropriate template to understand required and optional fields before submitting their data.

## 2. Request Details

- **HTTP Method**: `GET`
- **URL Structure**: `/api/templates/{type}`
- **URL Parameters**:
  - **Required**:
    - `type` (string): The template type to download. Must be either `"page"` or `"project"`.
- **Optional Parameters**: None
- **Request Body**: None (GET request)
- **Authentication**: Not required (public endpoint)

**Example Requests**:
```
GET /api/templates/page
GET /api/templates/project
```

## 3. Used Types

### Reference Types (for template generation)

Existing types from `src/types.ts` will serve as references for template structure:
- `PageData` - Structure for page template
- `ProjectData` - Structure for project template

No new DTO types are required as templates are static content.

**Note**: Since this endpoint uses `prerender = true` with `getStaticPaths()`, no validation schema is needed. The routes are generated at build time.

## 4. Response Details

### Success Response (200 OK)

**Headers**:
```
Content-Type: application/x-yaml; charset=utf-8
Content-Disposition: attachment; filename="page-template.yaml" | "project-template.yaml"
```

**Body**: YAML file content with comments

**Page Template Example**:
```yaml
# Personal Page Template
# Fill in your information below

# Your full name (required)
name: ""

# Short bio describing yourself (required)
bio: ""

# Contact information (optional)
contact_info:
  - label: "Email"
    value: ""
  - label: "Phone"
    value: ""

# Work experience (optional)
experience:
  - job_title: ""
    job_description: ""

# Education history (optional)
education:
  - school_title: ""
    school_description: ""

# Skills (optional)
skills:
  - name: ""
```

**Project Template Example**:
```yaml
# Project Template
# Fill in your project information below

# Project name (required)
name: ""

# Project description (required)
description: ""

# Technology stack used (optional)
tech_stack: ""

# Production link (optional)
prod_link: ""

# Start date in YYYY-MM-DD format (optional)
start_date: ""

# End date in YYYY-MM-DD format (optional)
end_date: ""
```

### Error Responses

**Note**: Since this endpoint is prerendered, runtime validation errors (404 for invalid template types) will not occur during normal operation. Only valid routes (`/api/templates/page` and `/api/templates/project`) are generated at build time. Any other paths will result in a standard 404 from the server.

**500 Internal Server Error** - Build-time file reading error (would prevent build from completing):
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to generate template file"
  }
}
```

## 5. Data Flow

### Build Time (Prerendering)
```
┌─────────────────────┐
│ Astro Build Process │
└─────────┬───────────┘
          │ Calls getStaticPaths()
          ▼
┌─────────────────────┐
│ Returns paths:      │
│ - {type: 'page'}    │
│ - {type: 'project'} │
└─────────┬───────────┘
          │ For each path
          ▼
┌─────────────────────┐
│ Template Service    │
│ getTemplate(type)   │
└─────────┬───────────┘
          │ Returns template string
          ▼
┌─────────────────────┐
│ Generates static    │
│ endpoints at:       │
│ - /api/templates/page    │
│ - /api/templates/project │
└─────────────────────┘
```

### Runtime
```
┌─────────┐
│ Client  │
└────┬────┘
     │ GET /api/templates/{type}
     ▼
┌─────────────────────┐
│ Prerendered Static  │
│ Endpoint            │
└─────────┬───────────┘
          │ Serves pregenerated response
          │ with headers and content
          ▼
┌─────────┐
│ Client  │ (Downloads YAML file)
└─────────┘
```

**Key Steps**:
1. At build time, `getStaticPaths()` defines valid routes ('page' and 'project')
2. For each route, template service retrieves template content
3. Static endpoints are generated with appropriate headers
4. At runtime, prerendered responses are served directly

## 6. Security Considerations

### Prerendering Security
- **No runtime validation needed**: Routes are generated at build time via `getStaticPaths()`
- **Only valid paths exist**: Only `/api/templates/page` and `/api/templates/project` are generated
- **No user input processed**: Templates are static files served from prerendered endpoints
- **Prevention of path traversal**: Not applicable - type parameter is controlled at build time

### Data Exposure
- **No sensitive data**: Templates contain only structural information with placeholder values
- **No authentication required**: Templates are public resources

## 7. Error Handling

### Build-Time Errors

Since this endpoint is prerendered, most errors occur at build time:

| Scenario | Status Code | Error Code | Message |
|----------|-------------|------------|---------|
| Template file read failure | Build fails | INTERNAL_ERROR | Failed to generate template file |
| Template file not found | Build fails | INTERNAL_ERROR | Template file not found |

### Runtime Errors

| Scenario | Status Code | Handling |
|----------|-------------|----------|
| Invalid route (e.g., `/api/templates/invalid`) | 404 | Standard Astro 404 (route doesn't exist) |
| Server serving error | 500 | Standard server error |

**Note**: Since valid routes are generated at build time, runtime validation errors don't occur. Invalid template types result in standard 404s because those routes were never generated.

## 8. Performance Considerations

### Prerendering Benefits
1. **Zero runtime overhead**: Templates are generated at build time
2. **Fast response times**: Static files served directly by the server
3. **No database queries**: Templates are static YAML files
4. **CDN-friendly**: Prerendered endpoints can be cached at edge locations

### Optimization Strategies
- **Build-time generation**: All routes created during build process
- **Small file size**: YAML templates are lightweight (< 1KB each)
- **No caching needed**: Static files are already optimized for delivery

## 9. Implementation Steps

### Step 1: Create Template Files
1. Create directory: `src/assets/templates/`
2. Create `page-template.yaml` with PageData structure and comments
3. Create `project-template.yaml` with ProjectData structure and comments
4. Ensure proper formatting and helpful comments in both files

### Step 2: Create Template Service
1. Create file: `src/lib/services/template.service.ts`
2. Implement `getPageTemplate(): string` function
3. Implement `getProjectTemplate(): string` function
4. Implement `getTemplate(type: 'page' | 'project'): string` wrapper function
5. Add error handling for file read operations
6. Export service functions

### Step 3: Implement Prerendered API Route Handler
1. Create file: `src/pages/api/templates/[type].ts`
2. Export `prerender = true` to enable static generation
3. Implement `getStaticPaths()` function:
   - Return array with `{ params: { type: 'page' } }` and `{ params: { type: 'project' } }`
4. Implement `GET` handler function
5. Extract `type` parameter from `Astro.params.type`
6. Call template service: `getTemplate(type as 'page' | 'project')`
7. Set response headers:
   - `Content-Type: application/x-yaml; charset=utf-8`
   - `Content-Disposition: attachment; filename="{type}-template.yaml"`
8. Return Response with template content and 200 status
9. Add error handling with try-catch for build-time errors