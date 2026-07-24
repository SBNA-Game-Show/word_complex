import { expect, test } from "@playwright/test";

import {
  TEST_STORY,
  returnToLauncherFromScene,
} from "./helpers/app-fixtures.js";

import {
  MEANING_BRIDGE_MODES,
  MEANING_BRIDGE_STAGE_SIZE,
  clickMeaningBridgeCard,
  clickMeaningBridgeCorrectPair,
  clickMeaningBridgeWrongPair,
  openMeaningBridgeAsGuest,
  openMeaningBridgeAsSignedIn,
  readMeaningBridgeState,
  runMeaningBridgeCommand,
  startMeaningBridgeTimed,
  waitForMeaningBridgeScreen,
  MEANING_BRIDGE_GAME_ID,
} from "./helpers/meaning-bridge-fixtures.js";

const CHALLENGES = [
  {
    mode: MEANING_BRIDGE_MODES.SYNONYM,
    activeChallenge: "Synonyms",
    instruction: "Match each word to its synonym.",
    firstLeftLabel: "brave",
    firstRightLabel: "courageous",
  },
  {
    mode: MEANING_BRIDGE_MODES.DEFINITION,
    activeChallenge: "Definitions",
    instruction: "Match each word to its definition.",
    firstLeftLabel: "orbit",
    firstRightLabel: "the curved path of an object around another object",
  },
  {
    mode: MEANING_BRIDGE_MODES.ANTONYM,
    activeChallenge: "Antonyms",
    instruction: "Match each word to its opposite.",
    firstLeftLabel: "ancient",
    firstRightLabel: "modern",
  },
];

async function completeMeaningBridgeRoundWithRealClicks(page) {
  const initial = await readMeaningBridgeState(page);

  for (const leftItem of initial.leftItems) {
    await clickMeaningBridgeCorrectPair(page, leftItem.id);
  }

  return waitForMeaningBridgeScreen(page, "round-complete");
}

async function completeMeaningBridgeRoundForSubmission(page, options = {}) {
  const completed = await runMeaningBridgeCommand(
    page,
    "completeCurrentPuzzleForTest",
    options,
  );

  expect(completed).toBe(true);

  return waitForMeaningBridgeScreen(page, "round-complete");
}

async function finishMeaningBridgePracticeAndWait(page) {
  await runMeaningBridgeCommand(page, "finishPracticeForTest");

  await expect
    .poll(
      async () => {
        const state = await readMeaningBridgeState(page);

        return {
          screen: state?.screen,
          isSubmittingScore: state?.isSubmittingScore,
        };
      },
      {
        timeout: 15_000,
      },
    )
    .toEqual({
      screen: "final-score",
      isSubmittingScore: false,
    });

  return readMeaningBridgeState(page);
}

async function openMeaningBridgeLeaderboardAndWait(
  page,
  returnScreen = "landing",
) {
  await runMeaningBridgeCommand(page, "openLeaderboardForTest", returnScreen);

  await expect
    .poll(
      async () => {
        const state = await readMeaningBridgeState(page);

        return {
          screen: state?.screen,
          isLoadingLeaderboard: state?.isLoadingLeaderboard,
        };
      },
      {
        timeout: 15_000,
      },
    )
    .toEqual({
      screen: "leaderboard",
      isLoadingLeaderboard: false,
    });

  return readMeaningBridgeState(page);
}

