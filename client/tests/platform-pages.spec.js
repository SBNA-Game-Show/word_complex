import { expect, test } from "@playwright/test";
import {
  mockSharedPlatformApis,
  openAppAsGuest,
  returnToLauncherFromScene,
} from "./helpers/app-fixtures.js";

test.describe("About page", () => {
  test.beforeEach(async ({ page }) => {
    await mockSharedPlatformApis(page);
    await openAppAsGuest(page);
  });

  test("About opens from the launcher and displays its content", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "About", exact: true }).click();

    await expect(page.getByTestId("about-page")).toBeVisible();

    await expect(
      page.getByRole("heading", {
        name: "Word Complex",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", {
        name: "Build stronger readers through playful word puzzles.",
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", {
        name: "Practice with purpose",
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", {
        name: "Short, friendly rounds",
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", {
        name: "Progress feels visible",
      }),
    ).toBeVisible();
  });

  test("About Back returns to the launcher", async ({ page }) => {
    await page.getByRole("button", { name: "About", exact: true }).click();

    await expect(page.getByTestId("about-page")).toBeVisible();

    await page.getByTestId("about-back-button").click();

    await expect(page.getByTestId("launcher-page")).toBeVisible();
  });

  test("About Play now launches Passage Reconstruction", async ({ page }) => {
    await page.getByRole("button", { name: "About", exact: true }).click();

    await page.getByTestId("about-play-button").click();

    await expect(page.getByTestId("game-scene-sentence-builder")).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.getByTestId("zim-sentence-game")).toBeVisible();

    await returnToLauncherFromScene(page, "sentence-builder");
  });
});

test.describe("Passage Reconstruction How to Play", () => {
  test.beforeEach(async ({ page }) => {
    await mockSharedPlatformApis(page);
    await openAppAsGuest(page);

    await page.getByTestId("game-help-sentence-builder").click();

    await expect(
      page.getByTestId("how-to-play-page-sentence-builder"),
    ).toBeVisible();
  });

  test("displays the Passage Reconstruction guide", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        name: "Passage Reconstruction",
        exact: true,
      }),
    ).toBeVisible();

    await expect(page.getByText("The 3 steps", { exact: true })).toBeVisible();

    await expect(
      page.locator('[data-testid^="how-to-play-step-sentence-builder-"]'),
    ).toHaveCount(3);

    await expect(
      page.getByRole("heading", {
        name: "Read the passage pieces",
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", {
        name: "Place them in order",
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", {
        name: "Check the rebuild",
      }),
    ).toBeVisible();

    await expect(
      page.locator('[data-testid^="how-to-play-tip-sentence-builder-"]'),
    ).toHaveCount(4);

    await expect(
      page.getByText("3 attempts per round", { exact: true }),
    ).toBeVisible();
  });

  test("Back returns to the launcher", async ({ page }) => {
    await page.getByTestId("how-to-play-back-sentence-builder").click();

    await expect(page.getByTestId("launcher-page")).toBeVisible();
  });

  test("Play launches Passage Reconstruction", async ({ page }) => {
    await page.getByTestId("how-to-play-play-sentence-builder").click();

    await expect(page.getByTestId("game-scene-sentence-builder")).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.getByTestId("zim-sentence-game")).toBeVisible();

    await returnToLauncherFromScene(page, "sentence-builder");
  });
});

test.describe("Context Cloze Quest How to Play", () => {
  test.beforeEach(async ({ page }) => {
    await mockSharedPlatformApis(page);
    await openAppAsGuest(page);

    await page.getByTestId("game-help-context-cloze-quest").click();

    await expect(
      page.getByTestId("how-to-play-page-context-cloze-quest"),
    ).toBeVisible();
  });

  test("displays the Context Cloze Quest guide", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        name: "Context Cloze Quest",
        exact: true,
      }),
    ).toBeVisible();

    await expect(page.getByText("The 3 steps", { exact: true })).toBeVisible();

    await expect(
      page.locator('[data-testid^="how-to-play-step-context-cloze-quest-"]'),
    ).toHaveCount(3);

    await expect(
      page.getByRole("heading", {
        name: "Read around the blank",
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", {
        name: "Test each choice",
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", {
        name: "Pick the best fit",
      }),
    ).toBeVisible();

    await expect(
      page.locator('[data-testid^="how-to-play-tip-context-cloze-quest-"]'),
    ).toHaveCount(4);

    await expect(
      page.getByText("Context is the clue", { exact: true }),
    ).toBeVisible();
  });

  test("Back returns to the launcher", async ({ page }) => {
    await page.getByTestId("how-to-play-back-context-cloze-quest").click();

    await expect(page.getByTestId("launcher-page")).toBeVisible();
  });

  test("Play launches Context Cloze Quest", async ({ page }) => {
    await page.getByTestId("how-to-play-play-context-cloze-quest").click();

    await expect(
      page.getByTestId("game-scene-context-cloze-quest"),
    ).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.getByTestId("zim-context-cloze-quest")).toBeVisible();

    await returnToLauncherFromScene(page, "context-cloze-quest");
  });
});
