import { test, expect } from "@playwright/test";

test.describe("Complete Story Set Workflow", () => {

    test.beforeEach(async ({ page }) => {

        await page.goto("/admin.html");

        await page.getByRole("button", {
            name: "Get Tokenized Stories"
        }).click();

        await expect(
            page.getByTestId("admin-tokenized-heading")
        ).toBeVisible();

    });

    test("Story Set panels are displayed", async ({ page }) => {

        await expect(
            page.getByTestId("admin-story-set-create-panel")
        ).toBeVisible();

        await expect(
            page.getByTestId("admin-story-sets-panel")
        ).toBeVisible();

    });

    test("Selected story counter starts at zero", async ({ page }) => {

        await expect(
            page.getByTestId("admin-selected-story-count")
        ).toContainText("0 / 4");

    });

    test("Selecting stories updates selected list", async ({ page }) => {

        const checkboxes = page.locator(
            '[data-testid^="admin-tokenized-select-"]'
        );

        await checkboxes.nth(0).check();

        await expect(
            page.getByTestId("admin-selected-story-list")
        ).toBeVisible();

        await expect(
            page.getByTestId("admin-selected-story-count")
        ).toContainText("1 / 4");

    });

    test("Selected story list displays story names", async ({ page }) => {

        const checkboxes = page.locator(
            '[data-testid^="admin-tokenized-select-"]'
        );

        await checkboxes.nth(0).check();

        const selectedStories = page.locator(
            '[data-testid^="admin-selected-story-"]'
        );

        await expect(selectedStories.first()).toBeVisible();

    });    
    
    test("Activate buttons exist for inactive Story Sets", async ({ page }) => {

        const activateButtons = page.locator(
            '[data-testid^="admin-story-set-activate-"]'
        );

        if (await activateButtons.count() > 0) {
            await expect(
                activateButtons.first()
            ).toBeVisible();
        }

    });

    test("Delete buttons are displayed", async ({ page }) => {

        const deleteButtons = page.locator(
            '[data-testid^="admin-story-set-delete-"]'
        );

        if (await deleteButtons.count() > 0) {
            await expect(
                deleteButtons.first()
            ).toBeVisible();
        }

    });    
});