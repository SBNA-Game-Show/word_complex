import { expect, test } from "@playwright/test";
import {
  MOCK_ACTIVE_STORIES,
  SECOND_TEST_STORY,
  TEST_STORY,
  loginAsGuest,
  mockSharedPlatformApis,
  openAppAsGuest,
  openGameScene,
  returnToLauncherFromScene,
  selectStoryAndOpenLauncher,
} from "./helpers/app-fixtures.js";

test.describe("Story Picker navigation", () => {
  test("guest login is gated by the Story Picker", async ({ page }) => {
    await mockSharedPlatformApis(page);
    await loginAsGuest(page);

    await expect(page.getByTestId("story-picker-page")).toBeVisible();

    await expect(page.locator('[data-testid^="story-card-"]')).toHaveCount(
      MOCK_ACTIVE_STORIES.length,
    );

    await expect(
      page.getByTestId(`story-card-${TEST_STORY.storyId}`),
    ).toContainText(TEST_STORY.title);

    // The initial mandatory picker has no Back action.
    await expect(page.getByTestId("story-picker-back-button")).toHaveCount(0);

    // Confirmation is intentionally absent until a story is selected.
    await expect(page.getByTestId("story-picker-confirm-button")).toHaveCount(
      0,
    );
  });

  test("Story Picker displays its loading state", async ({ page }) => {
    await mockSharedPlatformApis(page, {
      storiesDelayMs: 1_500,
    });

    await loginAsGuest(page);

    await expect(
      page.getByRole("status").filter({ hasText: "Loading stories" }),
    ).toBeVisible();
  });

  test("Story Picker displays an API failure", async ({ page }) => {
    await mockSharedPlatformApis(page, {
      storiesStatus: 503,
    });

    await loginAsGuest(page);

    await expect(page.getByRole("alert")).toContainText(
      "Failed to fetch active stories: 503",
    );

    await expect(page.locator('[data-testid^="story-card-"]')).toHaveCount(0);
  });

  test("Story Picker displays an empty-state message", async ({ page }) => {
    await mockSharedPlatformApis(page, {
      activeStories: [],
    });

    await loginAsGuest(page);

    await expect(
      page.getByText("No stories are active right now. Check back soon!"),
    ).toBeVisible();

    await expect(page.getByTestId("story-picker-confirm-button")).toHaveCount(
      0,
    );
  });

  test("selecting another story clears the previous selection", async ({
    page,
  }) => {
    await mockSharedPlatformApis(page);
    await loginAsGuest(page);

    const firstStory = page.getByTestId(`story-card-${TEST_STORY.storyId}`);
    const secondStory = page.getByTestId(
      `story-card-${SECOND_TEST_STORY.storyId}`,
    );

    await firstStory.click();
    await expect(firstStory).toHaveAttribute("aria-pressed", "true");
    await expect(secondStory).toHaveAttribute("aria-pressed", "false");

    await secondStory.click();
    await expect(firstStory).toHaveAttribute("aria-pressed", "false");
    await expect(secondStory).toHaveAttribute("aria-pressed", "true");

    await page.getByTestId("story-picker-confirm-button").click();

    await expect(page.getByTestId("launcher-page")).toBeVisible();
  });

  test("Change story preserves the current selection and Back keeps it", async ({
    page,
  }) => {
    await mockSharedPlatformApis(page);
    await openAppAsGuest(page);

    await page.getByRole("button", { name: "Change story" }).click();

    await expect(page.getByTestId("story-picker-page")).toBeVisible();

    await expect(
      page.getByTestId(`story-card-${TEST_STORY.storyId}`),
    ).toHaveAttribute("aria-pressed", "true");

    await page.getByTestId("story-picker-back-button").click();

    await expect(page.getByTestId("launcher-page")).toBeVisible();

    // Reopening confirms that Back did not replace the session story.
    await page.getByRole("button", { name: "Change story" }).click();

    await expect(
      page.getByTestId(`story-card-${TEST_STORY.storyId}`),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("logout clears the selected story for the next E2E login", async ({
    page,
  }) => {
    await mockSharedPlatformApis(page);
    await openAppAsGuest(page);

    await page.getByRole("button", { name: "Log out" }).click();

    await expect(page.getByTestId("guest-login-button")).toBeVisible();

    await page.getByTestId("guest-login-button").click();

    await expect(page.getByTestId("story-picker-page")).toBeVisible();

    await expect(
      page.locator('[data-testid^="story-card-"][aria-pressed="true"]'),
    ).toHaveCount(0);

    await expect(page.getByTestId("story-picker-confirm-button")).toHaveCount(
      0,
    );
  });
});

test.describe("Launcher and shared scene navigation", () => {
  test("launcher renders all registered playable game cards", async ({
    page,
  }) => {
    await mockSharedPlatformApis(page);
    await openAppAsGuest(page);

    await expect(page.locator('[data-testid^="game-card-"]')).toHaveCount(4);

    await expect(page.getByTestId("game-card-sentence-builder")).toContainText(
      "Passage Reconstruction",
    );

    await expect(page.getByTestId("game-card-meaning-bridge")).toContainText(
      "Meaning Bridge",
    );

    await expect(
      page.getByTestId("game-card-context-cloze-quest"),
    ).toContainText("Context Cloze Quest");

    await expect(page.getByTestId("game-card-word-hunt")).toContainText(
      "Word Hunt",
    );
  });

  test("progress values appear on the launcher and both APIs are called", async ({
    page,
  }) => {
    const calls = await mockSharedPlatformApis(page);

    await openAppAsGuest(page);

    await expect.poll(() => calls.progressConfig).toBeGreaterThan(0);

    await expect.poll(() => calls.progressVisit).toBeGreaterThan(0);

    await expect(
      page.getByRole("button", { name: "Open daily rewards" }),
    ).toContainText("3 days streak");

    await expect(page.getByText("18 stars", { exact: true })).toBeVisible();
  });

  test("progress API failures do not block Story Picker or Launcher", async ({
    page,
  }) => {
    await mockSharedPlatformApis(page, {
      // Use a client error so the production retry helper does not delay the test.
      progressConfigStatus: 400,
      progressVisitStatus: 400,
    });

    await openAppAsGuest(page);

    await expect(page.getByTestId("launcher-page")).toBeVisible();

    await expect(page.getByTestId("game-card-sentence-builder")).toBeVisible();
  });

  test("Passage Reconstruction opens in GameScene and returns", async ({
    page,
  }) => {
    await mockSharedPlatformApis(page);
    await openAppAsGuest(page);

    await openGameScene(page, {
      gameId: "sentence-builder",
      zimTestId: "zim-sentence-game",
    });

    await returnToLauncherFromScene(page, "sentence-builder");
  });

  test("Context Cloze Quest opens in GameScene and returns", async ({
    page,
  }) => {
    await mockSharedPlatformApis(page);
    await openAppAsGuest(page);

    await openGameScene(page, {
      gameId: "context-cloze-quest",
      zimTestId: "zim-context-cloze-quest",
    });

    await returnToLauncherFromScene(page, "context-cloze-quest");
  });

  test("rapid launch clicks still mount only one shared scene", async ({
    page,
  }) => {
    await mockSharedPlatformApis(page);
    await openAppAsGuest(page);

    const startButton = page.getByTestId("game-start-sentence-builder");

    // Trigger two immediate DOM clicks to exercise the launch transition guard.
    await startButton.evaluate((button) => {
      button.click();
      button.click();
    });

    await expect(page.getByTestId("game-scene-sentence-builder")).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.getByTestId("game-scene-sentence-builder")).toHaveCount(
      1,
    );
  });

  test("selected story remains active after returning from a game scene", async ({
    page,
  }) => {
    await mockSharedPlatformApis(page);
    await openAppAsGuest(page);

    await openGameScene(page, {
      gameId: "sentence-builder",
      zimTestId: "zim-sentence-game",
    });

    await returnToLauncherFromScene(page, "sentence-builder");

    await page.getByRole("button", { name: "Change story" }).click();

    await expect(
      page.getByTestId(`story-card-${TEST_STORY.storyId}`),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("Meaning Bridge opens in GameScene and returns", async ({ page }) => {
    await mockSharedPlatformApis(page);
    await openAppAsGuest(page);

    await openGameScene(page, {
      gameId: "meaning-bridge",
      zimTestId: "zim-meaning-bridge",
    });

    await returnToLauncherFromScene(page, "meaning-bridge");
  });

  test("Word Hunt opens in GameScene and returns", async ({ page }) => {
    await mockSharedPlatformApis(page);
    await openAppAsGuest(page);

    await openGameScene(page, {
      gameId: "word-hunt",
      zimTestId: "word-hunt",
    });

    await returnToLauncherFromScene(page, "word-hunt");
  });

  test("shared canvas zoom changes, resets, and enforces its minimum", async ({
    page,
  }) => {
    await mockSharedPlatformApis(page);
    await openAppAsGuest(page);

    await openGameScene(page, {
      gameId: "sentence-builder",
      zimTestId: "zim-sentence-game",
    });

    const scene = page.getByTestId("game-scene-sentence-builder");

    const zoomIn = page.getByRole("button", {
      name: "Zoom in",
    });

    const zoomOut = page.getByRole("button", {
      name: "Zoom out",
    });

    const resetZoom = page.getByRole("button", {
      name: "Reset zoom",
    });

    await expect(page.getByText("100%", { exact: true })).toBeVisible();

    await zoomIn.click();
    await zoomIn.click();

    await expect(page.getByText("120%", { exact: true })).toBeVisible();

    await expect
      .poll(() =>
        scene.evaluate((element) =>
          element.style.getPropertyValue("--canvas-zoom"),
        ),
      )
      .toBe("1.2");

    await expect
      .poll(() =>
        page.evaluate(() => window.localStorage.getItem("wc:canvasZoom")),
      )
      .toBe("1.2");

    await resetZoom.click();

    await expect(page.getByText("100%", { exact: true })).toBeVisible();

    for (let index = 0; index < 5; index += 1) {
      await zoomOut.click();
    }

    await expect(page.getByText("50%", { exact: true })).toBeVisible();

    await expect(zoomOut).toBeDisabled();

    await expect
      .poll(() =>
        scene.evaluate((element) =>
          element.style.getPropertyValue("--canvas-zoom"),
        ),
      )
      .toBe("0.5");

    await returnToLauncherFromScene(page, "sentence-builder");
  });

  test("canvas zoom persists when moving between game scenes", async ({
    page,
  }) => {
    await mockSharedPlatformApis(page);
    await openAppAsGuest(page);

    await openGameScene(page, {
      gameId: "sentence-builder",
      zimTestId: "zim-sentence-game",
    });

    await page
      .getByRole("button", {
        name: "Zoom in",
      })
      .click();

    await expect(page.getByText("110%", { exact: true })).toBeVisible();

    await returnToLauncherFromScene(page, "sentence-builder");

    await openGameScene(page, {
      gameId: "word-hunt",
      zimTestId: "word-hunt",
    });

    await expect(page.getByText("110%", { exact: true })).toBeVisible();

    await expect
      .poll(() =>
        page
          .getByTestId("game-scene-word-hunt")
          .evaluate((element) =>
            element.style.getPropertyValue("--canvas-zoom"),
          ),
      )
      .toBe("1.1");

    await expect
      .poll(() =>
        page.evaluate(() => window.localStorage.getItem("wc:canvasZoom")),
      )
      .toBe("1.1");

    await returnToLauncherFromScene(page, "word-hunt");
  });
});
