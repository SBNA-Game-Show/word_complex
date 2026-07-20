import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./adminAuth";

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page);
});

test.describe("Tokenized Stories", () => {

    test.beforeEach(async ({ page }) => {

        await page.goto("/admin.html");

        await page.getByRole("button", {
            name: "Get Tokenized Stories"
        }).click();

        await expect(
            page.getByTestId("admin-tokenized-heading")
        ).toBeVisible();

    });

    test("Tokenized Stories page loads", async ({ page }) => {

        const heading = page.getByTestId(
            "admin-tokenized-heading"
        );

        await expect(heading).toBeVisible();

        await expect(heading).toContainText(
            "Tokenized Stories"
        );

    });

    test("Story Set panel is visible", async ({ page }) => {

        await expect(
            page.getByText("Create Story Set")
        ).toBeVisible();

        await expect(
            page.getByText("Existing Story Sets")
        ).toBeVisible();

    });

    test("Story Set textbox exists", async ({ page }) => {

        await expect(
            page.getByPlaceholder("Enter a Story Set name")
        ).toBeVisible();

    });

    test("Create Story Set button starts disabled", async ({ page }) => {

        await expect(
            page.getByRole("button", {
                name: "Create & Activate Story Set"
            })
        ).toBeDisabled();

    });
    
    test("Select four stories", async ({ page }) => {

        const checkboxes = page.locator(
            '[data-testid^="admin-tokenized-select-"]'
        );

        const count = await checkboxes.count();

        expect(count).toBeGreaterThanOrEqual(4);

        for (let i = 0; i < 4; i++) {
            await checkboxes.nth(i).check();
        }

        for (let i = 0; i < 4; i++) {
            await expect(
                checkboxes.nth(i)
            ).toBeChecked();
        }

    });

    test("Selected Stories counter updates", async ({ page }) => {

        const checkboxes = page.locator(
            '[data-testid^="admin-tokenized-select-"]'
        );

        await checkboxes.nth(0).check();

        await expect(
            page.getByText("Selected Stories:")
        ).toContainText("1 / 4");

        await checkboxes.nth(1).check();

        await expect(
            page.getByText("Selected Stories:")
        ).toContainText("2 / 4");

    });

    test("Category is displayed", async ({ page }) => {

        const firstStory = page
            .locator('[data-testid^="admin-tokenized-story-"]')
            .first();

        await expect(firstStory)
            .toContainText("Category:");

    });

    test("Actors are displayed", async ({ page }) => {

        const firstStory = page
            .locator('[data-testid^="admin-tokenized-story-"]')
            .first();

        await expect(firstStory)
            .toContainText("Actors:");

    });

    test("Existing Story Sets section is visible", async ({ page }) => {

        await expect(
            page.getByText("Existing Story Sets")
        ).toBeVisible();

    });

    test("Story Set name textbox accepts input", async ({ page }) => {

        const textbox = page.getByPlaceholder(
            "Enter a Story Set name"
        );

        await textbox.fill("Playwright Story Set");

        await expect(textbox).toHaveValue(
            "Playwright Story Set"
        );

    });    
});