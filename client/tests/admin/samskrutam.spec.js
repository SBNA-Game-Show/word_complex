import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./adminAuth";

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page);
});

test.describe("Samskrutam Stories", () => {

    test.beforeEach(async ({ page }) => {

        await page.goto("/admin.html");

        // Expand Samskrutam section
        await page.getByText("Stories from Sanskrit.Samskrutam.com").click();

    });

    test("Samskrutam section expands successfully", async ({ page }) => {

        await expect(
            page.getByRole("button", {
                name: "Write Metadata",
            }).last()
        ).toBeVisible();

    });

    test("Story cards are displayed", async ({ page }) => {

        await expect(
            page.locator("details").first()
        ).toBeVisible({
            timeout: 30000,
        });

        const stories = page.locator("details");

        expect(await stories.count()).toBeGreaterThan(0);

    });

    test("Story titles are displayed", async ({ page }) => {

        await expect(
            page.locator("summary").first()
        ).toBeVisible({
            timeout: 30000,
        });

    });

    test("First story expands successfully", async ({ page }) => {

        const firstStory = page.locator("details").first();

        await firstStory.locator("summary").click();

        await expect(
            firstStory.getByRole("button", {
                name: "Download Story",
            })
        ).toBeVisible();

    });

    test("Download Story button exists", async ({ page }) => {

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
            }).last()
        ).toBeVisible();

    });

    test("Write Metadata button is enabled", async ({ page }) => {

        await expect(
            page.getByRole("button", {
                name: "Write Metadata",
            }).last()
        ).toBeEnabled();

    });

    test("Write Metadata action", async ({ page }) => {

        page.once("dialog", async dialog => {

            expect(dialog.message()).not.toBe("");

            await dialog.accept();

        });

        await page.getByRole("button", {
            name: "Write Metadata",
        }).last().click();

    });

    test("Download Story action", async ({ page }) => {

        const firstStory = page.locator("details").first();

        await firstStory.locator("summary").click();

        page.once("dialog", async dialog => {

            expect(dialog.message()).not.toBe("");

            await dialog.accept();

        });

        await firstStory.getByRole("button", {
            name: "Download Story",
        }).click();

    });   

    test("Collapse Samskrutam section", async ({ page }) => {

        await page.getByText("Stories from Sanskrit.Samskrutam.com").click();

        await expect(
            page.getByRole("button", {
                name: "Write Metadata",
            }).last()
        ).toBeHidden();

    });

});