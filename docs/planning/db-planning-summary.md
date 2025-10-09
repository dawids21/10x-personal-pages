# Database Planning Summary

<conversation_summary>

<decisions>

## User Decisions Made During Planning

1. **Separation of Concerns**: `pages` table created separately from Supabase Auth's `users` table to avoid modifying authentication schema
2. **User-Page Relationship**: One-to-one relationship between users and pages, enforced via PRIMARY KEY
3. **Project Ordering**: `display_order` INTEGER column (0, 1, 2, 3...) for user-defined project ordering
4. **Project Identification**: `project_id` VARCHAR(100) used as slug, server-side generated from project name (lowercase, hyphens) with duplicate checking via numeric suffixes
5. **Composite Key Strategy**: `(user_id, project_id)` as composite PRIMARY KEY for projects table
6. **Data Storage**: All YAML content (main page and projects) stored in single JSONB `data` column per table
7. **Theme Management**: Themes hardcoded in application, not stored in database table
8. **Reserved URLs**: Stored as application constants, not in database table
9. **URL Uniqueness**: Unique constraint on `url` column in pages table
10. **Deletion Strategy**: CASCADE constraints for automatic deletion of pages and projects when users are deleted
11. **Validation Layer**: Character limits enforced at server/application level only, not via database CHECK constraints
12. **Timestamps**: `created_at` and `updated_at` on pages and projects
13. **Default Values**: `DEFAULT NOW()` for all `created_at` columns; theme default provided server-side
14. **Auto-Update Mechanism**: Database trigger function for automatically updating `updated_at` column
15. **Pages Primary Key**: `user_id UUID` as PRIMARY KEY (not separate id column)
16. **Foreign Keys**:
    - pages.user_id → auth.users(id) ON DELETE CASCADE
    - projects.user_id → pages(user_id) ON DELETE CASCADE
17. **Nullability**:
    - pages.url: NOT NULL with CHECK (length >= 3 AND length <= 30)
    - pages.data: NULLABLE (server handles empty state)
    - pages.theme: NOT NULL (no default)
    - projects.data: NULLABLE
18. **Indexing Strategy**: Minimal indexes - only unique index on pages.url
19. **Schema Organization**: All tables in `public` schema
20. **URL Handling**: Lowercase conversion handled server-side; no database collation specified

</decisions>

<matched_recommendations>

## Recommendations Aligned with Decisions

1. **Separate Pages Table**: Creating separate `pages` table provides better separation of concerns and keeps authentication data isolated from content data
2. **One-to-One Relationship**: Using `user_id` as PRIMARY KEY naturally enforces one-to-one relationship at database level
3. **Display Order Column**: INTEGER column with sequential values (0, 1, 2...) provides simple and effective project ordering mechanism
4. **Composite Primary Key**: `(user_id, project_id)` ensures project_id uniqueness within user scope while allowing same project_id across different users
5. **JSONB Storage**: Single JSONB column per table optimal for data that's always read together, avoiding JOIN overhead and providing schema flexibility for YAML import/export
6. **Cascade Deletion**: Database-level CASCADE constraints ensure data integrity and guarantee immediate deletion as required by PRD, even if application logic has bugs
7. **Timestamps with Triggers**: Automatic `updated_at` management via trigger function prevents human error and ensures consistency
8. **RLS Policies**: Public SELECT for published content, authenticated INSERT/UPDATE/DELETE ensures proper access control while allowing public page viewing
9. **Minimal Indexing**: Avoiding unnecessary indexes reduces write overhead and maintenance costs while providing required lookup performance
10. **Public Schema**: Standard practice for application tables, provides clear separation from Supabase Auth schema
11. **URL Length Check**: Database-level CHECK constraint provides safety net even if application validation is bypassed

</matched_recommendations>

<database_planning_summary>

## Database Schema Overview

The database schema for Personal Pages MVP consists of three main tables supporting a YAML-based personal page and portfolio platform for students and freelancers.

### Core Entities and Relationships

**1. Pages Table**

