# API Endpoint Implementation Plan: Page URL and Data Management

## 1. Endpoint Overview

This implementation plan covers three REST API endpoints for managing user page URLs and YAML data:

1. **POST /api/pages/url** - Validates and updates a user's page URL slug
2. **POST /api/pages/data** - Validates and updates a user's page YAML data
3. **GET /api/pages/data** - Downloads a user's current page data as a YAML file

These endpoints enable authenticated users to manage their personal page configuration, including custom URL slugs and structured content data. All endpoints enforce one-to-one relationship between users and pages, with comprehensive validation and security controls.

## 2. Request Details

### POST /api/pages/url

- **HTTP Method**: `POST`
- **URL Structure**: `/api/pages/url`
- **Authentication**: Required (user must be authenticated)
- **Parameters**:
  - Required: None
  - Optional: None
- **Request Body**:
  ```json
  {
    "url": "my-custom-url"
  }
  ```
  - `url`: String (3-30 characters, lowercase alphanumeric and hyphens only)

### POST /api/pages/data

- **HTTP Method**: `POST`
- **URL Structure**: `/api/pages/data`
- **Authentication**: Required (user must be authenticated)
- **Parameters**:
  - Required: None
  - Optional: None
- **Request Body**:
  ```json
  {
    "data": "name: Jane Doe\nbio: Product manager...\n# ... YAML content"
  }
  ```
  - `data`: String (valid YAML content adhering to page data schema)

### GET /api/pages/data

- **HTTP Method**: `GET`
- **URL Structure**: `/api/pages/data`
- **Authentication**: Required (user must be authenticated)
- **Parameters**:
  - Required: None
  - Optional: None
- **Request Body**: None

## 3. Used Types

### Existing Types (from src/types.ts)

**Command Models:**
```typescript
// For POST /api/pages/url
interface UpdatePageUrlCommand {
  url: string;
}

// For POST /api/pages/data
interface UpdatePageDataCommand {
  data: string;
}
```

**Error Response Types:**
```typescript
interface ValidationErrorDetail {
  field: string;
  issue: string;
}

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: ValidationErrorDetail[];
  };
}
```

### Additional Types (to be created)

**Page Data Schema Types:**
```typescript
// Inferred from Zod schemas in src/lib/validators/pages.validators.ts
interface ContactInfo {
  label: string;      // max 50 chars
  value: string;      // max 100 chars
}

interface Experience {
  job_title: string;          // max 100 chars
  job_description?: string;   // max 500 chars
}

interface Education {
  school_title: string;          // max 100 chars
  school_description?: string;   // max 300 chars
}

interface Skill {
  name: string;  // max 50 chars
}

interface PageData {
  name: string;                    // required, max 100 chars
  bio: string;                     // required, max 500 chars
  contact_info?: ContactInfo[];
  experience?: Experience[];
  education?: Education[];
  skills?: Skill[];
}
```

## 4. Response Details

### POST /api/pages/url

**Success Response (200 OK):**
```json
{
  "message": "Page URL updated successfully",
  "url": "my-custom-url"
}
```

**Error Responses:**

- **400 Bad Request** (Invalid format or reserved word):
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Invalid URL format",
      "details": [
        {
          "field": "url",
          "issue": "URL must contain only lowercase letters, numbers, and hyphens"
        }
      ]
    }
  }
  ```

- **401 Unauthorized**:
  ```json
  {
    "error": {
      "code": "UNAUTHORIZED",
      "message": "Authentication required"
    }
  }
  ```

- **404 Not Found**:
  ```json
  {
    "error": {
      "code": "PAGE_NOT_FOUND",
      "message": "No page found for this user"
    }
  }
  ```

- **409 Conflict**:
  ```json
  {
    "error": {
      "code": "URL_ALREADY_TAKEN",
      "message": "The requested URL is already taken"
    }
  }
  ```

- **500 Internal Server Error**:
  ```json
  {
    "error": {
      "code": "INTERNAL_ERROR",
      "message": "An unexpected error occurred"
    }
  }
  ```

### POST /api/pages/data

**Success Response (200 OK):**
```json
{
  "message": "Page data updated successfully"
}
```

**Error Responses:**

- **400 Bad Request** (YAML validation failed):
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Invalid page data",
      "details": [
        {
          "field": "bio",
          "issue": "String must contain at most 500 character(s)"
        },
        {
          "field": "name",
          "issue": "Required field is missing"
        }
      ]
    }
  }
  ```

