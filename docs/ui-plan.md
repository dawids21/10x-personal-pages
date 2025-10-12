# UI Architecture for Personal Pages

## 1. UI Structure Overview

The Personal Pages UI is composed of:
- Public experience rendered server-side with Astro for the user’s main page and project subpages.
- An authenticated single-dashboard experience at /app that conditionally renders either the Initial Page Setup view (for first-time users) or the full Admin Dashboard (for returning users).
- A minimal landing page with integrated authentication for unauthenticated users.
- Inline, component-level management of API loading and error states, with success toasts for all mutations.
- Strict offline YAML editing model: upload/download only; no in-app YAML editor.

Core routing:
- / (Landing, unauthenticated)
- /app (Authenticated Dashboard Entry: shows Initial Setup or Admin Dashboard based on GET /api/pages)
- /page/{user_url} (Public Main Page, SSR)
- /page/{user_url}/{project_id} (Public Project Page, SSR)
- 404 (Default Not Found page for invalid or outdated public URLs)

Global elements:
- Header with brand and Logout (no Dashboard link; users access the dashboard via the main app link)
- Footer (minimal)
- Toast notification system (success on create/update/delete)
- Confirm dialogs for destructive actions

## 2. View List

1) Landing (Unauthenticated)
- View path: /
- Main purpose:
  - Present application name and authenticate the user via Supabase.
- Key information to display:
  - App name and a brief tagline.
  - Login/Signup form (Supabase Auth).
- Key view components:
  - BrandHeader (logo/name)
  - AuthForm (Supabase widget or custom wrapper)
  - PrimaryCTA (Login/Signup)
- UX, accessibility, and security considerations:
  - Ensure clear focus states for form controls.
  - Provide error messages for failed auth attempts.
  - Use semantic landmarks (main/section).
  - Do not leak any private data on this page.
  - After successful login, redirect to /app.

2) Authenticated App Shell (Dashboard Entry)
- View path: /app
- Main purpose:
  - Serve as entry point for authenticated users.
  - Decide between Initial Page Setup and Admin Dashboard based on GET /api/pages (404 → Initial Page Setup; 200 → Dashboard).
- Key information to display:
  - Loading state while checking page existence.
  - Error state if GET /api/pages fails (non-404).
- Key view components:
  - AppHeader (brand, Logout)
  - RouteGate (handles GET /api/pages and conditional rendering)
- UX, accessibility, and security considerations:
  - Use role="status" or aria-busy for loading indicators.
  - Handle 500+ errors gracefully with retry.
  - Enforce authentication via middleware; do not render authenticated content for logged-out users.

2a) Initial Page Setup (First-Time Users)
- View path: /app (conditional render)
- Main purpose:
  - Create the user’s main personal page (URL + theme + optional initial YAML).
- Key information to display:
  - Fields: URL slug, Theme selection, optional YAML file upload.
  - Links: Download Page YAML Template, brief instructions for offline editing.
- Key view components:
  - Card: “Create Your Page”
  - Input: URL slug
  - Select: Theme (theme-1, theme-2)
  - FileUploadButton: Optional Page YAML
  - Button: Create Page (POST /api/pages)
  - InlineHelp: Link to download template (GET /api/templates/page)
- UX, accessibility, and security considerations:
  - Rely on server-side validation; display API error messages clearly (e.g., 400/409).
  - Disable Create button while submitting; show spinner.
  - After success (201), show toast and transition to Admin Dashboard.
  - Provide labels, aria-describedby for errors, and keyboard navigation for all controls.

2b) Admin Dashboard (Returning Users)
- View path: /app (conditional render)
- Main purpose:
  - Manage page configuration and projects from a single screen.
- Key information to display:
  - Page settings (URL, theme, direct link to public page).
  - Page content management (download template/current YAML, upload YAML).
  - Projects list with inline actions and reorder controls.
- Key view components (arranged as cards):
  - Page Settings Card:
    - Input: URL slug + "Update URL" action (POST /api/pages/url)
    - Select: Theme + "Save Theme" action (PUT /api/pages)
    - Link: Public page link displayed directly under URL input
  - Page Content Card:
    - Button: Download Template (GET /api/templates/page)
    - Button: Download Current YAML (GET /api/pages/data)
    - FileUploadButton: Upload New YAML (POST /api/pages/data)
    - ErrorList: Displays field-level errors on 400
  - Projects Card:
    - Button: New Project (opens modal)
    - ProjectList (GET /api/projects) with ProjectListItem:
      - InlineEditText: Project name (PUT /api/projects/{id})
      - FileUploadButton: Upload YAML (POST /api/projects/{id}/data)
      - Button: Download YAML (GET /api/projects/{id}/data)
      - ReorderControls: Up/Down arrows (client-only until saved)
      - Button: Delete (DELETE /api/projects/{id}) with ConfirmDialog
    - Button: Save Order (PUT /api/projects/reorder)
- UX, accessibility, and security considerations:
  - Local component state for loading/errors; disable controls during operations.
  - Success toasts on create/update/delete; errors rendered near controls.
  - Keyboard accessible inline edit, reorder arrows, and modal (focus trap).
  - ConfirmDialog for deletes; explicit Save Order to avoid accidental persistence.
  - Only render data for the authenticated user (enforced by backend RLS; UI should not assume ownership outside responses).

3) Create Project Modal
- View path: (modal state within /app)
- Main purpose:
  - Create a project by specifying project_name; display_order is auto-computed (max + 1).
- Key information to display:
  - Fields: Project name (required).
  - UI computes display_order as max(display_order) + 1; user does not input it.
