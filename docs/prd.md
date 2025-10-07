# Product Requirements Document (PRD) - Personal Pages

## 1. Product Overview

Personal Pages is a web application designed to help students and freelancers establish an online presence without
requiring technical expertise. The platform enables users to create professional personal pages and project portfolios
by importing YAML documents, eliminating the need for domain registration, hosting setup, or frontend development
skills.

Target Audience:

- Students: Showcasing university experience and personal projects to increase hiring prospects
- Freelancers: Demonstrating expertise and project portfolios to attract future clients and employers

Technical Foundation:

- Authentication: Supabase Auth
- Development Timeline: 2-3 weeks (MVP)
- Monetization: Free for all users (no monetization strategy in MVP)

Core Value Proposition:
Personal Pages provides a frictionless way to create and maintain a professional online presence through a simple
YAML-based configuration system, paired with pre-designed themes and memorable URLs.

## 2. User Problem

Establishing an online presence is increasingly important for career advancement and professional opportunities.
However, creating a personal website currently requires:

- Technical knowledge of HTML, CSS, and JavaScript
- Understanding of web hosting and server configuration
- Domain registration and DNS management
- Ongoing maintenance and updates
- Financial investment in hosting and domains

These barriers prevent many students and freelancers from showcasing their skills, experience, and projects effectively
online. They need a simple, fast solution that:

- Requires no coding knowledge
- Provides professional-looking results
- Offers easy-to-share, memorable URLs
- Allows quick updates without technical complications
- Costs nothing to use

Personal Pages solves this problem by abstracting away all technical complexity, requiring only basic YAML editing
skills that can be learned in minutes.

## 3. Functional Requirements

### 3.1 Authentication and Account Management

3.1.1 User Registration

- Users can create accounts using Supabase Auth
- Standard email/password authentication
- No social login options in MVP
- No two-factor authentication in MVP

3.1.2 User Login and Session Management

- Users can log in to access their dashboard
- Session management handled by Supabase Auth
- Users can log out from their account

3.1.3 Account Deletion

- Users can permanently delete their account
- Deletion is immediate with no grace period
- All user data (page content, YAML configurations, projects) is removed immediately
- Published page becomes inaccessible immediately
- No data export functionality beyond standard YAML downloads during normal usage

### 3.2 Personal Page Creation and Management

3.2.1 Main Page YAML Structure
Required Fields:

- name: User's full name (maximum 100 characters)
- bio: Brief biography or description (maximum 500 characters)

Optional Fields:

- skills: Array of skill names (50 characters each)
- experience: Array of work experiences
    - job_title: Position title (maximum 100 characters)
    - job_description: Role description (maximum 500 characters)
- education: Array of educational background
    - school_name: Institution name (maximum 100 characters)
    - school_description: Details about education (maximum 300 characters)
- contact_info: Contact information (maximum 200 characters total, including phone and links)
- projects: Array of project names that link to project subpages

3.2.2 Project Subpage YAML Structure
Required Fields:

- name: Project name (maximum 100 characters)
- description: Project description (maximum 500 characters)

Optional Fields:

- tech_stack: Technologies used (maximum 500 characters)
- integrations: Third-party integrations (maximum 500 characters)
- prod_link: URL to live production version
- start_date: Project start date
- end_date: Project end date

3.2.3 YAML Import Functionality

- Users can import YAML documents for main page configuration
- Users can import separate YAML documents for each project subpage
- Changes are applied immediately upon successful import (no preview mode)
- Confirmation dialog required before publishing changes to live page
- System validates YAML against defined schema
- Invalid YAML triggers clear error messages

3.2.4 YAML Download Functionality

- Users can download empty YAML templates for main page
- Users can download empty YAML templates for project pages
- Users can download their current main page configuration as YAML
- Users can download their current project configurations as YAML

3.2.5 YAML Validation
System validates and provides UI feedback for:

- Missing required fields (name, bio for main page; name, description for projects)
- Unrecognized fields not in schema
- Field length violations (content exceeding maximum character limits)
- Malformed YAML syntax

Error messages must be:

- Specific (identifying exact field and issue)
- Clear (non-technical language where possible)
- Actionable (indicating what needs to be corrected)

### 3.3 Theme Selection

3.3.1 Available Themes

- Two themes available in MVP
- Themes will be similar in MVP phase (detailed differentiation deferred to post-MVP)
- Theme names and specific design characteristics to be defined during implementation

3.3.2 Theme Management

- Users can switch between available themes at any time
- Theme changes apply immediately to published page
- Theme selection persists across sessions

### 3.4 URL Customization

3.4.1 URL Format

- Main page format: https://{APP_DOMAIN}/page/{USER_PAGE}
- Project subpage format: https://{APP_DOMAIN}/page/{USER_PAGE}/project/{PROJECT_SLUG}

