# View Implementation Plan: Admin Dashboard

## 1. Overview

The Admin Dashboard is the primary authenticated interface for users who have already created their personal page. It provides a comprehensive management console for:
- Configuring page settings (URL slug and visual theme)
- Managing page content through YAML upload/download
- Creating, organizing, and managing project subpages
- Previewing and accessing the public personal page

The dashboard is organized into three main card-based sections: Page Settings, Page Content, and Projects. All operations follow a pessimistic update pattern with loading states, inline error handling, and success toast notifications. The view strictly adheres to the offline YAML editing model—no in-app text editing is provided.

## 2. View Routing

**Primary Route:** `/app`

**Access Control:**
- Protected by Astro middleware requiring authenticated Supabase session
- Conditional rendering based on `GET /api/pages` response:
  - `200 OK` with page data → Render Admin Dashboard (this view)
  - `404 Not Found` → Render Initial Page Setup view (separate implementation)
  - `401 Unauthorized` → Redirect to landing page `/`

**Implementation:** Astro page component at `src/pages/app.astro` that:
1. Checks authentication via `locals.supabase.auth.getUser()`
2. Fetches page data via `GET /api/pages`
3. Renders appropriate view based on response

## 3. Component Structure

```
/app (Astro Page)
└── AppShell (Astro wrapper component)
    ├── AppHeader (React)
    │   └── Logout button
    └── AdminDashboard (React - main container)
        ├── PageSettingsCard (React)
        │   ├── URL Management Section
        │   │   ├── Input (Shadcn)
        │   │   ├── Button (Shadcn) - Update URL
        │   │   └── LinkPreview (React)
        │   └── Theme Management Section
        │       ├── Select (Shadcn)
        │       └── Button (Shadcn) - Save Theme
        ├── PageContentCard (React)
        │   ├── Button (Shadcn) - Download Template
        │   ├── Button (Shadcn) - Download Current YAML
        │   ├── FileUploadButton (React) - Upload YAML
        │   └── ErrorList (React)
        └── ProjectsCard (React)
            ├── Button (Shadcn) - New Project
            ├── ProjectList (React)
            │   └── ProjectListItem[] (React)
            │       ├── InlineEditText (React)
            │       ├── FileUploadButton (React)
            │       ├── Button (Shadcn) - Download YAML
            │       ├── ReorderControls (React)
            │       └── Button (Shadcn) - Delete
            └── Button (Shadcn) - Save Order

Global/Modal Components:
├── CreateProjectModal (React)
│   ├── Modal (Shadcn Dialog)
│   ├── Input (Shadcn)
│   └── Button (Shadcn)
├── ConfirmDialog (React)
│   ├── Dialog (Shadcn)
│   └── Button group (Shadcn)
└── Toast System (via hook)
```

## 4. Component Details

### AppHeader

**Component Description:**
Global header component providing branding and user account actions. Displays the application logo/name and a logout button. Remains consistent across all authenticated views.

**Main Elements:**
- `<header>` with navigation role
- Brand/logo element (link to `/`)
- Logout button with icon

**Handled Interactions:**
- Logout click → Triggers Supabase `signOut()` → Redirects to `/`

**Validation Conditions:**
None required

**Required Types:**
```typescript
interface AppHeaderProps {
  // No props needed - uses Supabase context
}
```

**Props:**
None (or minimal styling props if needed)

---

### AdminDashboard

**Component Description:**
Root container component for the dashboard that orchestrates data fetching and manages the overall layout. Fetches initial page and project data, handles loading and error states, and distributes data to child card components.

**Main Elements:**
- `<main>` wrapper with semantic HTML
- Loading spinner (during initial fetch)
- Error message display (if fetch fails)
- Three card containers (Page Settings, Page Content, Projects)

**Handled Interactions:**
- Component mount → Fetch page and projects data
- Manual refresh trigger (optional refresh button)

**Validation Conditions:**
- Verify `GET /api/pages` returns 200 (handled by routing logic)
- Handle authentication check (should be pre-verified by middleware)

**Required Types:**
```typescript
interface AdminDashboardProps {
  initialPage: PageDto; // Pre-fetched by Astro
}

interface DashboardState {
  page: PageDto;
  projects: ProjectDto[];
  isLoading: boolean;
  error: string | null;
}
```

**Props:**
- `initialPage: PageDto` - Page data from Astro parent

---

### PageSettingsCard

**Component Description:**
Card component managing page configuration including URL slug and theme selection. Displays the current settings, provides inputs for changes, and shows the public page URL. Each setting (URL and theme) has its own update action with independent loading states.

**Main Elements:**
- `<section>` with Card component wrapper
- Card header with title "Page Settings"
- URL section:
  - Label "Page URL"
  - Input field (controlled)
  - "Update URL" button
  - LinkPreview component
  - Error message area
- Theme section:
  - Label "Theme"
  - Select dropdown (controlled)
  - "Save Theme" button
  - Error message area

**Handled Interactions:**
1. **URL Update:**
   - User types in URL input (updates local state)
   - User clicks "Update URL"
   - Calls `POST /api/pages/url`
   - On success: Updates page state, shows toast, updates LinkPreview
   - On error: Displays inline error message

2. **Theme Change:**
   - User selects theme from dropdown
   - User clicks "Save Theme" (or can auto-save)
   - Calls `PUT /api/pages`
   - On success: Updates page state, shows toast
   - On error: Displays inline error message

**Validation Conditions:**
- **Server-side validation (displayed on error):**
  - URL format validation (400 if invalid)
  - URL uniqueness (409 if taken)
  - Reserved words (400 if reserved)

- **Theme validation:**
  - Must be one of available themes (constrained by dropdown)

**Required Types:**
```typescript
interface PageSettingsCardProps {
  page: PageDto;
  onPageUpdate: (updatedPage: PageDto) => void;
}

interface PageSettingsState {
  localUrl: string;
  localTheme: string;
  isUpdatingUrl: boolean;
  isUpdatingTheme: boolean;
  urlError: string | null;
  themeError: string | null;
}
```

**Props:**
- `page: PageDto` - Current page configuration
- `onPageUpdate: (updatedPage: PageDto) => void` - Callback when page is successfully updated

---

### LinkPreview

**Component Description:**
Displays the full public page URL and provides a copy-to-clipboard action. Shows the URL in a read-only format with visual indication when copied.

**Main Elements:**
- `<div>` container with URL display
- Copy button with icon
- "Open in new tab" link
- Success indicator (temporary, after copy)

**Handled Interactions:**
- Copy button click → Uses `navigator.clipboard.writeText()` → Shows "Copied!" feedback
- Open link click → Opens public page in new tab

**Validation Conditions:**
None

**Required Types:**
```typescript
interface LinkPreviewProps {
  url: string; // The user's URL slug
  baseUrl: string; // e.g., "https://example.com/page"
}
```

**Props:**
- `url: string` - User's page URL slug
- `baseUrl: string` - Base domain for constructing full URL

---

### PageContentCard

**Component Description:**
Card component managing YAML content for the main personal page. Provides three actions: download template, download current configuration, and upload new YAML data. Displays validation errors returned from YAML upload attempts.

**Main Elements:**
- `<section>` with Card wrapper
- Card header "Page Content"
- Button group:
  - "Download Template" button
  - "Download Current YAML" button
