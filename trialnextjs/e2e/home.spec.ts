import { test, expect } from "@playwright/test";

test("home page loads Word Complex title", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /word complex/i }),
  ).toBeVisible();

  await expect(
    page.getByText(/passage-based word puzzle platform/i),
  ).toBeVisible();
});
