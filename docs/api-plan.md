# REST API Plan

## 1. Resources

- **Pages**: Represents a user's single personal page. Corresponds to the `pages` table. Managed via `/api/pages/*`
  endpoints.
- **Projects**: Represents project subpages associated with a user's personal page. Corresponds to the `projects` table.
  Managed via `/api/projects/*` endpoints.

## 2. Endpoints

All endpoints require authentication unless otherwise noted. Authorization is handled by Supabase RLS policies, ensuring
users can only operate on their own data.

### 2.1. Pages
---

#### Create a User Page

- **HTTP Method**: `POST`
- **URL Path**: `/api/pages`
- **Description**: Creates a new personal page for the authenticated user. This is a one-time operation as the
  relationship is one-to-one.
- **JSON Request Payload**:
  ```json
  {
    "url": "my-awesome-page",
    "theme": "theme-1",
    "data": "name: John Doe\nbio: A software developer."
  }
  ```
    - `url` (string, required): The desired URL slug.
    - `theme` (string, required): The theme identifier.
    - `data` (string, optional): The initial YAML content for the page.
- **JSON Response Payload**:
  ```json
  {
    "user_id": "uuid-string",
    "url": "my-awesome-page",
    "theme": "theme-1"
  }
  ```
- **Success/Error Codes**:
    - **201 Created**: Page created successfully.
    - **400 Bad Request**: Validation failed (e.g., invalid URL format).
    - **401 Unauthorized**: User is not authenticated.
    - **409 Conflict**: A page for this user already exists.

#### Get User Page

- **HTTP Method**: `GET`
- **URL Path**: `/api/pages`
- **Description**: Retrieves the authenticated user's page configuration (excluding YAML data).
- **JSON Response Payload**:
  ```json
  {
    "user_id": "uuid-string",
    "url": "my-awesome-page",
    "theme": "theme-1",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
  ```
- **Success/Error Codes**:
    - **200 OK**: Page retrieved successfully.
    - **401 Unauthorized**: User is not authenticated.
    - **404 Not Found**: No page found for this user.

#### Update Page Theme

- **HTTP Method**: `PUT`
- **URL Path**: `/api/pages`
- **Description**: Updates the theme of the user's personal page.
- **JSON Request Payload**:
  ```json
  {
    "theme": "theme-2"
  }
  ```
- **JSON Response Payload**:
  ```json
  {
    "user_id": "uuid-string",
    "url": "my-awesome-page",
    "theme": "theme-2"
  }
  ```
- **Success/Error Codes**:
    - **200 OK**: Theme updated successfully.
    - **400 Bad Request**: Invalid theme identifier.
    - **401 Unauthorized**: User is not authenticated.
    - **404 Not Found**: No page found for this user.

#### Delete User Page

- **HTTP Method**: `DELETE`
- **URL Path**: `/api/pages`
- **Description**: Deletes the user's personal page and all associated projects (via DB cascade).
- **Success/Error Codes**:
    - **204 No Content**: Page and associated data deleted successfully.
    - **401 Unauthorized**: User is not authenticated.
    - **404 Not Found**: No page found for this user.

### 2.2. Page URL
---

#### Validate and Update Page URL

- **HTTP Method**: `POST`
- **URL Path**: `/api/pages/url`
- **Description**: Validates a new URL slug for format and uniqueness, and updates the user's page URL if valid.
- **JSON Request Payload**:
  ```json
  {
    "url": "my-new-url"
  }
  ```
- **Success/Error Codes**:
    - **200 OK**: URL updated successfully.
    - **400 Bad Request**: Invalid URL format or slug is a reserved word.
    - **401 Unauthorized**: User is not authenticated.
    - **404 Not Found**: No page found for this user.
    - **409 Conflict**: The requested URL is already taken.

### 2.3. Page Data (YAML)
---

#### Validate and Update Page YAML

- **HTTP Method**: `POST`
- **URL Path**: `/api/pages/data`
- **Description**: Accepts YAML content within a JSON payload, validates it against the page schema, and updates the `data` field in the `pages` table.
- **JSON Request Payload**:
  ```json
  {
    "data": "name: Jane Doe\nbio: An amazing product manager.\n# ... other fields"
  }
  ```
- **Success/Error Codes**:
    - **200 OK**: Page data updated successfully.
    - **400 Bad Request**: YAML validation failed. The response body will contain detailed error messages.
    - **401 Unauthorized**: User is not authenticated.
    - **404 Not Found**: No page found for this user.

#### Download Current Page YAML