- FileUploadButton for YAML upload
- ErrorList component (conditional, shown only when upload errors exist)
- Helper text explaining YAML workflow

**Handled Interactions:**
1. **Download Template:**
   - User clicks "Download Template"
   - Triggers `GET /api/templates/page`
   - Browser downloads `page-template.yaml`

2. **Download Current YAML:**
   - User clicks "Download Current YAML"
   - Triggers `GET /api/pages/data`
   - Browser downloads `page.yaml`

3. **Upload YAML:**
   - User clicks FileUploadButton
   - File picker opens (filtered to .yaml files)
   - User selects file
   - File content read as text
   - Calls `POST /api/pages/data` with `{ data: fileContent }`
   - On success (200): Shows toast "Page data updated successfully", clears errors
   - On error (400): Populates ErrorList with validation details

**Validation Conditions:**
- **Client-side:**
  - File must be readable
  - File extension should be .yaml or .yml (filter in file picker)

- **Server-side (errors displayed in ErrorList):**
  - Valid YAML syntax
  - Required fields present: `name`, `bio`
  - Field types match schema (strings, arrays, etc.)
  - Example error: `"bio: This field is required but was not found"`

**Required Types:**
```typescript
interface PageContentCardProps {
  userId: string; // For API calls
}

interface PageContentState {
  isUploading: boolean;
  uploadErrors: ValidationErrorDetail[] | null;
}
```

**Props:**
- `userId: string` - Current user ID (implicit from auth context)

---

### FileUploadButton

**Component Description:**
Reusable button component that handles file selection, reading, and upload with integrated loading and error states. Accepts a callback for the upload operation.

**Main Elements:**
- Hidden `<input type="file">` with ref
- Visible `<button>` that triggers file input
- Loading spinner (shown during upload)
- Children content (button label)

**Handled Interactions:**
- Button click → Opens file picker
- File selected → Reads file content → Calls `onUpload` callback
- During upload: Shows spinner, disables button
- On completion: Re-enables button

**Validation Conditions:**
- File must be readable by FileReader
- Optionally check file extension matches `accept` prop

**Required Types:**
```typescript
interface FileUploadButtonProps {
  onUpload: (fileContent: string) => Promise<void>;
  accept?: string; // e.g., ".yaml,.yml"
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}
```

**Props:**
- `onUpload: (fileContent: string) => Promise<void>` - Async callback with file content
- `accept?: string` - File type filter for picker
- `disabled?: boolean` - External disable state
- `children: React.ReactNode` - Button label/content

---

### ErrorList

**Component Description:**
Displays a list of validation errors returned from the API. Each error shows the field name and the specific issue. Used for YAML upload validation feedback.

**Main Elements:**
- `<div>` with `role="alert"` and `aria-live="polite"`
- Header: "Validation Errors" or "Please fix the following:"
- `<ul>` list of errors
- Each `<li>` displays: `{field}: {issue}`
- Optional "Clear" or dismiss button

**Handled Interactions:**
- Display on render
- Optional: User clicks "Clear" → Callback to parent to clear error state

**Validation Conditions:**
None (display only)

**Required Types:**
```typescript
interface ErrorListProps {
  errors: ValidationErrorDetail[];
  onClear?: () => void;
}
```

**Props:**
- `errors: ValidationErrorDetail[]` - Array of field-level errors from API
- `onClear?: () => void` - Optional callback to clear errors

---

### ProjectsCard

**Component Description:**
Card component managing the user's project list. Provides project creation, inline editing, reordering, and bulk operations. Maintains local state for project order changes before persisting to server.

**Main Elements:**
- `<section>` with Card wrapper
- Card header "Projects" with project count
- "New Project" button (opens CreateProjectModal)
- ProjectList component with reorderable items
- "Save Order" button (enabled only when order changes exist)
- Empty state message (if no projects)

**Handled Interactions:**
1. **New Project:**
   - User clicks "New Project"
   - Opens CreateProjectModal
   - On modal success: Refreshes project list, shows toast

2. **Save Order:**
   - User clicks "Save Order" (enabled when hasOrderChanges is true)
   - Calls `PUT /api/projects/reorder` with all project order data
   - On success: Resets hasOrderChanges, shows toast
   - On error: Displays error, preserves local state for retry

3. **Child Interactions:**
   - Reorder up/down from ProjectListItem → Updates local projects array
   - Delete from ProjectListItem → Removes from list after confirmation
   - Update from ProjectListItem → Updates project in list

**Validation Conditions:**
- **Reorder operation:**
  - All projects must have valid display_order (non-negative integers)
  - No duplicate display_order values (enforced by up/down logic)
  - At least one project must exist to reorder

**Required Types:**
```typescript
interface ProjectsCardProps {
  initialProjects: ProjectDto[];
  userId: string;
}

interface ProjectsCardState {
  localProjects: ProjectDto[]; // Working array for reordering
  serverProjects: ProjectDto[]; // Source of truth from server
  hasOrderChanges: boolean;
  isSavingOrder: boolean;
  isCreateModalOpen: boolean;
}
```

**Props:**
- `initialProjects: ProjectDto[]` - Initial project list from parent
- `userId: string` - Current user ID for API calls

---

### ProjectListItem

**Component Description:**
Individual project item component with inline editing, YAML management, reordering controls, and delete action. Maintains its own loading and error states for operations.

**Main Elements:**
- `<div>` or `<li>` container with project data
- InlineEditText component for project name
- FileUploadButton for project YAML upload
- "Download YAML" button
- ReorderControls component (up/down arrows)
- "Delete" button
- ErrorList (conditional, for YAML upload errors)
- Loading spinners for async operations

**Handled Interactions:**
1. **Edit Name:**
   - User clicks edit icon or project name
   - InlineEditText switches to input mode
   - User types new name
   - User presses Enter or clicks save
   - Calls `PUT /api/projects/{id}` with `{ project_name }`
   - On success: Updates local name, shows toast, exits edit mode
   - On error: Shows inline error, remains in edit mode

2. **Upload YAML:**
   - User clicks FileUploadButton
   - File picker opens
   - User selects file
   - Calls `POST /api/projects/{id}/data` with `{ data: fileContent }`
   - On success (200): Shows toast, clears any previous errors
   - On error (400): Displays ErrorList with validation details

3. **Download YAML:**
   - User clicks "Download YAML"
   - Calls `GET /api/projects/{id}/data`
   - Browser downloads `{project_id}.yaml`

4. **Reorder:**
   - User clicks up arrow → Calls `onReorderUp` callback
   - User clicks down arrow → Calls `onReorderDown` callback
   - Parent updates local array order
   - No API call until "Save Order" clicked in parent

5. **Delete:**
   - User clicks "Delete"
   - ConfirmDialog opens: "Delete {project_name}?"
   - User confirms → Calls `DELETE /api/projects/{id}`
   - On success (204): Calls `onDelete` callback, shows toast
   - On error: Shows error in dialog

**Validation Conditions:**
- **Name edit:**
  - All validation handled server-side
  - Server returns 400 error for invalid names

- **YAML upload:**
  - Client: File must be readable, correct extension (.yaml, .yml)
  - Server: Valid YAML, required fields (`name`, `description`)

