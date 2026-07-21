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

/**
 * PASSAGE RECONSTRUCTION PLAYWRIGHT DATA:
 * These rounds deliberately use unique phrase chunks so correct, partial, wrong,
 * hint, reset, and drag behaviour can be asserted without ambiguous duplicates.
 */
export const PASSAGE_ENGLISH_ROUNDS = Object.freeze([
  Object.freeze({
    sentence: "The curious fox follows the moonlit path.",
    chunks: Object.freeze([
      "the moonlit path.",
      "The curious fox",
      "follows",
      "quietly",
    ]),
    answer: Object.freeze([
      "The curious fox",
      "follows",
      "quietly",
      "the moonlit path.",
    ]),
  }),
  Object.freeze({
    sentence: "A patient reader rebuilds every scattered sentence.",
    chunks: Object.freeze([
      "every scattered sentence.",
      "rebuilds",
      "A patient reader",
      "carefully",
    ]),
    answer: Object.freeze([
      "A patient reader",
      "carefully",
      "rebuilds",
      "every scattered sentence.",
    ]),
  }),
  Object.freeze({
    sentence: "Bright lanterns guide the travelers safely home.",
    chunks: Object.freeze([
      "safely home.",
      "Bright lanterns",
      "the travelers",
      "guide",
    ]),
    answer: Object.freeze([
      "Bright lanterns",
      "guide",
      "the travelers",
      "safely home.",
    ]),
  }),
]);

export const PASSAGE_SANSKRIT_ROUNDS = Object.freeze([
  Object.freeze({
    sentence: "बालकः उद्याने पुष्पाणि पश्यति।",
    chunks: Object.freeze(["पुष्पाणि", "बालकः", "पश्यति।", "उद्याने"]),
    answer: Object.freeze(["बालकः", "उद्याने", "पुष्पाणि", "पश्यति।"]),
  }),
  Object.freeze({
    sentence: "छात्रा पुस्तकम् ध्यानपूर्वकं पठति।",
    chunks: Object.freeze(["पठति।", "ध्यानपूर्वकं", "छात्रा", "पुस्तकम्"]),
    answer: Object.freeze(["छात्रा", "पुस्तकम्", "ध्यानपूर्वकं", "पठति।"]),
  }),
  Object.freeze({
    sentence: "सूर्यः आकाशे प्रकाशं प्रसारयति।",
    chunks: Object.freeze(["प्रकाशं", "प्रसारयति।", "आकाशे", "सूर्यः"]),
    answer: Object.freeze(["सूर्यः", "आकाशे", "प्रकाशं", "प्रसारयति।"]),
  }),
]);

export const PASSAGE_SIGNED_IN_USER = Object.freeze({
  id: "passage-reader-1",
  name: "Priya Passage",
  nickname: "Priya",
  username: "priya.passage@example.test",
  role: "Reader",
  isGuest: false,
});

const PASSAGE_CANVAS_WIDTH = 1100;
const PASSAGE_CANVAS_HEIGHT = 720;

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

/**
 * PASSAGE RECONSTRUCTION API MOCKS:
 * The browser suite runs only the Vite client. These route handlers preserve the
 * real service/fetch paths while replacing the unavailable Express and MongoDB
 * dependencies with deterministic game and score responses.
 */
export async function mockPassageReconstructionApis(page, options = {}) {
  const {
    englishRounds = PASSAGE_ENGLISH_ROUNDS,
    sanskritRounds = PASSAGE_SANSKRIT_ROUNDS,
    gameStatus = 200,
    gameStatusByLanguage = {},
    gameDelayMs = 0,
    gameMessage = "Passage Reconstruction game is unavailable.",
    scoreStatus = 200,
    scoreDelayMs = 0,
    scoreResponse = {
      success: true,
      message: "Score saved.",
      data: {
        saved: true,
      },
    },
    scoreMessage = "Failed to save score",
  } = options;

  const calls = {
    game: [],
    score: [],
  };

  await page.route(
    /\/api\/v1\/passageReconstruct\/game(?:\?|$)/,
    async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const language = url.searchParams.get("language") || "english";
      const storyId = url.searchParams.get("storyId");

      calls.game.push({
        method: request.method(),
        url: request.url(),
        language,
        storyId,
      });

      if (gameDelayMs > 0) {
        await delay(gameDelayMs);
      }

      const status = gameStatusByLanguage[language] ?? gameStatus;

      const rounds = language === "sanskrit" ? sanskritRounds : englishRounds;

      await fulfillJson(
        route,
        status === 200
          ? {
              success: true,
              data: {
                language,
                passage:
                  language === "sanskrit"
                    ? "संस्कृत परीक्षण कथा"
                    : "Deterministic Playwright passage",
                rounds,
              },
            }
          : {
              success: false,
              message: gameMessage,
            },
        status,
      );
    },
  );

  await page.route(
    /\/api\/v1\/passageReconstruct\/score(?:\?|$)/,
    async (route) => {
      const request = route.request();
      let body = null;

      try {
        body = request.postDataJSON();
      } catch {
        body = null;
      }

      calls.score.push({
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
              message: scoreMessage,
            },
        scoreStatus,
      );
    },
  );

  return calls;
}

/**
 * PASSAGE RECONSTRUCTION E2E BRIDGE:
 * The game is rendered inside one ZIM canvas, so Playwright reads observable
 * state and invokes the documented development/E2E-only hooks instead of
 * depending on canvas text recognition or random visual coordinates.
 */
