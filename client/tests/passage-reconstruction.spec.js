import { expect, test } from "@playwright/test";

import {
  TEST_STORY,
  returnToLauncherFromScene,
} from "./helpers/app-fixtures.js";
import {
  PASSAGE_ENGLISH_ROUNDS,
  PASSAGE_SIGNED_IN_USER,
  PASSAGE_SANSKRIT_ROUNDS,
  callPassageReconstructionHook,
  dragPassageChunkToZone,
  expectPassageReconstructionScreen,
  getPassageReconstructionState,
  openPassageReconstructionAsGuest,
  openPassageReconstructionAsSignedIn,
  startPassageReconstructionLanguage,
} from "./helpers/passage-reconstruction-fixtures.js";

async function startEnglishBoard(page) {
  return startPassageReconstructionLanguage(page, "english");
}

async function completeCurrentPassageRound(page) {
  const placed = await callPassageReconstructionHook(
    page,
    "placeCorrectAnswerForTest",
  );

  expect(placed).toBe(4);

  const state = await callPassageReconstructionHook(page, "checkAnswerForTest");

  expect(state.screen).toBe("correct-feedback");

  return state;
}

async function completeAllPassageRounds(page) {
  const startingState = await getPassageReconstructionState(page);

  const roundCount = startingState?.roundCount ?? 0;

  for (let index = 0; index < roundCount; index += 1) {
    await completeCurrentPassageRound(page);

    await callPassageReconstructionHook(page, "advanceAfterCorrectForTest");

    if (index < roundCount - 1) {
      await expectPassageReconstructionScreen(page, "preview");

      await expectPassageReconstructionScreen(page, "gameplay");
    }
  }

  await expectPassageReconstructionScreen(page, "results-complete");

  return getPassageReconstructionState(page);
}

