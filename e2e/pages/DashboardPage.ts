import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";
import * as path from "path";
import { fileURLToPath } from "url";

export class DashboardPage {
  readonly page: Page;
  readonly urlInput: Locator;
  readonly updateUrlButton: Locator;
  readonly urlError: Locator;
  readonly themeSelect: Locator;
  readonly saveThemeButton: Locator;
  readonly themeError: Locator;
  readonly uploadPageYamlInput: Locator;
  readonly uploadPageYamlButton: Locator;
  readonly validationErrors: Locator;
  readonly publicPageLink: Locator;
  readonly newProjectButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.urlInput = page.getByTestId("url-input");
    this.updateUrlButton = page.getByTestId("update-url-button");
    this.urlError = page.getByTestId("url-error");
    this.themeSelect = page.getByTestId("theme-select");
    this.saveThemeButton = page.getByTestId("save-theme-button");
    this.themeError = page.getByTestId("theme-error");
    this.uploadPageYamlInput = page.getByTestId("upload-page-yaml-button").locator("input[type='file']");
    this.uploadPageYamlButton = page.getByTestId("upload-page-yaml-button").locator("button");
    this.validationErrors = page.getByTestId("validation-errors");
    this.publicPageLink = page.getByTestId("public-page-link");
    this.newProjectButton = page.getByTestId("new-project-button");
  }

  async goto(): Promise<void> {
    await this.page.goto("/app");
  }

  async clearUrl(): Promise<void> {
    await this.urlInput.fill("");
  }

  async updateUrl(newUrl: string): Promise<void> {
    await this.urlInput.click();
    await this.urlInput.clear();
    await this.urlInput.pressSequentially(newUrl, { delay: 50 });
    await this.page.waitForTimeout(100);
    await this.updateUrlButton.click();

    await expect(this.updateUrlButton).toContainText("Updating");
    await expect(this.updateUrlButton).toContainText("Update URL");
  }

  async changeTheme(theme: string): Promise<void> {
    await this.themeSelect.click();
    await this.page.getByRole("option", { name: theme }).click();
    await this.saveThemeButton.click();

    await expect(this.saveThemeButton).toContainText("Saving");
    await expect(this.saveThemeButton).toContainText("Save Theme");
  }

  async uploadYamlFile(fileName: string): Promise<void> {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const filePath = path.join(__dirname, "..", "fixtures", fileName);
    await this.uploadPageYamlButton.click();
    await this.uploadPageYamlInput.setInputFiles(filePath);

    await expect(this.uploadPageYamlButton).toContainText("Uploading");
    await expect(this.uploadPageYamlButton).toContainText("Upload YAML");
  }

  async expectUrlError(errorMessage: string): Promise<void> {
    await expect(this.urlError).toBeVisible();
    await expect(this.urlError).toContainText(errorMessage);
  }

  async expectValidationErrors(): Promise<void> {
    await expect(this.validationErrors).toBeVisible();
  }

  async expectSuccessToast(message: string): Promise<void> {
    const toast = this.page.locator("[data-sonner-toast]").last();
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toContainText(message);
  }

  async getPublicPageUrl(): Promise<string | null> {
    return await this.publicPageLink.getAttribute("href");
  }

  async openPublicPage(): Promise<void> {
    const url = await this.getPublicPageUrl();
    if (url) {
      await this.page.goto(url);
    } else {
      throw new Error("Public page URL not found");
    }
  }

  async clickNewProject(): Promise<void> {
    await this.newProjectButton.click();
  }

  async expectProjectInList(projectName: string): Promise<void> {
    const projectCard = this.page.getByTestId(`project-list-item-${projectName}`);
    await expect(projectCard).toBeVisible();
  }

  async uploadProjectYaml(projectName: string, fileName: string): Promise<void> {
    const projectCard = this.page.getByTestId(`project-list-item-${projectName}`);
    const uploadButton = projectCard.getByTestId("upload-project-yaml-button").locator("button");
    const uploadInput = projectCard.getByTestId("upload-project-yaml-button").locator("input[type='file']");

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const filePath = path.join(__dirname, "..", "fixtures", fileName);

    await uploadButton.click();
    await uploadInput.setInputFiles(filePath);

    await expect(uploadButton).toContainText("Uploading");
    await expect(uploadButton).toContainText("Upload YAML");
  }

  async expectProjectValidationErrors(projectName: string): Promise<void> {
    const projectCard = this.page.getByTestId(`project-list-item-${projectName}`);
    const validationErrors = projectCard.getByTestId("project-validation-errors");
    await expect(validationErrors).toBeVisible();
  }

  async getProjectOrder(): Promise<string[]> {
    const projectCards = await this.page.getByTestId(/project-list-item-/).all();
    const projectNames: string[] = [];

    for (const card of projectCards) {
      const testId = await card.getAttribute("data-testid");
      if (testId) {
        const name = testId.replace("project-list-item-", "");
        projectNames.push(name);
      }
    }

    return projectNames;
  }

  async clickProjectMoveUp(projectName: string): Promise<void> {
    const projectCard = this.page.getByTestId(`project-list-item-${projectName}`);
    const moveUpButton = projectCard.getByTestId("move-project-up-button");
    await moveUpButton.click();
  }

  async clickProjectMoveDown(projectName: string): Promise<void> {
    const projectCard = this.page.getByTestId(`project-list-item-${projectName}`);
    const moveDownButton = projectCard.getByTestId("move-project-down-button");
    await moveDownButton.click();
  }

  async clickSaveProjectOrder(): Promise<void> {
    const saveButton = this.page.getByTestId("save-project-order-button");
    await saveButton.click();

    await expect(saveButton).toContainText("Saving");
    await expect(saveButton).toBeDisabled();
    await expect(saveButton).not.toBeVisible();
  }

  async expectProjectOrder(expectedOrder: string[]): Promise<void> {
    const actualOrder = await this.getProjectOrder();
    expect(actualOrder).toEqual(expectedOrder);
  }
}