- **Reorder:**
  - Disable up arrow if first in list
  - Disable down arrow if last in list

**Required Types:**
```typescript
interface ProjectListItemProps {
  project: ProjectDto;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onReorderUp: () => void;
  onReorderDown: () => void;
  onUpdate: (updatedProject: ProjectDto) => void;
  onDelete: (projectId: string) => void;
}

interface ProjectListItemState {
  isEditingName: boolean;
  localName: string;
  isUpdatingName: boolean;
  isUploadingYaml: boolean;
  uploadErrors: ValidationErrorDetail[] | null;
  showDeleteConfirm: boolean;
}
```

**Props:**
- `project: ProjectDto` - Project data
- `canMoveUp: boolean` - Whether up arrow should be enabled
- `canMoveDown: boolean` - Whether down arrow should be enabled
- `onReorderUp: () => void` - Callback when user clicks up
- `onReorderDown: () => void` - Callback when user clicks down
- `onUpdate: (updatedProject: ProjectDto) => void` - Callback when project updated
- `onDelete: (projectId: string) => void` - Callback when project deleted

---

### InlineEditText

**Component Description:**
Reusable component for inline text editing with accessible keyboard interactions. Displays text as a button when not editing, switches to input field when activated.

**Main Elements:**
- View mode: `<button>` displaying text with edit icon
- Edit mode: `<input>` field with save/cancel buttons or keyboard shortcuts

**Handled Interactions:**
- Click or Enter on button → Enter edit mode, focus input
- Type in input → Update local state
- Enter key → Save changes
- Save button click → Save changes
- Escape key → Cancel, revert to original
- Blur → No action (remains in edit mode)

**Validation Conditions:**
- Passed via props (e.g., max length, required)

**Required Types:**
```typescript
interface InlineEditTextProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
  aria-label?: string;
}
```

**Props:**
- `value: string` - Current text value
- `onSave: (newValue: string) => Promise<void>` - Async save callback
- `placeholder?: string` - Placeholder for input
- `maxLength?: number` - Maximum character length
- `required?: boolean` - Whether value is required
- `aria-label?: string` - Accessibility label

---

### ReorderControls

**Component Description:**
Simple component with up and down arrow buttons for reordering list items. Handles disabled states when at list boundaries.

**Main Elements:**
- Container `<div>` with button group
- Up arrow button with aria-label
- Down arrow button with aria-label

**Handled Interactions:**
- Up arrow click → Calls `onMoveUp` callback
- Down arrow click → Calls `onMoveDown` callback

**Validation Conditions:**
- Up button disabled when `!canMoveUp`
- Down button disabled when `!canMoveDown`

**Required Types:**
```typescript
interface ReorderControlsProps {
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  itemLabel: string; // For aria-label context
}
```

**Props:**
- `canMoveUp: boolean` - Enable up button
- `canMoveDown: boolean` - Enable down button
- `onMoveUp: () => void` - Up callback
- `onMoveDown: () => void` - Down callback
- `itemLabel: string` - Item name for aria-label (e.g., "Move Project X up")

---

### CreateProjectModal

**Component Description:**
Modal dialog for creating a new project. Captures project name and automatically computes display_order as max + 1. Includes focus trapping and keyboard navigation.

**Main Elements:**
- Shadcn Dialog component (modal overlay + content)
- Dialog header: "Create New Project"
- Form with:
  - Label + Input for project name
  - Helper text explaining display_order is automatic
  - Error message area
- Dialog footer with:
  - "Cancel" button
  - "Create" button (primary)

**Handled Interactions:**
- Modal opens → Focus trapped, first input focused
- User types project name → Updates local state
- User clicks "Create" or presses Enter:
  - Validates name (required, max 100 chars)
  - Computes `display_order = maxDisplayOrder + 1`
  - Calls `POST /api/projects` with `{ project_name, display_order }`
  - On success (201): Calls `onCreate` callback with new project, closes modal, shows toast
  - On error: Displays inline error in modal
- User clicks "Cancel" or presses Escape → Closes modal, no action
- Modal closes → Returns focus to trigger button

**Validation Conditions:**
- **Project name:**
  - All validation handled server-side
  - Server returns 400 error for invalid names

- **Display order:**
  - Computed automatically: `Math.max(...existingOrders, -1) + 1`
  - User does not input this value

**Required Types:**
```typescript
interface CreateProjectModalProps {
  isOpen: boolean;
  maxDisplayOrder: number; // Current max display_order in project list
  onClose: () => void;
  onCreate: (newProject: ProjectCreateResponseDto) => void;
}

interface CreateProjectModalState {
  projectName: string;
  isCreating: boolean;
  error: string | null;
}
```

**Props:**
- `isOpen: boolean` - Modal open state
- `maxDisplayOrder: number` - Current max display_order for computing new order
- `onClose: () => void` - Callback when modal closes (cancel)
- `onCreate: (newProject: ProjectCreateResponseDto) => void` - Callback with created project

---

### ConfirmDialog

**Component Description:**
Reusable confirmation dialog for destructive actions. Displays a warning message and requires explicit user confirmation.

**Main Elements:**
- Shadcn AlertDialog component
- Dialog header with title (e.g., "Delete Project?")
- Dialog body with message (e.g., "This action cannot be undone")
- Dialog footer with:
  - "Cancel" button (default focus)
  - "Confirm" button (danger style, e.g., red)

**Handled Interactions:**
- User clicks confirm → Calls `onConfirm` callback, closes dialog
- User clicks cancel or Escape → Calls `onCancel` callback, closes dialog
- Focus management: Focus "Cancel" by default for safety

**Validation Conditions:**
None

**Required Types:**
```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string; // Default: "Confirm"
  cancelLabel?: string; // Default: "Cancel"
  onConfirm: () => void;
  onCancel: () => void;
}
```

**Props:**
- `isOpen: boolean` - Dialog open state
- `title: string` - Dialog title
- `message: string` - Warning message
- `confirmLabel?: string` - Confirm button text
- `cancelLabel?: string` - Cancel button text
- `onConfirm: () => void` - Confirm callback
- `onCancel: () => void` - Cancel callback

## 5. Types

### Existing Types (from `src/types.ts`)

These types are already defined and should be imported:

```typescript
// Page DTOs
export type PageDto = Pick<PageEntity, "user_id" | "url" | "theme" | "created_at" | "updated_at">;
export type PageCreateResponseDto = Pick<PageEntity, "user_id" | "url" | "theme">;

// Page Commands
export interface CreatePageCommand {
  url: string;
  theme: string;
  data?: string;
}

export interface UpdatePageThemeCommand {
  theme: string;
}

export interface UpdatePageUrlCommand {
  url: string;
}

export interface UpdatePageDataCommand {
  data: string;
}

// Project DTOs
export type ProjectDto = Pick<ProjectEntity, "user_id" | "project_id" | "project_name" | "display_order">;
export type ProjectCreateResponseDto = Pick<ProjectEntity, "user_id" | "project_id" | "project_name" | "display_order" | "created_at" | "updated_at">;

// Project Commands
export interface CreateProjectCommand {
  project_name: string;
  display_order: number;
}

export interface UpdateProjectNameCommand {
  project_name: string;
}

export interface UpdateProjectDataCommand {
  data: string;
}

export interface ReorderProjectsCommand {
  project_orders: ProjectOrderEntry[];
}

export interface ProjectOrderEntry {
  project_id: string;
  display_order: number;
}

// Error Types
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: ValidationErrorDetail[];
  };
}

export interface ValidationErrorDetail {
  field: string;
  issue: string;
}
```

