import { authenticateUser } from "./fixtures/auth";
import { InitialPageSetupPage } from "./pages/InitialPageSetupPage.ts";
import { DashboardPage } from "./pages/DashboardPage";
import { PublicPage } from "./pages/PublicPage";
import { CreateProjectModalPage } from "./pages/CreateProjectModalPage";
import { PublicProjectPage } from "./pages/PublicProjectPage";
import { expect, test } from "@playwright/test";
import { cleanupDatabase } from "./fixtures/cleanup.ts";

test.describe("Page Management", () => {
  test.beforeEach(async () => {
    await cleanupDatabase();
  });

  test("Complete page management flow", async ({ page }) => {
    const setupPage = new InitialPageSetupPage(page);
    const dashboard = new DashboardPage(page);
    const publicPage = new PublicPage(page);

    await authenticateUser(page);

    // User creates a new page and verifies its public URL
    await setupPage.goto();
    await setupPage.createPage("test-user-page", "Ocean", "valid-page.yaml");
    await setupPage.waitForRedirectToDashboard();
    const publicPageUrl = await dashboard.getPublicPageUrl();
    expect(publicPageUrl).toContain("/page/test-user-page");

    // User opens a public page and verifies content
    await publicPage.goto("test-user-page");
    await publicPage.expectContentMatches({
      name: "John Doe",
      bio: "Software Engineer with 10 years of experience in web development and cloud architecture.",
      contactInfo: [
        { label: "Email", value: "john.doe@example.com" },
        { label: "Phone", value: "+1 234 567 8900" },
        { label: "LinkedIn", value: "https://linkedin.com/in/johndoe" },
      ],
      experience: ["Senior Software Engineer at Tech Corp", "Software Developer at StartupXYZ"],
      education: ["Master of Science in Computer Science", "Bachelor of Science in Software Engineering"],
      skills: ["JavaScript", "TypeScript", "React", "Node.js", "AWS"],
    });

    // User updates page data by uploading YAML
    await dashboard.goto();
    await dashboard.uploadYamlFile("updated-page.yaml");
    await dashboard.expectSuccessToast("Page data updated successfully");
    await dashboard.openPublicPage();
    await publicPage.expectContentMatches({
      name: "John Doe - Updated",
      bio: "Updated bio: Senior Software Architect specializing in distributed systems and cloud-native applications.",
      contactInfo: [
        { label: "Email", value: "john.updated@example.com" },
        { label: "Twitter", value: "@johndoe_tech" },
      ],
      experience: ["Lead Software Architect at MegaCorp", "Senior Software Engineer at Tech Corp"],
      education: ["PhD in Computer Science", "Master of Science in Computer Science"],
      skills: ["Kubernetes", "Docker", "TypeScript", "Go", "System Design"],
    });

    // User changes page theme
    await dashboard.goto();
    await dashboard.changeTheme("Earth");
    await dashboard.expectSuccessToast("Theme updated successfully");
    await dashboard.openPublicPage();
    await publicPage.expectTheme("earth");

    // Attempt to update URL to a reserved word
    await dashboard.goto();
    await dashboard.updateUrl("privacy");
    await dashboard.expectUrlError("This URL is reserved and cannot be used");
    await dashboard.clearUrl();

    // Attempt to save an invalid YAML format
    await dashboard.uploadYamlFile("invalid-page.yaml");
    await dashboard.expectValidationErrors();
  });

  test("Complete project upload flow", async ({ page }) => {
    // Initialize page objects
    const setupPage = new InitialPageSetupPage(page);
    const dashboard = new DashboardPage(page);
    const publicPage = new PublicPage(page);
    const createProjectModal = new CreateProjectModalPage(page);
    const publicProjectPage = new PublicProjectPage(page);

    // Phase 1: Initial Setup
    await authenticateUser(page);
    await setupPage.goto();
    await setupPage.createPage("test-user-page", "Ocean", "valid-page.yaml");
    await setupPage.waitForRedirectToDashboard();

    // Phase 2: Create Project
    await dashboard.clickNewProject();
    await createProjectModal.fillProjectName("My Test Project");
    await createProjectModal.clickCreate();
    await createProjectModal.waitForClose();
    await dashboard.expectSuccessToast("Project created successfully");
    await dashboard.expectProjectInList("My Test Project");

    // Verify project is visible on public page
    await publicPage.goto("test-user-page");
    await publicPage.expectProjectInList("My Test Project");

    // Phase 3: Upload Invalid Project YAML
    await dashboard.goto();
    await dashboard.uploadProjectYaml("My Test Project", "invalid-project.yaml");
    await dashboard.expectProjectValidationErrors("My Test Project");

    // Phase 4: Upload Valid Project YAML
    await dashboard.uploadProjectYaml("My Test Project", "valid-project.yaml");
    await dashboard.expectSuccessToast("Project data updated successfully");

    // Navigate to public page and click project to view details
    await publicPage.goto("test-user-page");
    await publicPage.clickProject("My Test Project");

    // Wait for navigation to project detail page
    await page.waitForURL(/\/page\/test-user-page\/projects\/.+/);

    // Verify all project data on the project detail page
    await publicProjectPage.expectProjectData({
      name: "Full Stack E-Commerce Platform",
      description:
        "A comprehensive e-commerce platform with real-time inventory management, secure payment processing, and advanced analytics. Built with modern technologies to ensure scalability and performance.",
      tech_stack: "React, Node.js, PostgreSQL, Redis, Docker, AWS",
      prod_link: "https://example-ecommerce.com",
      start_date: new Date("2024-01-15"),
      end_date: new Date("2025-06-30"),
    });
  });

  test("Complete project reordering flow", async ({ page }) => {
    // Initialize page objects
    const setupPage = new InitialPageSetupPage(page);
    const dashboard = new DashboardPage(page);
    const publicPage = new PublicPage(page);
    const createProjectModal = new CreateProjectModalPage(page);

    // Phase 1: Initial Setup
    await authenticateUser(page);
    await setupPage.goto();
    await setupPage.createPage("test-user-page", "Ocean", "valid-page.yaml");
    await setupPage.waitForRedirectToDashboard();

    // Phase 2: Create Three Projects
    // Create Project Alpha
    await dashboard.clickNewProject();
    await createProjectModal.fillProjectName("Project Alpha");
    await createProjectModal.clickCreate();
    await createProjectModal.waitForClose();
    await dashboard.expectSuccessToast("Project created successfully");
    await dashboard.expectProjectInList("Project Alpha");

    // Create Project Beta
    await dashboard.clickNewProject();
    await createProjectModal.fillProjectName("Project Beta");
    await createProjectModal.clickCreate();
    await createProjectModal.waitForClose();
    await dashboard.expectSuccessToast("Project created successfully");
    await dashboard.expectProjectInList("Project Beta");

    // Create Project Gamma
    await dashboard.clickNewProject();
    await createProjectModal.fillProjectName("Project Gamma");
    await createProjectModal.clickCreate();
    await createProjectModal.waitForClose();
    await dashboard.expectSuccessToast("Project created successfully");
    await dashboard.expectProjectInList("Project Gamma");

    // Phase 3: Verify Initial Order on Public Page
    await publicPage.goto("test-user-page");
    await publicPage.expectProjectOrder(["Project Alpha", "Project Beta", "Project Gamma"]);

    // Phase 4: Reorder Projects on Dashboard
    await dashboard.goto();
    // Move "Project Gamma" to the top (click up twice)
    await dashboard.clickProjectMoveUp("Project Gamma");
    await dashboard.clickProjectMoveDown("Project Alpha");
    // Verify order changed on dashboard
    await dashboard.expectProjectOrder(["Project Gamma", "Project Alpha", "Project Beta"]);
    // Save the new order
    await dashboard.clickSaveProjectOrder();

    // Phase 5: Verify New Order on Public Page
    await publicPage.goto("test-user-page");
    await publicPage.expectProjectOrder(["Project Gamma", "Project Alpha", "Project Beta"]);
  });
});
