import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./adminAuth";

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page);
});

test.describe("Admin Page", () => {

    test.beforeEach(async ({ page }) => {
        await page.goto("/admin.html");
    });

    test("Admin page loads successfully", async ({ page }) => {

        await expect(
            page.getByRole("heading", { name: "Word Complex Admin" })
        ).toBeVisible();

        await expect(
            page.getByRole("button", { name: "Get Tokenized Stories" })
        ).toBeVisible();

        await expect(
            page.getByRole("button", { name: "Refresh" })
        ).toBeVisible();

        await expect(
            page.getByRole("button", { name: "Edit Tokenized Stories" })
        ).toBeVisible();

        await expect(
            page.getByText("Available Stories")
        ).toBeVisible();

    });

    test("Available Stories section is displayed by default", async ({ page }) => {

        await expect(
            page.getByText("Available Stories")
        ).toBeVisible();

        await expect(
            page.getByText("Stories from LearnSanskrit.cc")
        ).toBeVisible();

        await expect(
            page.getByText("Stories from Sanskrit.Samskrutam.com")
        ).toBeVisible();

    });

    test("Learn Sanskrit section expands", async ({ page }) => {

        await page.getByText("Stories from LearnSanskrit.cc").click();

        await expect(
            page.getByRole("button", { name: "Write Metadata" }).first()
        ).toBeVisible();

    });

    test("Learn Sanskrit section collapses", async ({ page }) => {

        await page.getByText("Stories from LearnSanskrit.cc").click();

        await expect(
            page.getByRole("button", { name: "Write Metadata" }).first()
        ).toBeVisible();

        await page.getByText("Stories from LearnSanskrit.cc").click();

        await expect(
            page.getByRole("button", { name: "Write Metadata" }).first()
        ).toBeHidden();

    });

    test("Samskrutam section expands", async ({ page }) => {

        await page.getByText("Stories from Sanskrit.Samskrutam.com").click();

        await expect(
            page.getByRole("button", { name: "Write Metadata" }).last()
        ).toBeVisible();

    });

    test("Refresh button returns page to Available Stories", async ({ page }) => {

        await page.getByText("Stories from LearnSanskrit.cc").click();

        await page.getByRole("button", {
            name: "Refresh"
        }).click();

        await expect(
            page.getByText("Available Stories")
        ).toBeVisible();

    });
    test("Story Set name textbox is visible", async ({ page }) => {

        await page.getByRole("button", {
            name: "Get Tokenized Stories"
        }).click();

        await expect(
            page.getByPlaceholder("Enter a Story Set name")
        ).toBeVisible();

    });

    test("Create Story Set button is disabled initially", async ({ page }) => {

        await page.getByRole("button", {
            name: "Get Tokenized Stories"
        }).click();

        await expect(
            page.getByRole("button", {
                name: "Create & Activate Story Set"
            })
        ).toBeDisabled();

    });
});