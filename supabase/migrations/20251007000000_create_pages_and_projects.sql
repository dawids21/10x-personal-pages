-- migration: create pages and projects tables
-- purpose: establish core database schema for personal pages application
-- affected tables: pages, projects
-- special considerations:
--   - pages.user_id is both primary key and foreign key (one-to-one with auth.users)
--   - projects uses composite primary key (user_id, project_id)
--   - cascade deletes: auth.users -> pages -> projects
--   - public read access (rls policies allow select for all)
--   - authenticated write access (users can only modify their own data)

-- ============================================================================
-- table: pages
-- description: stores personal page configuration for each user (one-to-one)
-- ============================================================================

create table public.pages (
    user_id uuid primary key references auth.users(id) on delete cascade,
    url varchar(30) not null unique check (length(url) >= 3 and length(url) <= 30),
    theme varchar(50) not null,
    data jsonb null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- create index for fast url lookups (primary access pattern for public pages)
create unique index pages_url_idx on public.pages(url);

-- ============================================================================
-- table: projects
-- description: stores project subpages for user portfolios (one-to-many)
-- ============================================================================

create table public.projects (
    user_id uuid not null references public.pages(user_id) on delete cascade,
    project_id varchar(100) not null,
    display_order integer not null default 0 check (display_order >= 0),
    data jsonb null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (user_id, project_id)
);

-- ============================================================================
-- function: automatic updated_at timestamp
-- description: trigger function to update updated_at column on row updates
-- ============================================================================

create or replace function public.update_updated_at_column()
returns trigger
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- ============================================================================
-- triggers: apply updated_at function to pages and projects
-- ============================================================================

-- trigger for pages table: automatically update updated_at on modifications
create trigger update_pages_updated_at
    before update on public.pages
    for each row
    execute function public.update_updated_at_column();

-- trigger for projects table: automatically update updated_at on modifications
create trigger update_projects_updated_at
    before update on public.projects
    for each row
    execute function public.update_updated_at_column();

-- ============================================================================
-- row level security: pages table
-- description: public read access, authenticated write access for own data
-- ============================================================================

-- enable rls on pages table (required even for public access)
alter table public.pages enable row level security;

-- policy: allow anonymous users to select (read) all pages
-- rationale: published pages must be publicly accessible per prd section 3.5.2
create policy pages_select_policy_anon on public.pages
    for select
    to anon
    using (true);

-- policy: allow authenticated users to select (read) all pages
-- rationale: authenticated users should also be able to view all public pages
create policy pages_select_policy_authenticated on public.pages
    for select
    to authenticated
    using (true);

-- policy: allow authenticated users to insert their own page
-- rationale: users can only create their own page (one-to-one relationship)
create policy pages_insert_policy on public.pages
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- policy: allow authenticated users to update their own page
-- rationale: users can only modify their own page data
create policy pages_update_policy on public.pages
    for update
    to authenticated
    using (auth.uid() = user_id);

-- policy: allow authenticated users to delete their own page
-- rationale: users can only delete their own page (account deletion scenario)
-- warning: this will cascade delete all associated projects
create policy pages_delete_policy on public.pages
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- ============================================================================
-- row level security: projects table
-- description: public read access, authenticated write access for own data
-- ============================================================================

-- enable rls on projects table (required even for public access)
alter table public.projects enable row level security;

-- policy: allow anonymous users to select (read) all projects
-- rationale: project subpages must be publicly accessible per prd section 3.5.2
create policy projects_select_policy_anon on public.projects
    for select
    to anon
    using (true);

-- policy: allow authenticated users to select (read) all projects
-- rationale: authenticated users should also be able to view all public projects
create policy projects_select_policy_authenticated on public.projects
    for select
    to authenticated
    using (true);

-- policy: allow authenticated users to insert their own projects
-- rationale: users can only create projects for their own page
create policy projects_insert_policy on public.projects
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- policy: allow authenticated users to update their own projects
-- rationale: users can only modify their own project data
create policy projects_update_policy on public.projects
    for update
    to authenticated
    using (auth.uid() = user_id);

-- policy: allow authenticated users to delete their own projects
-- rationale: users can only delete their own projects
create policy projects_delete_policy on public.projects
    for delete
    to authenticated
    using (auth.uid() = user_id);