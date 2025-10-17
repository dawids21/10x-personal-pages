import { type Page } from "@playwright/test";

export async function authenticateUser(page: Page): Promise<void> {
  const email = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    throw new Error("Missing required environment variables for authentication");
  }

  await page.goto("/", { waitUntil: "networkidle" });

  const emailInput = page.locator("#signin-email");
  await emailInput.click();
  await emailInput.fill(email);

  const passwordInput = page.locator("#signin-password");
  await passwordInput.click();
  await passwordInput.fill(password);

  const signInButton = page.getByRole("button", { name: "Sign In" });
  await signInButton.click();

  await page.waitForURL("**/app", { timeout: 10000 });
}
