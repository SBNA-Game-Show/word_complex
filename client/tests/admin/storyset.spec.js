import { test, expect } from "@playwright/test";

test.describe("Story Set Management", () => {

    test.beforeEach(async ({ page }) => {

        await page.goto("/admin.html");

        await page.getByRole("button", {
            name: "Get Tokenized Stories"
        }).click();

        await expect(
            page.getByTestId("admin-tokenized-heading")
        ).toBeVisible();

    });

    test("Create Story Set section is displayed", async ({ page }) => {

        await expect(
            page.getByText("Create Story Set")
        ).toBeVisible();

        await expect(
            page.getByPlaceholder("Enter a Story Set name")
        ).toBeVisible();

    });

    test("Existing Story Sets section is displayed", async ({ page }) => {

        await expect(
            page.getByText("Existing Story Sets")
        ).toBeVisible();

    });

    test("Story Set name textbox accepts text", async ({ page }) => {

        const textbox = page.getByPlaceholder(
            "Enter a Story Set name"
        );

        await textbox.fill("Semester 1 Stories");

        await expect(textbox).toHaveValue(
            "Semester 1 Stories"
        );

    });

    test("Create button is disabled initially", async ({ page }) => {

        await expect(
            page.getByRole("button", {
                name: "Create & Activate Story Set"
            })
        ).toBeDisabled();

    });   
});