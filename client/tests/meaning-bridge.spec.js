import { expect, test } from "@playwright/test";

const MOCK_GENERATE_RESPONSE = {
  success: true,
  ok: true,
  passage: {
    passageId: "playwright-passage-1",
    chunkId: "playwright-chunk-1",
    title: "Playwright Test Passage",
    difficulty: "easy",
    text: "River forest teacher light bridge garden wisdom story flower music.",
  },
  puzzle: {
    gameId: "meaning_bridge",
    roundId: "playwright_round_1",
    passageId: "playwright-passage-1",
    chunkId: "playwright-chunk-1",
    mode: "english-to-sanskrit",
    difficulty: "easy",
    instruction:
      "Connect each word to its correct meaning or Sanskrit translation.",
    leftItems: [
      { id: "left_0_river", label: "river", sublabel: "nature" },
      { id: "left_1_forest", label: "forest", sublabel: "nature" },
      { id: "left_2_teacher", label: "teacher", sublabel: "people" },
      { id: "left_3_light", label: "light", sublabel: "concept" },
    ],
    rightItems: [
      { id: "right_0_river", label: "नदी", sublabel: "nadī" },
      { id: "right_1_forest", label: "वन", sublabel: "vana" },
      { id: "right_2_teacher", label: "गुरु", sublabel: "guru" },
      { id: "right_3_light", label: "प्रकाश", sublabel: "prakāśa" },
    ],
    answerKey: {
      left_0_river: "right_0_river",
      left_1_forest: "right_1_forest",
      left_2_teacher: "right_2_teacher",
      left_3_light: "right_3_light",
    },
    hints: {
      left_0_river: "River is related to nature.",
      left_1_forest: "Forest is related to nature.",
      left_2_teacher: "Teacher is related to people.",
      left_3_light: "Light is related to a concept.",
    },
    scoreRules: {
      correct: 10,
      incorrect: 0,
      hintPenalty: 2,
      wrongAttemptPenalty: 5,
    },
  },
};

const MOCK_SUBMIT_RESPONSE = {
  success: true,
  ok: true,
  score: 0,
  accuracy: 0,
  correctMatches: 0,
  incorrectMatches: 0,
  totalMatches: 4,
  wrongAttempts: 0,
  roundPoints: 0,
  perfectRound: false,
  timeSeconds: 5,
  hintsUsed: 0,
  message: "Round submitted.",
};

const MOCK_LEADERBOARD_RESPONSE = {
  success: true,
  ok: true,
  source: "playwright-mock",
  scores: [
    {
      playerName: "Test Explorer",
      score: 40,
      roundPoints: 40,
      accuracy: 100,
      perfectRound: true,
      timeSeconds: 20,
      createdAt: new Date().toISOString(),
    },
  ],
};

async function mockMeaningBridgeApi(page) {
  await page.route("**/api/v1/meaningBridge/generate", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_GENERATE_RESPONSE),
    });
  });

  await page.route("**/api/v1/meaningBridge/submit", async (route) => {
    let requestBody = {};

    try {
      requestBody = route.request().postDataJSON() || {};
    } catch {
      requestBody = {};
    }

    const submittedMatches = Array.isArray(requestBody.matches)
      ? requestBody.matches
      : [];

    const correctMatches = submittedMatches.length;
    const totalMatches = MOCK_GENERATE_RESPONSE.puzzle.leftItems.length;
    const accuracy =
      totalMatches > 0 ? Math.round((correctMatches / totalMatches) * 100) : 0;

    const perfectRound =
      correctMatches === totalMatches &&
      Number(requestBody.hintsUsed || 0) === 0 &&
      Number(requestBody.wrongAttempts || 0) === 0;

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ...MOCK_SUBMIT_RESPONSE,
        score: correctMatches * 10,
        accuracy,
        correctMatches,
        incorrectMatches: totalMatches - correctMatches,
        totalMatches,
        roundPoints: correctMatches * 10,
        perfectRound,
        timeSeconds: Number(requestBody.timeSeconds || 5),
        hintsUsed: Number(requestBody.hintsUsed || 0),
        wrongAttempts: Number(requestBody.wrongAttempts || 0),
        message: perfectRound ? "Perfect bridge!" : "Round submitted.",
      }),
    });
  });

  await page.route("**/api/v1/meaningBridge/leaderboard**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_LEADERBOARD_RESPONSE),
    });
  });

  await page.route("**/api/v1/fillInBlanks", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, ok: true, data: [] }),
    });
  });
}

