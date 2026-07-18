import { expect, test } from "@playwright/test";
import {
  MOCK_LEARN_STORIES,
  MOCK_SANSKRIT_STORIES,
  MOCK_TOKENIZED_STORIES,
  mockAdminApis,
} from "./helpers/admin-fixtures.js";

async function openAdmin(page) {
  await page.goto("/admin");

  await expect(page.getByTestId("admin-page")).toBeVisible({
    timeout: 15_000,
  });

  await expect(
    page.getByRole("heading", {
      name: "Word Complex Admin",
      exact: true,
    }),
  ).toBeVisible();
}

async function performDialogAction(page, action, expectedMessage) {
  const dialogHandled = new Promise((resolve, reject) => {
    page.once("dialog", async (dialog) => {
      try {
        expect(dialog.message()).toBe(expectedMessage);
        await dialog.accept();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });

  // The browser dialog blocks the click handler until it is accepted, so the
  // dialog listener and the triggering action must run concurrently.
  await Promise.all([dialogHandled, action()]);
}

async function performConfirmAction(
  page,
  action,
  expectedMessage,
  shouldAccept,
) {
  const dialogHandled = new Promise((resolve, reject) => {
    page.once("dialog", async (dialog) => {
      try {
        expect(dialog.type()).toBe("confirm");
        expect(dialog.message()).toBe(expectedMessage);

        if (shouldAccept) {
          await dialog.accept();
        } else {
          await dialog.dismiss();
        }

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });

  await Promise.all([dialogHandled, action()]);
}

async function openTokenizedView(page) {
  await page.getByTestId("admin-get-tokenized-button").click();

  await expect(page.getByTestId("admin-tokenized-heading")).toBeVisible({
    timeout: 15_000,
  });
}

test.describe("Admin story sources", () => {
  test("Admin page renders and loads Story Sets without contacting live APIs", async ({
    page,
  }) => {
    const calls = await mockAdminApis(page);

    await openAdmin(page);

    await expect.poll(() => calls.storySetsGet).toBeGreaterThan(0);

    await expect(
      page.getByRole("heading", {
        name: "Available Stories",
        exact: true,
      }),
    ).toBeVisible();

    await expect(page.getByTestId("admin-learn-toggle")).toHaveAttribute(
      "data-expanded",
      "false",
    );

    await expect(page.getByTestId("admin-sanskrit-toggle")).toHaveAttribute(
      "data-expanded",
      "false",
    );
  });

  test.describe("Admin tokenized stories and Story Sets", () => {
    test("Get Tokenized Stories renders stories and existing Story Sets", async ({
      page,
    }) => {
      const calls = await mockAdminApis(page);

      await openAdmin(page);
      await openTokenizedView(page);

      await expect(page.getByTestId("admin-tokenized-heading")).toContainText(
        "Tokenized Stories (5)",
      );

      await expect(
        page.locator('[data-testid^="admin-tokenized-story-"]'),
      ).toHaveCount(MOCK_TOKENIZED_STORIES.length);

      await expect(
        page.getByTestId("admin-tokenized-story-tokenized-story-1"),
      ).toContainText("River Rescue");

      await expect(
        page.locator('[data-testid^="admin-story-set-"]').filter({
          hasNot: page.locator('[data-testid^="admin-story-set-active-"]'),
        }),
      ).not.toHaveCount(0);

      await expect(
        page.getByTestId("admin-story-set-story-set-active"),
      ).toHaveAttribute("data-active", "true");

      await expect(
        page.getByTestId("admin-story-set-active-story-set-active"),
      ).toContainText("Active");

      await expect.poll(() => calls.tokenizedGetAll).toBe(1);

      await expect.poll(() => calls.storySetsGet).toBeGreaterThanOrEqual(2);
    });

    test("tokenized-story loading state is visible while the source is pending", async ({
      page,
    }) => {
      await mockAdminApis(page, {
        tokenizedDelayMs: 1_500,
      });

      await openAdmin(page);

      await page.getByTestId("admin-get-tokenized-button").click();

      await expect(page.getByTestId("admin-loading")).toBeVisible();

      await expect(page.getByTestId("admin-tokenized-heading")).toBeVisible({
        timeout: 10_000,
      });
    });

    test("an empty tokenized result displays a zero-count view safely", async ({
      page,
    }) => {
      await mockAdminApis(page, {
        tokenizedStories: [],
      });

      await openAdmin(page);
      await openTokenizedView(page);

      await expect(page.getByTestId("admin-tokenized-heading")).toContainText(
        "Tokenized Stories (0)",
      );

      await expect(
        page.locator('[data-testid^="admin-tokenized-story-"]'),
      ).toHaveCount(0);

      await expect(
        page.getByTestId("admin-story-set-create-button"),
      ).toBeDisabled();
    });

    test("selecting and deselecting a story updates the count and selected list", async ({
      page,
    }) => {
      await mockAdminApis(page);

      await openAdmin(page);
      await openTokenizedView(page);

      const checkbox = page.getByTestId(
        "admin-tokenized-select-tokenized-story-1",
      );

      const card = page.getByTestId("admin-tokenized-story-tokenized-story-1");

      await checkbox.check();

      await expect(checkbox).toBeChecked();
      await expect(card).toHaveAttribute("data-selected", "true");

      await expect(
        page.getByTestId("admin-selected-story-count"),
      ).toContainText("1 / 4");

      await expect(
        page.getByTestId("admin-selected-story-tokenized-story-1"),
      ).toContainText("River Rescue");

      await checkbox.uncheck();

      await expect(checkbox).not.toBeChecked();
      await expect(card).toHaveAttribute("data-selected", "false");

      await expect(
        page.getByTestId("admin-selected-story-count"),
      ).toContainText("0 / 4");

      await expect(page.getByTestId("admin-selected-story-list")).toHaveCount(
        0,
      );
    });

    test("a fifth selected story is rejected and the first four remain selected", async ({
      page,
    }) => {
      await mockAdminApis(page);

      await openAdmin(page);
      await openTokenizedView(page);

      for (const id of [
        "tokenized-story-1",
        "tokenized-story-2",
        "tokenized-story-3",
        "tokenized-story-4",
      ]) {
        await page.getByTestId(`admin-tokenized-select-${id}`).check();
      }

      await expect(
        page.getByTestId("admin-selected-story-count"),
      ).toContainText("4 / 4");

      const fifth = page.getByTestId(
        "admin-tokenized-select-tokenized-story-5",
      );

      await performDialogAction(
        page,
        () => fifth.click(),
        "You can only select up to 4 stories.",
      );

      await expect(fifth).not.toBeChecked();

      await expect(
        page.getByTestId("admin-selected-story-count"),
      ).toContainText("4 / 4");

      for (const id of [
        "tokenized-story-1",
        "tokenized-story-2",
        "tokenized-story-3",
        "tokenized-story-4",
      ]) {
        await expect(
          page.getByTestId(`admin-tokenized-select-${id}`),
        ).toBeChecked();
      }
    });

    test("Story Set creation requires a selection and a non-empty name", async ({
      page,
    }) => {
      const calls = await mockAdminApis(page);

      await openAdmin(page);
      await openTokenizedView(page);

      const createButton = page.getByTestId("admin-story-set-create-button");

      await expect(createButton).toBeDisabled();

      await page
        .getByTestId("admin-tokenized-select-tokenized-story-1")
        .check();

      await expect(createButton).toBeEnabled();

      await performDialogAction(
        page,
        () => createButton.click(),
        "Please enter a Story Set name.",
      );

      expect(calls.storySetsCreate).toBe(0);
      expect(calls.storySetsActivate).toBe(0);
    });

    test("creating a Story Set sends the selected IDs and automatically activates it", async ({
      page,
    }) => {
      const calls = await mockAdminApis(page);

      await openAdmin(page);
      await openTokenizedView(page);

      await page
        .getByTestId("admin-tokenized-select-tokenized-story-1")
        .check();

      await page
        .getByTestId("admin-tokenized-select-tokenized-story-2")
        .check();

      await page
        .getByTestId("admin-story-set-name-input")
        .fill("Playwright Story Set");

      await performDialogAction(
        page,
        () => page.getByTestId("admin-story-set-create-button").click(),
        "Story Set created and activated.",
      );

      await expect.poll(() => calls.storySetsCreate).toBe(1);

      await expect.poll(() => calls.storySetsActivate).toBe(1);

      expect(calls.lastStorySetCreateBody).toEqual({
        name: "Playwright Story Set",
        storyIds: ["tokenized-story-1", "tokenized-story-2"],
      });

      expect(calls.lastStorySetActivateBody).toEqual({
        setId: "story-set-created-1",
      });

      const createdCard = page.getByTestId(
        "admin-story-set-story-set-created-1",
      );

      await expect(createdCard).toBeVisible();
      await expect(createdCard).toContainText("Playwright Story Set");
      await expect(createdCard).toHaveAttribute("data-active", "true");

      await expect(
        page.getByTestId("admin-story-set-active-story-set-created-1"),
      ).toBeVisible();

      await expect(
        page.getByTestId("admin-story-set-story-set-active"),
      ).toHaveAttribute("data-active", "false");

      await expect(
        page.getByTestId("admin-selected-story-count"),
      ).toContainText("0 / 4");

      await expect(page.getByTestId("admin-story-set-name-input")).toHaveValue(
        "",
      );
    });

    test("failed Story Set creation preserves the entered name and selection", async ({
      page,
    }) => {
      const calls = await mockAdminApis(page, {
        storySetCreateStatus: 409,
        storySetCreateMessage: "A Story Set with these stories already exists.",
      });

      await openAdmin(page);
      await openTokenizedView(page);

      await page
        .getByTestId("admin-tokenized-select-tokenized-story-1")
        .check();

      const nameInput = page.getByTestId("admin-story-set-name-input");

      await nameInput.fill("Duplicate Story Set");

      await performDialogAction(
        page,
        () => page.getByTestId("admin-story-set-create-button").click(),
        "A Story Set with these stories already exists.",
      );

      expect(calls.storySetsCreate).toBe(1);
      expect(calls.storySetsActivate).toBe(0);

      await expect(nameInput).toHaveValue("Duplicate Story Set");

      await expect(
        page.getByTestId("admin-tokenized-select-tokenized-story-1"),
      ).toBeChecked();

      await expect(
        page.getByTestId("admin-selected-story-count"),
      ).toContainText("1 / 4");
    });

    test("an inactive Story Set can be activated", async ({ page }) => {
      const calls = await mockAdminApis(page);

      await openAdmin(page);
      await openTokenizedView(page);

      await performDialogAction(
        page,
        () =>
          page
            .getByTestId("admin-story-set-activate-story-set-inactive")
            .click(),
        "Story Set activated.",
      );

      await expect.poll(() => calls.storySetsActivate).toBe(1);

      expect(calls.lastStorySetActivateBody).toEqual({
        setId: "story-set-inactive",
      });

      await expect(
        page.getByTestId("admin-story-set-story-set-inactive"),
      ).toHaveAttribute("data-active", "true");

      await expect(
        page.getByTestId("admin-story-set-story-set-active"),
      ).toHaveAttribute("data-active", "false");
    });

    test("deleting an inactive Story Set respects cancel and confirm", async ({
      page,
    }) => {
      const calls = await mockAdminApis(page);

      await openAdmin(page);
      await openTokenizedView(page);

      const deleteButton = page.getByTestId(
        "admin-story-set-delete-story-set-inactive",
      );

      await performConfirmAction(
        page,
        () => deleteButton.click(),
        "Delete this Story Set?",
        false,
      );

      expect(calls.storySetsDelete).toBe(0);

      await expect(
        page.getByTestId("admin-story-set-story-set-inactive"),
      ).toBeVisible();

      await performConfirmAction(
        page,
        () => deleteButton.click(),
        "Delete this Story Set?",
        true,
      );

      await expect.poll(() => calls.storySetsDelete).toBe(1);

      expect(calls.lastStorySetDeleteId).toBe("story-set-inactive");

      await expect(
        page.getByTestId("admin-story-set-story-set-inactive"),
      ).toHaveCount(0);
    });

    test("the active Story Set cannot be deleted from the UI", async ({
      page,
    }) => {
      const calls = await mockAdminApis(page);

      await openAdmin(page);
      await openTokenizedView(page);

      await expect(
        page.getByTestId("admin-story-set-delete-story-set-active"),
      ).toBeDisabled();

      expect(calls.storySetsDelete).toBe(0);
    });

    test("a Story Set list failure shows the server error while Admin remains available", async ({
      page,
    }) => {
      const calls = await mockAdminApis(page, {
        storySetsStatus: 500,
      });

      await performDialogAction(
        page,
        () => page.goto("/admin"),
        "Failed to load Story Sets",
      );

      await expect(page.getByTestId("admin-page")).toBeVisible();

      await expect(
        page.getByRole("heading", {
          name: "Word Complex Admin",
          exact: true,
        }),
      ).toBeVisible();

      expect(calls.storySetsGet).toBeGreaterThanOrEqual(1);
    });

    test("Edit Tokenized Stories navigates to the editor without a live API request", async ({
      page,
    }) => {
      const calls = await mockAdminApis(page);

      await openAdmin(page);

      await page.getByTestId("admin-open-tokenized-editor-button").click();

      await expect(page).toHaveURL(/\/tokenized-editor$/);

      await expect(
        page.getByRole("heading", {
          name: "Tokenized Story Editor",
          exact: true,
        }),
      ).toBeVisible({
        timeout: 15_000,
      });

      await expect.poll(() => calls.tokenizedEditorGet).toBeGreaterThan(0);
    });
  });

  test("LearnSanskrit stories load lazily and are requested only once", async ({
    page,
  }) => {
    const calls = await mockAdminApis(page, {
      learnDelayMs: 800,
    });

    await openAdmin(page);

    const toggle = page.getByTestId("admin-learn-toggle");
    await toggle.click();

    await expect(toggle).toHaveAttribute("data-expanded", "true");

    await expect(page.getByTestId("admin-learn-loading")).toBeVisible();

    await expect(
      page.locator('[data-testid^="admin-learn-story-"]'),
    ).toHaveCount(MOCK_LEARN_STORIES.length);

    await expect(
      page.getByTestId("admin-learn-story-learn-story-1"),
    ).toContainText("The Clever Crow");

    await expect.poll(() => calls.learnGetAll).toBe(1);

    await toggle.click();
    await expect(toggle).toHaveAttribute("data-expanded", "false");

    await toggle.click();
    await expect(toggle).toHaveAttribute("data-expanded", "true");

    expect(calls.learnGetAll).toBe(1);
  });

  test("Sanskrit stories load lazily and are requested only once", async ({
    page,
  }) => {
    const calls = await mockAdminApis(page, {
      sanskritDelayMs: 800,
    });

    await openAdmin(page);

    const toggle = page.getByTestId("admin-sanskrit-toggle");
    await toggle.click();

    await expect(toggle).toHaveAttribute("data-expanded", "true");

    await expect(page.getByTestId("admin-sanskrit-loading")).toBeVisible();

    await expect(
      page.locator('[data-testid^="admin-sanskrit-story-"]'),
    ).toHaveCount(MOCK_SANSKRIT_STORIES.length);

    await expect(
      page.getByTestId("admin-sanskrit-story-sanskrit-story-1"),
    ).toContainText("The Wise Deer");

    await expect.poll(() => calls.sanskritGetUnused).toBe(1);

    await toggle.click();
    await toggle.click();

    expect(calls.sanskritGetUnused).toBe(1);
  });

  test("LearnSanskrit story download sends the selected story ID", async ({
    page,
  }) => {
    const calls = await mockAdminApis(page);

    await openAdmin(page);
    await page.getByTestId("admin-learn-toggle").click();

    const storyCard = page.getByTestId("admin-learn-story-learn-story-1");

    await expect(storyCard).toBeVisible();

    // The existing Download button is intentionally contained inside a native
    // collapsed details element, so open the story before clicking it.
    await storyCard.locator("summary").click();

    const downloadButton = page.getByTestId(
      "admin-learn-download-learn-story-1",
    );

    await expect(downloadButton).toBeVisible();

    await performDialogAction(
      page,
      () => downloadButton.click(),
      "Learn story downloaded successfully.",
    );

    expect(calls.learnDownload).toBe(1);
    expect(calls.lastLearnDownloadUrl).toContain("story_id=learn-story-1");
  });

  test("failed Sanskrit story download displays the existing failure alert", async ({
    page,
  }) => {
    const calls = await mockAdminApis(page, {
      sanskritDownloadStatus: 500,
    });

    await openAdmin(page);
    await page.getByTestId("admin-sanskrit-toggle").click();

    const storyCard = page.getByTestId("admin-sanskrit-story-sanskrit-story-1");

    await expect(storyCard).toBeVisible();

    // The Download control is inside the story's collapsed details section.
    await storyCard.locator("summary").click();

    const downloadButton = page.getByTestId(
      "admin-sanskrit-download-sanskrit-story-1",
    );

    await expect(downloadButton).toBeVisible();

    await performDialogAction(
      page,
      () => downloadButton.click(),
      "Failed to download story",
    );

    expect(calls.sanskritDownload).toBe(1);
  });

  test("both metadata actions send their expected workflow requests", async ({
    page,
  }) => {
    const calls = await mockAdminApis(page);

    await openAdmin(page);

    await page.getByTestId("admin-learn-toggle").click();

    await performDialogAction(
      page,
      () => page.getByTestId("admin-learn-metadata-button").click(),
      "LearnSanskrit metadata generated.",
    );

    expect(calls.learnMetadata).toBe(1);
    expect(calls.lastLearnMetadataBody?.workflow).toEqual([
      "Fetches Meta data from LearnSanskrit.cc",
      "Cleans and normalizes text",
      "Stores processed output in MongoDB Atlas",
    ]);

    await page.getByTestId("admin-sanskrit-toggle").click();

    await performDialogAction(
      page,
      () => page.getByTestId("admin-sanskrit-metadata-button").click(),
      "Samskrutam metadata generated.",
    );

    expect(calls.sanskritMetadata).toBe(1);
    expect(calls.lastSanskritMetadataBody?.workflow).toEqual([
      "Fetches Meta data from sanskrit.samskrutam.com",
      "Cleans and normalizes text",
      "Stores processed output in MongoDB Atlas",
    ]);
  });

  test("Upload requires a selected file", async ({ page }) => {
    const calls = await mockAdminApis(page);

    await openAdmin(page);

    await performDialogAction(
      page,
      () => page.getByTestId("admin-upload-button").click(),
      "Please choose a file.",
    );

    expect(calls.upload).toBe(0);
  });

  test("successful upload sends multipart data and clears the selected filename", async ({
    page,
  }) => {
    const calls = await mockAdminApis(page);

    await openAdmin(page);

    await page.getByTestId("admin-upload-input").setInputFiles({
      name: "playwright-story.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          title: "Playwright Admin Story",
        }),
      ),
    });

    await expect(page.getByTestId("admin-upload-filename")).toContainText(
      "playwright-story.json",
    );

    await performDialogAction(
      page,
      () => page.getByTestId("admin-upload-button").click(),
      "E2E story uploaded successfully.",
    );

    expect(calls.upload).toBe(1);
    expect(calls.lastUploadContentType).toContain("multipart/form-data");
    expect(calls.lastUploadBody).toContain("playwright-story.json");

    await expect(page.getByTestId("admin-upload-filename")).toContainText(
      "No file selected",
    );
  });

  test("Refresh collapses both sources and returns to clean available-story state", async ({
    page,
  }) => {
    await mockAdminApis(page);

    await openAdmin(page);

    await page.getByTestId("admin-learn-toggle").click();
    await page.getByTestId("admin-sanskrit-toggle").click();

    await expect(page.getByTestId("admin-learn-toggle")).toHaveAttribute(
      "data-expanded",
      "true",
    );

    await expect(page.getByTestId("admin-sanskrit-toggle")).toHaveAttribute(
      "data-expanded",
      "true",
    );

    await page.getByTestId("admin-refresh-button").click();

    await expect(page.getByTestId("admin-learn-toggle")).toHaveAttribute(
      "data-expanded",
      "false",
    );

    await expect(page.getByTestId("admin-sanskrit-toggle")).toHaveAttribute(
      "data-expanded",
      "false",
    );

    await expect(
      page.locator('[data-testid^="admin-learn-story-"]'),
    ).toHaveCount(0);

    await expect(
      page.locator('[data-testid^="admin-sanskrit-story-"]'),
    ).toHaveCount(0);

    await expect(page.getByTestId("admin-upload-filename")).toContainText(
      "No file selected",
    );
  });
});
