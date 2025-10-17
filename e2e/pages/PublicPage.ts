import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export class PublicPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(userUrl: string): Promise<void> {
    await this.page.goto(`/page/${userUrl}`);
  }

  async expectPageTitle(expectedName: string): Promise<void> {
    const nameHeading = this.page.locator("h1").first();
    await expect(nameHeading).toBeVisible();
    await expect(nameHeading).toContainText(expectedName);
  }

  async expectBio(expectedBio: string): Promise<void> {
    await expect(this.page.locator("body")).toContainText(expectedBio);
  }

  async expectContactInfo(label: string, value: string): Promise<void> {
    const contactSection = this.page.locator("body");
    await expect(contactSection).toContainText(label);
    await expect(contactSection).toContainText(value);
  }

  async expectExperience(jobTitle: string): Promise<void> {
    await expect(this.page.locator("body")).toContainText(jobTitle);
  }

  async expectEducation(schoolTitle: string): Promise<void> {
    await expect(this.page.locator("body")).toContainText(schoolTitle);
  }

  async expectSkill(skillName: string): Promise<void> {
    await expect(this.page.locator("body")).toContainText(skillName);
  }

  async expectTheme(theme: "ocean" | "earth"): Promise<void> {
    const bodyClasses = await this.page.locator("html").getAttribute("class");
    expect(bodyClasses).toContain(theme);
  }

  async expectContentMatches(content: {
    name?: string;
    bio?: string;
    contactInfo?: { label: string; value: string }[];
    experience?: string[];
    education?: string[];
    skills?: string[];
  }): Promise<void> {
    if (content.name) {
      await this.expectPageTitle(content.name);
    }

    if (content.bio) {
      await this.expectBio(content.bio);
    }

    if (content.contactInfo) {
      for (const contact of content.contactInfo) {
        await this.expectContactInfo(contact.label, contact.value);
      }
    }

    if (content.experience) {
      for (const exp of content.experience) {
        await this.expectExperience(exp);
      }
    }

    if (content.education) {
      for (const edu of content.education) {
        await this.expectEducation(edu);
      }
    }

    if (content.skills) {
      for (const skill of content.skills) {
        await this.expectSkill(skill);
      }
    }
  }

  async expectProjectInList(projectName: string): Promise<void> {
    await expect(this.page.locator("body")).toContainText(projectName);
  }

  async clickProject(projectName: string): Promise<void> {
    const projectCard = this.page.locator(`[data-project-name="${projectName}"]`);
    const viewLink = projectCard.locator('a[aria-label*="View"]');
    await viewLink.click();
  }

  async getProjectOrder(): Promise<string[]> {
    const projectElements = await this.page.locator("[data-project-name]").all();
    const projectNames: string[] = [];

    for (const element of projectElements) {
      const name = await element.getAttribute("data-project-name");
      if (name) {
        projectNames.push(name);
      }
    }

    return projectNames;
  }

  async expectProjectOrder(expectedOrder: string[]): Promise<void> {
    const actualOrder = await this.getProjectOrder();
    expect(actualOrder).toEqual(expectedOrder);
  }
}