### New Types Required for View Implementation

Create these types in a new file `src/components/dashboard/dashboard.types.ts`:

```typescript
import type { PageDto, ProjectDto, ValidationErrorDetail } from "@/types";

/**
 * Overall dashboard data state
 * Managed by AdminDashboard component
 */
export interface DashboardState {
  page: PageDto;
  projects: ProjectDto[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Local state for project reordering
 * Tracks changes before persisting to server
 */
export interface ProjectOrderState {
  projects: ProjectDto[];
  hasChanges: boolean;
}

/**
 * Generic operation state for async actions
 * Used for buttons, forms, and other interactive elements
 */
export interface OperationState {
  isLoading: boolean;
  error: string | null;
}

/**
 * File upload state with validation errors
 */
export interface FileUploadState {
  isUploading: boolean;
  errors: ValidationErrorDetail[] | null;
}

/**
 * Modal management state
 */
export interface ModalState {
  isOpen: boolean;
  mode?: 'create' | 'edit' | 'delete';
  targetId?: string;
}

/**
 * Component Props Interfaces
 */

export interface AdminDashboardProps {
  initialPage: PageDto;
}

export interface PageSettingsCardProps {
  page: PageDto;
  onPageUpdate: (updatedPage: PageDto) => void;
}

export interface LinkPreviewProps {
  url: string;
  baseUrl: string;
}

export interface PageContentCardProps {
  userId: string;
}

export interface ProjectsCardProps {
  initialProjects: ProjectDto[];
  userId: string;
}

export interface ProjectListItemProps {
  project: ProjectDto;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onReorderUp: () => void;
  onReorderDown: () => void;
  onUpdate: (updatedProject: ProjectDto) => void;
  onDelete: (projectId: string) => void;
}

export interface CreateProjectModalProps {
  isOpen: boolean;
  maxDisplayOrder: number;
  onClose: () => void;
  onCreate: (newProject: ProjectCreateResponseDto) => void;
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface FileUploadButtonProps {
  onUpload: (fileContent: string) => Promise<void>;
  accept?: string;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export interface ErrorListProps {
  errors: ValidationErrorDetail[];
  onClear?: () => void;
}

export interface InlineEditTextProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
  'aria-label'?: string;
}

export interface ReorderControlsProps {
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  itemLabel: string;
}

/**
 * API Response Helpers
 */

// Helper type for checking error responses
export function isErrorResponse(data: any): data is ErrorResponse {
  return data && typeof data === 'object' && 'error' in data;
}

// Helper type for extracting validation errors
export function getValidationErrors(response: ErrorResponse): ValidationErrorDetail[] {
  return response.error.details || [];
}
```

## 6. State Management

State management follows React best practices with local component state and custom hooks for shared logic. No global state management library (Redux, Zustand) is required for the MVP.

### Data Fetching Strategy

**Initial Load:**
1. Astro page (`/app`) performs server-side fetch of `GET /api/pages` to determine routing
2. If 200, page data is passed as prop to AdminDashboard React component
3. AdminDashboard fetches projects client-side via `GET /api/projects` on mount

**Refetching:**
- After mutations (create, update, delete), refetch affected data
- Use React state updates to trigger re-renders
- No caching layer needed for MVP (future: React Query)

### Custom Hooks

#### `useDashboardData(initialPage: PageDto)`

**Purpose:** Centralize dashboard data fetching and management

**Implementation:**
```typescript
function useDashboardData(initialPage: PageDto) {
  const [page, setPage] = useState<PageDto>(initialPage);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return {
    page,
    setPage,
    projects,
    setProjects,
    isLoading,
    error,
    refetchProjects: fetchProjects,
  };
}
```

**Usage:** Called in AdminDashboard to manage all dashboard data

---

#### `useToast()`

**Purpose:** Display toast notifications for success/error messages

**Implementation:**
```typescript
function useToast() {
  // Can use Shadcn's toast or custom implementation
  const { toast } = useToast(); // from Shadcn

  const showSuccess = (message: string) => {
    toast({
      title: "Success",
      description: message,
      variant: "default",
    });
  };

  const showError = (message: string) => {
    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
  };

  return { showSuccess, showError };
}
```

**Usage:** Called in components that perform mutations

---

#### `useFileUpload(apiCall: (data: string) => Promise<void>)`

**Purpose:** Handle file reading and upload with error handling

**Implementation:**
```typescript
function useFileUpload(apiCall: (data: string) => Promise<void>) {
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrorDetail[] | null>(null);

  const upload = async (file: File) => {
    try {
      setIsUploading(true);
      setErrors(null);

      const content = await readFileAsText(file);
      await apiCall(content);

      // Success handled by caller (toast)
    } catch (err) {
      if (isErrorResponse(err)) {
        setErrors(getValidationErrors(err));
      } else {
        throw err; // Re-throw for caller to handle
      }
    } finally {
      setIsUploading(false);
    }
  };

  const clearErrors = () => setErrors(null);

  return { upload, isUploading, errors, clearErrors };
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
```

**Usage:** Used in FileUploadButton component

---

#### `useProjectReorder(initialProjects: ProjectDto[])`

**Purpose:** Manage local project order changes before persisting

**Implementation:**
```typescript
function useProjectReorder(initialProjects: ProjectDto[]) {
  const [localProjects, setLocalProjects] = useState(initialProjects);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync when server data changes
  useEffect(() => {
    setLocalProjects(initialProjects);
    setHasChanges(false);
  }, [initialProjects]);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newProjects = [...localProjects];
    [newProjects[index - 1], newProjects[index]] = [newProjects[index], newProjects[index - 1]];
    // Update display_order to match new positions
    newProjects.forEach((proj, idx) => {
      proj.display_order = idx;
    });
    setLocalProjects(newProjects);
    setHasChanges(true);
  };

  const moveDown = (index: number) => {
    if (index === localProjects.length - 1) return;
    const newProjects = [...localProjects];
    [newProjects[index], newProjects[index + 1]] = [newProjects[index + 1], newProjects[index]];
    newProjects.forEach((proj, idx) => {
      proj.display_order = idx;
    });
    setLocalProjects(newProjects);
    setHasChanges(true);
  };

  const save = async () => {
    const project_orders = localProjects.map(p => ({
      project_id: p.project_id,
      display_order: p.display_order,
    }));

    const response = await fetch('/api/projects/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_orders }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    setHasChanges(false);
  };

  const reset = () => {
    setLocalProjects(initialProjects);
    setHasChanges(false);
  };

  return {
    projects: localProjects,
    hasChanges,
    moveUp,
    moveDown,
    save,
    reset,
  };
}
```

**Usage:** Used in ProjectsCard to manage reordering

### Component-Level State

Each component maintains its own operation states:

**PageSettingsCard:**
- `localUrl: string` - Controlled input value
- `localTheme: string` - Controlled select value
- `isUpdatingUrl: boolean` - Loading state for URL update
- `isUpdatingTheme: boolean` - Loading state for theme update
- `urlError: string | null` - Inline error for URL update