3.4.2 URL Rules and Validation

- Length: 3-30 characters
- Allowed characters: lowercase alphanumeric (a-z, 0-9) and hyphens (-)
- Cannot start or end with hyphen
- No consecutive hyphens allowed
- Must be unique across all users
- Reserved words blocked (including but not limited to: admin, api, auth, help, about)

3.4.3 URL Change Management

- Users can change their URL at any time
- No frequency restrictions or rate limiting in MVP
- Uniqueness checking occurs after user confirms URL selection (not real-time)
- Old URLs stop working immediately after change (no redirects in MVP)
- System notifies user if selected URL is already taken or invalid

3.4.4 Project URL Slug Generation

- PROJECT_SLUG generation mechanism to be defined during implementation
- Options include: derived from project name, user-specified, or auto-generated

### 3.5 Page Publishing

3.5.1 Real-Time Updates

- All changes go live immediately upon successful import
- No preview mode or staging environment in MVP
- No version history or rollback capability

3.5.2 Page Accessibility

- Published pages are publicly accessible without authentication

3.5.3 Project Linking

- Main page displays clickable array of project names
- Each project name links to corresponding project subpage
- Projects are defined through separate project YAML imports via the UI
- Project order is determined by the user through the UI during page configuration

### 3.6 Analytics and Metrics

3.6.1 Success Metrics Calculation
Success metrics are calculated on-demand using SQL queries against existing database tables. No separate event logging is required.

### 3.7 Data Constraints and Validation

3.7.1 Concurrency Handling

- Users only modify their own pages (no concurrent editing conflicts)
- No locking mechanism required
- Confirmation dialog required before changes are published

## 4. Product Boundaries

### 4.1 In Scope for MVP

The following features are included in the initial release:

- Account creation and authentication
- Main page creation through YAML import
- Project subpage creation through YAML import
- Two theme options for page styling
- Custom URL selection and modification
- YAML template downloads
- Current configuration downloads as YAML
- Real-time YAML validation with error feedback
- Immediate publishing of changes (no preview)
- Public page accessibility
- SQL-based success metrics calculation
- Account deletion with immediate data removal

### 4.2 Out of Scope for MVP

The following features are explicitly excluded from the initial release:

Visual Customization:

- Custom theme creation or modification
- Theme customization options (colors, fonts, layouts)
- Image or screenshot uploads and management
- Logo or profile picture support

Domain and SEO:

- Custom domain forwarding (e.g., customdomain.com to {APP_DOMAIN}/page/{USER_PAGE})
- Advanced SEO tools or meta tag customization
- Sitemap generation
- Search engine submission assistance

Content Management:

- Visual form-based editor for page content
- Preview mode before publishing changes
- Version history or rollback capability
- Draft saving functionality
- Content scheduling

URL Management:

- Redirects from old URLs after URL changes
- Real-time URL availability checking during typing
- URL change frequency limits or rate limiting

User Experience:

- Onboarding tutorials or wizards
- Help center or documentation
- In-app guidance or tooltips
- Email notifications
- Success messages or confirmations (beyond basic validation)

Analytics and Insights:

- User-facing analytics dashboard
- Page view statistics
- Visitor demographics or behavior tracking
- Traffic source information

Account Management:

- Social login options (Google, GitHub, LinkedIn)
- Two-factor authentication
- Account recovery grace period (deletion is immediate)
- Password reset via security questions
- Data export functionality (beyond standard YAML downloads)

Advanced Features:

- Multi-language support or internationalization
- Collaboration features (multiple users per page)
- Comments or feedback functionality
- Integration with external services (LinkedIn, GitHub)
- API access for programmatic updates
- Mobile application

## 5. User Stories

### 5.1 Authentication and Account Management

US-001
Title: User Registration
Description: As a new user, I want to create an account using my email and password, so that I can access the platform
and create my personal page.
Acceptance Criteria:

- User can access registration page
- User can enter email address and password
- System validates email format
- System validates password meets minimum requirements (as defined by Supabase Auth)
- System creates new account upon successful validation
- User receives confirmation of successful registration
- User is logged in automatically after registration
- System rejects duplicate email addresses with clear error message

US-002
Title: User Login
Description: As a registered user, I want to log in to my account using my credentials, so that I can manage my personal
page.
Acceptance Criteria:

- User can access login page
- User can enter email and password
- System validates credentials against stored user data
- Successful login redirects user to dashboard/management area
- Failed login displays clear error message
- System maintains user session until logout or timeout
- User cannot access management features without authentication

US-003
Title: Account Deletion
Description: As a user, I want to permanently delete my account and all associated data, so that I can remove my
presence from the platform.
Acceptance Criteria:

- User can access account deletion option in account settings
- System displays warning about permanent deletion and data loss
- User must confirm deletion intention
- System immediately deletes all user data (page content, YAML configurations, projects)
- Published page becomes inaccessible immediately after deletion
- User's custom URL becomes available for other users
- System terminates user session
- User cannot log in with deleted account credentials
- No data recovery option is available

### 5.2 Main Page YAML Management

US-004
Title: Download Main Page YAML Template
Description: As a user, I want to download an empty YAML template for the main page, so that I can understand the
required structure and fill in my information.
Acceptance Criteria:

- User can access template download option from dashboard
- System provides downloadable YAML file with all field names
- Template includes comments explaining required vs optional fields
- Template includes character limit information for each field
- Template follows valid YAML syntax
- Downloaded file has appropriate file extension (.yaml or .yml)

US-005
Title: Import Main Page YAML
Description: As a user, I want to import a YAML document containing my personal information, so that my main page is
created or updated with this content.
Acceptance Criteria:

- User can access YAML import functionality from dashboard
- User can select YAML file from local file system
- System validates YAML syntax
- System validates required fields are present (name, bio)
- System validates character limits for all fields
- System displays confirmation dialog before applying changes
- Upon confirmation, changes are applied immediately to live page
- System displays success message after successful import
- User's page is accessible at their custom URL after import

US-006
Title: Download Current Main Page Configuration
Description: As a user, I want to download my current main page configuration as a YAML file, so that I can modify it
locally and re-import it.
Acceptance Criteria:

- User can access configuration download option from dashboard
- System generates YAML file with current page configuration
- Downloaded YAML includes all populated fields and values
- Downloaded YAML is valid and can be re-imported without errors
- File includes user's current content with proper formatting
- Downloaded file has appropriate file extension (.yaml or .yml)

US-007
Title: Main Page YAML Validation
Description: As a user, I want to receive clear error messages when importing YAML with missing required fields, fields
exceeding character limits, unrecognized fields, or YAML with malformed syntax, so that
I can correct my YAML and successfully create my page.
Acceptance Criteria:

- System detects violation
- System displays specific error message
- Import is rejected until all errors are resolved

### 5.3 Project Subpage Management

US-008
Title: Download Project YAML Template
Description: As a user, I want to download an empty YAML template for project pages, so that I can understand the
structure and create project subpages.
Acceptance Criteria:

- User can access project template download option from dashboard
- System provides downloadable YAML file with project field names
- Template includes comments explaining required vs optional fields
- Template includes character limit information
- Template includes examples for date fields and URL fields
- Downloaded file has appropriate file extension (.yaml or .yml)

US-009
Title: Import Project YAML
Description: As a user, I want to import a YAML document for a project, so that I can add a new project subpage to my
portfolio.
Acceptance Criteria:

- User can access project YAML import functionality
- User can select YAML file from local file system
- System validates YAML syntax
- System validates required fields are present (name, description)
- System validates character limits
- System displays confirmation dialog before creating project
- Upon confirmation, project subpage is created immediately
- Project name appears in clickable project list on main page
- Project subpage is accessible at generated URL
- System displays success message after successful import

US-010
Title: Download Current Project Configuration
Description: As a user, I want to download the current configuration of a specific project as YAML, so that I can modify
and update it.
Acceptance Criteria:

- User can select specific project from list of projects
- User can access download option for selected project
- System generates YAML file with current project configuration
- Downloaded YAML includes all populated fields for that project
- Downloaded YAML is valid and can be re-imported
- File includes project's current content with proper formatting
- Downloaded file has appropriate file extension

US-011
Title: Update Existing Project via YAML Import
Description: As a user, I want to update an existing project by importing a modified YAML file, so that I can keep my
project information current.
Acceptance Criteria:

- User can select existing project to update
- User can import YAML file for selected project
- System validates YAML (same validation as new project)
- System displays confirmation dialog showing this will update existing project
- Upon confirmation, project content is updated immediately
- Project URL remains unchanged (same PROJECT_SLUG)
- Changes are reflected immediately on project subpage
- Project name in main page list is updated if changed

US-012
Title: Project YAML Validation
Description: As a user, I want to receive clear error messages when importing project YAML with missing required fields,
fields
exceeding character limits, unrecognized fields, or YAML with malformed syntax, so that
I can correct my YAML and successfully create my page.
Acceptance Criteria:

- System detects violation
- System displays specific error message
- Import is rejected until all errors are resolved

### 5.4 Theme Selection

US-013
Title: Select Page Theme
Description: As a user, I want to select a theme for my personal page, so that it has the visual style I prefer.
Acceptance Criteria:

- User can select from two available themes
- Selection can be made during initial setup or changed later
- System applies selected theme immediately to published page
- Theme change is visible immediately without delay
- Theme selection persists across sessions
- System displays confirmation of theme change

### 5.5 URL Customization

US-014
Title: Select Custom URL
Description: As a user, I want to choose a custom URL for my personal page, so that I have an easy-to-remember web
address to share.
Acceptance Criteria:

- User can enter desired URL during initial setup
- System validates URL length (3-30 characters)
- System validates allowed characters (lowercase a-z, 0-9, hyphens)
- System maintains list of reserved words (minimum: admin, api, auth, help, about)
- System rejects URLs matching reserved words (case-insensitive)
- System converts uppercase letters to lowercase automatically
- Error messages specify which rule was violated
- System checks URL uniqueness after user confirms selection
- If URL is available, system assigns it to user's page
- If URL is taken, system displays error and allows retry
- Page becomes accessible at https://{APP_DOMAIN}/page/{USER_PAGE}
- System displays user's URL clearly in dashboard

### 5.6 Page Viewing and Access

US-015
Title: View Published Personal Page
Description: As a visitor, I want to view someone's personal page without requiring authentication, so that I can learn
about their experience and skills.
Acceptance Criteria:

- Published pages are publicly accessible without login
- Page is accessible at https://{APP_DOMAIN}/page/{USER_PAGE}
- Page displays all user's configured information (name, bio, optional fields)
- Page uses user's selected theme
- Page displays clickable list of project names
- Page loads without errors
- Page is responsive and viewable on different devices

US-016
Title: Access Non-Existent Page
Description: As a visitor, I want to receive clear feedback when accessing a non-existent page, so that I know the URL
is incorrect or the page has been removed.
Acceptance Criteria:

- Accessing non-existent user page displays appropriate error (404)
- Error message is user-friendly
- Error explains page may not exist or URL may be incorrect
- System does not reveal whether username existed previously (privacy)
- Error page follows site branding
- Error page includes navigation to main site

### 5.7 Edge Cases and Error Handling
US-017
Title: Handle Special Characters in Content
Description: As a user, I want to include special characters in my content (quotes, apostrophes, etc.), so that I can
write naturally.
Acceptance Criteria:

- System accepts special characters within character limits
- YAML parser correctly handles quotes, apostrophes, line breaks
- Special characters display correctly on published page
- No encoding issues visible to visitors
- System sanitizes content to prevent security issues (XSS)
- User receives guidance if YAML escaping is needed

US-018
Title: Handle Project Array Ordering
Description: As a user, I want to control the order my projects are displayed in, so that my portfolio has the logical structure I choose.
Acceptance Criteria:

- Users can reorder projects through the UI during page configuration
- Projects are displayed in the user-defined order on main page
- Order persists across page reloads
- Order remains consistent for all visitors
- Order does not change unexpectedly

## 6. Success Metrics

### 6.1 Primary Success Metrics

The success of Personal Pages MVP will be measured against two primary metrics:

Metric 1: Page Setup Completion Rate

- Target: 80% of registered users successfully set up their personal page
- Definition: A successfully set up page includes:
    - Account created
    - Valid main page YAML imported
    - Required fields present (name minimum 1 character, bio minimum 1 character)
    - Page publicly accessible at chosen URL
- Measurement: (Number of users with published page) / (Total number of registered users) × 100
- Data Source: SQL query calculating users with published pages from database tables
- Evaluation Period: Ongoing from MVP launch
- Notes: Content quality is not evaluated; only presence of required fields matters

Metric 2: Project Subpage Adoption Rate

- Target: 80% of users with published pages have at least one project subpage
- Definition: User has successfully imported at least one valid project YAML
- Measurement: (Number of users with ≥1 project) / (Number of users with published page) × 100
- Data Source: SQL query calculating users with at least one project from database tables
- Evaluation Period: Ongoing from MVP launch
- Notes: Number of projects beyond first project is not measured in MVP

### 6.2 Metrics Calculation Method

Success metrics are calculated on-demand using SQL queries that analyze existing database tables:

- Page Setup Completion Rate: Calculated by querying user accounts and their associated published pages
- Project Subpage Adoption Rate: Calculated by querying users with published pages and counting their associated projects

### 6.3 Non-Goals for MVP Metrics

The following are explicitly NOT measured in MVP:

- User-facing analytics or page view counts
- Visitor behavior or engagement metrics
- Conversion rates (no monetization to convert to)
- User satisfaction or NPS scores
- Time spent on site
- Traffic sources or referral data
- SEO rankings or search visibility
- Content quality metrics
- Page load performance
- Error rates (beyond basic logging)

These may be considered for post-MVP iterations based on primary metric performance.