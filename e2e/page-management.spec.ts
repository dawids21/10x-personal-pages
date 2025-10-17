import { authenticateUser } from "./fixtures/auth";
import { InitialPageSetupPage } from "./pages/InitialPageSetupPage.ts";
import { DashboardPage } from "./pages/DashboardPage";
import { PublicPage } from "./pages/PublicPage";
import { expect, test } from "@playwright/test";

test.describe("Page Management", () => {
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
});
