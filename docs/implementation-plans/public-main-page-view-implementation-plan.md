# View Implementation Plan: Public Main Page

## 1. Overview

The Public Main Page is a server-side rendered (SSR) view that displays a user's personal portfolio page to the public. This view is accessible at `/page/{user_url}` and presents the user's profile information parsed from their uploaded YAML file, including name, bio, and optional sections (skills, experience, education, contact information). It also displays a list of the user's projects with links to their respective subpages. The view supports two visual themes (ocean and earth) that differ in their color schemes (blue and green respectively).

## 2. View Routing

**Path:** `/page/[user_url].astro`

**Route Parameters:**
- `user_url` (string): The unique URL slug identifying the user's page

**Access:** Public (no authentication required)

## 3. Component Structure

```
/page/[user_url].astro (Astro Page Component)
│
└── [Conditional based on theme]
    │
    ├── OceanThemeLayout (for ocean theme)
    │   └── [Renders all sections with ocean theme styling]
    │       ├── TopBar (ocean-specific)
    │       ├── PageHeader (ocean-specific)
    │       ├── SkillsSection (ocean-specific, conditional)
    │       ├── ExperienceSection (ocean-specific, conditional)
    │       ├── EducationSection (ocean-specific, conditional)
    │       ├── ContactSection (ocean-specific, conditional)
    │       └── ProjectsListPublic (ocean-specific, conditional)
    │
    └── EarthThemeLayout (for earth theme)
        └── [Renders all sections with earth theme styling]
            ├── TopBar (earth-specific)
            ├── PageHeader (earth-specific)
            ├── SkillsSection (earth-specific, conditional)
            ├── ExperienceSection (earth-specific, conditional)
            ├── EducationSection (earth-specific, conditional)
            ├── ContactSection (earth-specific, conditional)
            └── ProjectsListPublic (earth-specific, conditional)
```

**Theme Architecture:**

The public page uses two separate top-level layout components:
- `OceanThemeLayout.astro` - Located in `src/components/themes/ocean/`
- `EarthThemeLayout.astro` - Located in `src/components/themes/earth/`

Each layout component:
- Accepts `PublicMainPageViewModel` as props
- Imports and renders theme-specific subcomponents
- Loads theme-specific CSS file (global-ocean.css or global-earth.css)
- Contains all layout logic and conditional rendering internally

**Key Benefits:**
- Theme components don't need identical interfaces (only top-level layout needs to match)
- Each theme can have unique implementations while sharing the same data model
- Simplified prop passing - view model flows from page → layout only
- Theme isolation - all theme-specific code lives in its own directory

## 4. Component Details

### OceanThemeLayout / EarthThemeLayout

**Component Description:**
Top-level layout components for the two available themes. Each layout is a self-contained component that receives the complete view model and handles all rendering logic internally. OceanThemeLayout renders the page with blue color scheme, while EarthThemeLayout uses green. Both components:
- Import theme-specific CSS file (global-ocean.css or global-earth.css)
- Render all page sections with theme-specific subcomponents
- Handle conditional rendering of optional sections
- Provide semantic HTML structure with proper accessibility
- Can be implemented with different internal structures since they don't share subcomponents

**Main Elements:**
- `<html>` root element
- `<head>` with meta tags, title, and theme-specific stylesheet import
- `<body>` with theme-specific background and layout
- `<nav>` top bar with app name linking to landing page
- `<main>` content area containing:
  - PageHeader (name and bio)
  - SkillsSection (conditional)
  - ExperienceSection (conditional)
  - EducationSection (conditional)
  - ContactSection (conditional)
  - ProjectsListPublic (conditional)
- `<footer>` (optional)

**Child Components:**
Theme-specific implementations of:
- TopBar / navigation
- PageHeader
- SkillsSection (with skill items)
- ExperienceSection (with experience items)
- EducationSection (with education items)
- ContactSection (with contact items)
- ProjectsListPublic (with project links)