- Stores user personal pages with YAML-imported content
- One-to-one relationship with Supabase Auth users
- Primary Key: `user_id UUID`
- Foreign Key: `user_id` → `auth.users(id)` ON DELETE CASCADE
- Columns:
    - `user_id`: UUID PRIMARY KEY (links to auth.users)
    - `url`: VARCHAR(30) NOT NULL with unique constraint and CHECK (3-30 chars)
    - `theme`: VARCHAR(50) NOT NULL (theme identifier, default provided server-side)
    - `data`: JSONB NULLABLE (complete main page YAML content)
    - `created_at`: TIMESTAMPTZ NOT NULL DEFAULT NOW()
    - `updated_at`: TIMESTAMPTZ NOT NULL DEFAULT NOW()

**2. Projects Table**

- Stores project subpages linked to user pages
- One-to-many relationship with pages
- Composite Primary Key: `(user_id, project_id)`
- Foreign Key: `user_id` → `pages(user_id)` ON DELETE CASCADE
- Columns:
    - `user_id`: UUID NOT NULL
    - `project_id`: VARCHAR(100) NOT NULL (slug generated from project name)
    - `display_order`: INTEGER NOT NULL DEFAULT 0 with CHECK (>= 0)
    - `data`: JSONB NULLABLE (complete project YAML content)
    - `created_at`: TIMESTAMPTZ NOT NULL DEFAULT NOW()
    - `updated_at`: TIMESTAMPTZ NOT NULL DEFAULT NOW()

### Data Storage Strategy

All YAML content is stored in JSONB columns named `data`:

- **Rationale**: Content is always read together to generate pages, making JSONB optimal for performance
- **Benefits**: Schema flexibility, no character limit enforcement at DB level, easy import/export, no JOIN operations needed
- **Validation**: All field limits and schema validation handled at application/server level

### Indexing Strategy

Minimal indexes to reduce write overhead:

- **pages.url**: Unique index for URL lookups (primary public access pattern)
- **Primary keys**: Automatically indexed (pages.user_id, projects composite key)

### Security Implementation

**Row-Level Security (RLS) Policies:**

**Pages Table:**

- SELECT: Public read access (published pages viewable by everyone)
- INSERT/UPDATE/DELETE: Users can only modify their own pages (`auth.uid() = user_id`)

**Projects Table:**

- SELECT: Public read access (project subpages viewable by everyone)
- INSERT/UPDATE/DELETE: Users can only modify their own projects (`auth.uid() = user_id`)

### Automatic Behaviors

**Trigger Function:**

- Reusable `update_updated_at_column()` function
- Automatically updates `updated_at` on pages and projects modifications
- Executes BEFORE UPDATE on each row

**Cascade Deletions:**

- User deletion → pages deletion → projects deletion (cascading chain)
- Ensures immediate data removal as required by PRD

### Data Integrity

**Constraints:**

- URL length: 3-30 characters (database CHECK)
- URL uniqueness: Database-level unique constraint
- Display order: Non-negative integers (CHECK constraint)
- Required fields: NOT NULL constraints on critical columns

**Format Validation:**

- URL format (lowercase, alphanumeric, hyphens): Server-side only
- Project ID format: Server-side only
- YAML structure and character limits: Server-side only

### Scalability Considerations

- **JSONB Performance**: Acceptable for MVP since data read as complete objects, no field-level queries
- **No GIN Indexes**: Avoided to reduce index maintenance overhead (not needed for access patterns)
- **Minimal Indexes**: Reduces write amplification while maintaining read performance
- **Simple Schema**: Easy to understand and maintain during rapid MVP development

</database_planning_summary>

<unresolved_issues>

## Areas Requiring Implementation Decisions

1. **Theme Identifiers**: Specific theme names/identifiers need to be defined (e.g., 'theme-1', 'theme-2') and hardcoded in application
2. **Reserved URL List**: Complete list of reserved words needs to be defined as application constant (minimum: admin, api, auth, help, about)
3. **Project ID Generation Logic**: Detailed algorithm for server-side slug generation with duplicate handling (numeric suffix strategy)
4. **Default Theme Value**: Which theme should be set as default when user creates their page (provided server-side)
5. **Error Messages**: Specific wording for validation errors to be defined in application layer
6. **YAML Schema Validation**: Detailed validation rules for YAML structure to be implemented server-side
7. **Display Order Management**: UI/API logic for reordering projects (updating all display_order values)
8. **Initial User Flow**: Sequence of operations when user first creates account (theme selection, URL selection, YAML import order)

All items above are application/server-side concerns and do not require database schema changes.

</unresolved_issues>

</conversation_summary>