async function login(page) {
  await page.goto("/");
  await page.getByTestId("guest-login-button").click();

  await expect(page.getByTestId("launcher-page")).toBeVisible();
}

async function openMeaningBridge(page) {
  await page.getByTestId("game-start-meaning-bridge").click();

  await expect(page.getByTestId("game-screen-meaning-bridge")).toBeVisible();
  await expect(page.getByTestId("canvas-shell-meaning-bridge")).toBeVisible();
  await expect(page.getByTestId("zim-meaning-bridge-game")).toBeVisible();

  await waitForMeaningBridgeState(page, (state) => state.screen === "landing");
}

async function waitForMeaningBridgeState(page, predicate) {
  await page.waitForFunction((predicateText) => {
    const state = window.__meaningBridgeZimDebug;

    if (!state) {
      return false;
    }

    return Function("state", `return (${predicateText})(state);`)(state);
  }, predicate.toString());
}

async function getMeaningBridgeState(page) {
  return page.evaluate(() => window.__meaningBridgeZimDebug || null);
}

async function startPracticeRound(page) {
  await page.keyboard.press("Enter");

  await waitForMeaningBridgeState(page, (state) => state.screen === "menu");

  await page.keyboard.press("Enter");

  await waitForMeaningBridgeState(
    page,
    (state) => state.screen === "gameplay" && Boolean(state.roundId),
  );
}

test.describe("Meaning Bridge smoke tests", () => {
  test.beforeEach(async ({ page }) => {
    await mockMeaningBridgeApi(page);
    await login(page);
    await openMeaningBridge(page);
  });

  test("landing opens setup with Enter", async ({ page }) => {
    await page.keyboard.press("Enter");

    await waitForMeaningBridgeState(page, (state) => state.screen === "menu");

    const state = await getMeaningBridgeState(page);
    expect(state.screen).toBe("menu");
  });

  test("rules screen opens and closes from landing", async ({ page }) => {
    await page.keyboard.press("h");

    await waitForMeaningBridgeState(page, (state) => state.screen === "rules");

    let state = await getMeaningBridgeState(page);
    expect(state.screen).toBe("rules");

    await page.keyboard.press("Escape");

    await waitForMeaningBridgeState(
      page,
      (nextState) => nextState.screen === "landing",
    );

    state = await getMeaningBridgeState(page);
    expect(state.screen).toBe("landing");
  });

  test("leaderboard screen opens and closes from landing", async ({ page }) => {
    await page.keyboard.press("l");

    await waitForMeaningBridgeState(
      page,
      (state) => state.screen === "leaderboard",
    );

    let state = await getMeaningBridgeState(page);
    expect(state.screen).toBe("leaderboard");

    await page.keyboard.press("Escape");

    await waitForMeaningBridgeState(
      page,
      (nextState) => nextState.screen === "landing",
    );

    state = await getMeaningBridgeState(page);
    expect(state.screen).toBe("landing");
  });

  test("large text and sound toggles update debug state", async ({ page }) => {
    await page.keyboard.press("z");

    await waitForMeaningBridgeState(
      page,
      (state) => state.largeTextMode === true,
    );

    let state = await getMeaningBridgeState(page);
    expect(state.largeTextMode).toBe(true);

    await page.keyboard.press("v");

    await waitForMeaningBridgeState(
      page,
      (nextState) => nextState.soundMuted === true,
    );

    state = await getMeaningBridgeState(page);
    expect(state.soundMuted).toBe(true);
  });

  test("practice round starts and quit confirmation protects active round", async ({
    page,
  }) => {
    await page.keyboard.press("Enter");

    await waitForMeaningBridgeState(page, (state) => state.screen === "menu");

    await page.keyboard.press("Enter");

    await waitForMeaningBridgeState(
      page,
      (state) => state.screen === "gameplay" && Boolean(state.roundId),
    );

    let state = await getMeaningBridgeState(page);
    expect(state.screen).toBe("gameplay");
    expect(state.roundId).toBe("playwright_round_1");

    await page.keyboard.press("m");

    await waitForMeaningBridgeState(
      page,
      (nextState) => nextState.quitConfirmVisible === true,
    );

    state = await getMeaningBridgeState(page);
    expect(state.quitConfirmVisible).toBe(true);

    await page.keyboard.press("Escape");

    await waitForMeaningBridgeState(
      page,
      (nextState) =>
        nextState.screen === "gameplay" &&
        nextState.quitConfirmVisible === false,
    );

    state = await getMeaningBridgeState(page);
    expect(state.screen).toBe("gameplay");
    expect(state.quitConfirmVisible).toBe(false);

    await page.keyboard.press("m");

    await waitForMeaningBridgeState(
      page,
      (nextState) => nextState.quitConfirmVisible === true,
    );

    await page.keyboard.press("Enter");

    await waitForMeaningBridgeState(
      page,
      (nextState) => nextState.screen === "menu",
    );

    state = await getMeaningBridgeState(page);
    expect(state.screen).toBe("menu");
  });
});