- **401 Unauthorized**: Same as above
- **404 Not Found**: Same as above
- **500 Internal Server Error**: Same as above

### GET /api/pages/data

**Success Response (200 OK):**
- **Content-Type**: `application/x-yaml` or `text/yaml`
- **Headers**: `Content-Disposition: attachment; filename="page.yaml"`
- **Body**: Raw YAML content

**Error Responses:**

- **401 Unauthorized**: Same as above
- **404 Not Found**:
  ```json
  {
    "error": {
      "code": "PAGE_NOT_FOUND",
      "message": "No page or data found for this user"
    }
  }
  ```
- **500 Internal Server Error**: Same as above

## 5. Data Flow

### POST /api/pages/url Flow

```
1. Client sends POST request with JSON body
   ↓
2. Astro middleware authenticates request
   ↓
3. API route handler receives request
   ↓
4. Extract user ID from context.locals.supabase.auth.getUser()
   ↓
5. Parse and validate request body with Zod schema (format, length)
   ↓
6. Service: Check if URL is reserved word
   ↓
7. Service: Check URL uniqueness in database (excluding current user)
   ↓
8. Service: Update pages table SET url = ? WHERE user_id = ?
   ↓
9. Return success response with updated URL
```

### POST /api/pages/data Flow

```
1. Client sends POST request with JSON body containing YAML string
   ↓
2. Astro middleware authenticates request
   ↓
3. API route handler receives request
   ↓
4. Extract user ID from context.locals.supabase.auth.getUser()
   ↓
5. Parse and validate request body with Zod schema (data field)
   ↓
6. Service: Parse YAML string to JavaScript object
   ↓
7. Service: Validate parsed object against page data Zod schema
   ↓
8. Service: Update pages table SET data = ? WHERE user_id = ?
   ↓
9. Return success response
```

### GET /api/pages/data Flow

```
1. Client sends GET request
   ↓
2. Astro middleware authenticates request
   ↓
3. API route handler receives request
   ↓
4. Extract user ID from context.locals.supabase.auth.getUser()
   ↓
5. Service: Query pages table for user's data field
   ↓
6. Service: Convert JSONB data to YAML string
   ↓
7. Set response headers (Content-Type, Content-Disposition)
   ↓
8. Return YAML file as attachment
```

## 6. Security Considerations

### Authentication & Authorization

- **Authentication Check**: All endpoints must verify user is authenticated via `context.locals.supabase.auth.getUser()`
- **Authorization**: Users can only modify their own page (enforce user_id match in queries)
- **Session Validation**: Ensure valid session token before processing requests

### Input Validation & Sanitization

- **Request Body Validation**: Use Zod schemas to validate all incoming data
- **URL Validation**:
  - Enforce format: `^[a-z0-9-]{3,30}$` via Zod schema
  - Check against reserved words list: `['api', 'admin', 'auth', 'dashboard', 'static', 'assets', 'public', 'docs', 'help', 'terms', 'privacy']`
  - Prevent SQL injection via Supabase parameterized queries
- **YAML Validation**:
  - Use safe YAML parser (js-yaml with `safeLoad`)
  - Validate parsed object structure with Zod schema
  - Prevent YAML injection attacks

### Database Security

- **Row Level Security (RLS)**: Ensure RLS policies on `pages` table restrict access by user_id
- **Parameterized Queries**: Supabase client handles this automatically
- **One-to-One Relationship**: Database constraint ensures user_id uniqueness

### Data Privacy

- **YAML Download**: Ensure user can only download their own data
- **URL Uniqueness**: Check prevents information disclosure about existing URLs
- **Error Messages**: Avoid exposing sensitive system information

## 7. Error Handling