- **HTTP Method**: `GET`
- **URL Path**: `/api/pages/data`
- **Description**: Downloads the user's current page data as a YAML file.
- **Response**: A YAML file with `Content-Disposition: attachment; filename="page.yaml"`.
- **Success/Error Codes**:
    - **200 OK**: File sent successfully.
    - **401 Unauthorized**: User is not authenticated.
    - **404 Not Found**: No page or data found for this user.

### 2.4. Projects
---

#### Create a Project

- **HTTP Method**: `POST`
- **URL Path**: `/api/projects`
- **Description**: Creates a new project for the authenticated user. The server generates a unique `project_id` slug
  from the `project_name`.
- **JSON Request Payload**:
  ```json
  {
    "project_name": "My First Project",
    "display_order": 0
  }
  ```
  - `project_name` (string, required): The name of the project.
  - `display_order` (integer, required): The initial display order for the project.
- **JSON Response Payload**:
  ```json
  {
    "user_id": "uuid-string",
    "project_id": "my-first-project",
    "project_name": "My First Project",
    "display_order": 0,
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
  ```
- **Success/Error Codes**:
    - **201 Created**: Project created successfully.
    - **400 Bad Request**: Missing `project_name`.
    - **401 Unauthorized**: User is not authenticated.
    - **404 Not Found**: User does not have a main page to associate the project with.

#### List User's Projects

- **HTTP Method**: `GET`
- **URL Path**: `/api/projects`
- **Description**: Retrieves a list of all projects for the authenticated user, sorted by `display_order`.
- **JSON Response Payload**:
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
- **Success/Error Codes**:
    - **200 OK**: Projects retrieved successfully.
    - **401 Unauthorized**: User is not authenticated.

#### Get a Single Project

- **HTTP Method**: `GET`
- **URL Path**: `/api/projects/{project_id}`
- **Description**: Retrieves a single project by its ID.
- **URL Parameters**:
    - `project_id` (string, required): The unique identifier of the project.
- **JSON Response Payload**:
  ```json
  {
    "user_id": "uuid-string",
    "project_id": "my-first-project",
    "project_name": "My First Project",
    "display_order": 0
  }
  ```
- **Success/Error Codes**:
    - **200 OK**: Project retrieved successfully.
    - **401 Unauthorized**: User is not authenticated.
    - **404 Not Found**: Project not found.

#### Update a Project's Name

- **HTTP Method**: `PUT`
- **URL Path**: `/api/projects/{project_id}`
- **Description**: Updates a project's name. Note: this does not change the `project_id` slug.
- **URL Parameters**:
    - `project_id` (string, required): The unique identifier of the project.
- **JSON Request Payload**:
  ```json
  {
    "project_name": "My Renamed Project"
  }
  ```
- **JSON Response Payload**: The updated project object.
- **Success/Error Codes**:
    - **200 OK**: Project updated successfully.
    - **400 Bad Request**: Invalid `project_name`.
    - **401 Unauthorized**: User is not authenticated.
    - **404 Not Found**: Project not found.

#### Delete a Project

- **HTTP Method**: `DELETE`
- **URL Path**: `/api/projects/{project_id}`
- **Description**: Deletes a single project.
- **URL Parameters**:
    - `project_id` (string, required): The unique identifier of the project.
- **Success/Error Codes**:
    - **204 No Content**: Project deleted successfully.
    - **401 Unauthorized**: User is not authenticated.
    - **404 Not Found**: Project not found.

### 2.5. Project Data (YAML)
---

#### Validate and Update Project YAML

- **HTTP Method**: `POST`
- **URL Path**: `/api/projects/{project_id}/data`
- **Description**: Validates YAML content within a JSON payload against the project schema and updates the `data` field of the specified project.
- **URL Parameters**:
    - `project_id` (string, required): The unique identifier of the project.
- **JSON Request Payload**:
  ```json
  {
    "data": "name: My Awesome Project\ndescription: A project to demonstrate my skills."
  }
  ```
- **Success/Error Codes**:
    - **200 OK**: Project data updated successfully.
    - **400 Bad Request**: YAML validation failed.
    - **401 Unauthorized**: User is not authenticated.
    - **404 Not Found**: Project not found.

#### Download Current Project YAML

- **HTTP Method**: `GET`
- **URL Path**: `/api/projects/{project_id}/data`
- **Description**: Downloads the specified project's data as a YAML file.
- **URL Parameters**:
    - `project_id` (string, required): The unique identifier of the project.
- **Response**: A YAML file with `Content-Disposition: attachment; filename="{project_id}.yaml"`.
- **Success/Error Codes**:
    - **200 OK**: File sent successfully.
    - **401 Unauthorized**: User is not authenticated.
    - **404 Not Found**: Project or its data not found.