test.describe("Meaning Bridge gameplay", () => {
  test("opens at the production landing screen with an isolated E2E state bridge", async ({
    page,
  }) => {
    const { meaningBridgeCalls } = await openMeaningBridgeAsGuest(page);

    const state = await readMeaningBridgeState(page);

    expect(state).toMatchObject({
      screen: "landing",
      playerIdentityType: "Guest",
      currentMode: MEANING_BRIDGE_MODES.SYNONYM,
      activeChallenge: "Synonyms",
      roundIndex: 0,
      roundNumber: 1,
      pairCount: 4,
      currentPairCount: 4,
      totalScore: 0,
      roundStartScore: 0,
      matchedCount: 0,
      totalPairs: 4,
      roundHintsUsed: 0,
      roundWrongAttempts: 0,
      completedRounds: 0,
      submittedRounds: 0,
      playMode: "practice",
      activePlayMode: "Practice",
      timerPreset: 120,
      selectedTimerSeconds: 120,
      timerPreset: 120,
      selectedTimerSeconds: 0,
      completedPuzzles: 0,
      hasPuzzle: false,
      isLoading: false,
    });

    expect(state.leftItems).toEqual([]);
    expect(state.rightItems).toEqual([]);
    expect(state.leftCardGeometry).toEqual([]);
    expect(state.rightCardGeometry).toEqual([]);

    expect(state.stageSize).toEqual(MEANING_BRIDGE_STAGE_SIZE);

    expect(meaningBridgeCalls.generateRequests).toHaveLength(0);
    expect(meaningBridgeCalls.submitRequests).toHaveLength(0);
    expect(meaningBridgeCalls.persistentScoreRequests).toHaveLength(0);
  });

  for (const challenge of CHALLENGES) {
    test(`starts ${challenge.activeChallenge} Practice through the production round API`, async ({
      page,
    }) => {
      const { meaningBridgeCalls } = await openMeaningBridgeAsGuest(page, {
        startPractice: true,
        mode: challenge.mode,
      });

      const state = await readMeaningBridgeState(page);

      expect(state).toMatchObject({
        screen: "gameplay",
        currentMode: challenge.mode,
        activeChallenge: challenge.activeChallenge,
        playMode: "practice",
        activePlayMode: "Practice",
        roundIndex: 0,
        roundNumber: 1,
        pairCount: 4,
        currentPairCount: 4,
        puzzleRoundId: `${challenge.mode}-4-round-1`,
        instruction: challenge.instruction,
        matchedCount: 0,
        totalPairs: 4,
        totalScore: 0,
        roundHintsUsed: 0,
        roundWrongAttempts: 0,
        hasPuzzle: true,
      });

      expect(meaningBridgeCalls.generateRequests).toHaveLength(1);

      expect(meaningBridgeCalls.generateRequests[0]).toMatchObject({
        method: "POST",
        body: {
          mode: challenge.mode,
          pairCount: 4,
          storyId: TEST_STORY.storyId,
        },
      });

      expect(state.leftItems).toHaveLength(4);
      expect(state.rightItems).toHaveLength(4);

      expect(state.leftItems[0]).toMatchObject({
        id: "left_0",
        label: challenge.firstLeftLabel,
      });

      const firstAnswerId = state.answerKey.left_0;

      expect(firstAnswerId).toBe("right_0");

      expect(
        state.rightItems.find((item) => item.id === firstAnswerId),
      ).toMatchObject({
        label: challenge.firstRightLabel,
      });

      expect(state.hints.left_0).toContain(challenge.firstLeftLabel);
    });
  }

  test("starts a five-minute Timed Challenge and preserves the selected timer", async ({
    page,
  }) => {
    const { meaningBridgeCalls } = await openMeaningBridgeAsGuest(page);

    const state = await startMeaningBridgeTimed(
      page,
      MEANING_BRIDGE_MODES.ANTONYM,
      300,
    );

    expect(state).toMatchObject({
      screen: "gameplay",
      currentMode: MEANING_BRIDGE_MODES.ANTONYM,
      activeChallenge: "Antonyms",
      playMode: "timed",
      activePlayMode: "Timed Challenge",
      timerPreset: 300,
      selectedTimerSeconds: 300,
      timedSecondsTotal: 300,
      pairCount: 4,
      puzzleRoundId: `${MEANING_BRIDGE_MODES.ANTONYM}-4-round-1`,
    });

    expect(state.timedSecondsLeft).toBeGreaterThan(0);
    expect(state.timedSecondsLeft).toBeLessThanOrEqual(300);

    expect(meaningBridgeCalls.generateRequests).toHaveLength(1);

    expect(meaningBridgeCalls.generateRequests[0].body).toEqual({
      mode: MEANING_BRIDGE_MODES.ANTONYM,
      pairCount: 4,
      storyId: TEST_STORY.storyId,
    });
  });

  test("clamps custom Timed Challenge input to the production 1-to-60-minute limits", async ({
    page,
  }) => {
    const { meaningBridgeCalls } = await openMeaningBridgeAsGuest(page);

    const minimum = await runMeaningBridgeCommand(
      page,
      "setCustomTimerMinutesForTest",
      0,
    );

    expect(minimum).toBe(1);

    let state = await readMeaningBridgeState(page);

    expect(state).toMatchObject({
      screen: "challenge",
      playMode: "timed",
      activePlayMode: "Timed Challenge",
      timerPreset: "custom",
      customTimerMinutes: 1,
      isCustomTimerSelected: true,
      selectedTimerSeconds: 60,
    });

    const maximum = await runMeaningBridgeCommand(
      page,
      "setCustomTimerMinutesForTest",
      100,
    );

    expect(maximum).toBe(60);

    state = await readMeaningBridgeState(page);

    expect(state).toMatchObject({
      screen: "challenge",
      playMode: "timed",
      activePlayMode: "Timed Challenge",
      timerPreset: "custom",
      customTimerMinutes: 60,
      isCustomTimerSelected: true,
      selectedTimerSeconds: 3600,
    });

    expect(meaningBridgeCalls.generateRequests).toHaveLength(0);
  });

  test("publishes the live ZIM card geometry for all four cards on both sides", async ({
    page,
  }) => {
    await openMeaningBridgeAsGuest(page, {
      startPractice: true,
      mode: MEANING_BRIDGE_MODES.SYNONYM,
    });

    const state = await readMeaningBridgeState(page);

    expect(state.leftCardGeometry).toHaveLength(4);
    expect(state.rightCardGeometry).toHaveLength(4);

    expect(state.leftCardGeometry.map((card) => card.id)).toEqual(
      state.leftItems.map((item) => item.id),
    );

    expect(state.rightCardGeometry.map((card) => card.id)).toEqual(
      state.rightItems.map((item) => item.id),
    );

    for (const card of [
      ...state.leftCardGeometry,
      ...state.rightCardGeometry,
    ]) {
      expect(card.width).toBeGreaterThan(0);
      expect(card.height).toBeGreaterThan(0);
      expect(card.centerX).toBeGreaterThan(0);
      expect(card.centerY).toBeGreaterThan(0);

      expect(card.centerX).toBeLessThan(MEANING_BRIDGE_STAGE_SIZE.width);

      expect(card.centerY).toBeLessThan(MEANING_BRIDGE_STAGE_SIZE.height);

      expect(card.matched).toBe(false);
      expect(card.selected).toBe(false);
      expect(card.wrong).toBe(false);
      expect(card.mouseEnabled).toBe(true);
    }

    expect(new Set(state.leftCardGeometry.map((card) => card.id)).size).toBe(4);

    expect(new Set(state.rightCardGeometry.map((card) => card.id)).size).toBe(
      4,
    );
  });

  test("performs a real canvas match through onCardClick and production scoring", async ({
    page,
  }) => {
    await openMeaningBridgeAsGuest(page, {
      startPractice: true,
      mode: MEANING_BRIDGE_MODES.SYNONYM,
    });

    const before = await readMeaningBridgeState(page);
    const leftId = before.leftItems[0].id;
    const rightId = before.answerKey[leftId];

    expect(before).toMatchObject({
      screen: "gameplay",
      totalScore: 0,
      matchedCount: 0,
      roundWrongAttempts: 0,
      selectedLeftId: null,
      selectedRightId: null,
    });

    const after = await clickMeaningBridgeCorrectPair(page, leftId);

    expect(after).toMatchObject({
      screen: "gameplay",
      totalScore: 10,
      matchedCount: 1,
      roundWrongAttempts: 0,
      selectedLeftId: null,
      selectedRightId: null,
    });

    expect(after.matches).toEqual({
      [leftId]: rightId,
    });

    expect(
      after.leftCardGeometry.find((card) => card.id === leftId),
    ).toMatchObject({
      matched: true,
      mouseEnabled: false,
    });

    expect(
      after.rightCardGeometry.find((card) => card.id === rightId),
    ).toMatchObject({
      matched: true,
      mouseEnabled: false,
    });
  });

  test("applies the production wrong-match penalty and preserves the selected word", async ({
    page,
  }) => {
    await openMeaningBridgeAsGuest(page, {
      startPractice: true,
      mode: MEANING_BRIDGE_MODES.SYNONYM,
    });

    const initial = await readMeaningBridgeState(page);

    const firstLeftId = initial.leftItems[0].id;

    await clickMeaningBridgeCorrectPair(page, firstLeftId);

    const afterCorrect = await readMeaningBridgeState(page);

    expect(afterCorrect).toMatchObject({
      screen: "gameplay",
      totalScore: 10,
      matchedCount: 1,
      roundWrongAttempts: 0,
    });

    const secondLeftId = afterCorrect.leftItems[1].id;

    const afterWrong = await clickMeaningBridgeWrongPair(page, secondLeftId);

    expect(afterWrong).toMatchObject({
      screen: "gameplay",
      totalScore: 5,
      matchedCount: 1,
      roundWrongAttempts: 1,
      selectedLeftId: secondLeftId,
      selectedRightId: null,
    });

    expect(afterWrong.matches).toEqual({
      [firstLeftId]: initial.answerKey[firstLeftId],
    });
  });

  test("counts a selected-word hint once and does not charge an unselected hint", async ({
    page,
  }) => {
    await openMeaningBridgeAsGuest(page, {
      startPractice: true,
      mode: MEANING_BRIDGE_MODES.SYNONYM,
    });

    const withoutSelection = await runMeaningBridgeCommand(
      page,
      "requestHintForTest",
    );

    expect(withoutSelection).toBe(
      "Pick a word from the left side first, then I can help!",
    );

    let state = await readMeaningBridgeState(page);

    expect(state).toMatchObject({
      roundHintsUsed: 0,
      totalScore: 0,
      selectedLeftId: null,
    });

    const leftId = state.leftItems[0].id;

    await clickMeaningBridgeCard(page, "left", leftId);

    await expect
      .poll(() => readMeaningBridgeState(page))
      .toMatchObject({
        selectedLeftId: leftId,
      });

    const firstHint = await runMeaningBridgeCommand(page, "requestHintForTest");

    state = await readMeaningBridgeState(page);

    expect(firstHint).toBe(state.hints[leftId]);

    expect(state).toMatchObject({
      selectedLeftId: leftId,
      roundHintsUsed: 1,
      totalScore: 0,
      lastHintText: state.hints[leftId],
    });

    const repeatedHint = await runMeaningBridgeCommand(
      page,
      "requestHintForTest",
    );

    state = await readMeaningBridgeState(page);

    expect(repeatedHint).toBe(firstHint);

    expect(state).toMatchObject({
      selectedLeftId: leftId,
      roundHintsUsed: 1,
      totalScore: 0,
      lastHintText: firstHint,
    });
  });

  test("completes a four-pair round through real canvas matches and publishes its result summary", async ({
    page,
  }) => {
    await openMeaningBridgeAsGuest(page, {
      startPractice: true,
      mode: MEANING_BRIDGE_MODES.DEFINITION,
    });

    const roundComplete = await completeMeaningBridgeRoundWithRealClicks(page);

    expect(roundComplete).toMatchObject({
      screen: "round-complete",
      currentMode: MEANING_BRIDGE_MODES.DEFINITION,
      roundIndex: 0,
      roundNumber: 1,
      pairCount: 4,
      currentPairCount: 4,
      totalScore: 40,
      matchedCount: 4,
      totalPairs: 4,
      completedPuzzles: 1,
      completedRounds: 1,
      roundHintsUsed: 0,
      roundWrongAttempts: 0,
    });

    expect(roundComplete.matches).toEqual(roundComplete.answerKey);

    expect(roundComplete.currentPuzzleResultSummary).toMatchObject({
      accuracy: 100,
      hintsUsed: 0,
      wrongAttempts: 0,
    });

    expect(
      roundComplete.currentPuzzleResultSummary.timeSeconds,
    ).toBeGreaterThanOrEqual(0);
  });

  test("progresses through the production 4-to-5-to-6 pair session sequence", async ({
    page,
  }) => {
    const { meaningBridgeCalls } = await openMeaningBridgeAsGuest(page, {
      startPractice: true,
      mode: MEANING_BRIDGE_MODES.ANTONYM,
    });

    let state = await readMeaningBridgeState(page);

    expect(state).toMatchObject({
      screen: "gameplay",
      roundIndex: 0,
      roundNumber: 1,
      pairCount: 4,
      currentPairCount: 4,
    });

    await completeMeaningBridgeRoundWithRealClicks(page);

    await runMeaningBridgeCommand(page, "advanceAfterRoundCompleteForTest");

    state = await waitForMeaningBridgeScreen(page, "gameplay");

    expect(state).toMatchObject({
      roundIndex: 1,
      roundNumber: 2,
      pairCount: 5,
      currentPairCount: 5,
      totalPairs: 5,
      completedPuzzles: 1,
      completedRounds: 1,
    });

    expect(state.leftItems).toHaveLength(5);
    expect(state.rightItems).toHaveLength(5);
    expect(state.leftCardGeometry).toHaveLength(5);
    expect(state.rightCardGeometry).toHaveLength(5);

    await completeMeaningBridgeRoundWithRealClicks(page);

    await runMeaningBridgeCommand(page, "advanceAfterRoundCompleteForTest");

    state = await waitForMeaningBridgeScreen(page, "gameplay");

    expect(state).toMatchObject({
      roundIndex: 2,
      roundNumber: 3,
      pairCount: 6,
      currentPairCount: 6,
      totalPairs: 6,
      completedPuzzles: 2,
      completedRounds: 2,
      totalScore: 90,
    });

    expect(state.leftItems).toHaveLength(6);
    expect(state.rightItems).toHaveLength(6);
    expect(state.leftCardGeometry).toHaveLength(6);
    expect(state.rightCardGeometry).toHaveLength(6);

    expect(meaningBridgeCalls.generateRequests).toHaveLength(3);

    expect(
      meaningBridgeCalls.generateRequests.map(
        (request) => request.body.pairCount,
      ),
    ).toEqual([4, 5, 6]);

    for (const request of meaningBridgeCalls.generateRequests) {
      expect(request.body).toMatchObject({
        mode: MEANING_BRIDGE_MODES.ANTONYM,
        storyId: TEST_STORY.storyId,
      });
    }
  });

  test("submits a completed guest round using the authoritative server result without persistent storage", async ({
    page,
  }) => {
    const { meaningBridgeCalls } = await openMeaningBridgeAsGuest(page, {
      startPractice: true,
      mode: MEANING_BRIDGE_MODES.SYNONYM,
    });

    await completeMeaningBridgeRoundForSubmission(page, {
      wrongAttempts: 1,
      hintsUsed: 1,
      timeSeconds: 20,
    });

    const state = await finishMeaningBridgePracticeAndWait(page);

    expect(state).toMatchObject({
      screen: "final-score",
      totalScore: 35,
      completedPuzzles: 1,
      completedRounds: 1,
      submittedRounds: 1,
      isSubmittingScore: false,
      scoreSubmitMessage: "Score saved! Great bridge building.",
      scoreSubmitError: "",
      leaderboardCount: 3,
    });

    expect(state.submittedResultSummary).toMatchObject({
      score: 68,
      speedBonus: 35,
      accuracy: 67,
      correctMatches: 4,
      totalPairs: 4,
      timeSeconds: 20,
      hintsUsed: 1,
      wrongAttempts: 1,
      puzzlesCompleted: 1,
      message: "Score saved! Great bridge building.",
    });

    expect(meaningBridgeCalls.submitRequests).toHaveLength(1);

    expect(meaningBridgeCalls.submitRequests[0].body).toMatchObject({
      roundId: `${MEANING_BRIDGE_MODES.SYNONYM}-4-round-1`,
      playerName: "E2E Reader",
      timeSeconds: 20,
      hintsUsed: 1,
      wrongAttempts: 1,
      pairCount: 4,
    });

    expect(meaningBridgeCalls.submitRequests[0].body.matches).toHaveLength(4);

    expect(meaningBridgeCalls.persistentScoreRequests).toHaveLength(0);

    expect(meaningBridgeCalls.globalLeaderboardRequests).toHaveLength(1);

    expect(meaningBridgeCalls.fallbackLeaderboardRequests).toHaveLength(0);
  });

  test("persists the authoritative completed-session result for a signed-in player", async ({
    page,
  }) => {
    const { meaningBridgeCalls } = await openMeaningBridgeAsSignedIn(page, {
      startPractice: true,
      mode: MEANING_BRIDGE_MODES.DEFINITION,
    });

    await completeMeaningBridgeRoundForSubmission(page, {
      timeSeconds: 30,
    });

    const state = await finishMeaningBridgePracticeAndWait(page);

    expect(state).toMatchObject({
      screen: "final-score",
      playerName: "Mira Meaning",
      playerIdentityType: "Signed in",
      totalScore: 40,
      completedRounds: 1,
      submittedRounds: 1,
      scoreSubmitMessage: "New personal best saved!",
      scoreSubmitError: "",
    });

    expect(state.submittedResultSummary).toMatchObject({
      score: 70,
      speedBonus: 30,
      accuracy: 100,
      correctMatches: 4,
      totalPairs: 4,
      timeSeconds: 30,
      hintsUsed: 0,
      wrongAttempts: 0,
      puzzlesCompleted: 1,
      message: "New personal best saved!",
    });

    expect(meaningBridgeCalls.submitRequests).toHaveLength(1);

    expect(meaningBridgeCalls.submitRequests[0].body).toMatchObject({
      playerName: "Mira Meaning",
      pairCount: 4,
      timeSeconds: 30,
    });

    expect(meaningBridgeCalls.persistentScoreRequests).toHaveLength(1);

    expect(meaningBridgeCalls.persistentScoreRequests[0].body).toEqual({
      uuid: "meaning-reader-1",
      playerName: "Mira Meaning",
      score: 70,
      timeSeconds: 30,
      accuracy: 100,
    });

    expect(meaningBridgeCalls.globalLeaderboardRequests).toHaveLength(1);
  });

  test("keeps a successful round submission when signed-in best-score persistence fails", async ({
    page,
  }) => {
    const { meaningBridgeCalls } = await openMeaningBridgeAsSignedIn(page, {
      startPractice: true,
      mode: MEANING_BRIDGE_MODES.SYNONYM,
      apiOptions: {
        persistentScoreStatus: 500,
        persistentScoreError: "Deterministic best-score failure.",
      },
    });

    await completeMeaningBridgeRoundForSubmission(page, {
      timeSeconds: 30,
    });

    const state = await finishMeaningBridgePracticeAndWait(page);

    expect(state).toMatchObject({
      screen: "final-score",
      completedRounds: 1,
      submittedRounds: 1,
      scoreSubmitMessage: "Score saved! Great bridge building.",
      scoreSubmitError: "",
    });

    expect(state.submittedResultSummary).toMatchObject({
      score: 70,
      speedBonus: 30,
      accuracy: 100,
    });

    expect(meaningBridgeCalls.submitRequests).toHaveLength(1);

    expect(meaningBridgeCalls.persistentScoreRequests).toHaveLength(1);

    expect(meaningBridgeCalls.globalLeaderboardRequests).toHaveLength(1);
  });

  test("does not submit an already-saved round twice", async ({ page }) => {
    const { meaningBridgeCalls } = await openMeaningBridgeAsGuest(page, {
      startPractice: true,
      mode: MEANING_BRIDGE_MODES.SYNONYM,
    });

    await completeMeaningBridgeRoundForSubmission(page, {
      timeSeconds: 30,
    });

    let state = await finishMeaningBridgePracticeAndWait(page);

    expect(state.submittedRounds).toBe(1);
    expect(meaningBridgeCalls.submitRequests).toHaveLength(1);

    state = await runMeaningBridgeCommand(page, "submitScoreForTest");

    expect(state).toMatchObject({
      screen: "final-score",
      submittedRounds: 1,
      isSubmittingScore: false,
      scoreSubmitError: "",
    });

    expect(meaningBridgeCalls.submitRequests).toHaveLength(1);

    expect(meaningBridgeCalls.globalLeaderboardRequests).toHaveLength(2);
  });

  test("surfaces a round-submission failure without marking the round as submitted", async ({
    page,
  }) => {
    const { meaningBridgeCalls } = await openMeaningBridgeAsGuest(page, {
      startPractice: true,
      apiOptions: {
        submitStatus: 500,
        submitError: "Deterministic round submit failure.",
      },
    });

    await completeMeaningBridgeRoundForSubmission(page, {
      timeSeconds: 30,
    });

    const state = await finishMeaningBridgePracticeAndWait(page);

    expect(state).toMatchObject({
      screen: "final-score",
      completedRounds: 1,
      submittedRounds: 0,
      isSubmittingScore: false,
      scoreSubmitMessage: "",
      scoreSubmitError: "Deterministic round submit failure.",
      submittedResultSummary: null,
      leaderboardCount: 0,
    });

    expect(meaningBridgeCalls.submitRequests).toHaveLength(1);

    expect(meaningBridgeCalls.persistentScoreRequests).toHaveLength(0);

    expect(meaningBridgeCalls.globalLeaderboardRequests).toHaveLength(0);

    expect(meaningBridgeCalls.fallbackLeaderboardRequests).toHaveLength(0);
  });

  test("loads the persistent Meaning Bridge leaderboard without using the fallback", async ({
    page,
  }) => {
    const { meaningBridgeCalls } = await openMeaningBridgeAsGuest(page);

    const state = await openMeaningBridgeLeaderboardAndWait(page);

    expect(state).toMatchObject({
      screen: "leaderboard",
      isLoadingLeaderboard: false,
      leaderboardError: "",
      leaderboardCount: 3,
    });

    expect(meaningBridgeCalls.globalLeaderboardRequests).toHaveLength(1);

    expect(meaningBridgeCalls.fallbackLeaderboardRequests).toHaveLength(0);

    expect(meaningBridgeCalls.generateRequests).toHaveLength(0);
  });

  test("falls back to the session leaderboard when persistent leaderboard loading fails", async ({
    page,
  }) => {
    const { meaningBridgeCalls } = await openMeaningBridgeAsGuest(page, {
      apiOptions: {
        globalLeaderboardStatus: 500,
        globalLeaderboardError: "Persistent leaderboard failed.",
        fallbackLeaderboardRows: [
          {
            playerName: "Fallback Builder",
            totalScore: 111,
            roundsPlayed: 2,
            accuracyAverage: 80,
          },
        ],
      },
    });

    const state = await openMeaningBridgeLeaderboardAndWait(page);

    expect(state).toMatchObject({
      screen: "leaderboard",
      isLoadingLeaderboard: false,
      leaderboardError: "",
      leaderboardCount: 1,
    });

    expect(meaningBridgeCalls.globalLeaderboardRequests).toHaveLength(1);

    expect(meaningBridgeCalls.fallbackLeaderboardRequests).toHaveLength(1);
  });

  test("publishes an error when both leaderboard sources fail", async ({
    page,
  }) => {
    const { meaningBridgeCalls } = await openMeaningBridgeAsGuest(page, {
      apiOptions: {
        globalLeaderboardStatus: 500,
        globalLeaderboardError: "Persistent leaderboard failed.",
        fallbackLeaderboardStatus: 500,
        fallbackLeaderboardError: "Fallback leaderboard failed.",
      },
    });

    const state = await openMeaningBridgeLeaderboardAndWait(page);

    expect(state).toMatchObject({
      screen: "leaderboard",
      isLoadingLeaderboard: false,
      leaderboardError: "Persistent leaderboard failed.",
      leaderboardCount: 0,
    });

    expect(meaningBridgeCalls.globalLeaderboardRequests).toHaveLength(1);

    expect(meaningBridgeCalls.fallbackLeaderboardRequests).toHaveLength(1);
  });

  test("publishes loading while the production round request is pending", async ({
    page,
  }) => {
    const { meaningBridgeCalls } = await openMeaningBridgeAsGuest(page, {
      apiOptions: {
        generateDelayMs: 1200,
      },
    });

    await runMeaningBridgeCommand(
      page,
      "startPracticeForTest",
      MEANING_BRIDGE_MODES.SYNONYM,
    );

    const loading = await waitForMeaningBridgeScreen(page, "loading");

    expect(loading).toMatchObject({
      screen: "loading",
      isLoading: true,
      errorMessage: "",
      hasPuzzle: false,
      roundIndex: 0,
      roundNumber: 1,
      pairCount: 4,
    });

    expect(meaningBridgeCalls.generateRequests).toHaveLength(1);

    const gameplay = await waitForMeaningBridgeScreen(page, "gameplay");

    expect(gameplay).toMatchObject({
      screen: "gameplay",
      isLoading: false,
      errorMessage: "",
      hasPuzzle: true,
      pairCount: 4,
    });
  });

  test("shows a generation error and retries through the keyboard R shortcut", async ({
    page,
  }) => {
    const { meaningBridgeCalls } = await openMeaningBridgeAsGuest(page, {
      apiOptions: {
        generateStatuses: [500, 200],
        generateError: "Deterministic Meaning Bridge generation failure.",
      },
    });

    await runMeaningBridgeCommand(
      page,
      "startPracticeForTest",
      MEANING_BRIDGE_MODES.DEFINITION,
    );

    const errorState = await waitForMeaningBridgeScreen(page, "error");

    expect(errorState).toMatchObject({
      screen: "error",
      isLoading: false,
      hasPuzzle: false,
      errorMessage: "Deterministic Meaning Bridge generation failure.",
    });

    expect(meaningBridgeCalls.generateRequests).toHaveLength(1);

    await page.keyboard.press("r");

    await expect.poll(() => meaningBridgeCalls.generateRequests.length).toBe(2);

    const gameplay = await waitForMeaningBridgeScreen(page, "gameplay");

    expect(gameplay).toMatchObject({
      screen: "gameplay",
      currentMode: MEANING_BRIDGE_MODES.DEFINITION,
      errorMessage: "",
      hasPuzzle: true,
      puzzleRoundId: `${MEANING_BRIDGE_MODES.DEFINITION}-4-round-2`,
    });

    expect(
      meaningBridgeCalls.generateRequests.map(
        (request) => request.body.pairCount,
      ),
    ).toEqual([4, 4]);
  });

  test("uses keyboard H for hints and keyboard R to retry the active puzzle", async ({
    page,
  }) => {
    const { meaningBridgeCalls } = await openMeaningBridgeAsGuest(page, {
      startPractice: true,
      mode: MEANING_BRIDGE_MODES.SYNONYM,
    });

    let state = await readMeaningBridgeState(page);
    const leftId = state.leftItems[0].id;

    await clickMeaningBridgeCard(page, "left", leftId);

    await expect
      .poll(() => readMeaningBridgeState(page))
      .toMatchObject({
        selectedLeftId: leftId,
      });

    await page.keyboard.press("h");

    await expect
      .poll(() => readMeaningBridgeState(page))
      .toMatchObject({
        selectedLeftId: leftId,
        roundHintsUsed: 1,
      });

    state = await readMeaningBridgeState(page);

    expect(state.lastHintText).toBe(state.hints[leftId]);

    await clickMeaningBridgeCorrectPair(page, leftId);

    state = await readMeaningBridgeState(page);

    expect(state).toMatchObject({
      totalScore: 10,
      matchedCount: 1,
      roundHintsUsed: 1,
    });

    await page.keyboard.press("r");

    await expect.poll(() => meaningBridgeCalls.generateRequests.length).toBe(2);

    state = await waitForMeaningBridgeScreen(page, "gameplay");

    expect(state).toMatchObject({
      roundIndex: 0,
      roundNumber: 1,
      pairCount: 4,
      totalScore: 0,
      roundStartScore: 0,
      matchedCount: 0,
      roundHintsUsed: 0,
      roundWrongAttempts: 0,
      selectedLeftId: null,
      selectedRightId: null,
      puzzleRoundId: `${MEANING_BRIDGE_MODES.SYNONYM}-4-round-2`,
    });

    expect(state.matches).toEqual({});
  });

  test("uses keyboard S to skip to the next production pair-count round", async ({
    page,
  }) => {
    const { meaningBridgeCalls } = await openMeaningBridgeAsGuest(page, {
      startPractice: true,
      mode: MEANING_BRIDGE_MODES.ANTONYM,
    });

    await page.keyboard.press("s");

    await expect.poll(() => meaningBridgeCalls.generateRequests.length).toBe(2);

    const state = await waitForMeaningBridgeScreen(page, "gameplay");

    expect(state).toMatchObject({
      screen: "gameplay",
      currentMode: MEANING_BRIDGE_MODES.ANTONYM,
      roundIndex: 1,
      roundNumber: 2,
      pairCount: 5,
      currentPairCount: 5,
      totalPairs: 5,
      totalScore: 0,
      completedPuzzles: 0,
      completedRounds: 0,
      puzzleRoundId: `${MEANING_BRIDGE_MODES.ANTONYM}-5-round-2`,
    });

    expect(
      meaningBridgeCalls.generateRequests.map(
        (request) => request.body.pairCount,
      ),
    ).toEqual([4, 5]);
  });

  test("keyboard Escape opens exit confirmation, cancellation preserves progress, and confirmation resets", async ({
    page,
  }) => {
    await openMeaningBridgeAsGuest(page, {
      startPractice: true,
      mode: MEANING_BRIDGE_MODES.SYNONYM,
    });

    const initial = await readMeaningBridgeState(page);
    const leftId = initial.leftItems[0].id;
    const rightId = initial.answerKey[leftId];

    await clickMeaningBridgeCorrectPair(page, leftId);

    await page.keyboard.press("Escape");

    let state = await waitForMeaningBridgeScreen(page, "confirm-exit");

    expect(state).toMatchObject({
      screen: "confirm-exit",
      totalScore: 10,
      matchedCount: 1,
    });

    expect(state.matches).toEqual({
      [leftId]: rightId,
    });

    await runMeaningBridgeCommand(page, "cancelExitForTest");

    state = await waitForMeaningBridgeScreen(page, "gameplay");

    expect(state).toMatchObject({
      screen: "gameplay",
      totalScore: 10,
      matchedCount: 1,
    });

    expect(state.matches).toEqual({
      [leftId]: rightId,
    });

    await page.keyboard.press("Escape");

    await waitForMeaningBridgeScreen(page, "confirm-exit");

    await runMeaningBridgeCommand(page, "confirmExitForTest");

    state = await waitForMeaningBridgeScreen(page, "landing");

    expect(state).toMatchObject({
      screen: "landing",
      roundIndex: 0,
      roundNumber: 1,
      totalScore: 0,
      matchedCount: 0,
      completedPuzzles: 0,
      completedRounds: 0,
      submittedRounds: 0,
      hasPuzzle: false,
    });

    expect(state.matches).toEqual({});
    expect(state.leftItems).toEqual([]);
    expect(state.rightItems).toEqual([]);
  });

  test("expires a real timed round through the production interval and advances to round two", async ({
    page,
  }) => {
    const { meaningBridgeCalls } = await openMeaningBridgeAsGuest(page);

    /*
     * Keep ZIM, network request timeouts, and the production interval on their
     * normal browser timers. Only move Date.now() beyond the active deadline
     * after the timed round has fully loaded.
     */
    const initial = await startMeaningBridgeTimed(
      page,
      MEANING_BRIDGE_MODES.SYNONYM,
      60,
    );

    expect(initial).toMatchObject({
      screen: "gameplay",
      playMode: "timed",
      timedSecondsTotal: 60,
      roundIndex: 0,
      roundNumber: 1,
      pairCount: 4,
      completedRounds: 0,
      completedPuzzles: 0,
    });

    expect(initial.timedSecondsLeft).toBeGreaterThan(0);
    expect(initial.timedSecondsLeft).toBeLessThanOrEqual(60);

    const browserNow = await page.evaluate(() => Date.now());

    /*
     * setFixedTime changes Date.now() but keeps the already-running native
     * interval alive. Its next tick enters the real updateTimedClock() and
     * handleRoundTimeout() production path.
     */
    await page.clock.setFixedTime(browserNow + 61_000);

    await expect
      .poll(() => meaningBridgeCalls.generateRequests.length, {
        timeout: 15_000,
      })
      .toBe(2);

    const state = await waitForMeaningBridgeScreen(page, "gameplay");

    expect(state).toMatchObject({
      screen: "gameplay",
      playMode: "timed",
      roundIndex: 1,
      roundNumber: 2,
      pairCount: 5,
      currentPairCount: 5,
      totalPairs: 5,
      totalScore: 0,
      matchedCount: 0,
      completedPuzzles: 0,
      completedRounds: 1,
      timedSecondsTotal: 60,
    });

    expect(state.timedSecondsLeft).toBeGreaterThan(0);
    expect(state.timedSecondsLeft).toBeLessThanOrEqual(60);

    expect(
      meaningBridgeCalls.generateRequests.map(
        (request) => request.body.pairCount,
      ),
    ).toEqual([4, 5]);

    expect(meaningBridgeCalls.submitRequests).toHaveLength(0);
  });

  test("removes Meaning Bridge globals and keyboard cleanup state when GameScene unmounts", async ({
    page,
  }) => {
    await openMeaningBridgeAsGuest(page);

    const beforeUnmount = await page.evaluate(() => ({
      hasDebug: typeof window.__meaningBridgeZimDebug === "object",
      hasHooks:
        typeof window.__meaningBridgeZimTestHooks?.getState === "function",
      hasKeyboardCleanup:
        typeof window.__meaningBridgeKeyCleanup === "function",
    }));

    expect(beforeUnmount).toEqual({
      hasDebug: true,
      hasHooks: true,
      hasKeyboardCleanup: true,
    });

    await returnToLauncherFromScene(page, MEANING_BRIDGE_GAME_ID);

    const afterUnmount = await page.evaluate(() => ({
      debugRemoved: !("__meaningBridgeZimDebug" in window),
      hooksRemoved: !("__meaningBridgeZimTestHooks" in window),
      keyboardCleanupInactive: window.__meaningBridgeKeyCleanup == null,
    }));

    expect(afterUnmount).toEqual({
      debugRemoved: true,
      hooksRemoved: true,
      keyboardCleanupInactive: true,
    });

    await page.keyboard.press("p");

    await expect(page.getByTestId("launcher-page")).toBeVisible();
  });
});