**PageContentCard:**
- Delegates upload state to `useFileUpload` hook
- Manages visibility of ErrorList based on upload errors

**ProjectsCard:**
- Delegates reorder state to `useProjectReorder` hook
- `isCreateModalOpen: boolean` - Modal visibility
- `isSavingOrder: boolean` - Loading state for save order button

**ProjectListItem:**
- `isEditingName: boolean` - Inline edit mode
- `localName: string` - Input value during edit
- `isUpdatingName: boolean` - Loading state for name update
- `showDeleteConfirm: boolean` - Confirmation dialog visibility
- Delegates YAML upload to `useFileUpload` hook

## 7. API Integration

All API calls use native `fetch` with proper error handling. Responses follow the documented API structure from the endpoints.

### API Call Patterns

#### Successful Response Handling
```typescript
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

if (!response.ok) {
  const errorData = await response.json();
  throw errorData; // ErrorResponse structure
}

const data = await response.json();
// Use data according to endpoint response type
```

#### Error Response Handling
```typescript
try {
  // API call
} catch (err) {
  if (isErrorResponse(err)) {
    // Handle structured API error
    if (err.error.code === 'VALIDATION_ERROR') {
      setErrors(err.error.details || []);
    } else {
      showError(err.error.message);
    }
  } else {
    // Handle network or unexpected errors
    showError('An unexpected error occurred');
  }
}
```

### Endpoint Integration Details

#### GET /api/pages
**When:** Initial dashboard load (Astro server-side or React client-side refetch)
**Request:** None
**Response:** `PageDto`
**Usage:**
```typescript
const response = await fetch('/api/pages');
const page: PageDto = await response.json();
```

#### PUT /api/pages
**When:** User changes theme
**Request:** `UpdatePageThemeCommand`
**Response:** `PageCreateResponseDto`
**Usage:**
```typescript
const response = await fetch('/api/pages', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ theme: newTheme }),
});
const updatedPage: PageCreateResponseDto = await response.json();
```

#### POST /api/pages/url
**When:** User updates page URL
**Request:** `UpdatePageUrlCommand`
**Response:** `{ message: string, url: string }`
**Usage:**
```typescript
const response = await fetch('/api/pages/url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: newUrl }),
});
const result = await response.json();
// result.url contains the updated URL
```

#### POST /api/pages/data
**When:** User uploads page YAML
**Request:** `UpdatePageDataCommand`
**Response:** `{ message: string }`
**Error:** 400 with `ValidationErrorDetail[]` in `error.details`
**Usage:**
```typescript
const response = await fetch('/api/pages/data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ data: yamlContent }),
});

if (response.status === 400) {
  const error: ErrorResponse = await response.json();
  // error.error.details contains validation errors
}
```

#### GET /api/pages/data
**When:** User downloads current page YAML
**Request:** None
**Response:** YAML file (Content-Disposition: attachment)
**Usage:**
```typescript
// Trigger download by navigating or using anchor
window.location.href = '/api/pages/data';
// Or use fetch and create blob URL for download
```

#### GET /api/projects
**When:** Dashboard mount, after project mutations
**Request:** None
**Response:** `ProjectDto[]`
**Usage:**
```typescript
const response = await fetch('/api/projects');
const projects: ProjectDto[] = await response.json();
```

#### POST /api/projects
**When:** User creates new project
**Request:** `CreateProjectCommand`
**Response:** `ProjectCreateResponseDto`
**Usage:**
```typescript
const displayOrder = Math.max(...projects.map(p => p.display_order), -1) + 1;
const response = await fetch('/api/projects', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    project_name: name,
    display_order: displayOrder,
  }),
});
const newProject: ProjectCreateResponseDto = await response.json();
```