### 2.6. Project Reordering
---

#### Reorder Projects

- **HTTP Method**: `PUT`
- **URL Path**: `/api/projects/reorder`
- **Description**: Atomically updates the `display_order` for multiple projects in a single transaction.
- **JSON Request Payload**:
  ```json
  {
    "project_orders": [
      { "project_id": "my-first-project", "display_order": 1 },
      { "project_id": "another-project", "display_order": 0 }
    ]
  }
  ```
- **Success/Error Codes**:
    - **200 OK**: Projects reordered successfully.
    - **400 Bad Request**: Invalid payload or one of the projects does not belong to the user.
    - **401 Unauthorized**: User is not authenticated.
    - **404 Not Found**: One of the specified `project_id`s was not found.

### 2.7. Templates
---

#### Download YAML Template

- **HTTP Method**: `GET`
- **URL Path**: `/api/templates/{type}`
- **Description**: Downloads a blank YAML template for either a page or a project.
- **URL Parameters**:
    - `type` (string, required): The type of template to download (`page` or `project`).
- **Response**: A blank YAML template file with comments and appropriate `Content-Disposition` header.
- **Success/Error Codes**:
    - **200 OK**: Template downloaded successfully.
    - **401 Unauthorized**: User is not authenticated.
    - **404 Not Found**: Invalid template `type`.

## 3. Authentication and Authorization

- **Authentication**: Authentication is handled by Supabase Auth, which uses secure cookies to manage sessions. All
  non-public API endpoints are protected and require a valid session. Astro middleware will be used to verify the user's
  session from the incoming request cookies.
- **Authorization**: Authorization is enforced at the database level by PostgreSQL Row-Level Security (RLS) policies.
  These policies ensure that an authenticated user (`auth.uid()`) can only perform `INSERT`, `UPDATE`, or `DELETE`
  operations on rows where `user_id` matches their own ID. `SELECT` operations are public for published content.

## 4. Validation and Business Logic

### 4.1. Validation

Validation will be performed on the server-side using Zod schemas for all incoming data.

- **`pages.url`**:
    - **Format**: 3-30 characters, lowercase alphanumeric and hyphens.
    - **Uniqueness**: Checked against the database.
    - **Reserved**: Checked against a predefined list of reserved words (e.g., `api`, `admin`).
- **`pages.theme`**: Must be one of the available theme identifiers (hardcoded enum on the server).
- **`projects.project_name`**: Required, max 100 characters.
- **`projects.display_order`**: Must be a non-negative integer.
- **YAML Data (`pages.data`)**:
  - `name`: string (required, max 100 chars)
  - `bio`: string (required, max 500 chars)
  - `contact_info`: array (optional)
    - `label`: string (required, max 50 chars)
    - `value`: string (required, max 100 chars)
  - `experience`: array (optional)
    - `job_title`: string (required, max 100 chars)
    - `job_description`: string (optional, max 500 chars)
  - `education`: array (optional)
    - `school_title`: string (required, max 100 chars)
    - `school_description`: string (optional, max 300 chars)
  - `skills`: array (optional)
    - `name`: string (required, max 50 chars)
- **YAML Data (`projects.data`)**:
  - `name`: string (required, max 100 chars)
  - `description`: string (required, max 500 chars)
  - `tech_stack`: string (optional, max 500 chars)
  - `prod_link`: string (optional, max 100 chars)
  - `start_date`: string (optional, ISO date format YYYY-MM-DD)
  - `end_date`: string (optional, ISO date format YYYY-MM-DD, must be after start_date)
- Failed validations will return a `400 Bad Request` with a structured JSON error object detailing the issues.

### 4.2. Business Logic Implementation

- **Slug Generation**:
    - The `project_id` slug is generated deterministically on the server from the `project_name` upon project creation (
      `POST /api/projects`).
    - The algorithm converts the name to lowercase, replaces spaces with hyphens, and removes special characters.
    - It checks for uniqueness within the user's scope and appends a numeric suffix (`-2`, `-3`) to resolve collisions.
- **Project Reordering**:
    - The `PUT /api/projects/reorder` endpoint will perform all updates within a single database transaction to ensure
      atomicity. If any update fails, all changes will be rolled back.
- **Error Handling**:
    - A standardized JSON error format will be used for all client-facing errors (`4xx`).
      ```json
      {
        "error": {
          "code": "VALIDATION_ERROR",
          "message": "The provided data is invalid.",
          "details": [
            { "field": "bio", "issue": "String must contain at most 500 character(s)" }
          ]
        }
      }
