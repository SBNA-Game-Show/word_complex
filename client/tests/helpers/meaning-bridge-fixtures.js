import { expect } from "@playwright/test";

import {
  E2E_AUTH_ACTIONS,
  TEST_STORY,
  configureE2EAuth,
  mockSharedPlatformApis,
  openAppAsGuest,
  openGameScene,
  selectStoryAndOpenLauncher,
} from "./app-fixtures.js";

export const MEANING_BRIDGE_GAME_ID = "meaning-bridge";
export const MEANING_BRIDGE_ZIM_TEST_ID = "zim-meaning-bridge";

export const MEANING_BRIDGE_STAGE_SIZE = Object.freeze({
  width: 1100,
  height: 720,
});

export const MEANING_BRIDGE_SIGNED_IN_USER = Object.freeze({
  id: "meaning-reader-1",
  name: "Mira Meaning",
  nickname: "Mira",
  username: "mira.meaning@example.test",
  role: "Reader",
  isGuest: false,
});

export const MEANING_BRIDGE_MODES = Object.freeze({
  SYNONYM: "word-to-synonym",
  ANTONYM: "word-to-antonym",
  DEFINITION: "word-to-definition",
});

const SCORE_RULES = Object.freeze({
  correct: 10,
  incorrect: 0,
  hintPenalty: 2,
  wrongAttemptPenalty: 5,
});

const MODE_DATA = Object.freeze({
  [MEANING_BRIDGE_MODES.SYNONYM]: Object.freeze({
    instruction: "Match each word to its synonym.",
    rightSublabel: "synonym",
    hintVerb: "A synonym for",
    pairs: Object.freeze([
      ["brave", "adjective", "courageous"],
      ["quick", "adjective", "rapid"],
      ["silent", "adjective", "quiet"],
      ["joyful", "adjective", "happy"],
      ["calm", "adjective", "peaceful"],
      ["clever", "adjective", "intelligent"],
    ]),
  }),

  [MEANING_BRIDGE_MODES.ANTONYM]: Object.freeze({
    instruction: "Match each word to its opposite.",
    rightSublabel: "antonym",
    hintVerb: "The opposite of",
    pairs: Object.freeze([
      ["ancient", "adjective", "modern"],
      ["expand", "verb", "contract"],
      ["victory", "noun", "defeat"],
      ["generous", "adjective", "selfish"],
      ["arrival", "noun", "departure"],
      ["visible", "adjective", "hidden"],
    ]),
  }),

  [MEANING_BRIDGE_MODES.DEFINITION]: Object.freeze({
    instruction: "Match each word to its definition.",
    rightSublabel: "definition",
    hintVerb: "Definition:",
    pairs: Object.freeze([
      ["orbit", "noun", "the curved path of an object around another object"],
      ["harvest", "noun", "the gathering of ripe crops"],
      ["fragile", "adjective", "easily broken or damaged"],
      ["observe", "verb", "to watch carefully"],
      ["shelter", "noun", "a place that provides protection"],
      ["vanish", "verb", "to disappear suddenly"],
    ]),
  }),
});

const RIGHT_ORDERS = Object.freeze({
  4: Object.freeze([2, 0, 3, 1]),
  5: Object.freeze([3, 0, 4, 1, 2]),
  6: Object.freeze([4, 1, 5, 2, 0, 3]),
});

export const DEFAULT_MEANING_BRIDGE_LEADERBOARD = Object.freeze([
  Object.freeze({
    uuid: "meaning-player-1",
    playerName: "Bridge Champion",
    totalScore: 248,
    roundsPlayed: 3,
    accuracyAverage: 94,
    bestTime: 42_000,
  }),

  Object.freeze({
    uuid: "meaning-player-2",
    playerName: "Word Weaver",
    totalScore: 214,
    roundsPlayed: 3,
    accuracyAverage: 88,
    bestTime: 51_000,
  }),

  Object.freeze({
    uuid: "meaning-player-3",
    playerName: "Match Maker",
    totalScore: 181,
    roundsPlayed: 2,
    accuracyAverage: 82,
    bestTime: 45_800,
  }),
]);

