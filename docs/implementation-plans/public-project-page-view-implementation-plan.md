# View Implementation Plan: Public Project Page

## 1. Overview

The Public Project Page is a server-side rendered (SSR) view that displays detailed information about a specific project from a user's portfolio. The page is publicly accessible and styled according to the theme (ocean or earth) configured for the user's main page. It fetches project data from the database, parses the YAML content, and renders the information in a clean, professional layout with navigation back to the main page or landing page.

## 2. View Routing

**Path**: `/page/[user_url]/projects/[project_id]`

**Parameters**:
- `user_url` (string): The URL slug of the user's main page
- `project_id` (string): The UUID of the specific project

**Example**: `https://example.com/page/john-doe/projects/550e8400-e29b-41d4-a716-446655440000`

**Note**: The route includes `/projects/` segment to match the existing implementation pattern in `ProjectsListPublic.astro:30`.

## 3. Component Structure

```
/src/pages/page/[user_url]/projects/[project_id].astro (Main SSR page)
├── /src/components/themes/ocean/OceanProjectLayout.astro
│   ├── PublicHeader (navigation)
│   ├── ProjectHeader (project name and metadata)
│   └── ProjectDetails (description, tech stack, links, dates)
└── /src/components/themes/earth/EarthProjectLayout.astro
    ├── PublicHeader (navigation)
    ├── ProjectHeader (project name and metadata)
    └── ProjectDetails (description, tech stack, links, dates)
```

**Component Hierarchy**:

1. **Main Route Component** (`[project_id].astro`) - Fetches data and selects theme layout
2. **Theme Layouts** (`OceanProjectLayout.astro` / `EarthProjectLayout.astro`) - HTML structure and theme application
3. **Shared Components**:
   - `PublicHeader` - Navigation bar (reusable across themes)
4. **Theme-Specific Components**:
   - `ProjectHeader` - Project title and metadata section
   - `ProjectDetails` - Main content area with all project information

## 4. Component Details

### 4.1. Main Route Component: `/src/pages/page/[user_url]/projects/[project_id].astro`

**Purpose**: Server-side entry point that fetches all required data, validates it, determines the appropriate theme, and renders the corresponding layout component.

**Main Elements**:
- Frontmatter script block for data fetching and validation
- Single layout component render based on theme

**Handled Events**: None (SSR component)

**Validation Conditions**:
1. **Parameter validation**:
   - Verify `user_url` parameter exists and is not empty
   - Verify `project_id` parameter exists and is not empty
   - Redirect to `/404` if either parameter is missing

2. **Project existence**:
   - Query `projects` table for record matching `project_id`
   - Check for database errors or null result
   - Redirect to `/404` if project not found

4. **Ownership validation**:
   - Compare `projectData.user_id` with user_id from context
   - Redirect to `/404` if they don't match (security requirement)

5. **Data field validation**:
   - Verify `projectData.data` field exists and is not null
   - Redirect to `/500` if data field is missing

**Types**:
- `Theme` (from `@/types`)
- `ProjectData` (from `@/types`)
- `PublicProjectPageViewModel` (new, to be added to `@/types`)

**Props**: None (receives route params from `Astro.params`)

**Data Fetching**:
```typescript
// Fetch page data
const { data: pageData, error: pageError } = await supabase
  .from("pages")
  .select("user_id, url, theme")
  .eq("url", user_url)
  .maybeSingle();

// Fetch project data
const { data: projectData, error: projectError } = await supabase
  .from("projects")
  .select("user_id, project_id, project_name, data")
  .eq("project_id", project_id)
  .maybeSingle();
```

### 4.2. Theme Layouts: `OceanProjectLayout.astro` / `EarthProjectLayout.astro`

**Location**:
- `/src/components/themes/ocean/OceanProjectLayout.astro`
- `/src/components/themes/earth/EarthProjectLayout.astro`

**Purpose**: Provide theme-specific HTML structure, apply theme class (`theme-ocean` or `theme-earth`), and compose all child components into a complete page.

