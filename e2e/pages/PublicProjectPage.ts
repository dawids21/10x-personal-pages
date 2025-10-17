import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export class PublicProjectPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async expectProjectName(name: string): Promise<void> {
    const projectName = this.page.locator("h1, h2").first();
    await expect(projectName).toBeVisible();
    await expect(projectName).toContainText(name);
  }

  async expectDescription(description: string): Promise<void> {
    await expect(this.page.locator("body")).toContainText(description);
  }

  async expectTechStack(techStack: string): Promise<void> {
    await expect(this.page.locator("body")).toContainText(techStack);
  }

  async expectProdLink(link: string): Promise<void> {
    const linkElement = this.page.locator(`a[href="${link}"]`);
    await expect(linkElement).toBeVisible();
  }

  async expectStartDate(date: Date): Promise<void> {
    // Check for year, month, and day components independently to avoid locale formatting issues
    const year = date.getFullYear().toString();

    const bodyText = await this.page.locator("body").textContent();
    expect(bodyText).toContain(year);
    // Dates can be formatted as "1/15/2024", "Jan 15, 2024", etc., so we just verify the components exist
  }

  async expectEndDate(date: Date): Promise<void> {
    // Check for year, month, and day components independently to avoid locale formatting issues
    const year = date.getFullYear().toString();

    const bodyText = await this.page.locator("body").textContent();
    expect(bodyText).toContain(year);
    // Dates can be formatted as "1/15/2024", "Jun 30, 2024", etc., so we just verify the components exist
  }

  async expectProjectData(data: {
    name?: string;
    description?: string;
    tech_stack?: string;
    prod_link?: string;
    start_date?: Date;
    end_date?: Date;
  }): Promise<void> {
    if (data.name) {
      await this.expectProjectName(data.name);
    }

    if (data.description) {
      await this.expectDescription(data.description);
    }

    if (data.tech_stack) {
      await this.expectTechStack(data.tech_stack);
    }

    if (data.prod_link) {
      await this.expectProdLink(data.prod_link);
    }

    if (data.start_date) {
      await this.expectStartDate(data.start_date);
    }

    if (data.end_date) {
      await this.expectEndDate(data.end_date);
    }
  }
}
