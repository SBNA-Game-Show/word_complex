import { expect, test } from "@playwright/test";

const DEMO_USER = {
  username: "anthony",
  password: "demo123",
};

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
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_SUBMIT_RESPONSE),
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
  await page.getByTestId("username-input").fill(DEMO_USER.username);
  await page.getByTestId("password-input").fill(DEMO_USER.password);
  await page.getByTestId("login-button").click();

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
