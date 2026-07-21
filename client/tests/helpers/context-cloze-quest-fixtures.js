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

export const CONTEXT_CLOZE_GAME_ID = "context-cloze-quest";

export const CONTEXT_CLOZE_ZIM_TEST_ID = "zim-context-cloze-quest";

export const CONTEXT_CLOZE_STAGE_SIZE = Object.freeze({
  width: 1100,
  height: 800,
});

export const CONTEXT_CLOZE_SIGNED_IN_USER = Object.freeze({
  id: "context-reader-1",
  name: "Cora Context",
  nickname: "Cora",
  username: "cora.context@example.test",
  role: "Reader",
  isGuest: false,
});

const ENGLISH_FIXTURES = Object.freeze({
  easy: Object.freeze({
    id: TEST_STORY.storyId,

    originalParagraph: "The quick fox jumps over the fallen log.",

    paragraph: "The _____ fox _____ over the fallen _____.",

    answers: Object.freeze(["quick", "jumps", "log"]),

    wordBank: Object.freeze([
      "quick",
      "jumps",
      "log",
      "slow",
      "rests",
      "river",
    ]),
  }),

  medium: Object.freeze({
    id: TEST_STORY.storyId,

    originalParagraph:
      "At dawn the young traveler carried a woven basket through the forest toward the quiet village.",

    paragraph:
      "At dawn the _____ _____ carried a _____ basket through the _____ toward the _____ _____.",

    answers: Object.freeze([
      "young",
      "traveler",
      "woven",
      "forest",
      "quiet",
      "village",
    ]),

    wordBank: Object.freeze([
      "young",
      "traveler",
      "woven",
      "forest",
      "quiet",
      "village",
      "old",
      "teacher",
      "silver",
      "river",
      "busy",
      "market",
    ]),
  }),

  hard: Object.freeze({
    id: TEST_STORY.storyId,

    originalParagraph:
      "Before sunrise the curious explorer carefully opened the ancient wooden chest beside the silent river bank.",

    paragraph:
      "Before _____ the _____ _____ _____ opened the _____ _____ chest beside the _____ _____ _____.",

    answers: Object.freeze([
      "sunrise",
      "curious",
      "explorer",
      "carefully",
      "ancient",
      "wooden",
      "silent",
      "river",
      "bank",
    ]),

    wordBank: Object.freeze([
      "sunrise",
      "curious",
      "explorer",
      "carefully",
      "ancient",
      "wooden",
      "silent",
      "river",
      "bank",
      "sunset",
      "sleepy",
      "farmer",
      "quickly",
      "modern",
      "metal",
      "noisy",
      "forest",
      "road",
    ]),
  }),
});

const SANSKRIT_FIXTURES = Object.freeze({
  easy: Object.freeze({
    id: TEST_STORY.storyId,

    originalParagraph: "प्रसन्नः बालकः शीघ्रं धावति उद्याने क्रीडति।",

    paragraph: "_____ बालकः शीघ्रं _____ उद्याने _____.",

    answers: Object.freeze(["प्रसन्नः", "धावति", "क्रीडति"]),

    wordBank: Object.freeze([
      "प्रसन्नः",
      "धावति",
      "क्रीडति",
      "शान्तः",
      "पठति",
      "लिखति",
    ]),
  }),

  medium: Object.freeze({
    id: TEST_STORY.storyId,

    originalParagraph:
      "प्रातः छात्रः गुरुणा सह विद्यालयं गच्छति पुस्तकं पठति मित्रेण सह लिखति।",

    paragraph: "_____ _____ गुरुणा सह _____ गच्छति _____ पठति _____ सह _____.",

    answers: Object.freeze([
      "प्रातः",
      "छात्रः",
      "विद्यालयं",
      "पुस्तकं",
      "मित्रेण",
      "लिखति",
    ]),

    wordBank: Object.freeze([
      "प्रातः",
      "छात्रः",
      "विद्यालयं",
      "पुस्तकं",
      "मित्रेण",
      "लिखति",
      "सायम्",
      "बालिका",
      "उद्यानं",
      "फलं",
      "गुरुणा",
      "पठति",
    ]),
  }),

  hard: Object.freeze({
    id: TEST_STORY.storyId,

    originalParagraph:
      "उषसि जिज्ञासुः बालकः सावधानतया प्राचीनं काष्ठपात्रं शान्तस्य नदीतीरे शनैः उद्घाटयति।",

    paragraph: "_____ _____ _____ _____ _____ _____ _____ _____ _____.",

    answers: Object.freeze([
      "उषसि",
      "जिज्ञासुः",
      "बालकः",
      "सावधानतया",
      "प्राचीनं",
      "काष्ठपात्रं",
      "शान्तस्य",
      "नदीतीरे",
      "उद्घाटयति",
    ]),

    wordBank: Object.freeze([
      "उषसि",
      "जिज्ञासुः",
      "बालकः",
      "सावधानतया",
      "प्राचीनं",
      "काष्ठपात्रं",
      "शान्तस्य",
      "नदीतीरे",
      "उद्घाटयति",
      "सायम्",
      "आलसी",
      "शिक्षकः",
      "शीघ्रतया",
      "नूतनं",
      "पुस्तकम्",
      "कोलाहलस्य",
      "गृहे",
      "पठति",
    ]),
  }),
});