test.describe("Meaning Bridge timed setup tests", () => {
  test.beforeEach(async ({ page }) => {
    await mockMeaningBridgeApi(page);
    await login(page);
    await openMeaningBridge(page);

    await page.keyboard.press("Enter");

    await waitForMeaningBridgeState(page, (state) => state.screen === "menu");
  });

  test("timed mode can be selected from setup", async ({ page }) => {
    await page.keyboard.press("t");

    await waitForMeaningBridgeState(
      page,
      (state) => state.screen === "menu" && state.roundType === "timed",
    );

    const state = await getMeaningBridgeState(page);

    expect(state.screen).toBe("menu");
    expect(state.roundType).toBe("timed");
    expect(state.timerSeconds).toBe(120);
  });

  test("timer preset shortcuts update timer seconds", async ({ page }) => {
    await page.keyboard.press("t");

    await waitForMeaningBridgeState(
      page,
      (state) => state.roundType === "timed",
    );

    await page.keyboard.press("1");

    await waitForMeaningBridgeState(
      page,
      (state) =>
        state.roundType === "timed" &&
        state.timerOption === 120 &&
        state.timerSeconds === 120,
    );

    let state = await getMeaningBridgeState(page);

    expect(state.timerOption).toBe(120);
    expect(state.timerSeconds).toBe(120);

    await page.keyboard.press("2");

    await waitForMeaningBridgeState(
      page,
      (nextState) =>
        nextState.roundType === "timed" &&
        nextState.timerOption === 300 &&
        nextState.timerSeconds === 300,
    );

    state = await getMeaningBridgeState(page);

    expect(state.timerOption).toBe(300);
    expect(state.timerSeconds).toBe(300);

    await page.keyboard.press("3");

    await waitForMeaningBridgeState(
      page,
      (nextState) =>
        nextState.roundType === "timed" &&
        nextState.timerOption === 600 &&
        nextState.timerSeconds === 600,
    );

    state = await getMeaningBridgeState(page);

    expect(state.timerOption).toBe(600);
    expect(state.timerSeconds).toBe(600);
  });

  test("custom timer editing updates timer seconds", async ({ page }) => {
    await page.keyboard.press("c");

    await waitForMeaningBridgeState(
      page,
      (state) =>
        state.screen === "menu" &&
        state.roundType === "timed" &&
        state.timerOption === "custom" &&
        state.isEditingCustomTimer === true,
    );

    await page.keyboard.press("7");

    await waitForMeaningBridgeState(
      page,
      (state) =>
        state.timerOption === "custom" &&
        state.customTimerMinutes === "7" &&
        state.timerSeconds === 420,
    );

    await page.keyboard.press("Enter");

    await waitForMeaningBridgeState(
      page,
      (state) =>
        state.timerOption === "custom" &&
        state.customTimerMinutes === "7" &&
        state.timerSeconds === 420 &&
        state.isEditingCustomTimer === false,
    );

    const state = await getMeaningBridgeState(page);

    expect(state.roundType).toBe("timed");
    expect(state.timerOption).toBe("custom");
    expect(state.customTimerMinutes).toBe("7");
    expect(state.timerSeconds).toBe(420);
    expect(state.isEditingCustomTimer).toBe(false);
  });

  test("timed round starts with countdown state", async ({ page }) => {
    await page.keyboard.press("t");
    await page.keyboard.press("1");

    await waitForMeaningBridgeState(
      page,
      (state) =>
        state.screen === "menu" &&
        state.roundType === "timed" &&
        state.timerSeconds === 120,
    );

    await page.keyboard.press("Enter");

    await waitForMeaningBridgeState(
      page,
      (state) =>
        state.screen === "gameplay" &&
        state.roundType === "timed" &&
        state.timerSeconds === 120 &&
        state.timerRunning === true &&
        Boolean(state.roundId),
    );

    const state = await getMeaningBridgeState(page);

    expect(state.screen).toBe("gameplay");
    expect(state.roundType).toBe("timed");
    expect(state.timerSeconds).toBe(120);
    expect(state.remainingRoundSeconds).toBeGreaterThan(0);
    expect(state.remainingRoundSeconds).toBeLessThanOrEqual(120);
    expect(state.timerRunning).toBe(true);
    expect(state.roundId).toBe("playwright_round_1");
  });

  test("custom timed round starts with selected custom countdown", async ({
    page,
  }) => {
    await page.keyboard.press("c");
    await page.keyboard.press("4");
    await page.keyboard.press("Enter");

    await waitForMeaningBridgeState(
      page,
      (state) =>
        state.screen === "menu" &&
        state.roundType === "timed" &&
        state.timerOption === "custom" &&
        state.customTimerMinutes === "4" &&
        state.timerSeconds === 240,
    );

    await page.keyboard.press("Enter");

    await waitForMeaningBridgeState(
      page,
      (state) =>
        state.screen === "gameplay" &&
        state.roundType === "timed" &&
        state.timerOption === "custom" &&
        state.timerSeconds === 240 &&
        state.timerRunning === true &&
        Boolean(state.roundId),
    );

    const state = await getMeaningBridgeState(page);

    expect(state.screen).toBe("gameplay");
    expect(state.roundType).toBe("timed");
    expect(state.timerOption).toBe("custom");
    expect(state.customTimerMinutes).toBe("4");
    expect(state.timerSeconds).toBe(240);
    expect(state.remainingRoundSeconds).toBeGreaterThan(0);
    expect(state.remainingRoundSeconds).toBeLessThanOrEqual(240);
    expect(state.timerRunning).toBe(true);
  });
});