**Note:** Child components are theme-specific implementations and don't need to share identical interfaces. They exist only within their respective theme directory.

**Handled Interactions:**
- Click app name → navigate to landing page (/)
- Click project link → navigate to project subpage

**Validation Conditions:**
Internal conditional rendering based on view model data:
- Skills section: only if `pageData.skills` exists and has items
- Experience section: only if `pageData.experience` exists and has items
- Education section: only if `pageData.education` exists and has items
- Contact section: only if `pageData.contact_info` exists and has items
- Projects section: only if `projects` array has items

**Types:**
- Props: `PublicMainPageViewModel`

**Props:**
- `pageData` (required): User's page content from YAML
- `projects` (required): Array of user's projects (may be empty)
- `theme` (required): Theme identifier ('ocean' or 'earth') - used only for validation
- `userUrl` (required): User's URL slug for constructing project links

**Shadcn Components:**
Use shadcn/ui components server-side (no client:* directive unless interactivity is required):
- Consider using Card components for sections
- Use Typography components for consistent text styling
- Use Link/Button components for navigation
- All components render as static HTML

**Styling Approach:**
- Load theme-specific CSS file in component head
- CSS file defines theme-specific CSS variables that shadcn components will use automatically
- Apply Tailwind utility classes for layout and spacing
- Theme-specific colors from CSS variables will be applied automatically to shadcn components

## 5. Types

### Existing Types (from src/types.ts)

```typescript
// Page data structure from YAML
export interface PageData {
  name: string;
  bio: string;
  contact_info?: ContactInfo[];
  experience?: Experience[];
  education?: Education[];
  skills?: Skill[];
}

export interface ContactInfo {
  label: string;
  value: string;
}

export interface Experience {
  job_title: string;
  job_description?: string;
}

export interface Education {
  school_title: string;
  school_description?: string;
}

export interface Skill {
  name: string;
}

// Project DTO
export type ProjectDto = {
  user_id: string;
  project_id: string;
  project_name: string;
  display_order: number;
};
```

### New ViewModels Required

```typescript
/**
 * Theme type alias
 */
export type Theme = 'ocean' | 'earth';

/**
 * Complete view model for rendering the public main page
 * Aggregates all data needed for the view
 * This is the only prop passed to OceanThemeLayout / EarthThemeLayout
 */
export interface PublicMainPageViewModel {
  /** User's page content parsed from YAML */
  pageData: PageData;
  /** List of user's projects, ordered by display_order */
  projects: ProjectDto[];
  /** Theme identifier for selecting layout component */
  theme: Theme;
  /** User's URL slug for constructing project links */
  userUrl: string;
}
```

**Notes on Types:**
- `PublicMainPageViewModel` is the single interface that both theme layout components must accept
- Theme-specific CSS files define color variables that shadcn components use automatically
- No `ThemeConfig` interface needed - styling is handled purely through CSS
- No API response types needed - data fetched directly from database in SSR context

## 6. State Management

**State Type:** Server-Side Only (SSR)

Since this is a fully server-side rendered view, there is no client-side state management required. All data fetching and processing occurs on the server during the page build/request.

**Data Flow:**
1. User requests `/page/{user_url}`
2. Astro page component receives `user_url` from route params
3. Server-side code fetches page data and projects from database
4. YAML data is parsed to PageData structure
5. Theme is determined from page configuration
6. All data is passed to components as props
7. HTML is rendered and sent to client

**No Custom Hooks Required:** All logic is contained in the Astro page component's frontmatter.

## 7. Data Fetching (Database Integration)

Since this is a server-side rendered page, all data is fetched directly from the database in the Astro page component's frontmatter. **No API endpoints are used.**

### Database Queries

The page performs two main database queries using Supabase client:

#### 1. Fetch Page Data by URL

**Table:** `pages`