export const CONTEXT_CLOZE_FIXTURES = Object.freeze({
  english: ENGLISH_FIXTURES,
  sanskrit: SANSKRIT_FIXTURES,
});

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
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

function getFixture(fixtures, language, difficulty) {
  return fixtures?.[language]?.[difficulty] ?? null;
}

/**
 * CONTEXT CLOZE QUEST API FIXTURES:
 * Intercepts only the real game and score endpoints used by the frontend.
 *
 * Requests still pass through the production service functions and their real
 * query/body serialization. This helper replaces only the unavailable backend
 * response for deterministic Playwright execution.
 */
export async function mockContextClozeQuestApis(page, options = {}) {
  const {
    fixtures = CONTEXT_CLOZE_FIXTURES,

    gameStatus = 200,
    gameDelayMs = 0,

    gameError = "Context Cloze Quest game is unavailable.",

    scoreStatus = 200,
    scoreDelayMs = 0,

    scoreResponse = {
      success: true,
      message: "Score processed.",
      data: {
        updated: true,
      },
    },

    scoreError = "Context Cloze Quest score could not be saved.",
  } = options;

  const calls = {
    gameRequests: [],
    scoreRequests: [],
  };

  await page.route(/\/api\/v1\/fillInBlanks\/score(?:\?|$)/, async (route) => {
    const request = route.request();

    let body = null;

    try {
      body = request.postDataJSON();
    } catch {
      body = null;
    }

    calls.scoreRequests.push({
      method: request.method(),
      url: request.url(),
      body,
    });

    if (scoreDelayMs > 0) {
      await delay(scoreDelayMs);
    }

    await fulfillJson(
      route,
      scoreStatus === 200
        ? scoreResponse
        : {
            success: false,
            message: scoreError,
          },
      scoreStatus,
    );
  });

  await page.route(/\/api\/v1\/fillInBlanks(?:\?|$)/, async (route) => {
    const request = route.request();

    const url = new URL(request.url());

    const language = url.searchParams.get("language") || "english";

    const difficulty = url.searchParams.get("difficulty") || "easy";

    const wordTypesText = url.searchParams.get("wordTypes") || "NOUN";

    const storyId = url.searchParams.get("storyId");

    const wordTypes = wordTypesText
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    calls.gameRequests.push({
      method: request.method(),
      url: request.url(),
      language,
      difficulty,
      wordTypes,
      storyId,
    });

    if (gameDelayMs > 0) {
      await delay(gameDelayMs);
    }

    const fixture = getFixture(fixtures, language, difficulty);

    if (gameStatus !== 200 || !fixture) {
      await fulfillJson(
        route,
        {
          success: false,
          error: gameError,
        },
        gameStatus === 200 ? 500 : gameStatus,
      );

      return;
    }

    const data = cloneJson(fixture);

    data.id = storyId || data.id;

    await fulfillJson(route, {
      success: true,
      data,
    });
  });

  return calls;
}

/**
 * E2E FEATURE FLAG:
 * Enables the development/E2E-only ZIM bridge before the application loads.
 */
export async function enableContextClozeQuestE2E(page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("contextClozeQuestE2E", "1");
  });
}

export async function waitForContextClozeQuestHooks(page) {
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            typeof window.__contextClozeQuestZimTestHooks?.getState ===
            "function",
        ),
      {
        timeout: 15_000,
      },
    )
    .toBe(true);
}

export async function readContextClozeQuestState(page) {
  return page.evaluate(() => {
    const hooks = window.__contextClozeQuestZimTestHooks;

    if (!hooks || typeof hooks.getState !== "function") {
      return null;
    }

    return hooks.getState();
  });
}

export async function waitForContextClozeQuestScreen(page, screen) {
  await expect
    .poll(() => readContextClozeQuestState(page), {
      timeout: 15_000,
    })
    .toMatchObject({
      screen,
    });

  return readContextClozeQuestState(page);
}

