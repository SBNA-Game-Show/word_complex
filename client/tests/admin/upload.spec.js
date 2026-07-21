import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./adminAuth";

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page);
});

test.describe("Upload Story", () => {

    test.beforeEach(async ({ page }) => {

        await page.goto("/admin.html");

    });

    test("Upload section is displayed", async ({ page }) => {

        await expect(
            page.getByRole("button", {
                name: "Upload",
            })
        ).toBeVisible();

        await expect(
            page.getByText("No file selected")
        ).toBeVisible();

    });

    test("Choose File input exists", async ({ page }) => {

        const fileInput = page.locator('input[type="file"]');

        await expect(fileInput).toBeAttached();

    });
    
    test("Upload button is enabled", async ({ page }) => {

        await expect(
            page.getByRole("button", {
                name: "Upload",
            })
        ).toBeEnabled();

    });
    
    test("Upload section remains visible after refresh", async ({ page }) => {

        await page.getByRole("button", {
            name: "Refresh",
        }).click();

        await expect(
            page.getByRole("button", {
                name: "Upload",
            })
        ).toBeVisible();

        await expect(
            page.getByText("Available Stories")
        ).toBeVisible();

    });

});