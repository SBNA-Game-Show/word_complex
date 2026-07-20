import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./adminAuth";

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page);
});

test.describe("Learn Sanskrit Stories", () => {

    test.beforeEach(async ({ page }) => {
        await page.goto("/admin.html");

        // Expand Learn Sanskrit section
        await page.getByText("Stories from LearnSanskrit.cc").click();
    });

    test("Learn Sanskrit section expands successfully", async ({ page }) => {

        await expect(
            page.getByRole("button", { name: "Write Metadata" }).first()
        ).toBeVisible();

    });

    test("Story cards are displayed after expanding", async ({ page }) => {

        // Wait until at least one story card is displayed
        await expect(page.locator("details").first()).toBeVisible({
            timeout: 30000
        });

        const stories = page.locator("details");

        await expect(stories.first()).toBeVisible();

        expect(await stories.count()).toBeGreaterThan(0);

    });

    test("Story titles are displayed", async ({ page }) => {

        await expect(page.locator("details").first()).toBeVisible({
            timeout: 30000
        });

        const summaries = page.locator("summary");

        await expect(summaries.first()).toBeVisible();

    });

    test("First story can be expanded", async ({ page }) => {

        await expect(page.locator("details").first()).toBeVisible({
            timeout: 30000
        });

        const firstStory = page.locator("details").first();

        await firstStory.locator("summary").click();

        await expect(
            firstStory.getByRole("button", {
                name: "Download Story",
            })
        ).toBeVisible();

    });

    test("Download Story button exists", async ({ page }) => {

        await expect(page.locator("details").first()).toBeVisible({
            timeout: 30000
        });

        const firstStory = page.locator("details").first();

        await firstStory.locator("summary").click();

        await expect(
            firstStory.getByRole("button", {
                name: "Download Story",
            })
        ).toBeVisible();

    });

    test("Write Metadata button exists", async ({ page }) => {

        await expect(
            page.getByRole("button", {
                name: "Write Metadata",
            }).first()
        ).toBeVisible();

    });

    test("Write Metadata button is enabled", async ({ page }) => {

        await expect(
            page.getByRole("button", {
                name: "Write Metadata",
            }).first()
        ).toBeEnabled();

    });

    test("Click Write Metadata", async ({ page }) => {

        page.once("dialog", async dialog => {

            expect(dialog.message()).not.toBe("");

            await dialog.accept();

        });

        await page.getByRole("button", {
            name: "Write Metadata",
        }).first().click();

    });

    test("Collapse Learn Sanskrit section", async ({ page }) => {

        await page.getByText("Stories from LearnSanskrit.cc").click();

        await expect(
            page.getByRole("button", {
                name: "Write Metadata",
            }).first()
        ).toBeHidden();

    });

});