function cloneJson(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fulfillJson(route, body, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

function readBody(route) {
  try {
    return route.request().postDataJSON();
  } catch {
    return null;
  }
}

function requestValue(sequence, fallback, index) {
  return Array.isArray(sequence) && index < sequence.length
    ? sequence[index]
    : fallback;
}

function assertMode(mode) {
  if (!Object.prototype.hasOwnProperty.call(MODE_DATA, mode)) {
    throw new Error(`Unsupported Meaning Bridge mode: ${mode}`);
  }

  return mode;
}

function assertPairCount(pairCount) {
  const value = Number(pairCount);

  if (![4, 5, 6].includes(value)) {
    throw new Error(`Unsupported Meaning Bridge pair count: ${pairCount}`);
  }

  return value;
}

function buildHint(mode, word, match) {
  if (mode === MEANING_BRIDGE_MODES.DEFINITION) {
    return `Definition: "${word}" means "${match}".`;
  }

  return `${MODE_DATA[mode].hintVerb} "${word}" is "${match}".`;
}

export function buildMeaningBridgeRoundResponse({
  mode = MEANING_BRIDGE_MODES.SYNONYM,
  pairCount = 4,
  requestNumber = 1,
  story = TEST_STORY,
} = {}) {
  const safeMode = assertMode(mode);
  const safePairCount = assertPairCount(pairCount);
  const definition = MODE_DATA[safeMode];
  const pairs = definition.pairs.slice(0, safePairCount);

  const leftItems = pairs.map(([word, partOfSpeech], index) => ({
    id: `left_${index}`,
    label: word,
    sublabel: partOfSpeech,
  }));

  const orderedRightItems = pairs.map(([, , match], index) => ({
    id: `right_${index}`,
    label: match,
    sublabel: definition.rightSublabel,
  }));

  const rightItems = RIGHT_ORDERS[safePairCount].map(
    (index) => orderedRightItems[index],
  );

  const answerKey = Object.fromEntries(
    leftItems.map((item, index) => [item.id, orderedRightItems[index].id]),
  );

  const hints = Object.fromEntries(
    leftItems.map((item, index) => [
      item.id,
      buildHint(safeMode, item.label, orderedRightItems[index].label),
    ]),
  );

  return {
    success: true,
    ok: true,

    puzzle: {
      gameId: "meaning_bridge",
      roundId: `${safeMode}-${safePairCount}-round-${requestNumber}`,
      mode: safeMode,
      instruction: definition.instruction,
      leftItems,
      rightItems,
      answerKey,
      hints,
      scoreRules: cloneJson(SCORE_RULES),
    },

    passage: {
      passageId: story.storyId,
      title: story.title,
      text: "A deterministic Playwright passage for Meaning Bridge.",
      theme: story.category,
    },
  };
}

export function calculateMeaningBridgeServerRoundStats({
  matches = [],
  hintsUsed = 0,
  wrongAttempts = 0,
  timeSeconds = 0,
} = {}) {
  const correctMatches = Array.isArray(matches) ? matches.length : 0;
  const safeHints = Math.max(0, Number(hintsUsed) || 0);
  const safeWrong = Math.max(0, Number(wrongAttempts) || 0);
  const safeTime = Math.max(0, Number(timeSeconds) || 0);
  const totalAttempts = correctMatches + safeWrong;

  const accuracy =
    totalAttempts > 0 ? Math.round((correctMatches / totalAttempts) * 100) : 0;

  const baseScore = Math.max(
    0,
    correctMatches * 10 - safeHints * 2 - safeWrong * 5,
  );

  const speedBonus =
    correctMatches > 0 ? Math.round(Math.max(0, 90 - safeTime) * 0.5) : 0;

  return {
    score: baseScore + speedBonus,
    baseScore,
    speedBonus,
    correctMatches,
    hintsUsed: safeHints,
    wrongAttempts: safeWrong,
    timeSeconds: safeTime,
    accuracy,
  };
}

/**
 * MEANING BRIDGE API FIXTURES:
 * Requests still pass through the real meaningBridgeApi.js serialization.
 * Only backend responses are replaced for deterministic Playwright execution.
 */
export async function mockMeaningBridgeApis(page, options = {}) {
  const {
    generateStatus = 200,
    generateStatuses = [],
    generateDelayMs = 0,
    generateDelaysMs = [],
    generateError = "Meaning Bridge round is unavailable.",
    generateResponseFactory = null,

    submitStatus = 200,
    submitStatuses = [],
    submitDelayMs = 0,
    submitDelaysMs = [],
    submitError = "Meaning Bridge score could not be submitted.",
    submitResponseFactory = null,

    persistentScoreStatus = 200,
    persistentScoreDelayMs = 0,
    persistentScoreError = "Meaning Bridge best score could not be saved.",
    persistentScoreIsNewBest = true,

    globalLeaderboardStatus = 200,
    globalLeaderboardDelayMs = 0,
    globalLeaderboardError = "Meaning Bridge leaderboard is unavailable.",
    globalLeaderboardRows = DEFAULT_MEANING_BRIDGE_LEADERBOARD,

    fallbackLeaderboardStatus = 200,
    fallbackLeaderboardDelayMs = 0,
    fallbackLeaderboardError = "Meaning Bridge session leaderboard is unavailable.",
    fallbackLeaderboardRows = DEFAULT_MEANING_BRIDGE_LEADERBOARD,
  } = options;

  const calls = {
    generateRequests: [],
    submitRequests: [],
    persistentScoreRequests: [],
    globalLeaderboardRequests: [],
    fallbackLeaderboardRequests: [],
  };

  const submittedRoundKeys = new Set();

  await page.route(
    /\/api\/v1\/meaningBridge\/generate(?:\?|$)/,
    async (route) => {
      const index = calls.generateRequests.length;
      const body = readBody(route);

      calls.generateRequests.push({
        method: route.request().method(),
        url: route.request().url(),
        body: cloneJson(body),
      });

      const waitMs = requestValue(generateDelaysMs, generateDelayMs, index);

      if (waitMs > 0) {
        await delay(waitMs);
      }

      const status = requestValue(generateStatuses, generateStatus, index);

      if (status < 200 || status >= 300) {
        await fulfillJson(
          route,
          {
            success: false,
            ok: false,
            error: generateError,
          },
          status,
        );

        return;
      }

      const response =
        typeof generateResponseFactory === "function"
          ? await generateResponseFactory({
              body: cloneJson(body),
              index,
              calls,
            })
          : buildMeaningBridgeRoundResponse({
              mode: body?.mode,
              pairCount: body?.pairCount,
              requestNumber: index + 1,
            });

      await fulfillJson(route, cloneJson(response), status);
    },
  );

  await page.route(
    /\/api\/v1\/meaningBridge\/submit(?:\?|$)/,
    async (route) => {
      const index = calls.submitRequests.length;
      const body = readBody(route);

      calls.submitRequests.push({
        method: route.request().method(),
        url: route.request().url(),
        body: cloneJson(body),
      });

      const waitMs = requestValue(submitDelaysMs, submitDelayMs, index);

      if (waitMs > 0) {
        await delay(waitMs);
      }

      const status = requestValue(submitStatuses, submitStatus, index);

      if (status < 200 || status >= 300) {
        await fulfillJson(
          route,
          {
            success: false,
            ok: false,
            error: submitError,
          },
          status,
        );

        return;
      }

      if (typeof submitResponseFactory === "function") {
        const response = await submitResponseFactory({
          body: cloneJson(body),
          index,
          calls,
        });

        await fulfillJson(route, cloneJson(response), status);
        return;
      }

      const key = `${String(
        body?.playerName || "Guest",
      ).toLowerCase()}:${String(body?.roundId || "")}`;

      if (submittedRoundKeys.has(key)) {
        await fulfillJson(route, {
          success: true,
          ok: true,
          message: "Score already saved for this round.",
          duplicate: true,
          scores: cloneJson(fallbackLeaderboardRows),
        });

        return;
      }

      submittedRoundKeys.add(key);

      const stats = calculateMeaningBridgeServerRoundStats(body);

      await fulfillJson(route, {
        success: true,
        ok: true,
        message: "Score saved! Great bridge building.",
        score: stats.score,
        baseScore: stats.baseScore,
        speedBonus: stats.speedBonus,

        entry: {
          playerName: body?.playerName || "Guest",
          totalScore: stats.score,
          roundsPlayed: 1,
          accuracyAverage: stats.accuracy,
          completedPairCounts: [Number(body?.pairCount) || 0],
          sessionComplete: false,
        },

        scores: cloneJson(fallbackLeaderboardRows),
      });
    },
  );

  /*
   * Register the specific leaderboard route before the general /score route.
   * This prevents Playwright route matching from treating a leaderboard GET as
   * a persistent-score POST.
   */
  await page.route(
    /\/api\/v1\/meaningBridge\/score\/leaderboard(?:\?|$)/,
    async (route) => {
      calls.globalLeaderboardRequests.push({
        method: route.request().method(),
        url: route.request().url(),
      });

      if (globalLeaderboardDelayMs > 0) {
        await delay(globalLeaderboardDelayMs);
      }

      if (globalLeaderboardStatus < 200 || globalLeaderboardStatus >= 300) {
        await fulfillJson(
          route,
          {
            success: false,
            ok: false,
            error: globalLeaderboardError,
          },
          globalLeaderboardStatus,
        );

        return;
      }

      await fulfillJson(route, {
        success: true,
        ok: true,
        scores: cloneJson(globalLeaderboardRows),
      });
    },
  );

  await page.route(/\/api\/v1\/meaningBridge\/score(?:\?|$)/, async (route) => {
    const body = readBody(route);

    calls.persistentScoreRequests.push({
      method: route.request().method(),
      url: route.request().url(),
      body: cloneJson(body),
    });

    if (persistentScoreDelayMs > 0) {
      await delay(persistentScoreDelayMs);
    }

    if (persistentScoreStatus < 200 || persistentScoreStatus >= 300) {
      await fulfillJson(
        route,
        {
          success: false,
          ok: false,
          error: persistentScoreError,
        },
        persistentScoreStatus,
      );

      return;
    }

    await fulfillJson(route, {
      success: true,
      ok: true,
      isNewBest: persistentScoreIsNewBest,

      message: persistentScoreIsNewBest
        ? "New personal best saved!"
        : "Score received — your previous best still stands.",

      entry: {
        uuid: body?.uuid,
        playerName: body?.playerName,
        bestScore: body?.score,
        bestTime: Math.round((Number(body?.timeSeconds) || 0) * 1000),
        accuracy: body?.accuracy,
      },

      scores: cloneJson(globalLeaderboardRows),
    });
  });

  await page.route(
    /\/api\/v1\/meaningBridge\/leaderboard(?:\?|$)/,
    async (route) => {
      calls.fallbackLeaderboardRequests.push({
        method: route.request().method(),
        url: route.request().url(),
      });

      if (fallbackLeaderboardDelayMs > 0) {
        await delay(fallbackLeaderboardDelayMs);
      }

      if (fallbackLeaderboardStatus < 200 || fallbackLeaderboardStatus >= 300) {
        await fulfillJson(
          route,
          {
            success: false,
            ok: false,
            error: fallbackLeaderboardError,
          },
          fallbackLeaderboardStatus,
        );

        return;
      }

      await fulfillJson(route, {
        success: true,
        ok: true,
        scores: cloneJson(fallbackLeaderboardRows),
      });
    },
  );

  return calls;
}

/**
 * E2E FEATURE FLAG:
 * Enables the development/E2E-only Meaning Bridge canvas bridge before the
 * application loads.
 */
export async function enableMeaningBridgeE2E(page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("meaningBridgeE2E", "1");
  });
}