#### PUT /api/projects/{project_id}
**When:** User renames project
**Request:** `UpdateProjectNameCommand`
**Response:** `ProjectDto`
**Usage:**
```typescript
const response = await fetch(`/api/projects/${projectId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ project_name: newName }),
});
const updatedProject: ProjectDto = await response.json();
```

#### DELETE /api/projects/{project_id}
**When:** User deletes project (after confirmation)
**Request:** None
**Response:** 204 No Content
**Usage:**
```typescript
const response = await fetch(`/api/projects/${projectId}`, {
  method: 'DELETE',
});
// No response body for 204
```

#### PUT /api/projects/reorder
**When:** User clicks "Save Order" after reordering
**Request:** `ReorderProjectsCommand`
**Response:** `{}` (empty object)
**Usage:**
```typescript
const response = await fetch('/api/projects/reorder', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    project_orders: projects.map(p => ({
      project_id: p.project_id,
      display_order: p.display_order,
    })),
  }),
});
```

#### POST /api/projects/{project_id}/data
**When:** User uploads project YAML
**Request:** `UpdateProjectDataCommand`
**Response:** `{ message: string }`
**Error:** 400 with `ValidationErrorDetail[]`
**Usage:**
```typescript
const response = await fetch(`/api/projects/${projectId}/data`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ data: yamlContent }),
});
```

#### GET /api/projects/{project_id}/data
**When:** User downloads project YAML
**Request:** None
**Response:** YAML file
**Usage:**
```typescript
window.location.href = `/api/projects/${projectId}/data`;
```

#### GET /api/templates/{type}
**When:** User downloads template (type = "page" or "project")
**Request:** None
**Response:** YAML template file
**Usage:**
```typescript
window.location.href = '/api/templates/page';
// or
window.location.href = '/api/templates/project';
```

### Authentication Handling

All requests automatically include Supabase session cookies (handled by Astro middleware). If a 401 response is received:

```typescript
if (response.status === 401) {
  // Session expired, redirect to login
  window.location.href = '/';
  return;
}
```

## 8. User Interactions

### Page Settings Interactions

**Update URL:**
1. User types in URL input (controlled, updates `localUrl` state)
2. User clicks "Update URL" button
3. Button disables, spinner shows
4. POST request to `/api/pages/url`
5. **Success:** Page state updated, LinkPreview updates, success toast, button re-enables
6. **Error (400 - invalid format):** Inline error displays message from API (e.g., "URL format invalid")
7. **Error (409 - conflict):** Inline error "This URL is already taken"
8. **Error (400 - reserved):** Inline error "This URL is reserved and cannot be used"

**Change Theme:**
1. User selects theme from dropdown (controlled, updates `localTheme` state)
2. User clicks "Save Theme" button (or auto-save on change)
3. Button disables, spinner shows
4. PUT request to `/api/pages`
5. **Success:** Page state updated, success toast "Theme updated successfully", button re-enables
6. **Error:** Inline error with message from API

**Copy Public Link:**
1. User clicks copy icon in LinkPreview
2. `navigator.clipboard.writeText(fullUrl)`
3. Success: Brief "Copied!" message or icon change
4. Error: Fallback to select text approach or show error

**Open Public Page:**
1. User clicks "Open" link in LinkPreview
2. Opens `/page/{url}` in new tab
3. No state change in dashboard

### Page Content Interactions

**Download Template:**
1. User clicks "Download Template" button
2. Button shows brief loading state
3. Browser navigates to `/api/templates/page` or uses fetch + blob download
4. `page-template.yaml` file downloads
5. No toast needed (download is implicit feedback)

**Download Current YAML:**
1. User clicks "Download Current YAML" button
2. Button shows brief loading state
3. Browser navigates to `/api/pages/data` or uses fetch + blob download
4. `page.yaml` file downloads with current page data
5. No toast needed

**Upload Page YAML:**
1. User clicks FileUploadButton
2. File picker opens (filtered to `.yaml, .yml`)
3. User selects file
4. FileReader reads file content as text
5. Button disables, spinner shows, previous errors cleared
6. POST request to `/api/pages/data` with `{ data: fileContent }`
7. **Success (200):** Success toast "Page data updated successfully", button re-enables, errors remain cleared
8. **Error (400 - validation):** ErrorList populates with field-level errors from `response.error.details`, button re-enables
9. **Error (other):** Generic error toast, button re-enables

### Project Management Interactions

**Create New Project:**
1. User clicks "New Project" button in ProjectsCard
2. CreateProjectModal opens, focus moves to project name input
3. User types project name (controlled input)
4. User clicks "Create" or presses Enter
5. Modal "Create" button disables, spinner shows
6. Compute `display_order = Math.max(...projects.map(p => p.display_order), -1) + 1`
7. POST request to `/api/projects` with `{ project_name, display_order }`
8. **Success (201):** Modal closes, focus returns to "New Project" button, projects list refreshed (refetch or optimistic add), success toast "Project created successfully"
9. **Error (400):** Inline error in modal displays message from API, stays open for correction
10. **Error (404 - no page):** Error "Cannot create project: You must create a main page first" (should not occur if routed correctly)

**Reorder Projects:**
1. User clicks up arrow on ProjectListItem (not first item)
2. `onReorderUp` callback triggered
3. ProjectsCard updates local `projects` array (swap with previous item)
4. Update `display_order` values to match array indices
5. Set `hasChanges = true`, "Save Order" button enables and highlights
6. Repeat for additional reorder operations (all local, no API calls)
7. User clicks "Save Order"
8. Button disables, spinner shows
9. PUT request to `/api/projects/reorder` with all project order data
10. **Success (200):** `hasChanges = false`, "Save Order" button disables, success toast "Project order saved"
11. **Error:** Inline error displayed, `hasChanges` remains true, button re-enables, user can retry

**Edit Project Name:**
1. ProjectListItem displays project name with edit icon
2. User clicks name or edit icon
3. InlineEditText switches to input mode, input focused, previous name selected
4. User types new name (local state)
5. User presses Enter or clicks save icon
6. Input disables, spinner shows
7. PUT request to `/api/projects/{id}` with `{ project_name: newName }`
8. **Success (200):** Project updated in local state, InlineEditText exits edit mode, success toast "Project renamed"
9. **Error (400):** Inline error near input displays message from API, remains in edit mode for correction
10. User can press Escape to cancel and revert to original name

**Upload Project YAML:**
1. User clicks "Upload YAML" FileUploadButton in ProjectListItem
2. File picker opens (filtered to `.yaml, .yml`)
3. User selects file
4. FileReader reads file content
5. Button disables, spinner shows, previous errors cleared
6. POST request to `/api/projects/{id}/data` with `{ data: fileContent }`
7. **Success (200):** Success toast "Project data updated successfully", button re-enables, errors remain cleared
8. **Error (400 - validation):** ErrorList in ProjectListItem populates with field errors, button re-enables
9. **Error (other):** Generic error toast, button re-enables

**Download Project YAML:**
1. User clicks "Download YAML" button in ProjectListItem
2. Button shows brief loading state
3. Browser navigates to `/api/projects/{id}/data` or uses fetch + blob
4. `{project_id}.yaml` file downloads
5. No toast needed

**Delete Project:**
1. User clicks "Delete" button in ProjectListItem
2. ConfirmDialog opens: "Delete {project_name}?"
3. Dialog message: "This action cannot be undone. The project and all its data will be permanently deleted."
4. Focus trapped in dialog, "Cancel" button focused by default
5. User clicks "Confirm" or "Cancel"
6. **If Cancel or Escape:** Dialog closes, no action, focus returns to Delete button
7. **If Confirm:**
   - Dialog "Confirm" button disables, spinner shows
   - DELETE request to `/api/projects/{id}`
   - **Success (204):** Dialog closes, project removed from local list, success toast "Project deleted", focus returns to main content
   - **Error:** Error displayed in dialog, can retry or cancel

## 9. Conditions and Validation

### Client-Side Validation

Minimal client-side validation is performed. All data content validation is handled server-side. The client only validates file readability and enforces UI boundaries.

#### File Extension and Readability (FileUploadButton)
**Condition:** File extension is `.yaml` or `.yml` and file must be readable
**Validation:**
- File picker filtered with `accept=".yaml,.yml"` attribute
- FileReader attempts to read file content
**UI Feedback:**
- File picker pre-filters to YAML files
- If file cannot be read: Show error "Could not read file. Please try again with a different file."

#### Reorder Boundaries (ReorderControls)
**Condition:** Cannot move first item up or last item down
**Validation:**
```typescript
const canMoveUp = index > 0;
const canMoveDown = index < projects.length - 1;
```
**UI Feedback:**
- Disable up arrow if first item
- Disable down arrow if last item
- Aria-label indicates disabled state

### Server-Side Validation

Validation performed by the API; errors are displayed in the UI.

#### Page URL (POST /api/pages/url)
**Conditions:**
- Format matches required pattern (server-side validation)
- URL not already taken by another user (409 Conflict)
- URL not in reserved list (400 Bad Request)

**Error Handling:**
```typescript
try {
  // API call
} catch (err) {
  if (isErrorResponse(err)) {
    switch (err.error.code) {
      case 'VALIDATION_ERROR':
        setUrlError('Invalid URL format');
        break;
      case 'URL_ALREADY_TAKEN':
        setUrlError('This URL is already in use');
        break;
      case 'RESERVED_URL':
        setUrlError('This URL is reserved and cannot be used');
        break;
      default:
        setUrlError(err.error.message);
    }
  }
}
```

#### Page YAML (POST /api/pages/data)
**Conditions:**
- Valid YAML syntax
- Required fields: `name`, `bio`
- Optional fields: `contact_info`, `experience`, `education`, `skills` (with correct structure)

**Error Handling:**
```typescript
// 400 response with error.details
const errorResponse: ErrorResponse = await response.json();
setUploadErrors(errorResponse.error.details || []);
```
**UI Display:** ErrorList component shows each field error
**Example errors:**
- `"name: This field is required but was not found"`
- `"contact_info[0].label: Expected string, received number"`

#### Project YAML (POST /api/projects/{id}/data)
**Conditions:**
- Valid YAML syntax
- Required fields: `name`, `description`
- Optional fields: `tech_stack`, `prod_link`, `start_date`, `end_date`
- Date fields must be valid date formats

**Error Handling:** Same as Page YAML
**Example errors:**
- `"description: This field is required but was not found"`
- `"start_date: Invalid date format"`

#### Project Creation (POST /api/projects)
**Conditions:**
- `project_name` non-empty and max 100 chars
- User must have a page (404 if not)

**Error Handling:**
```typescript
if (response.status === 404) {
  showError('Cannot create project: No page found');
}
```

### Conditional UI States

**"Save Order" Button (ProjectsCard):**
- Enabled only when `hasOrderChanges === true`
- Visual highlight (e.g., primary color) when enabled
- Disabled + neutral styling when no changes

**Inline Errors:**
- Displayed only when error state is non-null
- Cleared on new attempt (e.g., new URL input, new file selection)
- Use `role="alert"` for screen reader announcement

**Loading States:**
- Button disables and shows spinner during operation
- Prevent multiple submissions
- Re-enable on success or error

**Empty States:**
- ProjectsCard shows "No projects yet. Click 'New Project' to get started." if `projects.length === 0`
- No empty state for Page Settings/Content (always present if user reached dashboard)

## 10. Error Handling

### Error Categories

**1. Validation Errors (400)**
- **Source:** Server-side YAML or request body validation
- **Structure:** `ErrorResponse` with `details: ValidationErrorDetail[]`
- **Handling:** Display in ErrorList component with field names and issues
- **Example:**
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Request validation failed",
      "details": [
        { "field": "bio", "issue": "This field is required but was not found" },
        { "field": "name", "issue": "Expected string, received number" }
      ]
    }
  }
  ```