### Error Scenarios and Responses

| Scenario                      | Status Code | Error Code        | Handler Location         |
|-------------------------------|-------------|-------------------|--------------------------|
| User not authenticated        | 401         | UNAUTHORIZED      | Middleware/Route handler |
| Invalid request body format   | 400         | VALIDATION_ERROR  | Route handler (Zod)      |
| URL is reserved word          | 400         | RESERVED_URL      | Service layer            |
| URL already taken             | 409         | URL_ALREADY_TAKEN | Service layer            |
| Page not found for user       | 404         | PAGE_NOT_FOUND    | Service layer            |
| YAML parsing failed           | 400         | INVALID_YAML      | Service layer            |
| YAML schema validation failed | 400         | VALIDATION_ERROR  | Service layer            |
| Database connection error     | 500         | INTERNAL_ERROR    | Service layer            |
| Unexpected server error       | 500         | INTERNAL_ERROR    | Route handler            |

### Error Handling Pattern

Use the existing `handleApiError` utility from `src/lib/utils/error-handler.utils.ts`:

```typescript
import { handleApiError } from '@/lib/utils/error-handler.utils';
import { z } from 'zod';

// In route handlers
try {
  // Validate input
  const validatedInput = schema.parse(requestBody);

  // Call service
  const result = await service.method(validatedInput);

  // Return success
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
} catch (error) {
  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    return new Response(JSON.stringify({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          issue: e.message
        }))
      }
    } as ErrorResponse), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Use centralized error handler for custom errors
  return handleApiError(error);
}
```

### Existing Error Classes

Reuse error classes from `src/lib/errors/pages.errors.ts`:

- `PageNotFoundError` - 404 error when page doesn't exist
- `UrlAlreadyTakenError` - 409 error when URL is taken
- `InvalidYamlError` - 400 error for YAML parsing/validation failures

### New Error Class Needed

Add to `src/lib/errors/pages.errors.ts`:

```typescript
/**
 * Error thrown when attempting to use a reserved URL.
 */
export class ReservedUrlError extends Error {
  constructor(message = "This URL is reserved and cannot be used") {
    super(message);
    this.name = "ReservedUrlError";
  }
}
```

Update `handleApiError` in `src/lib/utils/error-handler.utils.ts` to handle `ReservedUrlError`:

```typescript
if (error instanceof ReservedUrlError) {
  return new Response(
    JSON.stringify({
      error: {
        code: "RESERVED_URL",
        message: error.message,
      },
    } as ErrorResponse),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
}
```

## 8. Performance Considerations

### Database Queries

- **URL Uniqueness Check**: Index on `url` column (already UNIQUE constraint provides index)
- **User Page Lookup**: Index on `user_id` column (already PRIMARY KEY provides index)

### YAML Processing

- **Size Limits**: Consider enforcing max YAML file size (e.g., 1MB)

## 9. Implementation Steps

### Step 1: Add Validators and YAML Schema

**File**: `src/lib/validators/pages.validators.ts`

1. Install js-yaml if not present: `npm install js-yaml @types/js-yaml`
2. Add Zod schema for updating page URL:
   ```typescript
   export const updatePageUrlSchema = z.object({
     url: z
       .string()
       .min(3, "URL must be at least 3 characters")
       .max(30, "URL must not exceed 30 characters")
       .regex(/^[a-z0-9-]+$/, "URL must contain only lowercase letters, numbers, and hyphens"),
   });
   ```
3. Add Zod schema for updating page data:
   ```typescript
   export const updatePageDataSchema = z.object({
     data: z.string().min(1, "Data cannot be empty"),
   });
   ```
4. Add Zod schema for page data structure:
   ```typescript
   const contactInfoSchema = z.object({
     label: z.string().max(50),
     value: z.string().max(100),
   });

   const experienceSchema = z.object({
     job_title: z.string().max(100),
     job_description: z.string().max(500).optional(),
   });

   const educationSchema = z.object({
     school_title: z.string().max(100),
     school_description: z.string().max(300).optional(),
   });

   const skillSchema = z.object({
     name: z.string().max(50),
   });

   export const pageDataSchema = z.object({
     name: z.string().min(1).max(100),
     bio: z.string().min(1).max(500),
     contact_info: z.array(contactInfoSchema).optional(),
     experience: z.array(experienceSchema).optional(),
     education: z.array(educationSchema).optional(),
     skills: z.array(skillSchema).optional(),
   });
   ```

