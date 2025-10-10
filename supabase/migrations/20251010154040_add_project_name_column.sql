-- Migration: Add project_name column to projects table
-- Purpose: Store human-readable project names separately from project_id slugs
-- Affected Tables: projects
-- Special Considerations:
--   - This column is required (NOT NULL) and will be used in the API
--   - Max length is 100 characters to match project_id length constraint
--   - Existing rows (if any) will need default values during migration

-- add project_name column to projects table
-- this column stores the human-readable name of the project
-- while project_id remains the URL-safe slug identifier
alter table projects
add column project_name varchar(100) not null;
