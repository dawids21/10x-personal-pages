# Database Schema for Personal Pages

## 1. Tables with Columns, Data Types, and Constraints

### 1.1 auth.users

Managed by Supabase Auth. Contains user authentication data.

**Note**: This table is part of Supabase Auth's internal schema and should not be modified directly. The application references `auth.users(id)` via foreign keys but does not manage this table's structure or data directly.

### 1.2 pages

Stores personal page configuration for each user.

**Columns:**
- `user_id` UUID PRIMARY KEY - Foreign key to auth.users(id), enforces one-to-one relationship
- `url` VARCHAR(30) NOT NULL UNIQUE CHECK (length(url) >= 3 AND length(url) <= 30) - Custom URL slug for user's page
- `theme` VARCHAR(50) NOT NULL - Theme identifier (e.g., 'theme-1', 'theme-2')
- `data` JSONB NULL - Complete main page YAML content (name, bio, skills, experience, education, contact_info)
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW() - Page creation timestamp
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW() - Last modification timestamp

**Table Constraints:**
- PRIMARY KEY: `user_id`
- FOREIGN KEY: `user_id` REFERENCES `auth.users(id)` ON DELETE CASCADE
- UNIQUE: `url`
- CHECK: `length(url) >= 3 AND length(url) <= 30`

### 1.3 projects

Stores project subpages for user portfolios.

**Columns:**
- `user_id` UUID NOT NULL - Foreign key to pages(user_id), part of composite PRIMARY KEY
- `project_id` VARCHAR(100) NOT NULL - Server-generated slug from project name, part of composite PRIMARY KEY
- `display_order` INTEGER NOT NULL DEFAULT 0 CHECK (display_order >= 0) - User-defined ordering (0, 1, 2, 3...)
- `data` JSONB NULL - Complete project YAML content (name, description, tech_stack, integrations, prod_link, dates)
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW() - Project creation timestamp
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW() - Last modification timestamp

**Table Constraints:**
- PRIMARY KEY: `(user_id, project_id)`
- FOREIGN KEY: `user_id` REFERENCES `pages(user_id)` ON DELETE CASCADE
- CHECK: `display_order >= 0`

## 2. Relationships Between Tables

### 2.1 auth.users → pages
- **Type**: One-to-One
- **Implementation**: `pages.user_id` (PRIMARY KEY) references `auth.users.id`
- **Cascade Behavior**: ON DELETE CASCADE (deleting user deletes their page)
- **Rationale**: Each user can have exactly one personal page; using user_id as PRIMARY KEY enforces this at database level

### 2.2 pages → projects
- **Type**: One-to-Many
- **Implementation**: `projects.user_id` (part of composite PRIMARY KEY) references `pages.user_id`
- **Cascade Behavior**: ON DELETE CASCADE (deleting page deletes all associated projects)
- **Rationale**: Each page can have multiple projects; composite key ensures project_id uniqueness within user scope

### 2.3 Cascade Chain
```
auth.users (deleted)
    ↓ CASCADE
pages (deleted)
    ↓ CASCADE
projects (deleted)
```

## 3. Indexes

### 3.1 Automatic Indexes (via PRIMARY KEY)
- `pages_pkey` on `pages(user_id)`
- `projects_pkey` on `projects(user_id, project_id)`

### 3.2 Explicit Indexes
- `pages_url_idx` on `pages(url)` - UNIQUE index
  - **Purpose**: Fast URL lookups for public page access
  - **Access Pattern**: Primary method for visitors to access pages

### 3.3 Indexing Strategy Rationale
- **Minimal indexes**: Reduces write overhead and maintenance costs
- **No GIN indexes on JSONB**: Data always read as complete objects, no field-level queries needed
- **No index on display_order**: Projects filtered by user_id first (PRIMARY KEY), then ordered in-memory

## 4. PostgreSQL Row-Level Security (RLS) Policies

### 4.1 pages Table Policies

**Enable RLS:**
```sql
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
```

**Policies:**

1. **pages_select_policy** (Public Read)
   - **Operation**: SELECT
   - **Condition**: `true` (all rows visible to everyone)
   - **Rationale**: Published pages must be publicly accessible per PRD section 3.5.2

2. **pages_insert_policy** (Authenticated Insert)
   - **Operation**: INSERT
   - **Condition**: `auth.uid() = user_id`
   - **Rationale**: Users can only create their own page

3. **pages_update_policy** (Owner Update)
   - **Operation**: UPDATE
   - **Condition**: `auth.uid() = user_id`
   - **Rationale**: Users can only modify their own page

4. **pages_delete_policy** (Owner Delete)
   - **Operation**: DELETE
   - **Condition**: `auth.uid() = user_id`
   - **Rationale**: Users can only delete their own page (account deletion)

### 4.2 projects Table Policies

**Enable RLS:**
```sql
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
```

**Policies:**

1. **projects_select_policy** (Public Read)
   - **Operation**: SELECT
   - **Condition**: `true` (all rows visible to everyone)
   - **Rationale**: Project subpages must be publicly accessible per PRD section 3.5.2

2. **projects_insert_policy** (Authenticated Insert)
   - **Operation**: INSERT
   - **Condition**: `auth.uid() = user_id`
   - **Rationale**: Users can only create projects for their own page

3. **projects_update_policy** (Owner Update)
   - **Operation**: UPDATE
   - **Condition**: `auth.uid() = user_id`
   - **Rationale**: Users can only modify their own projects

4. **projects_delete_policy** (Owner Delete)
   - **Operation**: DELETE
   - **Condition**: `auth.uid() = user_id`
   - **Rationale**: Users can only delete their own projects

## 5. Database Functions and Triggers

### 5.1 Automatic updated_at Function

**Function:**
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Triggers:**

1. **update_pages_updated_at**
   - **Table**: pages
   - **Event**: BEFORE UPDATE
   - **Action**: Execute `update_updated_at_column()` FOR EACH ROW

2. **update_projects_updated_at**
   - **Table**: projects
   - **Event**: BEFORE UPDATE
   - **Action**: Execute `update_updated_at_column()` FOR EACH ROW

## 6. Design Decisions and Notes
- **JSONB for YAML content**: All imported YAML data stored in single `data` column per table
- **Schema**: All tables in `public` schema
- **Database-level validation**: Only critical constraints (URL length, display_order non-negative, NOT NULL)
- **Application-level validation**: All YAML schema validation, character limits, field requirements, format checks