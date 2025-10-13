# Product Requirements Document (PRD) - Personal Pages

## 1. Product Overview

Personal Pages is a web application designed to provide users with a simple, code-free way to create and host a personal
portfolio page. The core principle is to allow users, primarily developers, to define their page content within a
structured YAML document. The application will then parse this document and generate a clean, professional-looking
webpage hosted on a unique, easy-to-remember URL. Users can manage their page, add project subpages, and select a visual
theme through a simple administration dashboard. The project's goal is to offer a useful, free-forever tool to the
developer community, removing the technical barriers of web hosting, domain registration, and frontend development for
creating a personal online presence.

## 2. User Problem

In today's tech industry, an online presence is crucial for professional visibility, especially for developers seeking
new job opportunities. However, creating a personal portfolio page requires a significant investment of time and
technical skills, including frontend development (HTML, CSS, JavaScript), setting up hosting, and registering a domain.
This creates a barrier for many developers who want to showcase their experience but may lack the time, interest, or
specific frontend skills to build a page from scratch. Personal Pages addresses this problem by offering a streamlined,
configuration-based approach. It targets developers who want a professional-looking portfolio quickly, allowing them to
focus on the content of their profile rather than the technical implementation of the website itself.

## 3. Functional Requirements

### 3.1. User Account Management

* Users must be able to create an account and log in to the application.
* Authentication will be implemented using Supabase Auth.
* The system must securely manage user sessions, providing access to a personal administration dashboard only to
  authenticated users.

### 3.2. Page Generation and Content Management

* The system will generate a main personal page for each user based on an imported YAML document.
* Users can update their page content at any time by uploading a new YAML file, which will overwrite the previous
  version. The system will not maintain a version history of the content.
* The generated page will be publicly accessible via a unique URL in the format: `https://{APP_DOMAIN}/page/{USER_URL}`.

### 3.3. Project Subpages

* Users can create separate subpages for individual projects.
* Each project subpage is created by uploading a dedicated project YAML file through the user dashboard.
* The main personal page will automatically query and display a list of all associated projects, linking to their
  respective subpages.
* Projects are managed independently and are not defined within the main page's YAML file.

### 3.4. Page Administration Dashboard

Authenticated users will have access to a dashboard with the following capabilities:

* Upload and update the main page YAML file.
* Upload and manage project YAML files.
* Change the personal page's URL slug (`USER_URL`). When the URL is changed, the old link will become inactive and
  resolve to a 404 error page.
* Select one of two available visual themes for the personal page. The themes will differ only in their color schemes.
* Download a YAML template to guide content creation.
* Download the currently configured YAML file for their main page.

### 3.5. YAML Processing and Validation

* The application will provide a downloadable YAML template containing comments and examples to guide the user.
* Upon upload, the system must validate every YAML file against a predefined schema for both structure and required
  fields.
