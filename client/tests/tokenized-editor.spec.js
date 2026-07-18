import { expect, test } from "@playwright/test";
import {
  MOCK_TOKENIZED_EDITOR_STORIES,
  mockAdminApis,
} from "./helpers/admin-fixtures.js";

function cloneTestData(value) {
  return JSON.parse(JSON.stringify(value));
}

function createEmptySanskritStory() {
  const story = cloneTestData(MOCK_TOKENIZED_EDITOR_STORIES[0]);

  return {
    ...story,
    _id: "editor-story-empty-sanskrit",
    title: {
      englishversion: "Empty Sanskrit Story",
      sanskritversion: "रिक्तसंस्कृतकथा",
    },
    category: "E2E Empty",
    tokenized_sanskrit_version: [],
  };
}

function createLegacyFlatSanskritStory() {
  const story = cloneTestData(MOCK_TOKENIZED_EDITOR_STORIES[0]);

  return {
    ...story,
    _id: "editor-story-flat-sanskrit",
    title: {
      englishversion: "Legacy Flat Sanskrit Story",
      sanskritversion: "प्राचीनसंस्कृतकथा",
    },
    category: "E2E Legacy",
    tokenized_sanskrit_version: [
      {
        text: "रामः",
        lemma: "राम",
        upos: "NOUN",
        xpos: "NNP",
        feats: "Case=Nom|Number=Sing",
        definition: "Rama",
      },
      {
        text: "गच्छति",
        lemma: "गम्",
        upos: "VERB",
        xpos: "V",
        feats: "Tense=Pres",
        definition: "goes",
      },
    ],
  };
}

async function expandEnglishEditor(page, storyId) {
  const toggle = page.getByTestId(`tokenized-editor-english-toggle-${storyId}`);

  await toggle.click();

  await expect(toggle).toHaveAttribute("aria-expanded", "true");

  await expect(
    page.getByTestId(`tokenized-editor-english-panel-${storyId}`),
  ).toBeVisible();
}

async function openTokenizedEditor(page) {
  await page.goto("/tokenized-editor");

  await expect(page.getByTestId("tokenized-editor-page")).toBeVisible({
    timeout: 15_000,
  });

  await expect(
    page.getByRole("heading", {
      name: "Tokenized Story Editor",
      exact: true,
    }),
  ).toBeVisible();
}

