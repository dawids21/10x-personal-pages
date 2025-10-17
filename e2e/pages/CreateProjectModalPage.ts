import { expect, type Locator, type Page } from "@playwright/test";

export class CreateProjectModalPage {
  readonly page: Page;
  readonly projectNameInput: Locator;
  readonly createButton: Locator;
  readonly modal: Locator;

  constructor(page: Page) {
    this.page = page;
    this.projectNameInput = page.getByTestId("project-name-input");
    this.createButton = page.getByTestId("create-project-button");
    this.modal = page.getByRole("dialog");
  }

  async fillProjectName(name: string) {
    await this.projectNameInput.click();
    await this.projectNameInput.pressSequentially(name);
  }

  async clickCreate() {
    await this.createButton.click();
    // Verify button shows "Creating..." state
    await expect(this.createButton).toContainText("Creating...");
  }

  async waitForClose() {
    await expect(this.modal).not.toBeVisible({ timeout: 10000 });
  }
}
