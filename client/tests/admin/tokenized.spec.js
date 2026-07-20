import { test, expect } from "@playwright/test";

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

    test("Cannot select more than four stories", async ({ page }) => {

        const checkboxes = page.locator(
            '[data-testid^="admin-tokenized-select-"]'
        );

        const count = await checkboxes.count();

        if (count < 5) {
            test.skip();
        }

        for (let i = 0; i < 4; i++) {
            await checkboxes.nth(i).check();
        }

        await checkboxes.nth(4).click();

        await expect(
            checkboxes.nth(4)
        ).not.toBeChecked();

    });

    test("Create button enabled after selecting four stories", async ({ page }) => {

        const checkboxes = page.locator(
            '[data-testid^="admin-tokenized-select-"]'
        );

        for (let i = 0; i < 4; i++) {
            await checkboxes.nth(i).check();
        }

        await page
            .getByPlaceholder("Enter a Story Set name")
            .fill("Playwright Test Story Set");

        await expect(
            page.getByRole("button", {
                name: "Create & Activate Story Set"
            })
        ).toBeEnabled();

    });

    test("Selected story card is highlighted", async ({ page }) => {

        const card = page
            .locator('[data-testid^="admin-tokenized-story-"]')
            .first();

        const checkbox = page
            .locator('[data-testid^="admin-tokenized-select-"]')
            .first();

        await checkbox.check();

        await expect(card).toHaveAttribute(
            "data-selected",
            "true"
        );

    });
        test("View English Text expands", async ({ page }) => {

        const firstStory = page
            .locator('[data-testid^="admin-tokenized-story-"]')
            .first();

        await firstStory
            .getByText("View English Text")
            .click();

        const details = firstStory.locator("details");

        await expect(details).toHaveAttribute("open", "");

    });

    test("Story title is displayed", async ({ page }) => {

        const title = page.locator(
            '[data-testid^="admin-tokenized-story-"] h3'
        ).first();

        await expect(title).toBeVisible();

        await expect(title).not.toHaveText("");

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