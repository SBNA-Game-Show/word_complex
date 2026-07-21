import { expect, test } from "@playwright/test";

import {
  TEST_STORY,
  returnToLauncherFromScene,
} from "./helpers/app-fixtures.js";

import {
  CONTEXT_CLOZE_FIXTURES,
  CONTEXT_CLOZE_GAME_ID,
  CONTEXT_CLOZE_SIGNED_IN_USER,
  CONTEXT_CLOZE_STAGE_SIZE,
  CONTEXT_CLOZE_ZIM_TEST_ID,
  openContextClozeQuestAsGuest,
  openContextClozeQuestAsSignedIn,
  readContextClozeQuestState,
  runContextClozeQuestCommand,
  startContextClozeQuestRound,
  waitForContextClozeQuestScreen,
} from "./helpers/context-cloze-quest-fixtures.js";

/**
 * CONTEXT CLOZE QUEST PLAYWRIGHT COVERAGE:
 *
 * The player-facing game remains entirely inside the ZIM canvas.
 *
 * These tests enter through the real Story Picker, launcher, and GameScene.
 * External API responses and authentication outcomes are deterministic.
 *
 * Canvas state and commands come from the development/E2E-only bridge. The
 * bridge invokes the existing production menu, drag, hint, timer, Reset, and
 * Submit paths rather than duplicating their rules inside Playwright.
 */

async function clickContextCanvasAtStagePoint(page, stageX, stageY) {
  const canvas = page
    .getByTestId(CONTEXT_CLOZE_ZIM_TEST_ID)
    .locator("canvas")
    .first();

  const canvasBox = await canvas.boundingBox();

  if (!canvasBox) {
    throw new Error("Context Cloze Quest canvas does not have a bounding box.");
  }

  const x =
    canvasBox.x + (stageX / CONTEXT_CLOZE_STAGE_SIZE.width) * canvasBox.width;

  const y =
    canvasBox.y + (stageY / CONTEXT_CLOZE_STAGE_SIZE.height) * canvasBox.height;

  await page.mouse.click(x, y);
}

async function expectContextState(page, expected) {
  await expect
    .poll(() => readContextClozeQuestState(page), {
      timeout: 15_000,
    })
    .toMatchObject(expected);
}

async function waitForGameRequestCount(calls, expectedCount) {
  await expect.poll(() => calls.gameRequests.length).toBe(expectedCount);
}

async function waitForScoreRequestCount(calls, expectedCount) {
  await expect.poll(() => calls.scoreRequests.length).toBe(expectedCount);
}