export async function waitForMeaningBridgeHooks(page) {
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            typeof window.__meaningBridgeZimTestHooks?.getState === "function",
        ),
      {
        timeout: 15_000,
      },
    )
    .toBe(true);
}

export async function readMeaningBridgeState(page) {
  return page.evaluate(() => {
    const hooks = window.__meaningBridgeZimTestHooks;

    if (!hooks || typeof hooks.getState !== "function") {
      return null;
    }

    return hooks.getState();
  });
}

export async function waitForMeaningBridgeScreen(page, screen) {
  await expect
    .poll(() => readMeaningBridgeState(page), {
      timeout: 15_000,
    })
    .toMatchObject({
      screen,
    });

  return readMeaningBridgeState(page);
}

export async function runMeaningBridgeCommand(page, command, ...args) {
  return page.evaluate(
    ({ commandName, commandArgs }) => {
      const hooks = window.__meaningBridgeZimTestHooks;
      const action = hooks?.[commandName];

      if (typeof action !== "function") {
        throw new Error(
          `Meaning Bridge E2E command is unavailable: ${commandName}`,
        );
      }

      return action(...commandArgs);
    },
    {
      commandName: command,
      commandArgs: args,
    },
  );
}

export async function startMeaningBridgePractice(
  page,
  mode = MEANING_BRIDGE_MODES.SYNONYM,
) {
  await runMeaningBridgeCommand(page, "startPracticeForTest", mode);

  return waitForMeaningBridgeScreen(page, "gameplay");
}

