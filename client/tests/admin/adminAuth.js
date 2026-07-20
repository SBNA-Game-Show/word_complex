import { expect } from "@playwright/test";

export async function loginAsAdmin(page) {
  await page.goto("/");

  // Only log in if the login form is shown.
  const loginButton = page.getByTestId("login-button");

  if (await loginButton.isVisible().catch(() => false)) {
    await page.getByTestId("email-input").fill(
      "wordcomplexadmin@gmail.com"
    );

    await page.getByTestId("password-input").fill(
      "Admin11223344#"
    );

    await loginButton.click();
  }

  // Wait until authentication completes.
  await page.waitForLoadState("networkidle");

  // Open the admin page.
  await page.goto("/admin");

  await expect(page).toHaveURL(/admin/);
}