test.describe("Context Cloze Quest gameplay", () => {
  test("opens with the real default menu state", async ({ page }) => {
    const { contextCalls } = await openContextClozeQuestAsGuest(page);

    const state = await readContextClozeQuestState(page);

    expect(state).toMatchObject({
      screen: "menu",
      message: "",
      selectedLanguage: "english",
      selectedDifficulty: "easy",
      selectedWordTypes: ["noun"],
    });

    expect(contextCalls.gameRequests).toHaveLength(0);

    expect(contextCalls.scoreRequests).toHaveLength(0);
  });

  test("real canvas menu controls select Sanskrit, preserve one word type, choose hard, and launch", async ({
    page,
  }) => {
    const { contextCalls } = await openContextClozeQuestAsGuest(page);

    // Sanskrit button:
    // loc(500, 170), size 180 x 40.
    await clickContextCanvasAtStagePoint(page, 590, 190);

    await expectContextState(page, {
      selectedLanguage: "sanskrit",
    });

    // Verb card:
    // loc(415, 260), size 270 x 90.
    await clickContextCanvasAtStagePoint(page, 550, 305);

    await expectContextState(page, {
      selectedWordTypes: ["noun", "verb"],
    });

    // Remove Noun, leaving Verb.
    await clickContextCanvasAtStagePoint(page, 250, 305);

    await expectContextState(page, {
      selectedWordTypes: ["verb"],
    });

    // Attempt to remove the final remaining
    // word type. Production behavior keeps it.
    await clickContextCanvasAtStagePoint(page, 550, 305);

    await expectContextState(page, {
      selectedWordTypes: ["verb"],
    });

    // Hard card:
    // loc(715, 423), size 270 x 105.
    await clickContextCanvasAtStagePoint(page, 850, 475);

    await expectContextState(page, {
      selectedDifficulty: "hard",
    });

    // Let's Play:
    // loc(365, 565), size 370 x 60.
    await clickContextCanvasAtStagePoint(page, 550, 595);

    const gameplay = await waitForContextClozeQuestScreen(page, "gameplay");

    expect(gameplay).toMatchObject({
      selectedLanguage: "sanskrit",
      selectedDifficulty: "hard",
      selectedWordTypes: ["verb"],
      blankCount: 9,
      timeLimit: 120,
    });

    await waitForGameRequestCount(contextCalls, 1);

    expect(contextCalls.gameRequests[0]).toMatchObject({
      method: "GET",
      language: "sanskrit",
      difficulty: "hard",
      wordTypes: ["VERB"],
      storyId: TEST_STORY.storyId,
    });
  });

  test("rejects invalid deterministic menu selections without changing the menu", async ({
    page,
  }) => {
    await openContextClozeQuestAsGuest(page);

    const before = await readContextClozeQuestState(page);

    const invalidLanguage = await runContextClozeQuestCommand(
      page,
      "setMenuSelectionsForTest",
      {
        language: "unsupported-language",
      },
    );

    expect(invalidLanguage).toBe(false);

    const emptyWordTypes = await runContextClozeQuestCommand(
      page,
      "setMenuSelectionsForTest",
      {
        wordTypes: [],
      },
    );

    expect(emptyWordTypes).toBe(false);

    const after = await readContextClozeQuestState(page);

    expect(after).toMatchObject({
      screen: "menu",
      selectedLanguage: before.selectedLanguage,
      selectedDifficulty: before.selectedDifficulty,
      selectedWordTypes: before.selectedWordTypes,
    });
  });

  test("English easy sends the selected story and every requested word type", async ({
    page,
  }) => {
    const { contextCalls } = await openContextClozeQuestAsGuest(page, {
      startRound: true,
      selections: {
        language: "english",
        difficulty: "easy",
        wordTypes: ["noun", "verb", "adjective"],
      },
    });

    const state = await readContextClozeQuestState(page);

    expect(state).toMatchObject({
      screen: "gameplay",
      selectedLanguage: "english",
      selectedDifficulty: "easy",
      selectedWordTypes: ["noun", "verb", "adjective"],
      blankCount: 3,
      timeLimit: 60,
      filledCount: 0,
      correctCount: 0,
      hintsRemaining: 2,
      hintsUsed: 0,
      roundSubmitted: false,
    });

    expect(state.paragraph).toBe(CONTEXT_CLOZE_FIXTURES.english.easy.paragraph);

    expect(state.answers).toEqual(CONTEXT_CLOZE_FIXTURES.english.easy.answers);

    expect(state.wordBank).toEqual(
      CONTEXT_CLOZE_FIXTURES.english.easy.wordBank,
    );

    await waitForGameRequestCount(contextCalls, 1);

    expect(contextCalls.gameRequests[0]).toMatchObject({
      method: "GET",
      language: "english",
      difficulty: "easy",
      wordTypes: ["NOUN", "VERB", "ADJ"],
      storyId: TEST_STORY.storyId,
    });
  });

  test("English medium renders six blanks and the 90-second policy", async ({
    page,
  }) => {
    await openContextClozeQuestAsGuest(page, {
      startRound: true,
      selections: {
        language: "english",
        difficulty: "medium",
        wordTypes: ["noun", "adjective"],
      },
    });

    const state = await readContextClozeQuestState(page);

    expect(state).toMatchObject({
      screen: "gameplay",
      selectedLanguage: "english",
      selectedDifficulty: "medium",
      selectedWordTypes: ["noun", "adjective"],
      blankCount: 6,
      timeLimit: 90,
      timerScorePerSecond: 2,
      hintsRemaining: 2,
    });

    expect(state.blankPlacements).toHaveLength(6);

    expect(state.answers).toHaveLength(6);

    expect(state.remainingTime).toBeGreaterThanOrEqual(88);

    expect(state.remainingTime).toBeLessThanOrEqual(90);
  });

  test("Sanskrit hard renders nine blanks and the 120-second policy", async ({
    page,
  }) => {
    const { contextCalls } = await openContextClozeQuestAsGuest(page, {
      startRound: true,
      selections: {
        language: "sanskrit",
        difficulty: "hard",
        wordTypes: ["noun", "verb"],
      },
    });

    const state = await readContextClozeQuestState(page);

    expect(state).toMatchObject({
      screen: "gameplay",
      selectedLanguage: "sanskrit",
      selectedDifficulty: "hard",
      selectedWordTypes: ["noun", "verb"],
      blankCount: 9,
      timeLimit: 120,
      hintsRemaining: 2,
    });

    expect(state.answers).toEqual(CONTEXT_CLOZE_FIXTURES.sanskrit.hard.answers);

    expect(state.wordGeometry).toHaveLength(
      CONTEXT_CLOZE_FIXTURES.sanskrit.hard.wordBank.length,
    );

    expect(contextCalls.gameRequests[0]).toMatchObject({
      language: "sanskrit",
      difficulty: "hard",
      wordTypes: ["NOUN", "VERB"],
      storyId: TEST_STORY.storyId,
    });
  });

  test("publishes usable live blank and word geometry", async ({ page }) => {
    await openContextClozeQuestAsGuest(page, {
      startRound: true,
    });

    const state = await readContextClozeQuestState(page);

    expect(state.blankPlacements).toHaveLength(3);

    expect(state.wordGeometry).toHaveLength(6);

    for (const blank of state.blankPlacements) {
      expect(blank.geometry).not.toBeNull();

      expect(blank.geometry.width).toBeGreaterThan(0);

      expect(blank.geometry.height).toBeGreaterThan(0);

      expect(blank.geometry.centerX).toBeGreaterThan(0);

      expect(blank.geometry.centerX).toBeLessThan(
        CONTEXT_CLOZE_STAGE_SIZE.width,
      );

      expect(blank.geometry.centerY).toBeGreaterThan(0);

      expect(blank.geometry.centerY).toBeLessThan(
        CONTEXT_CLOZE_STAGE_SIZE.height,
      );
    }

    for (const word of state.wordGeometry) {
      expect(word.geometry).not.toBeNull();

      expect(word.geometry.width).toBeGreaterThan(0);

      expect(word.geometry.height).toBeGreaterThan(0);

      expect(word.blankIndex).toBeNull();

      expect(word.mouseEnabled).toBe(true);
    }
  });

  test("placing a second word into one blank returns the previous word home", async ({
    page,
  }) => {
    await openContextClozeQuestAsGuest(page, {
      startRound: true,
    });

    const initial = await readContextClozeQuestState(page);

    const first = initial.answers[0];

    const second = initial.answers[1];

    await runContextClozeQuestCommand(
      page,
      "placeWordInBlankForTest",
      first,
      0,
    );

    const replaced = await runContextClozeQuestCommand(
      page,
      "placeWordInBlankForTest",
      second,
      0,
    );

    expect(replaced.blankPlacements[0]).toMatchObject({
      index: 0,
      filledWord: second,
    });

    expect(
      replaced.wordGeometry.find((item) => item.word === first).blankIndex,
    ).toBeNull();

    expect(
      replaced.wordGeometry.find((item) => item.word === second).blankIndex,
    ).toBe(0);

    expect(replaced.filledCount).toBe(1);
  });

  test("moves one placed word between blanks and returns it home", async ({
    page,
  }) => {
    await openContextClozeQuestAsGuest(page, {
      startRound: true,
    });

    const initial = await readContextClozeQuestState(page);

    const word = initial.answers[0];

    await runContextClozeQuestCommand(page, "placeWordInBlankForTest", word, 0);

    const moved = await runContextClozeQuestCommand(
      page,
      "placeWordInBlankForTest",
      word,
      1,
    );

    expect(moved.blankPlacements[0].filledWord).toBeNull();

    expect(moved.blankPlacements[1].filledWord).toBe(word);

    expect(
      moved.wordGeometry.find((item) => item.word === word).blankIndex,
    ).toBe(1);

    const returned = await runContextClozeQuestCommand(
      page,
      "returnWordHomeForTest",
      word,
    );

    expect(returned.filledCount).toBe(0);

    expect(returned.blankPlacements[1].filledWord).toBeNull();

    expect(
      returned.wordGeometry.find((item) => item.word === word).blankIndex,
    ).toBeNull();
  });

  test("clears every current placement through the existing release path", async ({
    page,
  }) => {
    await openContextClozeQuestAsGuest(page, {
      startRound: true,
    });

    const partiallyFilled = await runContextClozeQuestCommand(
      page,
      "placeCorrectAnswersForTest",
      2,
    );

    expect(partiallyFilled.filledCount).toBe(2);

    expect(partiallyFilled.correctCount).toBe(2);

    const cleared = await runContextClozeQuestCommand(
      page,
      "clearPlacementsForTest",
    );

    expect(cleared).toMatchObject({
      filledCount: 0,
      correctCount: 0,
      roundSubmitted: false,
    });

    expect(
      cleared.blankPlacements.every((blank) => blank.filledWord === null),
    ).toBe(true);

    expect(cleared.wordGeometry.every((word) => word.blankIndex === null)).toBe(
      true,
    );
  });

  test("incomplete submission reports the warning without locking or posting", async ({
    page,
  }) => {
    const { contextCalls } = await openContextClozeQuestAsGuest(page, {
      startRound: true,
    });

    await runContextClozeQuestCommand(page, "placeCorrectAnswersForTest", 2);

    const submitted = await runContextClozeQuestCommand(
      page,
      "submitAnswerForTest",
    );

    expect(submitted).toMatchObject({
      filledCount: 2,
      correctCount: 2,
      scoreText: "Answer Score: 2/3 = 200",
      feedbackText: "⚠️ Fill in all blanks before submitting!",
      roundSubmitted: false,
      controlsLocked: false,
      timerRunning: true,
    });

    expect(contextCalls.scoreRequests).toHaveLength(0);
  });

  test("uses two distinct hints and refuses to spend a third", async ({
    page,
  }) => {
    await openContextClozeQuestAsGuest(page, {
      startRound: true,
    });

    const first = await runContextClozeQuestCommand(page, "useHintForTest");

    expect(first).toMatchObject({
      hintsRemaining: 1,
      hintsUsed: 1,
      hintPenalty: 25,
    });

    const second = await runContextClozeQuestCommand(page, "useHintForTest");

    expect(second).toMatchObject({
      hintsRemaining: 0,
      hintsUsed: 2,
      hintPenalty: 50,
    });

    const third = await runContextClozeQuestCommand(page, "useHintForTest");

    expect(third).toMatchObject({
      hintsRemaining: 0,
      hintsUsed: 2,
      hintPenalty: 50,
    });
  });

  test("does not spend a hint when all blanks are already correct", async ({
    page,
  }) => {
    await openContextClozeQuestAsGuest(page, {
      startRound: true,
    });

    const solved = await runContextClozeQuestCommand(
      page,
      "placeCorrectAnswersForTest",
    );

    expect(solved).toMatchObject({
      filledCount: 3,
      correctCount: 3,
      hintsRemaining: 2,
    });

    const afterHint = await runContextClozeQuestCommand(page, "useHintForTest");

    expect(afterHint).toMatchObject({
      filledCount: 3,
      correctCount: 3,
      hintsRemaining: 2,
      hintsUsed: 0,
      hintPenalty: 0,
    });
  });

  test("fully incorrect submission locks the round with no perfect bonus", async ({
    page,
  }) => {
    const { contextCalls } = await openContextClozeQuestAsGuest(page, {
      startRound: true,
    });

    const wrong = await runContextClozeQuestCommand(
      page,
      "placeWrongAnswersForTest",
    );

    expect(wrong).toMatchObject({
      filledCount: 3,
      correctCount: 0,
    });

    const submitted = await runContextClozeQuestCommand(
      page,
      "submitAnswerForTest",
    );

    expect(submitted).toMatchObject({
      scoreText: "Answer Score: 0/3 = 0",
      roundSubmitted: true,
      controlsLocked: true,
      timerRunning: false,
    });

    expect(submitted.feedbackText).toContain("You got 0/3.");

    expect(submitted.feedbackText).toContain("Final Score: 0");

    expect(submitted.feedbackText).toContain("Perfect Bonus: 0");

    expect(contextCalls.scoreRequests).toHaveLength(0);
  });

  test("partially correct filled board receives only its answer score", async ({
    page,
  }) => {
    await openContextClozeQuestAsGuest(page, {
      startRound: true,
    });

    const initial = await readContextClozeQuestState(page);

    const [first, second, third] = initial.answers;

    await runContextClozeQuestCommand(
      page,
      "placeWordInBlankForTest",
      first,
      0,
    );

    await runContextClozeQuestCommand(
      page,
      "placeWordInBlankForTest",
      third,
      1,
    );

    await runContextClozeQuestCommand(
      page,
      "placeWordInBlankForTest",
      second,
      2,
    );

    await runContextClozeQuestCommand(page, "setRemainingTimeForTest", 30);

    const submitted = await runContextClozeQuestCommand(
      page,
      "submitAnswerForTest",
    );

    expect(submitted).toMatchObject({
      filledCount: 3,
      correctCount: 1,
      scoreText: "Answer Score: 1/3 = 100",
      roundSubmitted: true,
      controlsLocked: true,
      timerRunning: false,
    });

    expect(submitted.feedbackText).toContain("You got 1/3.");

    expect(submitted.feedbackText).toContain("Final Score: 100");

    expect(submitted.feedbackText).toContain("Perfect Bonus: 0");
  });

  test("perfect guest completion awards the exact remaining-time bonus without posting", async ({
    page,
  }) => {
    const { contextCalls } = await openContextClozeQuestAsGuest(page, {
      startRound: true,
    });

    await runContextClozeQuestCommand(page, "placeCorrectAnswersForTest");

    await runContextClozeQuestCommand(page, "setRemainingTimeForTest", 40);

    const submitted = await runContextClozeQuestCommand(
      page,
      "submitAnswerForTest",
    );

    expect(submitted).toMatchObject({
      filledCount: 3,
      correctCount: 3,
      scoreText: "Answer Score: 3/3 = 300",
      remainingTime: 40,
      currentPerfectBonus: 80,
      roundSubmitted: true,
      controlsLocked: true,
      timerRunning: false,
    });

    expect(submitted.feedbackText).toContain("Excellent!");

    expect(submitted.feedbackText).toContain("Final Score: 380");

    expect(submitted.feedbackText).toContain("Perfect Bonus: +80");

    expect(contextCalls.scoreRequests).toHaveLength(0);
  });

  test("perfect score subtracts the exact hint penalty", async ({ page }) => {
    await openContextClozeQuestAsGuest(page, {
      startRound: true,
    });

    await runContextClozeQuestCommand(page, "useHintForTest");

    await runContextClozeQuestCommand(page, "placeCorrectAnswersForTest");

    await runContextClozeQuestCommand(page, "setRemainingTimeForTest", 30);

    const submitted = await runContextClozeQuestCommand(
      page,
      "submitAnswerForTest",
    );

    expect(submitted).toMatchObject({
      correctCount: 3,
      remainingTime: 30,
      currentPerfectBonus: 60,
      hintsUsed: 1,
      hintPenalty: 25,
      roundSubmitted: true,
    });

    expect(submitted.feedbackText).toContain("Final Score: 335");

    expect(submitted.feedbackText).toContain("Perfect Bonus: +60");

    expect(submitted.feedbackText).toContain("Hints: -25");
  });

  test("the production countdown reaches zero and stops the timer", async ({
    page,
  }) => {
    await openContextClozeQuestAsGuest(page, {
      startRound: true,
    });

    const arranged = await runContextClozeQuestCommand(
      page,
      "setRemainingTimeForTest",
      1,
    );

    expect(arranged).toMatchObject({
      remainingTime: 1,
      currentPerfectBonus: 2,
      timerRunning: true,
    });

    await expect
      .poll(() => readContextClozeQuestState(page), {
        timeout: 5_000,
      })
      .toMatchObject({
        remainingTime: 0,
        timerRunning: false,
        timedOut: true,
      });

    const expired = await readContextClozeQuestState(page);

    // Current production behavior announces
    // time-up but does not submit the round.
    expect(expired).toMatchObject({
      remainingTime: 0,
      timerRunning: false,
      timedOut: true,
      roundSubmitted: false,
      controlsLocked: false,
    });
  });

  test("Reset requests a fresh board and clears placements, hints, score, and lock state", async ({
    page,
  }) => {
    const { contextCalls } = await openContextClozeQuestAsGuest(page, {
      startRound: true,
    });

    await runContextClozeQuestCommand(page, "useHintForTest");

    await runContextClozeQuestCommand(page, "placeCorrectAnswersForTest", 1);

    const beforeReset = await readContextClozeQuestState(page);

    expect(beforeReset).toMatchObject({
      filledCount: 1,
      correctCount: 1,
      hintsRemaining: 1,
      hintsUsed: 1,
    });

    await runContextClozeQuestCommand(page, "resetGameForTest");

    await waitForContextClozeQuestScreen(page, "gameplay");

    await waitForGameRequestCount(contextCalls, 2);

    const reset = await readContextClozeQuestState(page);

    expect(reset).toMatchObject({
      screen: "gameplay",
      filledCount: 0,
      correctCount: 0,
      hintsRemaining: 2,
      hintsUsed: 0,
      hintPenalty: 0,
      scoreText: "Answer Score: 0/0 = 0",
      feedbackText: "",
      roundSubmitted: false,
      controlsLocked: false,
      timerRunning: true,
    });

    expect(reset.remainingTime).toBeGreaterThanOrEqual(58);

    expect(reset.remainingTime).toBeLessThanOrEqual(60);
  });

  test("Menu abandons the active board and preserves its current selections", async ({
    page,
  }) => {
    await openContextClozeQuestAsGuest(page, {
      startRound: true,
      selections: {
        language: "sanskrit",
        difficulty: "medium",
        wordTypes: ["noun", "verb"],
      },
    });

    await runContextClozeQuestCommand(page, "placeCorrectAnswersForTest", 2);

    await runContextClozeQuestCommand(page, "returnToMenuForTest");

    const menu = await waitForContextClozeQuestScreen(page, "menu");

    expect(menu).toMatchObject({
      selectedLanguage: "sanskrit",
      selectedDifficulty: "medium",
      selectedWordTypes: ["noun", "verb"],
    });

    expect(menu).not.toHaveProperty("blankCount");

    expect(menu).not.toHaveProperty("remainingTime");
  });

  test("a stale delayed response cannot rebuild gameplay after returning to the menu", async ({
    page,
  }) => {
    const { contextCalls } = await openContextClozeQuestAsGuest(page, {
      apiOptions: {
        gameDelayMs: 800,
      },
    });

    await runContextClozeQuestCommand(page, "startGameForTest");

    await waitForContextClozeQuestScreen(page, "loading");

    await runContextClozeQuestCommand(page, "returnToMenuForTest");

    await waitForContextClozeQuestScreen(page, "menu");

    await waitForGameRequestCount(contextCalls, 1);

    await page.waitForTimeout(1_000);

    const finalState = await readContextClozeQuestState(page);

    expect(finalState).toMatchObject({
      screen: "menu",
      selectedLanguage: "english",
      selectedDifficulty: "easy",
      selectedWordTypes: ["noun"],
    });

    expect(finalState).not.toHaveProperty("blankCount");
  });

  test("failed game response never fabricates a gameplay board", async ({
    page,
  }) => {
    await openContextClozeQuestAsGuest(page, {
      apiOptions: {
        gameStatus: 503,
        gameError: "Deterministic game failure.",
      },
    });

    const responsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url());

      return (
        url.pathname.endsWith("/api/v1/fillInBlanks") &&
        response.status() === 503
      );
    });

    await runContextClozeQuestCommand(page, "startGameForTest");

    const response = await responsePromise;

    expect(response.status()).toBe(503);

    await page.waitForTimeout(100);

    const state = await readContextClozeQuestState(page);

    expect(state).toMatchObject({
      screen: "loading",
    });

    expect(state).not.toHaveProperty("blankCount");

    expect(state).not.toHaveProperty("answers");
  });

  test("signed-in perfect completion posts the exact score payload once", async ({
    page,
  }) => {
    const { contextCalls } = await openContextClozeQuestAsSignedIn(page, {
      startRound: true,
      selections: {
        language: "english",
        difficulty: "easy",
        wordTypes: ["noun"],
      },
    });

    await runContextClozeQuestCommand(page, "placeCorrectAnswersForTest");

    // Set time immediately before submission
    // so the exact bestTime is deterministic.
    await runContextClozeQuestCommand(page, "setRemainingTimeForTest", 42);

    const submitted = await runContextClozeQuestCommand(
      page,
      "submitAnswerForTest",
    );

    expect(submitted.feedbackText).toContain("Final Score: 384");

    await waitForScoreRequestCount(contextCalls, 1);

    expect(contextCalls.scoreRequests[0]).toMatchObject({
      method: "POST",
      body: {
        uuid: CONTEXT_CLOZE_SIGNED_IN_USER.id,

        displayName: CONTEXT_CLOZE_SIGNED_IN_USER.name,

        score: 384,
        bestTime: 18_000,

        storyId: TEST_STORY.storyId,

        difficulty: "easy",
      },
    });
  });

  test("duplicate Submit events cannot post a completed score twice", async ({
    page,
  }) => {
    const { contextCalls } = await openContextClozeQuestAsSignedIn(page, {
      startRound: true,
    });

    await runContextClozeQuestCommand(page, "placeCorrectAnswersForTest");

    await runContextClozeQuestCommand(page, "setRemainingTimeForTest", 35);

    await runContextClozeQuestCommand(page, "submitAnswerForTest");

    await runContextClozeQuestCommand(page, "submitAnswerForTest");

    await waitForScoreRequestCount(contextCalls, 1);

    await page.waitForTimeout(100);

    expect(contextCalls.scoreRequests).toHaveLength(1);

    const state = await readContextClozeQuestState(page);

    expect(state).toMatchObject({
      roundSubmitted: true,
      controlsLocked: true,
      timerRunning: false,
    });
  });

  test("failed score POST preserves the completed result and locked board", async ({
    page,
  }) => {
    const { contextCalls } = await openContextClozeQuestAsSignedIn(page, {
      apiOptions: {
        scoreStatus: 500,
        scoreError: "Deterministic score failure.",
      },
      startRound: true,
    });

    await runContextClozeQuestCommand(page, "placeCorrectAnswersForTest");

    await runContextClozeQuestCommand(page, "setRemainingTimeForTest", 25);

    const submitted = await runContextClozeQuestCommand(
      page,
      "submitAnswerForTest",
    );

    await waitForScoreRequestCount(contextCalls, 1);

    expect(contextCalls.scoreRequests[0].body.score).toBe(350);

    expect(submitted).toMatchObject({
      correctCount: 3,
      remainingTime: 25,
      roundSubmitted: true,
      controlsLocked: true,
      timerRunning: false,
    });

    expect(submitted.feedbackText).toContain("Excellent!");

    expect(submitted.feedbackText).toContain("Final Score: 350");

    await page.waitForTimeout(100);

    const preserved = await readContextClozeQuestState(page);

    expect(preserved).toMatchObject({
      roundSubmitted: true,
      controlsLocked: true,
      timerRunning: false,
    });

    expect(preserved.feedbackText).toContain("Final Score: 350");
  });

  test("leaving GameScene removes Context Cloze Quest debug state and commands", async ({
    page,
  }) => {
    await openContextClozeQuestAsGuest(page, {
      startRound: true,
    });

    await expect(
      page.evaluate(() => typeof window.__contextClozeQuestZimDebug),
    ).resolves.toBe("object");

    await expect(
      page.evaluate(() => typeof window.__contextClozeQuestZimTestHooks),
    ).resolves.toBe("object");

    await returnToLauncherFromScene(page, CONTEXT_CLOZE_GAME_ID);

    await expect
      .poll(() =>
        page.evaluate(() => ({
          debug: typeof window.__contextClozeQuestZimDebug,

          hooks: typeof window.__contextClozeQuestZimTestHooks,
        })),
      )
      .toEqual({
        debug: "undefined",
        hooks: "undefined",
      });
  });
});