**Main Elements**:
- `<!doctype html>` declaration
- `<html>` with theme class attribute
- `<head>` with meta tags, title, and Open Graph tags
- `<nav>` section with navigation link to landing page
- `<main>` container with:
  - Link back to user's main page
  - ProjectHeader component
  - ProjectDetails component
- `<footer>` with attribution

**Handled Events**: None (SSR component)

**Validation Conditions**: None (data pre-validated by route component)

**Types**:
- `PublicProjectPageViewModel` (interface Props)

**Props** (from `PublicProjectPageViewModel`):
- `project_data: ProjectData` - Parsed YAML content
- `theme: Theme` - Theme identifier (not used within layout, but part of viewmodel)
- `user_url: string` - For constructing back link
- `project_id: string` - Project UUID
- `project_name: string` - Project name from metadata

**Template Structure**:
```astro
<html lang="en" class="theme-ocean"> <!-- or theme-earth -->
  <head>
    <title>{projectData.name} - Project</title>
    <!-- Meta tags -->
  </head>
  <body>
    <nav>
      <a href="/">Personal Pages</a>
    </nav>
    <main>
      <a href={`/page/${userUrl}`}>← Back to {userUrl}'s page</a>
      <ProjectHeader projectData={projectData} />
      <ProjectDetails projectData={projectData} />
    </main>
    <footer>
      <p>Powered by Personal Pages</p>
    </footer>
  </body>
</html>
```

### 4.3. ProjectHeader Component (Theme-Specific)

**Location**:
- `/src/components/themes/ocean/ProjectHeader.astro`
- `/src/components/themes/earth/ProjectHeader.astro`

**Purpose**: Display the project's name prominently as the main heading of the page with appropriate semantic HTML and accessibility attributes.

**Main Elements**:
- `<header>` element with appropriate margins/padding
- `<h1>` element with project name
- Optional subtitle or metadata (if design requires)

**Handled Events**: None (static content)

**Validation Conditions**: None (name is required field, validated before render)

**Types**:
- `ProjectData` (partial - only uses `name` field)

**Props**:
```typescript
interface Props {
  projectData: ProjectData;
}
```

**Template Structure**:
```astro
<header class="mb-8">
  <h1 class="text-4xl font-bold text-foreground">{projectData.name}</h1>
</header>
```

### 4.4. ProjectDetails Component (Theme-Specific)

**Location**:
- `/src/components/themes/ocean/ProjectDetails.astro`
- `/src/components/themes/earth/ProjectDetails.astro`

**Purpose**: Display all project information including description, tech stack, production link, and dates. Conditionally render optional fields only when present in the data.

**Main Elements**:
- `<div>` container for all details
- Description section with `<p>` or formatted text
- Tech stack section (conditional) with `<div>` and tech list/string
- Production link section (conditional) with `<a>` element
- Dates section (conditional) displaying start and/or end dates
- Uses shadcn Card components for visual structure

**Handled Events**: None (static content)

**Validation Conditions**:
1. **Description**: Always render (required field)
2. **Tech Stack**: Only render if `projectData.tech_stack` is truthy
3. **Production Link**: Only render if `projectData.prod_link` is truthy
4. **Start Date**: Only render if `projectData.start_date` is truthy
5. **End Date**: Only render if `projectData.end_date` is truthy

**Types**:
- `ProjectData` (uses all fields)

**Props**:
```typescript
interface Props {
  projectData: ProjectData;
}
```