- Key view components:
  - Modal (focus-trapped)
  - Input: Project name
  - Button: Create (POST /api/projects)
- UX, accessibility, and security considerations:
  - Disable Create while submitting; show spinner.
  - On success, close modal, refetch project list, show toast.
  - Provide clear field-level error if 400.

4) Public Main Page (SSR)
- View path: /page/{user_url}
- Main purpose:
  - Display generated profile content from latest valid YAML with links to project subpages.
- Key information to display:
  - Name, bio, optional sections (skills, experience, education, contact), list of projects linking to subpages.
- Key view components:
  - PublicLayout (top bar with app name, click takes to landing page)
  - PageHeader (name, bio)
  - Sections: Skills, Experience, Education, Contact (conditionally rendered)
  - ProjectsListPublic (links to subpages)
- Structure of the view depends on the theme for user page (ocean/earth)
- Create separate sets of components for each theme. For now they will differ only in the main color (blue/green).
- For this view use copy of global.css matching theme

5) Public Project Page (SSR)
- View path: /page/{user_url}/{project_id}
- Main purpose:
  - Display a project’s details from YAML.
- Key information to display:
  - Name, description, tech stack, optional production link, dates.
- Key view components:
  - PublicLayout (top bar with app name, click takes to landing page)
  - ProjectHeader
  - ProjectDetails
- Structure of the view depends on the theme for user page (ocean/earth)
- Create separate sets of components for each theme. For now they will differ only in the main color (blue/green).
- For this view use copy of global.css matching theme

6) 404 Not Found
- View path: 404
- Main purpose:
  - Handle invalid or outdated URLs (e.g., after URL change).
- Key information to display:
  - Clear message and optional link back to landing.
- Key view components:
  - NotFound
- UX, accessibility, and security considerations:
  - Plain, accessible content; no sensitive info disclosed.

## 3. User Journey Map

Primary journey (first-time setup to live page):
1) User visits / and logs in via Supabase.
2) Redirect to /app → GET /api/pages returns 404 → Initial Page Setup renders.
3) User downloads the Page YAML Template, edits offline.
4) User fills URL and Theme; optionally uploads YAML file; submits (POST /api/pages).
5) On 201 Created, show success toast; re-check GET /api/pages and render Admin Dashboard.
6) In Dashboard, user downloads current YAML as needed, re-uploads updates via POST /api/pages/data.
7) User creates a project via New Project modal (POST /api/projects); then uploads project YAML via POST /api/projects/{id}/data.
8) User reorders projects using arrows; clicks Save Order (PUT /api/projects/reorder); success toast.
9) User clicks public page link; new tab opens /page/{user_url} with content and project links.
10) User logs out; redirected to /.

Alternative/intermediate interactions:
- Change theme (PUT /api/pages); success toast; confirm visually in public page.
- Change URL (POST /api/pages/url); show new public link under input; old public URL now 404s.
- Download current project YAML (GET /api/projects/{id}/data) for offline edits.
- Delete a project (DELETE /api/projects/{id}); confirm, toast, list refetch.

Error/edge journeys:
- Any YAML upload with validation errors returns 400; ErrorList displays field-level issues; user re-uploads corrected file.
- URL conflicts (409) or invalid format (400) shown inline; user can retry.
- Network or server errors show inline banners with retry.

## 4. Layout and Navigation Structure

Global layout:
- Header:
  - Brand/logo linking to /
  - Logout button in user menu
- Content area:
  - Landing: auth form
  - App: cards for Page Settings, Page Content, Projects; modal overlays for creating project and confirms
- Footer:
  - Minimal legal/info links

Navigation:
- High-level routes: /, /app, /page/{user_url}, /page/{user_url}/{project_id}
- In-dashboard section anchors: Page Settings, Page Content, Projects
- No side navigation; cards provide clear grouping
- Public pages have no admin nav; provide a link back to landing if desired

Access control:
- Astro middleware verifies sessions for /app and API routes.
- UI renders loading states while verifying; redirects to / on logout or auth loss.

## 5. Key Components

Cross-view reusable components:
- AppHeader: Brand, Logout
- Toast: Success notifications for create/update/delete; aria-live=”polite”
- ConfirmDialog: Destructive action confirmation with focus trap
- Card: Section container in dashboard
- Input, Select, Button: Form controls with accessible labels/states
- FileUploadButton: Reads YAML file as text; disables during upload; shows spinner
- ErrorList: Renders API validation errors (field + issue)
- Spinner/Status: Loading indicators with role="status"
- InlineEditText: Accessible inline edit for project names
- ReorderControls: Up/Down arrows with aria-labels per item and keyboard operability
- ProjectList / ProjectListItem: Inline controls (rename, upload/download YAML, reorder, delete)
- CreateProjectModal: Form to create a project; closes on success and refetches list

User stories mapping (high level):
- US-001/002: Landing auth → /app
- US-003: Dashboard “Download Template” (page) → GET /api/templates/page
- US-004/009: Upload Page YAML → POST /api/pages/data; success toast; live page reflects
- US-005: YAML validation errors → ErrorList in Page Content card
- US-006: Change Theme → PUT /api/pages; success toast; public reflects
- US-007/008: Change URL → POST /api/pages/url; new link shown; old URL 404 via SSR
- US-010: Create Project via modal; upload project YAML; appears on main page
- US-011: Click public page link under URL input; opens /page/{user_url} in new tab
- US-012: Download Current YAML (page) → GET /api/pages/data
- US-013: Logout → redirect to /