export async function startMeaningBridgeTimed(
  page,
  mode = MEANING_BRIDGE_MODES.SYNONYM,
  seconds = 120,
) {
  await runMeaningBridgeCommand(page, "startTimedForTest", mode, seconds);

  return waitForMeaningBridgeScreen(page, "gameplay");
}

async function getMeaningBridgeCanvasBox(page) {
  const canvas = page
    .getByTestId(MEANING_BRIDGE_ZIM_TEST_ID)
    .locator("canvas")
    .first();

  await expect(canvas).toBeVisible();

  const box = await canvas.boundingBox();

  if (!box) {
    throw new Error("Meaning Bridge canvas has no bounding box");
  }

  return box;
}

/**
 * REAL CANVAS INTERACTION:
 * Converts stage-space card coordinates into browser-space coordinates and
 * performs a real Playwright mouse click against the rendered canvas.
 */
export async function clickMeaningBridgeCard(page, side, cardId) {
  const state = await readMeaningBridgeState(page);

  const cards =
    side === "left" ? state?.leftCardGeometry : state?.rightCardGeometry;

  const card = cards?.find((item) => item.id === cardId);

  if (!card) {
    throw new Error(`Meaning Bridge ${side} card was not found: ${cardId}`);
  }

  if (!card.mouseEnabled) {
    throw new Error(`Meaning Bridge ${side} card is not clickable: ${cardId}`);
  }

  const box = await getMeaningBridgeCanvasBox(page);

  const width = state?.stageSize?.width || MEANING_BRIDGE_STAGE_SIZE.width;

  const height = state?.stageSize?.height || MEANING_BRIDGE_STAGE_SIZE.height;

  const pageX = box.x + (card.centerX / width) * box.width;

  const pageY = box.y + (card.centerY / height) * box.height;

  await page.mouse.click(pageX, pageY);
}