export async function waitForPassageReconstructionHooks(page) {
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            typeof window.__passageReconstructionZimTestHooks?.getState ===
            "function",
        ),
      {
        timeout: 15_000,
      },
    )
    .toBe(true);
}

export async function getPassageReconstructionState(page) {
  return page.evaluate(() => {
    const hooks = window.__passageReconstructionZimTestHooks;

    if (!hooks?.getState) {
      return null;
    }

    return hooks.getState();
  });
}

export async function callPassageReconstructionHook(page, hookName, ...args) {
  return page.evaluate(
    async ({ hookName: requestedHook, args: hookArgs }) => {
      const hooks = window.__passageReconstructionZimTestHooks;

      const hook = hooks?.[requestedHook];

      if (typeof hook !== "function") {
        throw new Error(
          `Passage Reconstruction E2E hook is unavailable: ${requestedHook}`,
        );
      }

      return hook(...hookArgs);
    },
    {
      hookName,
      args,
    },
  );
}

export async function expectPassageReconstructionScreen(
  page,
  screen,
  timeout = 8_000,
) {
  await expect
    .poll(async () => (await getPassageReconstructionState(page))?.screen, {
      timeout,
    })
    .toBe(screen);
}

export async function startPassageReconstructionLanguage(
  page,
  language = "english",
) {
  const previewState = await callPassageReconstructionHook(
    page,
    "startLanguageForTest",
    language,
  );

  expect(previewState).toMatchObject({
    screen: "preview",
    language,
    timerPaused: true,
  });

  await expectPassageReconstructionScreen(page, "gameplay");

  return getPassageReconstructionState(page);
}

/**
 * PASSAGE RECONSTRUCTION APPLICATION BOOTSTRAP:
 * These helpers reach the game through the real login, Story Picker, launcher,
 * and shared GameScene paths. Only authentication and APIs are deterministic.
 */
export async function openPassageReconstructionAsGuest(page, options = {}) {
  const { platformOptions = {}, ...passageOptions } = options;

  await mockSharedPlatformApis(page, platformOptions);

  const calls = await mockPassageReconstructionApis(page, passageOptions);

  await openAppAsGuest(page);

  await openGameScene(page, {
    gameId: "sentence-builder",
    zimTestId: "zim-sentence-game",
  });

  await waitForPassageReconstructionHooks(page);

  return calls;
}

export async function openPassageReconstructionAsSignedIn(page, options = {}) {
  const {
    user = PASSAGE_SIGNED_IN_USER,
    email = PASSAGE_SIGNED_IN_USER.username,
    password = "passage-e2e-password",
    authOptions = {},
    platformOptions = {},
    ...passageOptions
  } = options;

  await mockSharedPlatformApis(page, platformOptions);

  const calls = await mockPassageReconstructionApis(page, passageOptions);

  await configureE2EAuth(page, {
    ...authOptions,
    userByAction: {
      ...(authOptions.userByAction ?? {}),
      [E2E_AUTH_ACTIONS.EMAIL_SIGN_IN]: user,
    },
  });

  await page.goto("/");

  await page.getByTestId("email-input").fill(email);

  await page.getByTestId("password-input").fill(password);

  await page.getByTestId("login-button").click();

  await expect(page.getByTestId("story-picker-page")).toBeVisible({
    timeout: 15_000,
  });

  await selectStoryAndOpenLauncher(page, TEST_STORY.storyId);

  await openGameScene(page, {
    gameId: "sentence-builder",
    zimTestId: "zim-sentence-game",
  });

  await waitForPassageReconstructionHooks(page);

  return calls;
}

/**
 * REAL CANVAS DRAG:
 * Most behavioural setup uses the stable E2E bridge, but this helper performs a
 * genuine mouse drag on the live ZIM canvas to verify that a phrase cloud snaps
 * into a numbered zone through the production pointer handlers.
 */
export async function dragPassageChunkToZone(page, chunk, zoneIndex) {
  const state = await getPassageReconstructionState(page);

  const tile = state?.tileGeometry?.find((item) => item.chunk === chunk);

  const zone = state?.zoneGeometry?.find((item) => item.index === zoneIndex);

  if (!tile) {
    throw new Error(`Passage tile was not found: ${chunk}`);
  }

  if (!zone) {
    throw new Error(`Passage zone was not found: ${zoneIndex}`);
  }

  const canvas = page
    .getByTestId("zim-sentence-game")
    .locator("canvas")
    .first();

  await expect(canvas).toBeVisible();

  const box = await canvas.boundingBox();

  if (!box) {
    throw new Error("Passage Reconstruction canvas has no bounding box");
  }

  const fromX = box.x + (tile.centerX / PASSAGE_CANVAS_WIDTH) * box.width;

  const fromY = box.y + (tile.centerY / PASSAGE_CANVAS_HEIGHT) * box.height;

  const toX = box.x + (zone.centerX / PASSAGE_CANVAS_WIDTH) * box.width;

  const toY = box.y + (zone.centerY / PASSAGE_CANVAS_HEIGHT) * box.height;

  await page.mouse.move(fromX, fromY);
  await page.mouse.down();

  await page.mouse.move(toX, toY, {
    steps: 18,
  });

  await page.mouse.up();

  await expect
    .poll(
      async () =>
        (await getPassageReconstructionState(page))?.placedChunks?.[zoneIndex],
    )
    .toBe(chunk);
}