**2. Authentication Errors (401)**
- **Source:** Session expired or invalid
- **Handling:** Redirect to `/` (landing/login page)
- **Implementation:**
  ```typescript
  if (response.status === 401) {
    window.location.href = '/';
    return;
  }
  ```

**3. Not Found Errors (404)**
- **Source:** Page or project doesn't exist
- **Handling:**
  - If `GET /api/pages` returns 404 → Redirect to Initial Page Setup (handled by routing)
  - If project operation returns 404 → Show error toast, remove from local state
- **Example:** User tries to download YAML for deleted project

**4. Conflict Errors (409)**
- **Source:** URL already taken
- **Handling:** Display inline error message below URL input
- **Example:** "This URL is already in use. Please choose another."

**5. Server Errors (500+)**
- **Source:** Unexpected backend errors
- **Handling:** Display generic error message with retry option
- **Example:** "Something went wrong. Please try again later."
- **Implementation:**
  ```typescript
  if (response.status >= 500) {
    showError('Server error. Please try again later.');
  }
  ```

**6. Network Errors**
- **Source:** Fetch fails (no response)
- **Handling:** Display error message with retry option
- **Example:** "Network error. Please check your connection and try again."
- **Implementation:**
  ```typescript
  try {
    const response = await fetch(/* ... */);
  } catch (err) {
    if (err instanceof TypeError) {
      showError('Network error. Please try again.');
    }
  }
  ```

**7. File Reading Errors**
- **Source:** FileReader fails to read selected file
- **Handling:** Display error toast
- **Example:** "Could not read file. Please try again with a different file."

### Error Display Patterns

**Inline Errors (near action):**
- URL validation error → Below URL input in PageSettingsCard
- Theme update error → Below theme select in PageSettingsCard
- Project name error → Near input in InlineEditText or CreateProjectModal

**ErrorList Component (YAML validation):**
- Appears below FileUploadButton
- Lists all field-level errors
- Stays visible until next upload or user clears

**Toast Notifications (global actions):**
- Project created/deleted
- Order saved
- Generic errors (network, server)
- Use Shadcn toast component

**Dialog Errors (modal operations):**
- Error during project creation → Show in CreateProjectModal
- Error during project deletion → Show in ConfirmDialog

### Error Recovery

**Retry Actions:**
- Provide explicit retry button for failed operations
- Example: "Save Order" button remains enabled with error message if reorder fails
- User can correct and retry without losing changes

**Error Clearing:**
- Validation errors cleared on new file selection
- Inline errors cleared when user starts typing (e.g., URL input)
- Toast notifications auto-dismiss after timeout

**Partial Failures:**
- If batch operation (e.g., reorder) partially fails, show specific error
- Preserve local state so user doesn't lose work

### Accessibility Considerations

**ARIA Live Regions:**
- ErrorList uses `role="alert"` and `aria-live="polite"`
- Toast notifications have `aria-live="polite"` or `assertive` for critical errors

**Focus Management:**
- On error in modal, focus returns to first invalid field
- On dialog error, focus remains in dialog for retry

**Keyboard Interaction:**
- Escape key dismisses errors where applicable
- Enter key retries operation if explicit retry button has focus

## 11. Implementation Steps

### Phase 1: Setup and Shared Components (Foundation)

**Step 1.1: Create Directory Structure**
```
src/components/dashboard/
  ├── AdminDashboard.tsx
  ├── AppHeader.tsx
  ├── PageSettingsCard.tsx
  ├── PageContentCard.tsx
  ├── ProjectsCard.tsx
  ├── ProjectListItem.tsx
  ├── CreateProjectModal.tsx
  ├── dashboard.types.ts
  └── hooks/
      ├── useDashboardData.ts
      ├── useToast.ts
      ├── useFileUpload.ts
      └── useProjectReorder.ts

src/components/shared/
  ├── FileUploadButton.tsx
  ├── ErrorList.tsx
  ├── LinkPreview.tsx
  ├── InlineEditText.tsx
  ├── ReorderControls.tsx
  └── ConfirmDialog.tsx
```

**Step 1.2: Define Types**
- Create `src/components/dashboard/dashboard.types.ts`
- Import existing types from `@/types`
- Define all component props interfaces
- Define view model interfaces
- Add type guard helper functions

**Step 1.3: Implement Shared Components**

1. **ErrorList Component**
   - Props: `errors`, `onClear`
   - Render list with semantic HTML and ARIA
   - Style with Tailwind
   - Test with sample errors

2. **FileUploadButton Component**
   - Props: `onUpload`, `accept`, `disabled`, `children`
   - Implement file reading with FileReader
   - Handle loading state with spinner
   - Handle file reading errors
   - Test with sample YAML files

3. **LinkPreview Component**
   - Props: `url`, `baseUrl`
   - Construct full URL
   - Implement copy-to-clipboard with feedback
   - Implement "Open in new tab" link
   - Test copy functionality

4. **InlineEditText Component**
   - Props: `value`, `onSave`, `maxLength`, `required`
   - Implement view/edit mode toggle
   - Handle keyboard interactions (Enter, Escape)
   - Implement validation feedback
   - Test keyboard navigation

5. **ReorderControls Component**
   - Props: `canMoveUp`, `canMoveDown`, `onMoveUp`, `onMoveDown`, `itemLabel`
   - Implement up/down arrow buttons
   - Handle disabled states
   - Implement ARIA labels with context
   - Test keyboard accessibility

6. **ConfirmDialog Component**
   - Use Shadcn AlertDialog
   - Props: `isOpen`, `title`, `message`, `onConfirm`, `onCancel`
   - Implement focus trap
   - Style confirm button with danger variant
   - Test keyboard interactions

### Phase 2: Custom Hooks (Data Management)

**Step 2.1: Implement useToast Hook**
- Wrap Shadcn toast or implement custom
- Export `showSuccess` and `showError` functions
- Configure auto-dismiss timing
- Test with various message types