export async function clickMeaningBridgeCorrectPair(page, leftId) {
  const before = await readMeaningBridgeState(page);
  const rightId = before?.answerKey?.[leftId];

  if (!rightId) {
    throw new Error(`Meaning Bridge answer was not found for: ${leftId}`);
  }

  /*
   * REAL CANVAS CLICK SYNCHRONIZATION:
   * ZIM recreates the card objects after each selection and match. A browser
   * click can occasionally arrive during that very short replacement window.
   * Verify that each real click registered and retry once only when the state
   * proves that the canvas did not receive it.
   */
  await clickMeaningBridgeCard(page, "left", leftId);
  await page.waitForTimeout(150);

  let state = await readMeaningBridgeState(page);

  if (state?.screen === "gameplay" && state?.selectedLeftId !== leftId) {
    await clickMeaningBridgeCard(page, "left", leftId);
  }

  await expect
    .poll(() => readMeaningBridgeState(page), {
      timeout: 10_000,
    })
    .toMatchObject({
      selectedLeftId: leftId,
    });

  await clickMeaningBridgeCard(page, "right", rightId);
  await page.waitForTimeout(150);

  state = await readMeaningBridgeState(page);

  const rightClickDidNotRegister =
    state?.screen === "gameplay" &&
    state?.matches?.[leftId] !== rightId &&
    state?.selectedLeftId === leftId &&
    state?.selectedRightId === null;

  if (rightClickDidNotRegister) {
    await clickMeaningBridgeCard(page, "right", rightId);
  }

  await expect
    .poll(
      async () => {
        const current = await readMeaningBridgeState(page);

        return (
          current?.screen === "round-complete" ||
          current?.matches?.[leftId] === rightId
        );
      },
      {
        timeout: 10_000,
      },
    )
    .toBe(true);

  return readMeaningBridgeState(page);
}

