import { type Page, type Locator, expect } from "@playwright/test";
import * as path from "path";
import { fileURLToPath } from "url";

export class InitialPageSetupPage {
  readonly page: Page;
  readonly urlInput: Locator;
  readonly themeSelect: Locator;
  readonly uploadPageYamlButton: Locator;
  readonly createPageButton: Locator;
  readonly urlError: Locator;
  readonly validationErrors: Locator;

  constructor(page: Page) {
    this.page = page;
    this.urlInput = page.getByTestId("url-input");
    this.themeSelect = page.getByTestId("theme-select");
    this.uploadPageYamlButton = page.getByTestId("upload-page-yaml-button").locator("button");
    this.createPageButton = page.getByTestId("create-page-button");
    this.urlError = page.getByTestId("url-error");
    this.validationErrors = page.getByTestId("validation-errors");
  }

  async goto(): Promise<void> {
    await this.page.goto("/app");
  }

  async fillUrl(url: string): Promise<void> {
    await this.urlInput.click();
    await this.urlInput.pressSequentially(url, { delay: 50 });
  }

  async selectTheme(theme: string): Promise<void> {
    await this.themeSelect.click();
    await this.page.getByRole("option", { name: theme }).click();
  }

  async uploadYamlFile(fileName: string): Promise<void> {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const filePath = path.join(__dirname, "..", "fixtures", fileName);

    const fileChooserPromise = this.page.waitForEvent("filechooser");
    await this.uploadPageYamlButton.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);
  }

  async clickCreatePage(): Promise<void> {
    await this.createPageButton.click();
    await expect(this.createPageButton).toContainText("Creating");
  }

  async createPage(url: string, theme: string, yamlFileName?: string): Promise<void> {
    await this.fillUrl(url);
    await this.selectTheme(theme);

    if (yamlFileName) {
      await this.uploadYamlFile(yamlFileName);
    }

    await this.clickCreatePage();
  }

  async waitForRedirectToDashboard(): Promise<void> {
    await this.page.waitForURL("**/app", { timeout: 5000 });
  }
}