**Template Structure**:
```astro
<div class="space-y-6">
  <!-- Description (always shown) -->
  <Card>
    <CardHeader>
      <CardTitle>About</CardTitle>
    </CardHeader>
    <CardContent>
      <p class="text-foreground leading-relaxed">{projectData.description}</p>
    </CardContent>
  </Card>

  <!-- Tech Stack (conditional) -->
  {projectData.tech_stack && (
    <Card>
      <CardHeader>
        <CardTitle>Technologies</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-foreground">{projectData.tech_stack}</p>
      </CardContent>
    </Card>
  )}

  <!-- Production Link (conditional) -->
  {projectData.prod_link && (
    <Card>
      <CardHeader>
        <CardTitle>View Project</CardTitle>
      </CardHeader>
      <CardContent>
        <a
          href={projectData.prod_link}
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary hover:underline"
        >
          {projectData.prod_link}
        </a>
      </CardContent>
    </Card>
  )}

  <!-- Dates (conditional) -->
  {(projectData.start_date || projectData.end_date) && (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
      </CardHeader>
      <CardContent class="space-y-2">
        {projectData.start_date && (
          <p class="text-muted-foreground">
            <span class="font-semibold">Started:</span>{' '}
            <time datetime={projectData.start_date.toISOString()}>
              {projectData.start_date.toLocaleDateString()}
            </time>
          </p>
        )}
        {projectData.end_date && (
          <p class="text-muted-foreground">
            <span class="font-semibold">Completed:</span>{' '}
            <time datetime={projectData.end_date.toISOString()}>
              {projectData.end_date.toLocaleDateString()}
            </time>
          </p>
        )}
      </CardContent>
    </Card>
  )}
</div>
```

## 5. Types

### 5.1. Existing Types (from `@/types`)

**ProjectData** (already defined):
```typescript
export interface ProjectData {
  name: string;           // Required: Project name
  description: string;    // Required: Project description
  tech_stack?: string;    // Optional: Technologies used
  prod_link?: string;     // Optional: Production URL
  start_date?: Date;      // Optional: Project start date
  end_date?: Date;        // Optional: Project end date
}
```

**Theme** (already defined):
```typescript
export type Theme = 'ocean' | 'earth';
```

### 5.2. New Type: PublicProjectPageViewModel

**Location**: Add to `/src/types.ts` in the "ViewModels for Public Pages" section

**Purpose**: Aggregate all data needed to render the public project page, passed as props to the theme layout components.

**Definition**:
```typescript
/**
 * Complete view model for rendering the public project page
 * Aggregates all data needed for the project view
 * This is the only prop passed to OceanProjectLayout / EarthProjectLayout for projects
 */
export interface PublicProjectPageViewModel {
  /** Project content parsed from YAML */
  project_data: ProjectData;
  /** Theme identifier inherited from user's main page */
  theme: Theme;
  /** User's URL slug for constructing navigation links */
  user_url: string;
  /** Project's UUID from database */
  project_id: string;
  /** Project name from metadata (projects table) */
  project_name: string;
}
```

**Field Descriptions**:
- `project_data: ProjectData` - Complete parsed YAML content with all project details
  - Contains required fields (name, description) and optional fields (tech_stack, prod_link, dates)
  - Parsed from the `data` JSONB column in the `projects` table
- `theme: Theme` - Theme inherited from the user's main page settings
  - Used to determine which layout component to render
  - Either 'ocean' (blue) or 'earth' (green)
- `user_url: string` - User's page URL slug
  - Used to construct the "Back to main page" link: `/page/${user_url}`
  - Retrieved from the `pages` table via `user_url` parameter
- `project_id: string` - Project's unique identifier
  - UUID from the `projects` table
  - Used in URL routing and potential future enhancements
- `project_name: string` - Project name from database metadata
  - Stored in the `project_name` column of `projects` table
  - May differ from `project_data.name` (YAML) but typically should match
  - Useful for fallback scenarios or metadata

## 6. State Management

**State Type**: None

**Explanation**: This is a fully server-side rendered view using Astro. No client-side state management is required because:

## 7. API Integration

### 7.1. Database Queries (via Supabase Client)

**Access Method**: Use `Astro.locals.supabase` in the route component's frontmatter (not direct import)

#### Query 1: Fetch Page Data

**Purpose**: Retrieve the user's page information to get the theme and verify the page exists

**Table**: `pages`