export async function clickMeaningBridgeWrongPair(page, leftId) {
  const before = await readMeaningBridgeState(page);
  const correctRightId = before?.answerKey?.[leftId];

  const wrongRight = before?.rightCardGeometry?.find(
    (item) => item.id !== correctRightId && item.mouseEnabled,
  );

  if (!correctRightId || !wrongRight) {
    throw new Error(
      `Meaning Bridge wrong pair was not available for: ${leftId}`,
    );
  }

  /*
   * REAL CANVAS CLICK SYNCHRONIZATION:
   * Matching and selection rebuild the ZIM cards. Verify each browser click
   * reached the newly rendered card and retry once only when state proves that
   * the click was missed.
   */
  await clickMeaningBridgeCard(page, "left", leftId);
  await page.waitForTimeout(150);

  let state = await readMeaningBridgeState(page);

  if (state?.screen === "gameplay" && state?.selectedLeftId !== leftId) {
    await clickMeaningBridgeCard(page, "left", leftId);
  }

  await expect
    .poll(() => readMeaningBridgeState(page), {
      timeout: 10_000,
    })
    .toMatchObject({
      selectedLeftId: leftId,
    });

  await clickMeaningBridgeCard(page, "right", wrongRight.id);

  await page.waitForTimeout(150);

  state = await readMeaningBridgeState(page);

  const wrongClickDidNotRegister =
    state?.screen === "gameplay" &&
    (state?.roundWrongAttempts ?? 0) === (before?.roundWrongAttempts ?? 0) &&
    state?.selectedLeftId === leftId &&
    state?.selectedRightId === null;

  if (wrongClickDidNotRegister) {
    await clickMeaningBridgeCard(page, "right", wrongRight.id);
  }

  await expect
    .poll(
      async () => {
        const current = await readMeaningBridgeState(page);

        return current?.roundWrongAttempts ?? 0;
      },
      {
        timeout: 10_000,
      },
    )
    .toBeGreaterThan(before?.roundWrongAttempts ?? 0);

  return readMeaningBridgeState(page);
}

export async function openMeaningBridgeAsGuest(page, options = {}) {
  const {
    storyId = TEST_STORY.storyId,
    apiOptions = {},
    startPractice = false,
    startTimed = false,
    mode = MEANING_BRIDGE_MODES.SYNONYM,
    timedSeconds = 120,
  } = options;

  await enableMeaningBridgeE2E(page);

  const platformCalls = await mockSharedPlatformApis(page);

  const meaningBridgeCalls = await mockMeaningBridgeApis(page, apiOptions);

  await openAppAsGuest(page, storyId);

  await openGameScene(page, {
    gameId: MEANING_BRIDGE_GAME_ID,
    zimTestId: MEANING_BRIDGE_ZIM_TEST_ID,
  });

  await waitForMeaningBridgeHooks(page);
  await waitForMeaningBridgeScreen(page, "landing");

  if (startPractice) {
    await startMeaningBridgePractice(page, mode);
  } else if (startTimed) {
    await startMeaningBridgeTimed(page, mode, timedSeconds);
  }

  return {
    platformCalls,
    meaningBridgeCalls,
  };
}

export async function openMeaningBridgeAsSignedIn(page, options = {}) {
  const {
    storyId = TEST_STORY.storyId,
    apiOptions = {},
    user = MEANING_BRIDGE_SIGNED_IN_USER,
    email = "mira.meaning@example.test",
    password = "meaning-password",
    startPractice = false,
    startTimed = false,
    mode = MEANING_BRIDGE_MODES.SYNONYM,
    timedSeconds = 120,
  } = options;

  await enableMeaningBridgeE2E(page);

  const platformCalls = await mockSharedPlatformApis(page);

  const meaningBridgeCalls = await mockMeaningBridgeApis(page, apiOptions);

  await configureE2EAuth(page, {
    userByAction: {
      [E2E_AUTH_ACTIONS.EMAIL_SIGN_IN]: user,
    },
  });

  await page.goto("/");

  await expect(page.getByTestId("login-page")).toBeVisible();

  await page.getByTestId("email-input").fill(email);

  await page.getByTestId("password-input").fill(password);

  await page.getByTestId("login-button").click();

  await expect(page.getByTestId("story-picker-page")).toBeVisible({
    timeout: 15_000,
  });

  await selectStoryAndOpenLauncher(page, storyId);

  await openGameScene(page, {
    gameId: MEANING_BRIDGE_GAME_ID,
    zimTestId: MEANING_BRIDGE_ZIM_TEST_ID,
  });

  await waitForMeaningBridgeHooks(page);
  await waitForMeaningBridgeScreen(page, "landing");

  if (startPractice) {
    await startMeaningBridgePractice(page, mode);
  } else if (startTimed) {
    await startMeaningBridgeTimed(page, mode, timedSeconds);
  }

  return {
    platformCalls,
    meaningBridgeCalls,
  };
}