### Step 2: Add Reserved URL Error

**File**: `src/lib/errors/pages.errors.ts`

1. Add `ReservedUrlError` class:
   ```typescript
   export class ReservedUrlError extends Error {
     constructor(message = "This URL is reserved and cannot be used") {
       super(message);
       this.name = "ReservedUrlError";
     }
   }
   ```

### Step 3: Update Error Handler

**File**: `src/lib/utils/error-handler.utils.ts`

1. Import `ReservedUrlError`
2. Add handler for `ReservedUrlError` that returns 400 with code "RESERVED_URL"

### Step 4: Create Pages Service

**File**: `src/lib/services/pages.service.ts`

1. Create service module with functions:
   - `isReservedUrl(url: string): boolean` - Check against reserved words list
   - `checkUrlAvailability(supabase: SupabaseClient, url: string, userId: string): Promise<void>` - Query database for uniqueness, throw `UrlAlreadyTakenError` if taken
   - `updatePageUrl(supabase: SupabaseClient, userId: string, url: string): Promise<void>` - Update page URL, throw `PageNotFoundError` if page doesn't exist
   - `parseAndValidateYaml(yamlString: string): Promise<PageData>` - Parse YAML with js-yaml `safeLoad`, validate with `pageDataSchema`, throw `InvalidYamlError` on failure
   - `updatePageData(supabase: SupabaseClient, userId: string, data: PageData): Promise<void>` - Update page JSONB data, throw `PageNotFoundError` if page doesn't exist
   - `getPageData(supabase: SupabaseClient, userId: string): Promise<PageData | null>` - Retrieve page data, throw `PageNotFoundError` if page doesn't exist
   - `convertToYaml(data: PageData): string` - Convert object to YAML string using js-yaml `dump`

2. Reserved words list:
   ```typescript
   const RESERVED_URLS = [
     'api', 'admin', 'auth', 'dashboard', 'static',
     'assets', 'public', 'docs', 'help', 'terms', 'privacy'
   ];
   ```

### Step 5: Implement POST /api/pages/url Endpoint

**File**: `src/pages/api/pages/url.ts`

1. Implement POST handler:
   ```typescript
   export async function POST(context: APIContext): Promise<Response>
   ```
2. Extract user from `context.locals.supabase.auth.getUser()`
3. Return 401 if not authenticated
4. Parse request body with `updatePageUrlSchema`
5. Call service functions:
   - Check if URL is reserved
   - Check URL availability
   - Update page URL
6. Use `handleApiError` for error handling
7. Return 200 with success message and updated URL

### Step 6: Implement POST /api/pages/data Endpoint

**File**: `src/pages/api/pages/data.ts`

1. Implement POST handler:
   ```typescript
   export async function POST(context: APIContext): Promise<Response>
   ```
2. Extract user from `context.locals.supabase.auth.getUser()`
3. Return 401 if not authenticated
4. Parse request body with `updatePageDataSchema`
5. Call service methods:
   - Parse and validate YAML
   - Update page data
6. Use `handleApiError` for error handling
7. Return 200 with success message

### Step 7: Implement GET /api/pages/data Endpoint

**File**: `src/pages/api/pages/data.ts` (same file as POST)

1. Implement GET handler:
   ```typescript
   export async function GET(context: APIContext): Promise<Response>
   ```
2. Extract user from `context.locals.supabase.auth.getUser()`
3. Return 401 if not authenticated
4. Call service method to get page data
5. If no data found, use `handleApiError` with `PageNotFoundError`
6. Convert data to YAML format
7. Set appropriate headers:
   - `Content-Type: text/yaml`
   - `Content-Disposition: attachment; filename="page.yaml"`
8. Return 200 with YAML content