export async function runContextClozeQuestCommand(page, command, ...args) {
  return page.evaluate(
    ({ commandName, commandArgs }) => {
      const hooks = window.__contextClozeQuestZimTestHooks;

      const action = hooks?.[commandName];

      if (typeof action !== "function") {
        throw new Error(
          `Context Cloze Quest E2E command is unavailable: ${commandName}`,
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

export async function startContextClozeQuestRound(page, selections = {}) {
  await runContextClozeQuestCommand(
    page,
    "setMenuSelectionsForTest",
    selections,
  );

  await runContextClozeQuestCommand(page, "startGameForTest");

  return waitForContextClozeQuestScreen(page, "gameplay");
}

export async function openContextClozeQuestAsGuest(page, options = {}) {
  const {
    storyId = TEST_STORY.storyId,

    apiOptions = {},
    startRound = false,
    selections = {},
  } = options;

  await enableContextClozeQuestE2E(page);

  const platformCalls = await mockSharedPlatformApis(page);

  const contextCalls = await mockContextClozeQuestApis(page, apiOptions);

  await openAppAsGuest(page, storyId);

  await openGameScene(page, {
    gameId: CONTEXT_CLOZE_GAME_ID,

    zimTestId: CONTEXT_CLOZE_ZIM_TEST_ID,
  });

  await waitForContextClozeQuestHooks(page);

  await waitForContextClozeQuestScreen(page, "menu");

  if (startRound) {
    await startContextClozeQuestRound(page, selections);
  }

  return {
    platformCalls,
    contextCalls,
  };
}

export async function openContextClozeQuestAsSignedIn(page, options = {}) {
  const {
    storyId = TEST_STORY.storyId,

    apiOptions = {},

    user = CONTEXT_CLOZE_SIGNED_IN_USER,

    email = "cora.context@example.test",

    password = "context-password",

    startRound = false,
    selections = {},
  } = options;

  await enableContextClozeQuestE2E(page);

  const platformCalls = await mockSharedPlatformApis(page);

  const contextCalls = await mockContextClozeQuestApis(page, apiOptions);

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
    gameId: CONTEXT_CLOZE_GAME_ID,

    zimTestId: CONTEXT_CLOZE_ZIM_TEST_ID,
  });

  await waitForContextClozeQuestHooks(page);

  await waitForContextClozeQuestScreen(page, "menu");

  if (startRound) {
    await startContextClozeQuestRound(page, selections);
  }

  return {
    platformCalls,
    contextCalls,
  };
}

function stagePointToCanvasPoint(canvasBox, point) {
  return {
    x:
      canvasBox.x +
      (point.x / CONTEXT_CLOZE_STAGE_SIZE.width) * canvasBox.width,

    y:
      canvasBox.y +
      (point.y / CONTEXT_CLOZE_STAGE_SIZE.height) * canvasBox.height,
  };
}

/**
 * REAL CANVAS DRAG:
 * Uses live geometry published by the ZIM game and Playwright's mouse API.
 *
 * This exercises the real player pointer and snap handlers instead of a
 * deterministic test command.
 */
export async function dragContextClozeWordToBlank(page, word, blankIndex) {
  const before = await readContextClozeQuestState(page);

  const wordState = before?.wordGeometry?.find((item) => item.word === word);

  const blankState = before?.blankPlacements?.find(
    (item) => item.index === blankIndex,
  );

  if (!wordState?.geometry || !blankState?.geometry) {
    throw new Error(
      `Missing Context Cloze Quest geometry for word "${word}" or blank ${blankIndex}.`,
    );
  }

  const canvas = page
    .getByTestId(CONTEXT_CLOZE_ZIM_TEST_ID)
    .locator("canvas")
    .first();

  const canvasBox = await canvas.boundingBox();

  if (!canvasBox) {
    throw new Error("Context Cloze Quest canvas does not have a bounding box.");
  }

  const start = stagePointToCanvasPoint(canvasBox, {
    x: wordState.geometry.centerX,

    y: wordState.geometry.centerY,
  });

  const end = stagePointToCanvasPoint(canvasBox, {
    x: blankState.geometry.centerX,

    y: blankState.geometry.centerY,
  });

  await page.mouse.move(start.x, start.y);

  await page.mouse.down();

  // ZIM updates its drag state from canvas pointer events. Give slower CI
  // runners a frame to register the press before sending movement events.
  await page.waitForTimeout(50);

  await page.mouse.move(end.x, end.y, {
    steps: 20,
  });

  // Allow ZIM to process the final move while the pointer is over the blank
  // before pressup performs the production hit test.
  await page.waitForTimeout(100);

  await page.mouse.up();

  await expect
    .poll(() => readContextClozeQuestState(page))
    .toMatchObject({
      blankPlacements: expect.arrayContaining([
        expect.objectContaining({
          index: blankIndex,
          filledWord: word,
        }),
      ]),
    });

  return readContextClozeQuestState(page);
}