async function expandStory(page, storyId) {
  const toggle = page.getByTestId(`tokenized-editor-story-toggle-${storyId}`);

  await toggle.click();

  await expect(toggle).toHaveAttribute("aria-expanded", "true");

  await expect(
    page.getByTestId(`tokenized-editor-expanded-${storyId}`),
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

  await Promise.all([dialogHandled, action()]);
}

test.describe("Tokenized Editor loading and filtering", () => {
  test("loads all tokenized stories and builds category options", async ({
    page,
  }) => {
    const calls = await mockAdminApis(page);

    await openTokenizedEditor(page);

    await expect(page.getByTestId("tokenized-editor-count")).toContainText(
      "Showing 3 of 3 stories",
    );

    await expect(
      page.locator('[data-testid^="tokenized-editor-story-"]').filter({
        has: page.locator('[data-testid^="tokenized-editor-story-toggle-"]'),
      }),
    ).toHaveCount(MOCK_TOKENIZED_EDITOR_STORIES.length);

    await expect(
      page.getByTestId("tokenized-editor-story-editor-story-1"),
    ).toContainText("River Rescue");

    const categoryFilter = page.getByTestId("tokenized-editor-category-filter");

    await expect(categoryFilter.locator("option")).toHaveCount(4);

    await expect
      .poll(() =>
        categoryFilter
          .locator("option")
          .evaluateAll((options) => options.map((option) => option.value)),
      )
      .toEqual(["All", "Adventure", "Nature", "Moral"]);

    await expect.poll(() => calls.tokenizedEditorGet).toBeGreaterThanOrEqual(1);
  });

  test("shows the loading state while stories are pending", async ({
    page,
  }) => {
    await mockAdminApis(page, {
      tokenizedEditorDelayMs: 1_500,
    });

    await page.goto("/tokenized-editor");

    await expect(page.getByTestId("tokenized-editor-loading")).toBeVisible();

    await expect(page.getByTestId("tokenized-editor-count")).toContainText(
      "Showing 3 of 3 stories",
      {
        timeout: 10_000,
      },
    );
  });

  test("load failure shows the API message while keeping the editor available", async ({
    page,
  }) => {
    await mockAdminApis(page, {
      tokenizedEditorStatus: 503,
    });

    await performDialogAction(
      page,
      () => page.goto("/tokenized-editor"),
      "Tokenized editor stories unavailable.",
    );

    await expect(page.getByTestId("tokenized-editor-page")).toBeVisible();

    await expect(page.getByTestId("tokenized-editor-count")).toContainText(
      "Showing 0 of 0 stories",
    );
  });

  test("search matches an English title", async ({ page }) => {
    await mockAdminApis(page);
    await openTokenizedEditor(page);

    await page.getByTestId("tokenized-editor-search-input").fill("moonlit");

    await expect(page.getByTestId("tokenized-editor-count")).toContainText(
      "Showing 1 of 3 stories",
    );

    await expect(
      page.getByTestId("tokenized-editor-story-editor-story-2"),
    ).toBeVisible();

    await expect(
      page.getByTestId("tokenized-editor-story-editor-story-1"),
    ).toHaveCount(0);
  });

  test("search matches a Sanskrit title", async ({ page }) => {
    await mockAdminApis(page);
    await openTokenizedEditor(page);

    await page.getByTestId("tokenized-editor-search-input").fill("सत्यवान्");

    await expect(page.getByTestId("tokenized-editor-count")).toContainText(
      "Showing 1 of 3 stories",
    );

    await expect(
      page.getByTestId("tokenized-editor-story-editor-story-3"),
    ).toBeVisible();
  });

  test("search matches a category", async ({ page }) => {
    await mockAdminApis(page);
    await openTokenizedEditor(page);

    await page.getByTestId("tokenized-editor-search-input").fill("adventure");

    await expect(page.getByTestId("tokenized-editor-count")).toContainText(
      "Showing 1 of 3 stories",
    );

    await expect(
      page.getByTestId("tokenized-editor-story-editor-story-1"),
    ).toBeVisible();
  });

  test("category filter limits the visible stories", async ({ page }) => {
    await mockAdminApis(page);
    await openTokenizedEditor(page);

    await page
      .getByTestId("tokenized-editor-category-filter")
      .selectOption("Nature");

    await expect(page.getByTestId("tokenized-editor-count")).toContainText(
      "Showing 1 of 3 stories",
    );

    await expect(
      page.getByTestId("tokenized-editor-story-editor-story-2"),
    ).toBeVisible();
  });

  test("combined filters can produce a safe zero-result state", async ({
    page,
  }) => {
    await mockAdminApis(page);
    await openTokenizedEditor(page);

    await page
      .getByTestId("tokenized-editor-category-filter")
      .selectOption("Nature");

    await page.getByTestId("tokenized-editor-search-input").fill("merchant");

    await expect(page.getByTestId("tokenized-editor-count")).toContainText(
      "Showing 0 of 3 stories",
    );

    await expect(
      page.locator('[data-testid^="tokenized-editor-story-"]').filter({
        has: page.locator('[data-testid^="tokenized-editor-story-toggle-"]'),
      }),
    ).toHaveCount(0);
  });

  test("Clear Filters restores every story", async ({ page }) => {
    await mockAdminApis(page);
    await openTokenizedEditor(page);

    await page
      .getByTestId("tokenized-editor-category-filter")
      .selectOption("Nature");

    await page.getByTestId("tokenized-editor-search-input").fill("moonlit");

    await page.getByTestId("tokenized-editor-clear-filters").click();

    await expect(page.getByTestId("tokenized-editor-search-input")).toHaveValue(
      "",
    );

    await expect(
      page.getByTestId("tokenized-editor-category-filter"),
    ).toHaveValue("All");

    await expect(page.getByTestId("tokenized-editor-count")).toContainText(
      "Showing 3 of 3 stories",
    );
  });

  test("Refresh issues another story request", async ({ page }) => {
    const calls = await mockAdminApis(page);

    await openTokenizedEditor(page);

    const initialRequests = calls.tokenizedEditorGet;

    await page.getByTestId("tokenized-editor-refresh-button").click();

    await expect
      .poll(() => calls.tokenizedEditorGet)
      .toBeGreaterThan(initialRequests);

    await expect(page.getByTestId("tokenized-editor-count")).toContainText(
      "Showing 3 of 3 stories",
    );
  });
});

test.describe("Tokenized Editor expansion and general editing", () => {
  test("expanding a story displays its editor and temporarily hides other cards", async ({
    page,
  }) => {
    await mockAdminApis(page);
    await openTokenizedEditor(page);

    await expandStory(page, "editor-story-1");

    const card = page.getByTestId("tokenized-editor-story-editor-story-1");

    await expect(card).toHaveAttribute("data-expanded", "true");

    await expect(
      page.getByTestId("tokenized-editor-story-editor-story-2"),
    ).toHaveCount(0);

    await expect(
      page.getByTestId("tokenized-editor-moral-editor-story-1"),
    ).toHaveValue("Teamwork helps solve difficult problems.");

    await expect(
      page.getByTestId("tokenized-editor-sanskrit-version-editor-story-1-0"),
    ).toBeVisible();

    await expect(
      page.getByTestId("tokenized-editor-transliterated-editor-story-1-0"),
    ).toBeVisible();
  });

  test("collapsing an expanded story restores the filtered card grid", async ({
    page,
  }) => {
    await mockAdminApis(page);
    await openTokenizedEditor(page);

    const toggle = page.getByTestId(
      "tokenized-editor-story-toggle-editor-story-1",
    );

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");

    await expect(page.getByTestId("tokenized-editor-count")).toContainText(
      "Showing 3 of 3 stories",
    );

    await expect(
      page.getByTestId("tokenized-editor-story-editor-story-2"),
    ).toBeVisible();
  });

  test("editing a general field marks the story dirty and enables Save and Discard", async ({
    page,
  }) => {
    await mockAdminApis(page);
    await openTokenizedEditor(page);
    await expandStory(page, "editor-story-1");

    const moral = page.getByTestId("tokenized-editor-moral-editor-story-1");

    await moral.fill("Updated E2E moral.");

    await expect(
      page.getByTestId("tokenized-editor-unsaved-editor-story-1"),
    ).toContainText("Unsaved Changes");

    await expect(
      page.getByTestId("tokenized-editor-story-editor-story-1"),
    ).toHaveAttribute("data-dirty", "true");

    await expect(
      page.getByTestId("tokenized-editor-save-editor-story-1"),
    ).toBeEnabled();

    await expect(
      page.getByTestId("tokenized-editor-discard-editor-story-1"),
    ).toBeEnabled();
  });

  test("Discard restores the original field values and clears dirty state", async ({
    page,
  }) => {
    await mockAdminApis(page);
    await openTokenizedEditor(page);
    await expandStory(page, "editor-story-1");

    const moral = page.getByTestId("tokenized-editor-moral-editor-story-1");

    await moral.fill("Discard this change.");

    await page.getByTestId("tokenized-editor-discard-editor-story-1").click();

    await expect(moral).toHaveValue("Teamwork helps solve difficult problems.");

    await expect(
      page.getByTestId("tokenized-editor-unsaved-editor-story-1"),
    ).toHaveCount(0);

    await expect(
      page.getByTestId("tokenized-editor-story-editor-story-1"),
    ).toHaveAttribute("data-dirty", "false");

    await expect(
      page.getByTestId("tokenized-editor-save-editor-story-1"),
    ).toBeDisabled();

    await expect(
      page.getByTestId("tokenized-editor-discard-editor-story-1"),
    ).toBeDisabled();
  });

  test("successful save sends the complete editable payload and clears dirty state", async ({
    page,
  }) => {
    const calls = await mockAdminApis(page);

    await openTokenizedEditor(page);
    await expandStory(page, "editor-story-1");

    await page
      .getByTestId("tokenized-editor-moral-editor-story-1")
      .fill("Saved E2E moral.");

    await page
      .getByTestId("tokenized-editor-sanskrit-version-editor-story-1-0")
      .fill("संशोधितं संस्कृतवाक्यम्।");

    await page
      .getByTestId("tokenized-editor-transliterated-editor-story-1-0")
      .fill("saṃśodhitaṃ saṃskṛtavākyam");

    await performDialogAction(
      page,
      () => page.getByTestId("tokenized-editor-save-editor-story-1").click(),
      "Story updated successfully!",
    );

    await expect.poll(() => calls.tokenizedEditorPut).toBe(1);

    expect(calls.lastTokenizedEditorPutId).toBe("editor-story-1");

    expect(calls.lastTokenizedEditorPutBody).toEqual({
      storyMoral: "Saved E2E moral.",
      transliteratedVersion: [
        "saṃśodhitaṃ saṃskṛtavākyam",
        "sahakāryeṇa kaṭhinaṃ kāryaṃ siddham",
      ],
      sanskritVersion: [
        "संशोधितं संस्कृतवाक्यम्।",
        "सहकार्येण कठिनं कार्यं सिद्धम्।",
      ],
      tokenized_english_version:
        MOCK_TOKENIZED_EDITOR_STORIES[0].tokenized_english_version,
      tokenized_sanskrit_version:
        MOCK_TOKENIZED_EDITOR_STORIES[0].tokenized_sanskrit_version,
    });

    await expect.poll(() => calls.tokenizedEditorGet).toBeGreaterThanOrEqual(2);

    await expect(
      page.getByTestId("tokenized-editor-unsaved-editor-story-1"),
    ).toHaveCount(0);

    await expect(
      page.getByTestId("tokenized-editor-save-editor-story-1"),
    ).toBeDisabled();

    await expect(
      page.getByTestId("tokenized-editor-moral-editor-story-1"),
    ).toHaveValue("Saved E2E moral.");
  });

  test("failed save preserves the user's edits and dirty state", async ({
    page,
  }) => {
    const calls = await mockAdminApis(page, {
      tokenizedEditorPutStatus: 500,
      tokenizedEditorPutMessage: "Editor save rejected for E2E test.",
    });

    await openTokenizedEditor(page);
    await expandStory(page, "editor-story-1");

    const moral = page.getByTestId("tokenized-editor-moral-editor-story-1");

    await moral.fill("Preserve this failed edit.");

    await performDialogAction(
      page,
      () => page.getByTestId("tokenized-editor-save-editor-story-1").click(),
      "Editor save rejected for E2E test.",
    );

    expect(calls.tokenizedEditorPut).toBe(1);

    await expect(moral).toHaveValue("Preserve this failed edit.");

    await expect(
      page.getByTestId("tokenized-editor-unsaved-editor-story-1"),
    ).toBeVisible();

    await expect(
      page.getByTestId("tokenized-editor-save-editor-story-1"),
    ).toBeEnabled();
  });

  test("Back to Admin returns to the Admin page", async ({ page }) => {
    await mockAdminApis(page);
    await openTokenizedEditor(page);

    await page.getByTestId("tokenized-editor-back-button").click();

    await expect(page).toHaveURL(/\/admin$/);

    await expect(page.getByTestId("admin-page")).toBeVisible({
      timeout: 15_000,
    });
  });

  test.describe("Tokenized English detailed editing", () => {
    test("English editor expands, renders every token, and collapses", async ({
      page,
    }) => {
      await mockAdminApis(page);
      await openTokenizedEditor(page);
      await expandStory(page, "editor-story-1");

      const toggle = page.getByTestId(
        "tokenized-editor-english-toggle-editor-story-1",
      );

      await expect(toggle).toHaveAttribute("aria-expanded", "false");

      await expandEnglishEditor(page, "editor-story-1");

      await expect(
        page.getByTestId("tokenized-english-editor-editor-story-1"),
      ).toBeVisible();

      await expect(
        page.locator(
          '[data-testid^="tokenized-english-token-editor-story-1-"]',
        ),
      ).toHaveCount(2);

      await expect(
        page.getByTestId("tokenized-english-text-editor-story-1-0"),
      ).toHaveValue("Maya");

      await expect(
        page.getByTestId("tokenized-english-lemma-editor-story-1-1"),
      ).toHaveValue("work");

      await expect(
        page.getByTestId("tokenized-english-pos-editor-story-1-1"),
      ).toHaveValue("VERB");

      await toggle.click();

      await expect(toggle).toHaveAttribute("aria-expanded", "false");

      await expect(
        page.getByTestId("tokenized-editor-english-panel-editor-story-1"),
      ).toHaveCount(0);
    });

    test("editing English text, lemma, POS, and definition marks the story dirty", async ({
      page,
    }) => {
      await mockAdminApis(page);
      await openTokenizedEditor(page);
      await expandStory(page, "editor-story-1");
      await expandEnglishEditor(page, "editor-story-1");

      await page
        .getByTestId("tokenized-english-text-editor-story-1-0")
        .fill("Maya Updated");

      await page
        .getByTestId("tokenized-english-lemma-editor-story-1-0")
        .fill("maya-updated");

      await page
        .getByTestId("tokenized-english-pos-editor-story-1-0")
        .selectOption("ADJ");

      await page
        .getByTestId("tokenized-english-definition-editor-story-1-0")
        .fill("An updated E2E definition.");

      await expect(
        page.getByTestId("tokenized-english-token-editor-story-1-0"),
      ).toHaveAttribute("data-pos", "ADJ");

      await expect(
        page.getByTestId("tokenized-editor-story-editor-story-1"),
      ).toHaveAttribute("data-dirty", "true");

      await expect(
        page.getByTestId("tokenized-editor-save-editor-story-1"),
      ).toBeEnabled();

      await expect(
        page.getByTestId("tokenized-editor-unsaved-editor-story-1"),
      ).toBeVisible();
    });

    test("English synonyms and antonyms parse comma-separated input", async ({
      page,
    }) => {
      const calls = await mockAdminApis(page);

      await openTokenizedEditor(page);
      await expandStory(page, "editor-story-1");
      await expandEnglishEditor(page, "editor-story-1");

      await page
        .getByTestId("tokenized-english-synonyms-editor-story-1-0")
        .fill("hero, friend, guide, , ");

      await page
        .getByTestId("tokenized-english-antonyms-editor-story-1-0")
        .fill("enemy, stranger");

      await performDialogAction(
        page,
        () => page.getByTestId("tokenized-editor-save-editor-story-1").click(),
        "Story updated successfully!",
      );

      expect(
        calls.lastTokenizedEditorPutBody.tokenized_english_version[0].synonyms,
      ).toEqual(["hero", "friend", "guide"]);

      expect(
        calls.lastTokenizedEditorPutBody.tokenized_english_version[0].antonyms,
      ).toEqual(["enemy", "stranger"]);
    });

    test("Discard restores deeply edited English token values", async ({
      page,
    }) => {
      await mockAdminApis(page);
      await openTokenizedEditor(page);
      await expandStory(page, "editor-story-1");
      await expandEnglishEditor(page, "editor-story-1");

      const text = page.getByTestId("tokenized-english-text-editor-story-1-0");

      const definition = page.getByTestId(
        "tokenized-english-definition-editor-story-1-0",
      );

      const synonyms = page.getByTestId(
        "tokenized-english-synonyms-editor-story-1-0",
      );

      await text.fill("Discarded Maya");
      await definition.fill("Discarded definition");
      await synonyms.fill("discarded, values");

      await page.getByTestId("tokenized-editor-discard-editor-story-1").click();

      await expect(text).toHaveValue("Maya");

      await expect(definition).toHaveValue("A character in the story.");

      await expect(synonyms).toHaveValue("girl");

      await expect(
        page.getByTestId("tokenized-editor-story-editor-story-1"),
      ).toHaveAttribute("data-dirty", "false");
    });

    test("saving English edits preserves all untouched English and Sanskrit tokens", async ({
      page,
    }) => {
      const calls = await mockAdminApis(page);

      await openTokenizedEditor(page);
      await expandStory(page, "editor-story-1");
      await expandEnglishEditor(page, "editor-story-1");

      await page
        .getByTestId("tokenized-english-text-editor-story-1-1")
        .fill("collaborated");

      await page
        .getByTestId("tokenized-english-lemma-editor-story-1-1")
        .fill("collaborate");

      await page
        .getByTestId("tokenized-english-pos-editor-story-1-1")
        .selectOption("VERB");

      await page
        .getByTestId("tokenized-english-definition-editor-story-1-1")
        .fill("Worked together with another person.");

      await performDialogAction(
        page,
        () => page.getByTestId("tokenized-editor-save-editor-story-1").click(),
        "Story updated successfully!",
      );

      const payload = calls.lastTokenizedEditorPutBody;

      expect(payload.tokenized_english_version).toHaveLength(2);

      expect(payload.tokenized_english_version[0]).toEqual(
        MOCK_TOKENIZED_EDITOR_STORIES[0].tokenized_english_version[0],
      );

      expect(payload.tokenized_english_version[1]).toEqual({
        ...MOCK_TOKENIZED_EDITOR_STORIES[0].tokenized_english_version[1],
        text: "collaborated",
        lemma: "collaborate",
        pos: "VERB",
        definition: "Worked together with another person.",
      });

      expect(payload.tokenized_sanskrit_version).toEqual(
        MOCK_TOKENIZED_EDITOR_STORIES[0].tokenized_sanskrit_version,
      );
    });
  });

  test.describe("Tokenized Sanskrit detailed editing", () => {
    test("renders nested Sanskrit sentences, words, and every editable field", async ({
      page,
    }) => {
      await mockAdminApis(page);
      await openTokenizedEditor(page);
      await expandStory(page, "editor-story-1");

      await expect(
        page.getByTestId("tokenized-sanskrit-editor-editor-story-1"),
      ).toBeVisible();

      await expect(
        page.locator(
          '[data-testid^="tokenized-sanskrit-sentence-editor-story-1-"]',
        ),
      ).toHaveCount(2);

      await expect(
        page.getByTestId("tokenized-sanskrit-sentence-editor-story-1-0"),
      ).toHaveAttribute("data-word-count", "2");

      await expect(
        page.getByTestId("tokenized-sanskrit-sentence-editor-story-1-1"),
      ).toHaveAttribute("data-word-count", "1");

      await expect(
        page.getByTestId("tokenized-sanskrit-text-editor-story-1-0-0"),
      ).toHaveValue("माया");

      await expect(
        page.getByTestId("tokenized-sanskrit-lemma-editor-story-1-0-1"),
      ).toHaveValue("रक्ष्");

      await expect(
        page.getByTestId("tokenized-sanskrit-upos-editor-story-1-0-1"),
      ).toHaveValue("VERB");

      await expect(
        page.getByTestId("tokenized-sanskrit-xpos-editor-story-1-0-0"),
      ).toHaveValue("NNP");

      await expect(
        page.getByTestId("tokenized-sanskrit-feats-editor-story-1-0-0"),
      ).toHaveValue("Case=Nom|Number=Sing");

      await expect(
        page.getByTestId("tokenized-sanskrit-definition-editor-story-1-0-1"),
      ).toHaveValue("protected");
    });

    test("editing every Sanskrit word field updates and saves the nested word", async ({
      page,
    }) => {
      const calls = await mockAdminApis(page);

      await openTokenizedEditor(page);
      await expandStory(page, "editor-story-1");

      await page
        .getByTestId("tokenized-sanskrit-text-editor-story-1-0-0")
        .fill("नायिका");

      await page
        .getByTestId("tokenized-sanskrit-lemma-editor-story-1-0-0")
        .fill("नायिका");

      await page
        .getByTestId("tokenized-sanskrit-upos-editor-story-1-0-0")
        .fill("ADJ");

      await page
        .getByTestId("tokenized-sanskrit-xpos-editor-story-1-0-0")
        .fill("JJ");

      await page
        .getByTestId("tokenized-sanskrit-feats-editor-story-1-0-0")
        .fill("Case=Nom|Gender=Fem|Number=Sing");

      await page
        .getByTestId("tokenized-sanskrit-definition-editor-story-1-0-0")
        .fill("heroine");

      await expect(
        page.getByTestId("tokenized-sanskrit-word-editor-story-1-0-0"),
      ).toHaveAttribute("data-upos", "ADJ");

      await performDialogAction(
        page,
        () => page.getByTestId("tokenized-editor-save-editor-story-1").click(),
        "Story updated successfully!",
      );

      expect(
        calls.lastTokenizedEditorPutBody.tokenized_sanskrit_version[0][0],
      ).toEqual({
        text: "नायिका",
        lemma: "नायिका",
        upos: "ADJ",
        xpos: "JJ",
        feats: "Case=Nom|Gender=Fem|Number=Sing",
        definition: "heroine",
      });
    });

    test("Add Word inserts a valid empty word object that can be edited", async ({
      page,
    }) => {
      const calls = await mockAdminApis(page);

      await openTokenizedEditor(page);
      await expandStory(page, "editor-story-1");

      await page
        .getByTestId("tokenized-sanskrit-add-word-editor-story-1-1-0")
        .click();

      await expect(
        page.getByTestId("tokenized-sanskrit-sentence-editor-story-1-1"),
      ).toHaveAttribute("data-word-count", "2");

      const newText = page.getByTestId(
        "tokenized-sanskrit-text-editor-story-1-1-1",
      );

      await expect(newText).toHaveValue("");

      await newText.fill("विजयः");

      await page
        .getByTestId("tokenized-sanskrit-lemma-editor-story-1-1-1")
        .fill("विजय");

      await page
        .getByTestId("tokenized-sanskrit-upos-editor-story-1-1-1")
        .fill("NOUN");

      await page
        .getByTestId("tokenized-sanskrit-xpos-editor-story-1-1-1")
        .fill("NN");

      await page
        .getByTestId("tokenized-sanskrit-feats-editor-story-1-1-1")
        .fill("Case=Nom|Number=Sing");

      await page
        .getByTestId("tokenized-sanskrit-definition-editor-story-1-1-1")
        .fill("victory");

      await performDialogAction(
        page,
        () => page.getByTestId("tokenized-editor-save-editor-story-1").click(),
        "Story updated successfully!",
      );

      expect(
        calls.lastTokenizedEditorPutBody.tokenized_sanskrit_version[1][1],
      ).toEqual({
        text: "विजयः",
        lemma: "विजय",
        upos: "NOUN",
        xpos: "NN",
        feats: "Case=Nom|Number=Sing",
        definition: "victory",
      });
    });

    test("Delete Word removes a word but never allows an empty sentence", async ({
      page,
    }) => {
      await mockAdminApis(page);
      await openTokenizedEditor(page);
      await expandStory(page, "editor-story-1");

      await expect(
        page.getByTestId("tokenized-sanskrit-delete-word-editor-story-1-1-0"),
      ).toBeDisabled();

      await page
        .getByTestId("tokenized-sanskrit-delete-word-editor-story-1-0-0")
        .click();

      await expect(
        page.getByTestId("tokenized-sanskrit-sentence-editor-story-1-0"),
      ).toHaveAttribute("data-word-count", "1");

      await expect(
        page.getByTestId("tokenized-sanskrit-text-editor-story-1-0-0"),
      ).toHaveValue("रक्षितवती");

      await expect(
        page.getByTestId("tokenized-sanskrit-delete-word-editor-story-1-0-0"),
      ).toBeDisabled();
    });

    test("Add Sentence creates a valid editable sentence after the selected sentence", async ({
      page,
    }) => {
      await mockAdminApis(page);
      await openTokenizedEditor(page);
      await expandStory(page, "editor-story-1");

      await page
        .getByTestId("tokenized-sanskrit-add-sentence-editor-story-1-0")
        .click();

      await expect(
        page.locator(
          '[data-testid^="tokenized-sanskrit-sentence-editor-story-1-"]',
        ),
      ).toHaveCount(3);

      await expect(
        page.getByTestId("tokenized-sanskrit-sentence-editor-story-1-1"),
      ).toHaveAttribute("data-word-count", "1");

      const newWord = page.getByTestId(
        "tokenized-sanskrit-text-editor-story-1-1-0",
      );

      await expect(newWord).toHaveValue("");
      await newWord.fill("नववाक्यम्");

      await expect(newWord).toHaveValue("नववाक्यम्");

      await expect(
        page.getByTestId("tokenized-sanskrit-delete-word-editor-story-1-1-0"),
      ).toBeDisabled();
    });

    test("Add Sentence At End appends a valid editable sentence", async ({
      page,
    }) => {
      await mockAdminApis(page);
      await openTokenizedEditor(page);
      await expandStory(page, "editor-story-1");

      await page
        .getByTestId("tokenized-sanskrit-add-sentence-end-editor-story-1")
        .click();

      await expect(
        page.locator(
          '[data-testid^="tokenized-sanskrit-sentence-editor-story-1-"]',
        ),
      ).toHaveCount(3);

      const appendedWord = page.getByTestId(
        "tokenized-sanskrit-text-editor-story-1-2-0",
      );

      await expect(appendedWord).toHaveValue("");

      await appendedWord.fill("अन्तिमवाक्यम्");

      await expect(appendedWord).toHaveValue("अन्तिमवाक्यम्");
    });

    test("Delete Sentence removes one sentence and protects the last remaining sentence", async ({
      page,
    }) => {
      await mockAdminApis(page);
      await openTokenizedEditor(page);
      await expandStory(page, "editor-story-1");

      await page
        .getByTestId("tokenized-sanskrit-delete-sentence-editor-story-1-0")
        .click();

      await expect(
        page.locator(
          '[data-testid^="tokenized-sanskrit-sentence-editor-story-1-"]',
        ),
      ).toHaveCount(1);

      await expect(
        page.getByTestId("tokenized-sanskrit-text-editor-story-1-0-0"),
      ).toHaveValue("सहकार्यम्");

      await expect(
        page.getByTestId("tokenized-sanskrit-delete-sentence-editor-story-1-0"),
      ).toBeDisabled();
    });

    test("an empty Sanskrit story can create its first valid sentence", async ({
      page,
    }) => {
      const emptyStory = createEmptySanskritStory();

      await mockAdminApis(page, {
        tokenizedEditorStories: [emptyStory],
      });

      await openTokenizedEditor(page);
      await expandStory(page, "editor-story-empty-sanskrit");

      await expect(
        page.getByTestId(
          "tokenized-sanskrit-empty-editor-story-empty-sanskrit",
        ),
      ).toContainText("No Sanskrit sentences found.");

      await page
        .getByTestId(
          "tokenized-sanskrit-add-sentence-end-editor-story-empty-sanskrit",
        )
        .click();

      await expect(
        page.getByTestId(
          "tokenized-sanskrit-empty-editor-story-empty-sanskrit",
        ),
      ).toHaveCount(0);

      const firstWord = page.getByTestId(
        "tokenized-sanskrit-text-editor-story-empty-sanskrit-0-0",
      );

      await expect(firstWord).toHaveValue("");
      await firstWord.fill("प्रथमम्");

      await expect(firstWord).toHaveValue("प्रथमम्");

      await expect(
        page.getByTestId(
          "tokenized-sanskrit-delete-word-editor-story-empty-sanskrit-0-0",
        ),
      ).toBeDisabled();

      await expect(
        page.getByTestId(
          "tokenized-sanskrit-delete-sentence-editor-story-empty-sanskrit-0",
        ),
      ).toBeDisabled();
    });

    test("legacy flat Sanskrit tokens normalize into one editable sentence and save nested data", async ({
      page,
    }) => {
      const calls = await mockAdminApis(page, {
        tokenizedEditorStories: [createLegacyFlatSanskritStory()],
      });

      await openTokenizedEditor(page);
      await expandStory(page, "editor-story-flat-sanskrit");

      await expect(
        page.locator(
          '[data-testid^="tokenized-sanskrit-sentence-editor-story-flat-sanskrit-"]',
        ),
      ).toHaveCount(1);

      await expect(
        page.getByTestId(
          "tokenized-sanskrit-sentence-editor-story-flat-sanskrit-0",
        ),
      ).toHaveAttribute("data-word-count", "2");

      await page
        .getByTestId(
          "tokenized-sanskrit-definition-editor-story-flat-sanskrit-0-1",
        )
        .fill("travels");

      await performDialogAction(
        page,
        () =>
          page
            .getByTestId("tokenized-editor-save-editor-story-flat-sanskrit")
            .click(),
        "Story updated successfully!",
      );

      const saved = calls.lastTokenizedEditorPutBody.tokenized_sanskrit_version;

      expect(saved).toHaveLength(1);
      expect(saved[0]).toHaveLength(2);

      expect(saved[0][0]).toEqual({
        text: "रामः",
        lemma: "राम",
        upos: "NOUN",
        xpos: "NNP",
        feats: "Case=Nom|Number=Sing",
        definition: "Rama",
      });

      expect(saved[0][1]).toEqual({
        text: "गच्छति",
        lemma: "गम्",
        upos: "VERB",
        xpos: "V",
        feats: "Tense=Pres",
        definition: "travels",
      });
    });

    test("one save preserves simultaneous English and Sanskrit token edits", async ({
      page,
    }) => {
      const calls = await mockAdminApis(page);

      await openTokenizedEditor(page);
      await expandStory(page, "editor-story-1");
      await expandEnglishEditor(page, "editor-story-1");

      await page
        .getByTestId("tokenized-english-definition-editor-story-1-0")
        .fill("Updated English definition.");

      await page
        .getByTestId("tokenized-sanskrit-definition-editor-story-1-0-0")
        .fill("Updated Sanskrit definition.");

      await performDialogAction(
        page,
        () => page.getByTestId("tokenized-editor-save-editor-story-1").click(),
        "Story updated successfully!",
      );

      expect(
        calls.lastTokenizedEditorPutBody.tokenized_english_version[0]
          .definition,
      ).toBe("Updated English definition.");

      expect(
        calls.lastTokenizedEditorPutBody.tokenized_sanskrit_version[0][0]
          .definition,
      ).toBe("Updated Sanskrit definition.");

      expect(
        calls.lastTokenizedEditorPutBody.tokenized_english_version[1],
      ).toEqual(MOCK_TOKENIZED_EDITOR_STORIES[0].tokenized_english_version[1]);

      expect(
        calls.lastTokenizedEditorPutBody.tokenized_sanskrit_version[1],
      ).toEqual(MOCK_TOKENIZED_EDITOR_STORIES[0].tokenized_sanskrit_version[1]);
    });
  });
});