**Query**:
```typescript
const { data: pageData, error: pageError } = await supabase
  .from("pages")
  .select("user_id, url, theme")
  .eq("url", user_url)
  .maybeSingle();
```

**Selected Fields**:
- `user_id`: UUID of the page owner
- `url`: User's URL slug (for verification)
- `theme`: Theme setting ('ocean' or 'earth')

**Response Type**:
```typescript
{
  data: {
    user_id: string;
    url: string;
    theme: string;
  } | null;
  error: PostgrestError | null;
}
```

**Error Handling**:
- If `pageError` is not null → Log error and redirect to `/404`
- If `pageData` is null → Log "page not found" and redirect to `/404`

#### Query 2: Fetch Project Data

**Purpose**: Retrieve the project's metadata and YAML content

**Table**: `projects`

**Query**:
```typescript
const { data: projectData, error: projectError } = await supabase
  .from("projects")
  .select("user_id, project_id, project_name, data")
  .eq("project_id", project_id)
  .maybeSingle();
```

**Selected Fields**:
- `user_id`: UUID of the project owner
- `project_id`: Project's UUID
- `project_name`: Project name from metadata
- `data`: JSONB field containing parsed ProjectData

**Response Type**:
```typescript
{
  data: {
    user_id: string;
    project_id: string;
    project_name: string;
    data: unknown; // JSONB, needs type assertion to ProjectData
  } | null;
  error: PostgrestError | null;
}
```

**Error Handling**:
- If `projectError` is not null → Log error and redirect to `/404`
- If `projectData` is null → Log "project not found" and redirect to `/404`
- If `projectData.data` is null → Log "missing data field" and redirect to `/500`

### 7.2. Data Processing

**Type Assertion**:
```typescript
const parsedProjectData = projectData.data as unknown as ProjectData;
```

**Validation**:
```typescript
if (!parsedProjectData.name || !parsedProjectData.description) {
  console.error("Invalid project data structure for", project_id);
  return Astro.redirect("/500");
}
```

**Date Handling**:
- If dates are stored as ISO strings in the database, convert them:
```typescript
if (parsedProjectData.start_date && typeof parsedProjectData.start_date === 'string') {
  parsedProjectData.start_date = new Date(parsedProjectData.start_date);
}
if (parsedProjectData.end_date && typeof parsedProjectData.end_date === 'string') {
  parsedProjectData.end_date = new Date(parsedProjectData.end_date);
}
```

## 8. User Interactions

### 8.1. Navigate to Project Page

**Trigger**: User clicks "View Project" button on main page's project list

**Action**: Browser navigates to `/page/{user_url}/projects/{project_id}`

**Expected Outcome**:
- Project page loads with correct theme
- All project data is displayed
- Page is fully server-rendered
- No loading states required

### 8.2. Click "Personal Pages" Logo/Link

**Trigger**: User clicks the app name in the navigation bar

**Action**: Navigate to `/` (landing page)

**Expected Outcome**: User is taken to the application's landing page

**Implementation**: Standard `<a href="/">` link in the nav section

### 8.3. Click "Back to Main Page" Link

**Trigger**: User clicks the back link at the top of the project page