test.describe("Meaning Bridge match and result tests", () => {
  test.beforeEach(async ({ page }) => {
    await mockMeaningBridgeApi(page);
    await login(page);
    await openMeaningBridge(page);
  });

  test("correct pair can be matched with keyboard shortcuts", async ({
    page,
  }) => {
    await startPracticeRound(page);

    await page.keyboard.press("1");
    await waitForMeaningBridgeState(
      page,
      (state) => state.selectedLeftId === "left_0_river",
    );

    await page.keyboard.press("1");

    await waitForMeaningBridgeState(
      page,
      (state) =>
        Array.isArray(state.matches) &&
        state.matches.length === 1 &&
        state.matches[0].leftId === "left_0_river" &&
        state.matches[0].rightId === "right_0_river" &&
        state.selectedLeftId === null,
    );

    const state = await getMeaningBridgeState(page);

    expect(state.screen).toBe("gameplay");
    expect(state.matches).toHaveLength(1);
    expect(state.matches[0]).toEqual({
      leftId: "left_0_river",
      rightId: "right_0_river",
    });
    expect(state.selectedLeftId).toBeNull();
  });

  test("hint shortcut increments hint count after selecting a card", async ({
    page,
  }) => {
    await startPracticeRound(page);

    await page.keyboard.press("2");

    await waitForMeaningBridgeState(
      page,
      (state) => state.selectedLeftId === "left_1_forest",
    );

    await page.keyboard.press("h");

    await waitForMeaningBridgeState(page, (state) => state.hintsUsed === 1);

    const state = await getMeaningBridgeState(page);

    expect(state.screen).toBe("gameplay");
    expect(state.selectedLeftId).toBe("left_1_forest");
    expect(state.hintsUsed).toBe(1);
  });

  test("reset clears matches, selected card, hints, and wrong attempts", async ({
    page,
  }) => {
    await startPracticeRound(page);

    await page.keyboard.press("1");
    await page.keyboard.press("1");

    await waitForMeaningBridgeState(
      page,
      (state) => state.matches.length === 1,
    );

    await page.keyboard.press("2");
    await page.keyboard.press("h");

    await waitForMeaningBridgeState(page, (state) => state.hintsUsed === 1);

    await page.keyboard.press("r");

    await waitForMeaningBridgeState(
      page,
      (state) =>
        state.screen === "gameplay" &&
        state.matches.length === 0 &&
        state.selectedLeftId === null &&
        state.hintsUsed === 0 &&
        state.wrongAttempts === 0 &&
        state.resultVisible === false,
    );

    const state = await getMeaningBridgeState(page);

    expect(state.matches).toHaveLength(0);
    expect(state.selectedLeftId).toBeNull();
    expect(state.hintsUsed).toBe(0);
    expect(state.wrongAttempts).toBe(0);
    expect(state.resultVisible).toBe(false);
  });

  test("submit after a match shows result state", async ({ page }) => {
    await startPracticeRound(page);

    await page.keyboard.press("1");
    await page.keyboard.press("1");

    await waitForMeaningBridgeState(
      page,
      (state) => state.matches.length === 1,
    );

    await page.keyboard.press("s");

    await waitForMeaningBridgeState(
      page,
      (state) =>
        state.screen === "gameplay" &&
        state.resultVisible === true &&
        state.isSubmittingRound === false,
    );

    const state = await getMeaningBridgeState(page);

    expect(state.screen).toBe("gameplay");
    expect(state.resultVisible).toBe(true);
    expect(state.matches).toHaveLength(1);
    expect(state.isSubmittingRound).toBe(false);
  });

  test("leaderboard opens from result screen and returns to result flow", async ({
    page,
  }) => {
    await startPracticeRound(page);

    await page.keyboard.press("1");
    await page.keyboard.press("1");

    await waitForMeaningBridgeState(
      page,
      (state) => state.matches.length === 1,
    );

    await page.keyboard.press("s");

    await waitForMeaningBridgeState(
      page,
      (state) => state.resultVisible === true,
    );

    await page.keyboard.press("l");

    await waitForMeaningBridgeState(
      page,
      (state) =>
        state.screen === "leaderboard" &&
        state.leaderboardReturnScreen === "gameplay",
    );

    let state = await getMeaningBridgeState(page);

    expect(state.screen).toBe("leaderboard");
    expect(state.leaderboardReturnScreen).toBe("gameplay");

    await page.keyboard.press("Escape");

    await waitForMeaningBridgeState(
      page,
      (nextState) =>
        nextState.screen === "gameplay" && nextState.resultVisible === true,
    );

    state = await getMeaningBridgeState(page);

    expect(state.screen).toBe("gameplay");
    expect(state.resultVisible).toBe(true);
  });
});