test.describe("Passage Reconstruction gameplay", () => {
  test("opens at the language picker with a development/E2E-only state bridge", async ({
    page,
  }) => {
    await openPassageReconstructionAsGuest(page);

    const state = await getPassageReconstructionState(page);

    expect(state).toMatchObject({
      screen: "language-picker",
      message: "",
      language: "english",
      roundIndex: 0,
      roundNumber: 0,
      roundCount: 0,
      score: 0,
      attemptsLeft: 3,
      checks: 0,
      correctChecks: 0,
      hintsRemaining: 2,
      hintsUsedTotal: 0,
      timeRemaining: 90,
      gameOver: false,
      feedbackActive: false,
    });

    await expect(page.getByTestId("zim-sentence-game")).toBeVisible();
  });

  test("loads English with the selected story, pauses preview time, and resumes gameplay", async ({
    page,
  }) => {
    const calls = await openPassageReconstructionAsGuest(page);

    const preview = await callPassageReconstructionHook(
      page,
      "startLanguageForTest",
      "english",
    );

    expect(preview).toMatchObject({
      screen: "preview",
      language: "english",
      roundNumber: 1,
      roundCount: PASSAGE_ENGLISH_ROUNDS.length,
      timerPaused: true,
      sentence: PASSAGE_ENGLISH_ROUNDS[0].sentence,
      answer: [...PASSAGE_ENGLISH_ROUNDS[0].answer],
    });

    expect(calls.game).toHaveLength(1);

    expect(calls.game[0]).toMatchObject({
      method: "GET",
      language: "english",
      storyId: TEST_STORY.storyId,
    });

    await expectPassageReconstructionScreen(page, "gameplay");

    const gameplay = await getPassageReconstructionState(page);

    expect(gameplay.timerPaused).toBe(false);

    expect(gameplay.tileGeometry).toHaveLength(4);

    expect(gameplay.zoneGeometry).toHaveLength(4);
  });

  test("loads the Sanskrit rounds through the same real game service path", async ({
    page,
  }) => {
    const calls = await openPassageReconstructionAsGuest(page);

    const gameplay = await startPassageReconstructionLanguage(page, "sanskrit");

    expect(calls.game).toHaveLength(1);

    expect(calls.game[0]).toMatchObject({
      language: "sanskrit",
      storyId: TEST_STORY.storyId,
    });

    expect(gameplay).toMatchObject({
      language: "sanskrit",
      roundCount: PASSAGE_SANSKRIT_ROUNDS.length,
      sentence: PASSAGE_SANSKRIT_ROUNDS[0].sentence,
      answer: [...PASSAGE_SANSKRIT_ROUNDS[0].answer],
    });
  });

  test("shows the canvas load-error state when the game request fails", async ({
    page,
  }) => {
    const calls = await openPassageReconstructionAsGuest(page, {
      gameStatus: 500,
      gameMessage: "Deterministic game failure.",
    });

    const state = await callPassageReconstructionHook(
      page,
      "startLanguageForTest",
      "english",
    );

    expect(calls.game).toHaveLength(1);

    expect(state).toMatchObject({
      screen: "load-error",
      message: "Failed to load story. Please refresh.",
      roundCount: 0,
      gameOver: false,
    });
  });

  test("publishes deterministic phrase and slot geometry for the live board", async ({
    page,
  }) => {
    await openPassageReconstructionAsGuest(page);

    const state = await startEnglishBoard(page);

    expect(state.chunks).toEqual([...PASSAGE_ENGLISH_ROUNDS[0].chunks]);

    expect(state.answer).toEqual([...PASSAGE_ENGLISH_ROUNDS[0].answer]);

    expect(state.placedChunks).toEqual([null, null, null, null]);

    for (const tile of state.tileGeometry) {
      expect(tile.width).toBeGreaterThan(0);

      expect(tile.height).toBeGreaterThan(0);

      expect(tile.centerX).toBeGreaterThan(0);

      expect(tile.centerY).toBeGreaterThan(0);
    }

    for (const zone of state.zoneGeometry) {
      expect(zone.width).toBeGreaterThan(0);

      expect(zone.height).toBeGreaterThan(0);

      expect(zone.chunk).toBeNull();
    }
  });

  test("performs a real canvas drag and snaps a phrase into its numbered slot", async ({
    page,
  }) => {
    await openPassageReconstructionAsGuest(page);

    const state = await startEnglishBoard(page);

    const firstChunk = state.answer[0];

    await dragPassageChunkToZone(page, firstChunk, 0);

    const afterDrag = await getPassageReconstructionState(page);

    expect(afterDrag.placedChunks[0]).toBe(firstChunk);

    expect(
      afterDrag.tileGeometry.find((tile) => tile.chunk === firstChunk)
        ?.zoneIndex,
    ).toBe(0);
  });

  test("rejects an incomplete board without deducting score or attempts", async ({
    page,
  }) => {
    await openPassageReconstructionAsGuest(page);

    await startEnglishBoard(page);

    const placed = await callPassageReconstructionHook(
      page,
      "placePartialAnswerForTest",
      1,
    );

    expect(placed).toBe(1);

    const state = await callPassageReconstructionHook(
      page,
      "checkAnswerForTest",
    );

    expect(state).toMatchObject({
      screen: "gameplay",
      message: "Fill all four slots before checking.",
      score: 0,
      attemptsLeft: 3,
      checks: 1,
      correctChecks: 0,
    });

    expect(state.placedChunks).toEqual([null, null, null, null]);
  });

  test("Reset clears placed phrases but preserves a hint already spent in the round", async ({
    page,
  }) => {
    await openPassageReconstructionAsGuest(page);

    await startEnglishBoard(page);

    await callPassageReconstructionHook(page, "useHintForTest");

    await callPassageReconstructionHook(page, "placePartialAnswerForTest", 2);

    await callPassageReconstructionHook(page, "resetBoardForTest");

    const state = await getPassageReconstructionState(page);

    expect(state.placedChunks).toEqual([null, null, null, null]);

    expect(state).toMatchObject({
      screen: "gameplay",
      hintsRemaining: 1,
      hintsUsedTotal: 1,
      score: 0,
    });
  });

  test("uses two different useful hints and refuses to spend a third hint", async ({
    page,
  }) => {
    await openPassageReconstructionAsGuest(page);

    await startEnglishBoard(page);

    const first = await callPassageReconstructionHook(page, "useHintForTest");

    expect(first.hintsRemaining).toBe(1);

    expect(first.hintsUsedTotal).toBe(1);

    expect(first.lastHintText).toContain("slot 1");

    const second = await callPassageReconstructionHook(page, "useHintForTest");

    expect(second.hintsRemaining).toBe(0);

    expect(second.hintsUsedTotal).toBe(2);

    expect(second.lastHintText).toContain("slot 2");

    expect(second.lastHintText).not.toBe(first.lastHintText);

    const third = await callPassageReconstructionHook(page, "useHintForTest");

    expect(third.hintsRemaining).toBe(0);

    expect(third.hintsUsedTotal).toBe(2);

    expect(third.lastHintText).toBe(second.lastHintText);

    expect(third.score).toBe(0);
  });

  test("does not spend a hint when every answer slot is already correct", async ({
    page,
  }) => {
    await openPassageReconstructionAsGuest(page);

    await startEnglishBoard(page);

    await callPassageReconstructionHook(page, "placeCorrectAnswerForTest");

    const state = await callPassageReconstructionHook(page, "useHintForTest");

    expect(state).toMatchObject({
      hintsRemaining: 2,
      hintsUsedTotal: 0,
      lastHintText: "",
      score: 0,
    });
  });

  test("a wrong completed board loses one attempt and never makes score negative", async ({
    page,
  }) => {
    await openPassageReconstructionAsGuest(page);

    await startEnglishBoard(page);

    await callPassageReconstructionHook(page, "placeWrongAnswerForTest");

    const wrong = await callPassageReconstructionHook(
      page,
      "checkAnswerForTest",
    );

    expect(wrong).toMatchObject({
      screen: "wrong-feedback",
      message: "Not quite! (-20)",
      score: 0,
      attemptsLeft: 2,
      checks: 1,
      correctChecks: 0,
      feedbackActive: true,
    });

    await expectPassageReconstructionScreen(page, "gameplay", 5_000);
  });

  test("the 20-point wrong-answer penalty applies after points have been earned", async ({
    page,
  }) => {
    await openPassageReconstructionAsGuest(page);

    await startEnglishBoard(page);

    const correct = await completeCurrentPassageRound(page);

    expect(correct.score).toBe(100);

    await callPassageReconstructionHook(page, "advanceAfterCorrectForTest");

    await expectPassageReconstructionScreen(page, "gameplay");

    await callPassageReconstructionHook(page, "placeWrongAnswerForTest");

    const wrong = await callPassageReconstructionHook(
      page,
      "checkAnswerForTest",
    );

    expect(wrong).toMatchObject({
      screen: "wrong-feedback",
      score: 80,
      attemptsLeft: 2,
      checks: 2,
      correctChecks: 1,
    });
  });

  test("three wrong checks reach round-over and retry restores three attempts", async ({
    page,
  }) => {
    await openPassageReconstructionAsGuest(page);

    await startEnglishBoard(page);

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      await callPassageReconstructionHook(page, "placeWrongAnswerForTest");

      const state = await callPassageReconstructionHook(
        page,
        "checkAnswerForTest",
      );

      if (attempt < 3) {
        expect(state.screen).toBe("wrong-feedback");

        expect(state.attemptsLeft).toBe(3 - attempt);

        await expectPassageReconstructionScreen(page, "gameplay", 5_000);
      } else {
        expect(state).toMatchObject({
          screen: "round-over",
          attemptsLeft: 0,
          checks: 3,
          score: 0,
        });
      }
    }

    await callPassageReconstructionHook(page, "retryAfterRoundOverForTest");

    const preview = await getPassageReconstructionState(page);

    expect(preview).toMatchObject({
      screen: "preview",
      attemptsLeft: 3,
      roundNumber: 1,
    });

    await expectPassageReconstructionScreen(page, "gameplay");
  });

  test("a correct board awards 100 points and advancing resets round attempts and hints", async ({
    page,
  }) => {
    await openPassageReconstructionAsGuest(page);

    await startEnglishBoard(page);

    await callPassageReconstructionHook(page, "useHintForTest");

    const correct = await completeCurrentPassageRound(page);

    expect(correct).toMatchObject({
      screen: "correct-feedback",
      score: 100,
      correctChecks: 1,
      checks: 1,
      hintsRemaining: 1,
      hintsUsedTotal: 1,
    });

    await callPassageReconstructionHook(page, "advanceAfterCorrectForTest");

    const nextPreview = await getPassageReconstructionState(page);

    expect(nextPreview).toMatchObject({
      screen: "preview",
      roundNumber: 2,
      attemptsLeft: 3,
      hintsRemaining: 2,
      hintsUsedTotal: 1,
      lastHintText: "",
    });

    await expectPassageReconstructionScreen(page, "gameplay");
  });

  test("timeout ends the current run with missed rounds and no time bonus", async ({
    page,
  }) => {
    await openPassageReconstructionAsGuest(page);

    await startEnglishBoard(page);

    await completeCurrentPassageRound(page);

    await callPassageReconstructionHook(page, "advanceAfterCorrectForTest");

    await expectPassageReconstructionScreen(page, "gameplay");

    await callPassageReconstructionHook(page, "expireTimerForTest");

    const state = await getPassageReconstructionState(page);

    expect(state).toMatchObject({
      screen: "results-timeout",
      message: "Time's Up!",
      score: 100,
      timeRemaining: 0,
      gameOver: true,
      feedbackActive: true,
      resultSummary: {
        timedOut: true,
        timeBonus: 0,
        finalScore: 100,
        roundsRight: 1,
        roundsWrong: 2,
        accuracy: 100,
      },
    });
  });

  test("natural completion reports every round and applies the remaining-time bonus", async ({
    page,
  }) => {
    const calls = await openPassageReconstructionAsGuest(page);

    await startEnglishBoard(page);

    const state = await completeAllPassageRounds(page);

    const summary = state.resultSummary;

    expect(summary).toMatchObject({
      timedOut: false,
      roundsRight: 3,
      roundsWrong: 0,
      accuracy: 100,
    });

    expect(summary.timeBonus).toBe(state.timeRemaining * 5);

    expect(summary.finalScore).toBe(300 + summary.timeBonus);

    expect(state.score).toBe(summary.finalScore);

    expect(state.correctChecks).toBe(3);

    expect(state.checks).toBe(3);

    // Guest sessions must never write leaderboard scores.
    expect(calls.score).toHaveLength(0);
  });

  test("a signed-in completion submits the exact result payload once", async ({
    page,
  }) => {
    const calls = await openPassageReconstructionAsSignedIn(page);

    await startEnglishBoard(page);

    const state = await completeAllPassageRounds(page);

    await expect.poll(() => calls.score.length).toBe(1);

    const submission = calls.score[0];

    expect(submission.method).toBe("POST");

    expect(submission.body).toEqual({
      uuid: PASSAGE_SIGNED_IN_USER.id,
      displayName: PASSAGE_SIGNED_IN_USER.name,
      score: state.resultSummary.finalScore,
      time: (90 - state.timeRemaining) * 1000,
      hintsUsed: 0,
      storyId: TEST_STORY.storyId,
    });
  });

  test("a failed score request leaves the completed results screen intact", async ({
    page,
  }) => {
    const calls = await openPassageReconstructionAsSignedIn(page, {
      scoreStatus: 500,
      scoreMessage: "Deterministic score failure.",
    });

    await startEnglishBoard(page);

    await completeAllPassageRounds(page);

    await expect.poll(() => calls.score.length).toBe(1);

    const state = await getPassageReconstructionState(page);

    expect(state.screen).toBe("results-complete");

    expect(state.gameOver).toBe(true);

    expect(state.resultSummary.finalScore).toBe(state.score);
  });

  test("Play Again resets the completed session to a clean language picker", async ({
    page,
  }) => {
    await openPassageReconstructionAsGuest(page);

    await startEnglishBoard(page);

    await callPassageReconstructionHook(page, "expireTimerForTest");

    const reset = await callPassageReconstructionHook(page, "playAgainForTest");

    expect(reset).toBe(true);

    const state = await getPassageReconstructionState(page);

    expect(state).toMatchObject({
      screen: "language-picker",
      message: "",
      roundNumber: 0,
      roundCount: 0,
      score: 0,
      attemptsLeft: 3,
      checks: 0,
      correctChecks: 0,
      hintsRemaining: 2,
      hintsUsedTotal: 0,
      lastHintText: "",
      resultSummary: null,
      timeRemaining: 90,
      gameOver: false,
      feedbackActive: false,
    });
  });

  test("leaving GameScene removes Passage Reconstruction debug state and commands", async ({
    page,
  }) => {
    await openPassageReconstructionAsGuest(page);

    await startEnglishBoard(page);

    await returnToLauncherFromScene(page, "sentence-builder");

    await expect
      .poll(() =>
        page.evaluate(() => ({
          debug: typeof window.__passageReconstructionZimDebug,
          hooks: typeof window.__passageReconstructionZimTestHooks,
        })),
      )
      .toEqual({
        debug: "undefined",
        hooks: "undefined",
      });
  });
});