**Action**: Navigate to `/page/{user_url}` (user's main page)

**Expected Outcome**: User returns to the main personal page with all projects listed

**Implementation**:
```astro
<a href={`/page/${userUrl}`} class="inline-flex items-center text-primary hover:underline">
  ← Back to main page
</a>
```

### 8.4. Click Production Link

**Trigger**: User clicks the production link (if present)

**Action**: Open external project URL in new tab

**Expected Outcome**:
- External site opens in new tab
- Current page remains open
- Security attributes prevent tabnapping

**Implementation**:
```astro
<a
  href={projectData.prod_link}
  target="_blank"
  rel="noopener noreferrer"
  class="text-primary hover:underline"
>
  {projectData.prod_link}
</a>
```

### 8.5. Navigate to Non-Existent Project

**Trigger**: User enters invalid project_id in URL or follows broken link

**Action**: Server detects project doesn't exist during data fetch

**Expected Outcome**: User is redirected to `/404` error page

## 9. Conditions and Validation

### 9.1. Route-Level Validations (Enforced in `[project_id].astro`)

These validations are **critical for security and data integrity** and must be performed before rendering:

1. **URL Parameters Exist**
   - **Condition**: `user_url` and `project_id` must be present in `Astro.params`
   - **Check**: `if (!user_url || !project_id)`
   - **Action**: Redirect to `/404`
   - **Reason**: Prevent undefined parameter errors

2. **Page Exists**
   - **Condition**: Page record must exist in database for given `user_url`
   - **Check**: `if (pageError || !pageData)`
   - **Action**: Redirect to `/404`
   - **Reason**: Cannot determine theme or validate ownership without page

3. **Project Exists**
   - **Condition**: Project record must exist in database for given `project_id`
   - **Check**: `if (projectError || !projectData)`
   - **Action**: Redirect to `/404`
   - **Reason**: Cannot display non-existent project

4. **Ownership Match (Security)**
   - **Condition**: Project must belong to the page owner
   - **Check**: check if project.user_id matches user_id from context
   - **Action**: Redirect to `/404`
   - **Reason**: **Security requirement** - prevent viewing projects through wrong user URLs

5. **Data Field Present**
   - **Condition**: Project's `data` JSONB field must not be null
   - **Check**: `if (!projectData.data)`
   - **Action**: Redirect to `/500`
   - **Reason**: Cannot render page without YAML content

### 9.2. Component-Level Conditional Rendering

These conditions control which UI elements are displayed:

**ProjectDetails Component**:

1. **Tech Stack Section**
   - **Condition**: `projectData.tech_stack` is truthy
   - **Implementation**: `{projectData.tech_stack && <Card>...</Card>}`
   - **Effect**: Section only appears if tech stack was provided in YAML

2. **Production Link Section**
   - **Condition**: `projectData.prod_link` is truthy
   - **Implementation**: `{projectData.prod_link && <Card>...</Card>}`
   - **Effect**: Link section only appears if production URL was provided

3. **Timeline Section Container**
   - **Condition**: At least one date exists
   - **Implementation**: `{(projectData.start_date || projectData.end_date) && <Card>...</Card>}`
   - **Effect**: Timeline section only appears if at least one date is provided

4. **Start Date Display**
   - **Condition**: `projectData.start_date` is truthy
   - **Implementation**: `{projectData.start_date && <p>...</p>}`
   - **Effect**: Start date only shown if provided

5. **End Date Display**
   - **Condition**: `projectData.end_date` is truthy
   - **Implementation**: `{projectData.end_date && <p>...</p>}`
   - **Effect**: End date only shown if provided

### 9.3. Theme Selection Logic

**Condition**: Theme must be either 'ocean' or 'earth'

**Implementation**:
```typescript
const theme = (pageData.theme === "earth" ? "earth" : "ocean") as Theme;
const LayoutComponent = theme === "ocean" ? OceanProjectLayout : EarthProjectLayout;
```

**Default**: If theme is invalid or undefined, default to 'ocean'

## 10. Error Handling

### 10.1. Error Categories and Responses

#### Client Errors (4xx)

**404 - Not Found**

Redirect to `/404` in these scenarios:
1. **Missing URL parameters**: `user_url` or `project_id` is undefined
2. **Page not found**: No page record exists for the given `user_url`
3. **Project not found**: No project record exists for the given `project_id`
4. **Ownership mismatch**: Project's `user_id` doesn't match page's `user_id`

**Logging**:
```typescript
console.error("Page not found:", user_url, pageError);
console.error("Project not found:", project_id, projectError);
console.error("Project ownership mismatch:", {
  project_user_id: projectData.user_id,
  page_user_id: pageData.user_id
});
```

#### Server Errors (5xx)

**500 - Internal Server Error**

Redirect to `/500` in these scenarios:
1. **Missing data field**: Project's `data` field is null
2. **Invalid data structure**: Required fields (name, description) are missing from parsed data

**Logging**:
```typescript
console.error("No data field for project:", project_id);
console.error("Invalid project data structure for", project_id, {
  hasName: !!parsedProjectData.name,
  hasDescription: !!parsedProjectData.description
});
```

### 10.2. Database Query Error Handling

**Pattern**: Check for errors immediately after each query

```typescript
const { data, error } = await supabase.from("table").select();

if (error || !data) {
  console.error("Query failed:", error);
  return Astro.redirect("/404"); // or /500 depending on error type
}
```

**Error Information to Log**:
- Error message/code from Supabase
- Relevant parameters (user_url, project_id)
- Context of the operation

### 10.3. Date Parsing Error Handling

**Scenario**: Date strings from database are invalid

**Implementation**:
```typescript
if (parsedProjectData.start_date) {
  const startDate = new Date(parsedProjectData.start_date);
  parsedProjectData.start_date = isNaN(startDate.getTime()) ? undefined : startDate;
}

if (parsedProjectData.end_date) {
  const endDate = new Date(parsedProjectData.end_date);
  parsedProjectData.end_date = isNaN(endDate.getTime()) ? undefined : endDate;
}
```

**Effect**: Invalid dates are treated as if they weren't provided (graceful degradation)

### 10.4. External Link Safety

**Scenario**: Production link could be malicious

**Implementation**: Always use security attributes
```astro
<a
  href={projectData.prod_link}
  target="_blank"
  rel="noopener noreferrer"
>
```

**Attributes**:
- `target="_blank"`: Opens in new tab
- `rel="noopener"`: Prevents new page from accessing window.opener
- `rel="noreferrer"`: Prevents sending referrer information

### 10.5. Early Return Pattern

**Principle**: Handle errors at the beginning of the component, happy path at the end

**Example Structure**:
```typescript
---
// 1. Extract params
const { user_url, project_id } = Astro.params;

// 2. Validate params
if (!user_url || !project_id) {
  return Astro.redirect("/404");
}

// 3. Fetch page data
const { data: pageData, error: pageError } = await supabase...
if (pageError || !pageData) {
  console.error("Page not found:", user_url, pageError);
  return Astro.redirect("/404");
}

// 4. Fetch project data
const { data: projectData, error: projectError } = await supabase...
if (projectError || !projectData) {
  console.error("Project not found:", project_id, projectError);
  return Astro.redirect("/404");
}

// 5. Validate ownership
if (projectData.user_id !== pageData.user_id) {
  console.error("Ownership mismatch");
  return Astro.redirect("/404");
}

// 6. Validate data field
if (!projectData.data) {
  console.error("Missing data field");
  return Astro.redirect("/500");
}

// 7. Parse and validate data structure
const parsedProjectData = projectData.data as ProjectData;
if (!parsedProjectData.name || !parsedProjectData.description) {
  console.error("Invalid data structure");
  return Astro.redirect("/500");
}

// 8. Happy path - build viewmodel and render
const viewModel: PublicProjectPageViewModel = {...};
---

<LayoutComponent {...viewModel} />
```

## 11. Implementation Steps

### Step 1: Add New Type to Type Definitions

**File**: `/src/types.ts`

**Action**: Add `PublicProjectPageViewModel` interface to the "ViewModels for Public Pages" section (after `PublicMainPageViewModel`)

```typescript
/**
 * Complete view model for rendering the public project page
 * Aggregates all data needed for the project view
 * This is the only prop passed to OceanProjectLayout / EarthProjectLayout for projects
 */
export interface PublicProjectPageViewModel {
  project_data: ProjectData;
  theme: Theme;
  user_url: string;
  project_id: string;
  project_name: string;
}
```

### Step 2: Create Route Component

**File**: `/src/pages/page/[user_url]/projects/[project_id].astro`

**Action**: Create the main route component with:
1. Imports for types and theme layouts
2. Parameter extraction and validation
3. Supabase queries for page and project data
4. Ownership validation
5. Data parsing and structure validation
6. ViewModel construction
7. Theme-based layout selection
8. Component rendering

**Template**:
```astro
---
import type { PublicProjectPageViewModel, ProjectData, Theme } from "@/types";
import OceanProjectLayout from "@/components/themes/ocean/OceanProjectLayout.astro";
import EarthProjectLayout from "@/components/themes/earth/EarthProjectLayout.astro";

const { user_url, project_id } = Astro.params;

// Validation and data fetching logic (see section 10.5 for complete pattern)
// ...

const viewModel: PublicProjectPageViewModel = {
  project_data: parsedProjectData,
  theme,
  user_url: pageData.url,
  project_id: projectData.project_id,
  project_name: projectData.project_name,
};

const LayoutComponent = theme === "ocean" ? OceanProjectLayout : EarthProjectLayout;
---

<LayoutComponent {...viewModel} />
```

### Step 3: Create Ocean Theme Layout

**File**: `/src/components/themes/ocean/OceanProjectLayout.astro`

**Action**: Create full HTML document with ocean theme
1. Import shared styles and sub-components
2. Define Props interface extending PublicProjectPageViewModel
3. Destructure props
4. Build HTML structure with theme class
5. Add meta tags and Open Graph data
6. Include navigation, main content area, and footer

**Reference**: Follow pattern from `OceanThemeLayout.astro` (main page layout)

### Step 4: Create Earth Theme Layout

**File**: `/src/components/themes/earth/EarthThemeLayout.astro`

**Action**: Create full HTML document with earth theme
- Same structure as Ocean layout
- Use `class="theme-earth"` on html element
- All other implementation identical

### Step 5: Create Ocean Theme ProjectHeader Component

**File**: `/src/components/themes/ocean/ProjectHeader.astro`

**Action**: Create header component for project name
1. Define Props interface accepting projectData
2. Extract name from projectData
3. Render semantic header with h1

**Implementation**:
```astro
---
import type { ProjectData } from '@/types';

interface Props {
  projectData: ProjectData;
}

const { projectData } = Astro.props;
---

<header class="mb-8">
  <h1 class="text-4xl font-bold text-foreground">{projectData.name}</h1>
</header>
```

### Step 6: Create Earth Theme ProjectHeader Component

**File**: `/src/components/themes/earth/ProjectHeader.astro`

**Action**: Create identical component for earth theme (same implementation as ocean, but styles will resolve differently via theme CSS variables)

### Step 7: Create Ocean Theme ProjectDetails Component

**File**: `/src/components/themes/ocean/ProjectDetails.astro`

**Action**: Create details component with conditional rendering
1. Import Card components from shadcn/ui
2. Define Props interface
3. Render description (always)
4. Conditionally render tech_stack section
5. Conditionally render prod_link section
6. Conditionally render dates section with proper date formatting

**Key Implementation Points**:
- Use `<Card>` components for visual structure
- Use conditional rendering: `{condition && <element>}`
- Format dates with `toLocaleDateString()`
- Use semantic HTML: `<time datetime={...}>`
- Apply theme-aware Tailwind classes

### Step 8: Create Earth Theme ProjectDetails Component

**File**: `/src/components/themes/earth/ProjectDetails.astro`

**Action**: Create identical component for earth theme (implementation matches ocean component)

### Step 9: Test Data Fetching and Validation

**Actions**:
1. Start dev server: `npm run dev`
2. Create test project in database with valid YAML data
3. Navigate to project URL: `/page/{test_user}/projects/{test_project_id}`
4. Verify page renders correctly with all data
5. Test error scenarios:
   - Invalid project_id → should redirect to 404
   - Invalid user_url → should redirect to 404
   - Project from different user → should redirect to 404
   - Project with missing data field → should redirect to 500

### Step 10: Documentation and Cleanup

**Actions**:
1. Add JSDoc comments to new types
2. Check code formatting with linter