**Query:**
```typescript
const { data: pageData, error: pageError } = await supabase
  .from('pages')
  .select('user_id, url, theme, data')
  .eq('url', user_url)
  .single();
```

**Returns:**
- `user_id` (string): Owner of the page
- `url` (string): URL slug
- `theme` (string): Theme identifier ('ocean' or 'earth')
- `data` (string): YAML content as string

**Error Handling:**
- If `pageError` or no `pageData`: redirect to 404
- If `data` field is empty/null: redirect to 500

---

#### 2. Fetch User's Projects

**Table:** `projects`

**Query:**
```typescript
const { data: projectsData, error: projectsError } = await supabase
  .from('projects')
  .select('user_id, project_id, project_name, display_order')
  .eq('user_id', pageData.user_id)
  .order('display_order', { ascending: true });
```

**Returns:**
Array of project objects with:
- `user_id` (string): Owner of the project
- `project_id` (string): Unique project identifier
- `project_name` (string): Display name
- `display_order` (number): Sort order

**Error Handling:**
- If query fails: log warning and use empty array (graceful degradation)

### Key Points

- **No API layer**: Direct database access via `Astro.locals.supabase`
- **Server-side only**: All queries happen during SSR, no client-side data fetching
- **Error handling**: Proper redirects for 404/500 cases
- **Graceful degradation**: Missing projects don't break the page
- **Type safety**: All data properly typed using TypeScript interfaces

## 8. User Interactions

### 1. Navigate to Personal Page

**User Action:** User enters URL `/page/{user_url}` in browser or clicks link from dashboard

**System Behavior:**
- Server receives request
- Fetches page data and projects from database
- Parses YAML content
- Renders HTML with all components
- Returns complete page to browser

**Expected Outcome:** User sees their personal page with all sections and projects

**Edge Cases:**
- URL doesn't exist → 404 page
- Page has no data → 500 error or message
- No projects → Projects section not displayed

---

### 2. Click App Name to Return to Landing

**User Action:** User clicks application name/logo in TopBar

**System Behavior:**
- Browser navigates to `/` (landing page)

**Expected Outcome:** User sees the application landing page

---

### 3. Click Project Link

**User Action:** User clicks on a project name in ProjectsListPublic

**System Behavior:**
- Browser navigates to `/page/{user_url}/projects/{project_id}`

**Expected Outcome:** User sees the project subpage

**Edge Cases:**
- Project page not yet implemented → 404

---

### 4. View Different Sections

**User Action:** User scrolls through the page

**System Behavior:**
- Browser renders sections as they come into viewport
- No dynamic loading (all SSR)

**Expected Outcome:** User sees all available sections in order:
1. Page Header (name, bio)
2. Skills (if present)
3. Experience (if present)
4. Education (if present)
5. Contact (if present)
6. Projects (if present)

## 9. Conditions and Validation

### Page-Level Conditions

**Condition:** Page URL must exist in database
**Verification:** Query database for matching `url` field
**Effect on UI:** If not found, redirect to 404 page
**Implementation:** Check query result before rendering

---

**Condition:** Page must have valid data field
**Verification:** Check that `data` field is not null/empty
**Effect on UI:** If invalid, show error or redirect to 500
**Implementation:** Validate before parsing YAML

---

**Condition:** YAML must be parseable
**Verification:** Try-catch around YAML parse operation
**Effect on UI:** If parse fails, log error and redirect to 500
**Implementation:** Use try-catch in page frontmatter

---

**Condition:** Theme must be valid
**Verification:** Check that theme is 'ocean' or 'earth'
**Effect on UI:** If invalid, default to 'ocean' theme
**Implementation:** Use ternary or default value: `theme === 'earth' ? 'earth' : 'ocean'`

### Component-Level Conditions

**SkillsSection:**
- **Condition:** skills array exists and has items
- **Verification:** `skills && skills.length > 0`
- **Effect:** Only render section if condition is true
- **Implementation:** Conditional rendering in template