* If validation fails, the system must provide clear, field-level error messages to the user (e.g., "'bio' is a required
  field but was not found"). Error messages will not include line numbers.
* A successful upload is defined as a file that passes all validation checks.

## 4. Product Boundaries

### 4.1. In Scope (MVP)

* User account creation and administration via Supabase Auth.
* A user dashboard to manage page settings and content.
* Generation of a main personal page from an imported YAML file.
* Generation of project subpages from separate YAML file imports.
* Ability to change the page URL slug.
* Ability to switch between two pre-defined, color-based themes.
* Functionality to download a YAML template and the user's current YAML configuration.
* Server-side validation of all uploaded YAML files with user-friendly error feedback.

### 4.2. Out of Scope

* Creation or use of custom user-defined themes.
* Uploading, hosting, or managing any binary assets like images or screenshots. The MVP YAML schema will not contain
  fields for image URLs.
* Support for custom domains (e.g., pointing `my-name.com` to the user's page).
* Advanced SEO management tools.
* An in-app editor for YAML content; all editing is done offline by the user.
* Version history for page content.

## 5. User Stories

### US-001 - User Account Creation

- Description: As a new user, I want to create an account so that I can access the platform and create my personal page.
- Acceptance Criteria:
  * Given I am a new user on the landing page,
  * When I choose to sign up,
  * Then I am presented with the account creation interface provided by Supabase Auth.
  * And upon successful creation, I am automatically logged in and redirected to my personal dashboard.

### US-002 - User Login

- Description: As a returning user, I want to log in to my account so that I can manage my personal page.
- Acceptance Criteria:
  * Given I am a returning user with an existing account,
  * When I choose to log in,
  * Then I am presented with the login interface.
  * And upon successful authentication, I am redirected to my personal dashboard.

### US-003 - Download YAML Template

- Description: As a new user on my dashboard, I want to download a YAML template so that I know the correct structure and fields for my personal page.
- Acceptance Criteria:
  * Given I am logged in and on my dashboard,
  * When I click the "Download Template" button for the main page,
  * Then a YAML file is downloaded to my device.
  * And the file contains all possible fields with comments explaining their purpose.

### US-004 - Upload Main Page YAML Successfully

- Description: As a user, I want to upload my completed main page YAML file to generate my personal page.
- Acceptance Criteria:
  * Given I am logged in and on my dashboard,
  * When I select a valid YAML file and initiate the upload,
  * Then the system validates the file successfully.
  * And I receive a confirmation message that my page has been created/updated.
  * And my personal page is now live at my designated URL.

### US-005 - Upload Main Page YAML with Errors

- Description: As a user, I want to see clear error messages if I upload a YAML file that is improperly formatted or missing required fields.
- Acceptance Criteria:
  * Given I am logged in and on my dashboard,
  * When I attempt to upload a YAML file with missing required fields or incorrect structure,
  * Then the system rejects the file.
  * And I am shown a specific error message indicating which field is missing or invalid (e.g., "'bio' is a required field but was not found").

### US-006 - Change Personal Page Theme

- Description: As a user, I want to change the theme of my personal page to personalize its appearance.
- Acceptance Criteria:
  * Given I am logged in and have an active personal page,
  * When I select one of the two available themes in my dashboard,
  * Then the change is saved immediately.
  * And when I visit my public page URL, the new color scheme is applied.

### US-007 - Change Personal Page URL

- Description: As a user, I want to change the URL of my personal page so that it is more memorable or relevant.
- Acceptance Criteria:
  * Given I am logged in and on my dashboard,
  * When I enter a new, available URL slug and save it,
  * Then my page becomes immediately accessible at the new URL (`https://{APP_DOMAIN}/page/{NEW_URL}`).
  * And I receive a confirmation message that the URL has been updated.

### US-008 - Old URL Invalidation

- Description: As a user who has changed my page URL, I expect the old URL to no longer be active.
- Acceptance Criteria:
  * Given I have successfully changed my page's URL from `OLD_URL` to `NEW_URL`,
  * When anyone (including me) tries to visit `https://{APP_DOMAIN}/page/{OLD_URL}`,
  * Then they are shown a standard 404 "Not Found" page.

### US-009 - Update Page by Re-uploading YAML

- Description: As a user, I want to update the content on my page by uploading a modified YAML file.
- Acceptance Criteria:
  * Given I have an existing personal page and am logged in to my dashboard,
  * When I upload a new, valid main page YAML file,
  * Then the system overwrites my previous page data with the new content.
  * And when I visit my public page URL, I see the updated information.

### US-010 - Add a Project Subpage

- Description: As a user, I want to add a project to my profile by uploading a separate project YAML file.
- Acceptance Criteria:
  * Given I am logged in and on my dashboard,
  * When I choose to add a project and upload a valid project YAML file,
  * Then the system creates a new project subpage.
  * And the new project appears in the projects list on my main personal page.

### US-011 - View Generated Personal Page

- Description: As an anonymous user, I want to easily view any public-facing personal page.
- Acceptance Criteria:
  * When I click on a personal page link (e.g., `{APP_DOMAIN}/page/user-page`),
  * Then the public personal page opens.
  * And it correctly displays the content from the latest uploaded YAML file.

### US-012 - View Generated Project Page

- Description: As an anonymous user, I want to easily view any public-facing project page.
- Acceptance Criteria:
    * When I click on 'View project' on a public personal page
    * Then the public project page opens.
    * And it correctly displays the content from the latest uploaded project YAML file.

### US-013 - Download Current Configuration

- Description: As a user, I want to download the YAML file that is currently powering my page so I can easily edit it.
- Acceptance Criteria:
  * Given I am logged in and have an active page,
  * When I click the "Download Current YAML" button on my dashboard,
  * Then a YAML file containing my current page's data is downloaded to my device.

### US-014 - User Logout

- Description: As a user, I want to log out of my account to end my session securely.
- Acceptance Criteria:
  * Given I am logged into the application,
  * When I click the "Logout" button,
  * Then my session is terminated.
  * And I am redirected to the public landing page.

## 6. Success Metrics

The success of the Personal Pages MVP will be measured against the following key performance indicators, reflecting user
adoption and engagement.

### 6.1. Primary Metric: Successful Page Setup

* Target: 90% of users who sign up successfully set up their personal page.
* Definition: A "successful setup" is defined as a user uploading their first valid main YAML file that passes all
  system validations. This event marks the user's successful transition from account creation to core product usage.
* Measurement: This will be measured by the ratio: (Number of unique users with at least one successful main YAML
  upload) / (Total number of unique users who have signed up).

### 6.2. Secondary Metric: Project Subpage Adoption

* Target: 80% of active users have at least one project subpage.
* Definition: An "active user" is a user who has successfully set up their main page. This metric measures the adoption
  of a key feature designed for the target audience.
* Measurement: This will be measured by the ratio: (Number of users with at least one successful project YAML
  upload) / (Total number of users who have a successful main page setup).