**Step 2.2: Implement useFileUpload Hook**
- Accept `apiCall` callback parameter
- Implement file reading with error handling
- Manage `isUploading` and `errors` state
- Parse ErrorResponse for validation errors
- Return `upload`, `isUploading`, `errors`, `clearErrors`
- Test with mock API calls

**Step 2.3: Implement useDashboardData Hook**
- Accept `initialPage` parameter
- Manage `page`, `projects`, `isLoading`, `error` state
- Fetch projects on mount with `GET /api/projects`
- Handle errors with user-friendly messages
- Return state and `refetchProjects` function
- Test with mock data

**Step 2.4: Implement useProjectReorder Hook**
- Accept `initialProjects` parameter
- Manage local `projects` array and `hasChanges` flag
- Implement `moveUp` and `moveDown` with display_order updates
- Implement `save` with API call to `PUT /api/projects/reorder`
- Implement `reset` to revert changes
- Sync with server data on prop changes
- Test reordering logic thoroughly

### Phase 3: Page Settings and Content Cards

**Step 3.1: Implement PageSettingsCard Component**
- Import `PageDto`, `UpdatePageUrlCommand`, `UpdatePageThemeCommand`
- Set up state: `localUrl`, `localTheme`, loading states, error states
- Implement controlled inputs
- Implement URL update handler:
  - POST to `/api/pages/url`
  - Handle 400, 409 errors
  - Show success toast
  - Update parent page state
- Implement theme update handler:
  - PUT to `/api/pages`
  - Show success toast
  - Update parent page state
- Integrate LinkPreview component
- Style with Tailwind and Shadcn components
- Test all interactions and error scenarios

**Step 3.2: Implement PageContentCard Component**
- Set up useFileUpload hook for YAML upload
- Implement template download button:
  - Navigate to `/api/templates/page`
- Implement current YAML download button:
  - Navigate to `/api/pages/data`
- Implement YAML upload:
  - Use FileUploadButton component
  - POST to `/api/pages/data`
  - Show success toast or display errors in ErrorList
- Style layout with clear sections
- Test downloads and upload with validation errors

### Phase 4: Project Management Components

**Step 4.1: Implement CreateProjectModal Component**
- Use Shadcn Dialog component
- Set up state: `projectName`, `isCreating`, `error`
- Implement controlled input
- Implement project creation:
  - Compute `display_order = max + 1`
  - POST to `/api/projects`
  - Handle success: close modal, call `onCreate` callback
  - Handle error: display inline in modal (server-side validation errors)
- Implement focus management (trap, return on close)
- Style with Shadcn form components
- Test creation flow and error handling

**Step 4.2: Implement ProjectListItem Component**
- Import all required types and hooks
- Set up state for inline editing, upload, delete confirmation
- Integrate InlineEditText for project name:
  - PUT to `/api/projects/{id}` on save
  - Handle errors
- Implement YAML upload with FileUploadButton:
  - Use useFileUpload hook
  - POST to `/api/projects/{id}/data`
  - Display errors in ErrorList
- Implement YAML download button:
  - Navigate to `/api/projects/{id}/data`
- Integrate ReorderControls component:
  - Call `onReorderUp`/`onReorderDown` callbacks
  - Pass `canMoveUp`/`canMoveDown` props
- Implement delete button:
  - Show ConfirmDialog
  - DELETE to `/api/projects/{id}` on confirm
  - Call `onDelete` callback on success
- Style with card or list item layout
- Test all interactions thoroughly

**Step 4.3: Implement ProjectsCard Component**
- Use useProjectReorder hook
- Set up state for modal visibility
- Implement "New Project" button:
  - Opens CreateProjectModal
  - Computes `maxDisplayOrder` from current projects
  - Handles `onCreate` callback (refetch projects)
- Render ProjectList with mapped ProjectListItem components
- Implement reorder callbacks:
  - Call hook's `moveUp`/`moveDown` functions
  - Pass correct `canMoveUp`/`canMoveDown` based on index
- Implement "Save Order" button:
  - Enabled only when `hasChanges === true`
  - Call hook's `save` function
  - Show success toast or error
- Implement empty state message
- Style with Shadcn Card component
- Test reordering, creation, and all child interactions

### Phase 5: Main Dashboard Container

**Step 5.1: Implement AppHeader Component**
- Render brand/logo (link to `/`)
- Implement logout button:
  - Call Supabase `signOut()`
  - Redirect to `/` on success
- Style with Tailwind, ensure responsive
- Test logout flow

**Step 5.2: Implement AdminDashboard Component**
- Use useDashboardData hook with `initialPage` prop
- Render loading state during projects fetch
- Render error state if fetch fails
- Render AppHeader
- Render PageSettingsCard with page data and update callback
- Render PageContentCard
- Render ProjectsCard with projects data and callbacks
- Implement data refresh logic (after mutations)
- Style with responsive grid/flexbox layout
- Test full dashboard with all interactions

### Phase 6: Astro Integration and Routing

**Step 6.1: Create Astro Page at /app**
- Create `src/pages/app.astro`
- Implement authentication check:
  - Use `locals.supabase.auth.getUser()`
  - Redirect to `/` if not authenticated
- Fetch page data:
  - Call `GET /api/pages`
  - If 404: Redirect to InitialPageSetup (or show setup view)
  - If 200: Pass page data to AdminDashboard
  - Handle errors (500+)
- Render AdminDashboard React component with `client:load`
- Pass initial page data as prop
- Test routing and authentication flow

**Step 6.2: Configure Middleware (if not already done)**
- Ensure Astro middleware at `src/middleware/index.ts` verifies session for `/app` route
- Redirect unauthenticated users to `/`

### Phase 7: Styling and Polish

**Step 7.1: Apply Consistent Styling**
- Ensure all components use Shadcn components where applicable
- Apply Tailwind classes for layout, spacing, colors
- Implement responsive design (mobile, tablet, desktop)
- Ensure consistent spacing and visual hierarchy
- Test on different screen sizes

**Step 7.2: Accessibility Audit**
- Verify all interactive elements are keyboard accessible
- Test with screen reader (VoiceOver, NVDA)
- Ensure ARIA labels and roles are correct
- Check color contrast ratios
- Verify focus indicators are visible
- Test tab order and focus management in modals

**Step 7.3: Polish UX Details**
- Add loading skeletons for async data (optional)
- Add micro-interactions (hover states, transitions)
- Ensure error messages are clear and actionable
- Test all toast notifications
- Verify all button states (hover, active, disabled)

---

## Summary

This implementation plan provides a comprehensive guide for building the Admin Dashboard view. The phased approach ensures that foundational components are built first, followed by more complex integrated features. Each phase includes specific steps with technical details, ensuring the implementation matches the PRD requirements and satisfies all user stories.

Key principles to follow during implementation:
1. **Incremental Development:** Build and test components in isolation before integration
2. **Type Safety:** Leverage TypeScript throughout; no `any` types
3. **Accessibility:** Ensure keyboard navigation and screen reader support at every step
4. **Error Handling:** Handle all error scenarios gracefully with user-friendly messages
5. **Testing:** Test each component and integration point thoroughly
6. **Code Quality:** Follow coding practices from CLAUDE.md (early returns, guard clauses, proper error logging)

By following this plan, the Admin Dashboard will provide a robust, accessible, and user-friendly interface for managing personal pages and projects.