**ExperienceSection:**
- **Condition:** experience array exists and has items
- **Verification:** `experience && experience.length > 0`
- **Effect:** Only render section if condition is true
- **Implementation:** Conditional rendering in template

**EducationSection:**
- **Condition:** education array exists and has items
- **Verification:** `education && education.length > 0`
- **Effect:** Only render section if condition is true
- **Implementation:** Conditional rendering in template

**ContactSection:**
- **Condition:** contact_info array exists and has items
- **Verification:** `contactInfo && contactInfo.length > 0`
- **Effect:** Only render section if condition is true
- **Implementation:** Conditional rendering in template

**ProjectsListPublic:**
- **Condition:** projects array exists and has items
- **Verification:** `projects && projects.length > 0`
- **Effect:** Only render section if condition is true
- **Implementation:** Conditional rendering in template

**ExperienceItem:**
- **Condition:** job_description is present
- **Verification:** `jobDescription` (truthy check)
- **Effect:** Only render description paragraph if present
- **Implementation:** Conditional rendering: `{jobDescription && <p>{jobDescription}</p>}`

**EducationItem:**
- **Condition:** school_description is present
- **Verification:** `schoolDescription` (truthy check)
- **Effect:** Only render description paragraph if present
- **Implementation:** Conditional rendering: `{schoolDescription && <p>{schoolDescription}</p>}`

### Data Validation

**Required Fields (PageData):**
- `name` - Always present (validated on upload)
- `bio` - Always present (validated on upload)

**Optional Fields (PageData):**
- `contact_info` - May be undefined or empty array
- `experience` - May be undefined or empty array
- `education` - May be undefined or empty array
- `skills` - May be undefined or empty array

**Projects:**
- May be empty array (user has no projects yet)
- Must be sorted by `display_order` ascending before passing to component

## 10. Error Handling

### 1. Page Not Found (404)

**Scenario:** URL slug doesn't match any page in database

**Detection:** Database query returns no results

**Handling:**
```typescript
if (pageError || !pageData) {
  return Astro.redirect('/404');
}
```

**User Experience:** User sees standard 404 error page

---

### 2. YAML Parsing Error

**Scenario:** Data field contains invalid YAML (should be rare due to upload validation)

**Detection:** YAML parser throws exception

**Handling:**
```typescript
try {
  parsedPageData = parseYaml(pageData.data) as PageData;
} catch (error) {
  console.error('YAML parse error for', user_url, error);
  return Astro.redirect('/500');
}
```

**User Experience:** User sees 500 error page or generic error message

---

### 3. Missing Data Field

**Scenario:** Page exists but has null/empty data field (data corruption)

**Detection:** Check data field before parsing

**Handling:**
```typescript
if (!pageData.data) {
  console.error('No data field for page:', user_url);
  return Astro.redirect('/500');
}
```

**User Experience:** User sees 500 error page

---

### 4. Database Connection Error

**Scenario:** Cannot connect to Supabase or query fails

**Detection:** Supabase client returns error

**Handling:**
```typescript
const { data, error } = await supabase...;
if (error) {
  console.error('Database error:', error);
  return new Response('Service unavailable', { status: 503 });
}
```

**User Experience:** User sees 503 Service Unavailable error

---

### 5. Invalid Theme Value

**Scenario:** Theme field contains unexpected value

**Detection:** Check theme value against known themes

**Handling:**
```typescript
const theme = (pageData.theme === 'earth' ? 'earth' : 'ocean') as Theme;
// Default to 'ocean' if invalid
```

**User Experience:** Page renders with default theme (no error shown)

---

### 6. Projects Fetch Failure

**Scenario:** Cannot fetch user's projects from database

**Detection:** Projects query returns error

**Handling:**
```typescript
const { data: projectsData, error: projectsError } = await supabase...;
if (projectsError) {
  console.warn('Could not fetch projects:', projectsError);
  // Continue with empty projects array
}
const projects = projectsData || [];
```

**User Experience:** Page renders without projects section (graceful degradation)

---

### 7. Empty Optional Sections

**Scenario:** User hasn't filled in optional sections (not an error)

**Detection:** Check array existence and length

**Handling:** Conditional rendering - don't show section at all

**User Experience:** Sections are simply not displayed (clean, minimal page)

## 11. Implementation Steps

### Step 1: Set Up Type Definitions
- Add new ViewModel types to `src/types.ts`:
  - `Theme` type alias: `'ocean' | 'earth'`
  - `PublicMainPageViewModel` interface with all required fields

### Step 2: Create Theme Structure
- Create directory structure:
  - `src/components/themes/ocean/`
  - `src/components/themes/earth/`
- Create theme-specific stylesheets:
  - `src/styles/themes/global-ocean.css`
  - `src/styles/themes/global-earth.css`
- Define color variables and theme-specific styles in each stylesheet

### Step 3: Implement Ocean Theme Layout
- Create `src/components/themes/ocean/OceanThemeLayout.astro`
  - Accept `PublicMainPageViewModel` as props
  - Include complete HTML structure with head and body
  - Import theme-specific global CSS (global-ocean.css)
  - Add meta tags for SEO (title, description, Open Graph)
  - Render TopBar, PageHeader, and all content sections internally
  - Use shadcn/ui components server-side for consistent styling
  - Implement conditional rendering for optional sections

### Step 4: Implement Section Components for Ocean Theme
- Create `src/components/themes/ocean/SkillsSection.astro`
  - Render skills list with proper semantics
  - Style skills as tags or list items
- Create `src/components/themes/ocean/ExperienceSection.astro`
  - Render experience entries with ExperienceItem
- Create `src/components/themes/ocean/ExperienceItem.astro`
  - Display job title and optional description
- Create `src/components/themes/ocean/EducationSection.astro`
  - Render education entries with EducationItem
- Create `src/components/themes/ocean/EducationItem.astro`
  - Display school title and optional description
- Create `src/components/themes/ocean/ContactSection.astro`
  - Render contact information using description list (dl, dt, dd)
  - Create ContactItem for each entry
- Create `src/components/themes/ocean/ProjectsListPublic.astro`
  - Render project links with ProjectLink component
  - Ensure proper accessibility for navigation

### Step 5: Implement Earth Theme Layout
- Create `src/components/themes/earth/EarthThemeLayout.astro`
  - Accept `PublicMainPageViewModel` as props (same interface as Ocean)
  - Can reuse Ocean theme structure or implement differently
  - Import theme-specific global CSS (global-earth.css)
  - Update color usage to green color scheme throughout
  - Ensure all shadcn components pick up earth theme CSS variables

### Step 6: Create Page Route
- Create `src/pages/page/[user_url].astro`
- Implement frontmatter logic:
  - Extract `user_url` from route params
  - Query Supabase for page data by URL
  - Query Supabase for user's projects
  - Handle 404 if page not found
  - Parse YAML data to PageData object
  - Handle parse errors
  - Sort projects by display_order
  - Determine theme
  - Build PublicMainPageViewModel
- Add try-catch blocks for error handling
- Set up redirects for error cases

### Step 7: Render Page Template
- In the page template, conditionally select layout component based on theme:
  ```typescript
  const LayoutComponent = theme === 'ocean' ? OceanThemeLayout : EarthThemeLayout;
  ```
- Render selected layout with spread operator:
  ```typescript
  <LayoutComponent {...viewModel} />
  ```
- All conditional section rendering is handled internally by layout components

### Step 8: Add SEO and Accessibility Features
- In both layout components, add meta tags:
  - Title: User's name
  - Description: User's bio (truncated if needed)
  - Open Graph tags for social sharing
- Ensure proper heading hierarchy (h1 → h2 → h3)
- Add ARIA labels where needed
- Test with screen reader
- Verify semantic HTML structure