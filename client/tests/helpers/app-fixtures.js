import { expect } from "@playwright/test";

/**
 * SHARED PLAYWRIGHT TEST DATA:
 * These stories are returned by the mocked Story Picker endpoint so every
 * site/game test begins from the same deterministic application state.
 */
export const TEST_STORY = Object.freeze({
  storyId: "playwright-story-1",
  title: "The Playwright Forest",
  category: "E2E Test Story",
});

export const SECOND_TEST_STORY = Object.freeze({
  storyId: "playwright-story-2",
  title: "The Canvas Adventure",
  category: "E2E Test Story",
});

export const MOCK_ACTIVE_STORIES = Object.freeze([
  TEST_STORY,
  SECOND_TEST_STORY,
]);

export const MOCK_PROGRESS_CONFIG = Object.freeze({
  ladder: [
    { day: 1, stars: 5, gift: null },
    { day: 2, stars: 6, gift: null },
    { day: 3, stars: 7, gift: null },
    { day: 10, stars: 14, gift: "luna" },
    { day: 20, stars: 24, gift: "comet" },
  ],
  milestones: {
    10: "luna",
    20: "comet",
  },
  prices: {
    cap: 30,
    bolt: 55,
    berry: 85,
  },
  freeCharacters: ["tomely", "sprout", "bubbles"],
});

export const MOCK_PROGRESS_VISIT = Object.freeze({
  streak: 3,
  stars: 18,
  ownedCharacters: [],
  lastVisitDate: "2026-07-16",
  awardedStars: 0,
  isNewDay: false,
  giftedCharacters: [],
});

/**
 * SHARED LEADERBOARD TEST DATA:
 * Every board has deterministic players so Playwright can verify board
 * switching, podium placement, ranked rows, score formatting, and time display.
 */
export const MOCK_LEADERBOARD_ROWS = Object.freeze({
  master: [
    {
      rank: 1,
      uuid: "player-alpha",
      displayName: "Asha Reader",
      avatar: "luna",
      score: 398.6,
      bestTime: null,
    },
    {
      rank: 2,
      uuid: "player-beta",
      displayName: "Ben Builder",
      avatar: null,
      score: 325.2,
      bestTime: null,
    },
    {
      rank: 3,
      uuid: "player-gamma",
      displayName: "Cora Canvas",
      avatar: null,
      score: 271,
      bestTime: null,
    },
    {
      rank: 4,
      uuid: "player-delta",
      displayName: "Devon Decoder",
      avatar: null,
      score: 240,
      bestTime: null,
    },
    {
      rank: 5,
      uuid: "player-epsilon",
      displayName: "Eli Explorer",
      avatar: null,
      score: 199,
      bestTime: null,
    },
  ],

  WordHunt: [
    {
      rank: 1,
      uuid: "word-player-1",
      displayName: "Word Winner",
      avatar: null,
      score: 97.8,
      bestTime: 42_400,
    },
    {
      rank: 2,
      uuid: "word-player-2",
      displayName: "Noun Navigator",
      avatar: null,
      score: 91,
      bestTime: 51_200,
    },
    {
      rank: 3,
      uuid: "word-player-3",
      displayName: "Verb Voyager",
      avatar: null,
      score: 87,
      bestTime: 63_000,
    },
    {
      rank: 4,
      uuid: "word-player-4",
      displayName: "Adjective Ace",
      avatar: null,
      score: 80,
      bestTime: 72_500,
    },
  ],

  PassageReconstruction: [
    {
      rank: 1,
      uuid: "passage-player-1",
      displayName: "Passage Pro",
      avatar: null,
      score: 98.6,
      bestTime: 65_200,
    },
    {
      rank: 2,
      uuid: "passage-player-2",
      displayName: "Sequence Star",
      avatar: null,
      score: 94,
      bestTime: 73_400,
    },
    {
      rank: 3,
      uuid: "passage-player-3",
      displayName: "Order Oracle",
      avatar: null,
      score: 90,
      bestTime: 80_000,
    },
    {
      rank: 4,
      uuid: "passage-player-4",
      displayName: "Sentence Solver",
      avatar: null,
      score: 84,
      bestTime: 91_300,
    },
  ],

  ContextQuiz: [
    {
      rank: 1,
      uuid: "context-player-1",
      displayName: "Context Champion",
      avatar: null,
      score: 100,
      bestTime: 38_600,
    },
    {
      rank: 2,
      uuid: "context-player-2",
      displayName: "Cloze Captain",
      avatar: null,
      score: 95,
      bestTime: 44_100,
    },
    {
      rank: 3,
      uuid: "context-player-3",
      displayName: "Blank Boss",
      avatar: null,
      score: 89,
      bestTime: 50_700,
    },
    {
      rank: 4,
      uuid: "context-player-4",
      displayName: "Choice Checker",
      avatar: null,
      score: 81,
      bestTime: 62_000,
    },
  ],

  MeaningBridge: [
    {
      rank: 1,
      uuid: "meaning-player-1",
      displayName: "Meaning Master",
      avatar: null,
      score: 99,
      bestTime: 31_500,
    },
    {
      rank: 2,
      uuid: "meaning-player-2",
      displayName: "Bridge Builder",
      avatar: null,
      score: 93,
      bestTime: 38_000,
    },
    {
      rank: 3,
      uuid: "meaning-player-3",
      displayName: "Match Maker",
      avatar: null,
      score: 88,
      bestTime: 45_800,
    },
    {
      rank: 4,
      uuid: "meaning-player-4",
      displayName: "Pair Pro",
      avatar: null,
      score: 80,
      bestTime: 59_000,
    },
  ],
});

async function fulfillJson(route, body, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * SHARED PLATFORM API MOCKS:
 * Playwright starts the Vite client but not the Express backend. These mocks
 * isolate site tests from MongoDB, backend cold starts, and network availability
 * while preserving the application's real fetch and rendering paths.
 *
 * Options allow individual tests to exercise loading, empty, and failure states
 * without registering overlapping route handlers.
 */
export async function mockSharedPlatformApis(page, options = {}) {
  const {
    activeStories = MOCK_ACTIVE_STORIES,
    storiesStatus = 200,
    storiesDelayMs = 0,
    progressConfig = MOCK_PROGRESS_CONFIG,
    progressConfigStatus = 200,
    progressConfigDelayMs = 0,
    progressVisit = MOCK_PROGRESS_VISIT,
    progressVisitStatus = 200,
    progressVisitDelayMs = 0,
    progressBuyStatus = 200,
    progressBuyData = null,
    progressBuyMessage = "Failed to buy character.",
  } = options;

  const calls = {
    storiesActive: 0,
    progressConfig: 0,
    progressVisit: 0,
    progressBuy: 0,
    lastProgressBuyBody: null,
  };

  await page.route("**/api/v1/stories/active", async (route) => {
    calls.storiesActive += 1;

    if (storiesDelayMs > 0) {
      await delay(storiesDelayMs);
    }

    await fulfillJson(
      route,
      storiesStatus === 200
        ? {
            success: true,
            data: activeStories,
          }
        : {
            success: false,
            message: "Active stories are unavailable.",
          },
      storiesStatus,
    );
  });

  await page.route("**/api/v1/progress/config", async (route) => {
    calls.progressConfig += 1;
    if (progressConfigDelayMs > 0) {
      await delay(progressConfigDelayMs);
    }

    await fulfillJson(
      route,
      progressConfigStatus === 200
        ? {
            success: true,
            data: progressConfig,
          }
        : {
            success: false,
            message: "Progress configuration is unavailable.",
          },
      progressConfigStatus,
    );
  });

  await page.route("**/api/v1/progress/visit", async (route) => {
    calls.progressVisit += 1;
    if (progressVisitDelayMs > 0) {
      await delay(progressVisitDelayMs);
    }

    await fulfillJson(
      route,
      progressVisitStatus === 200
        ? {
            success: true,
            data: progressVisit,
          }
        : {
            success: false,
            message: "Progress visit could not be registered.",
          },
      progressVisitStatus,
    );
  });

  await page.route("**/api/v1/progress/buy", async (route) => {
    calls.progressBuy += 1;

    let requestBody = null;
    try {
      requestBody = route.request().postDataJSON();
    } catch {
      requestBody = null;
    }

    calls.lastProgressBuyBody = requestBody;

    const price = progressConfig.prices?.[requestBody?.characterId] ?? 0;

    const defaultBuyData = {
      streak: progressVisit.streak ?? 0,
      stars: Math.max(0, (progressVisit.stars ?? 0) - price),
      ownedCharacters: Array.from(
        new Set(
          [
            ...(progressVisit.ownedCharacters ?? []),
            requestBody?.characterId,
          ].filter(Boolean),
        ),
      ),
      lastVisitDate: progressVisit.lastVisitDate ?? null,
    };

    await fulfillJson(
      route,
      progressBuyStatus === 200
        ? {
            success: true,
            data: progressBuyData ?? defaultBuyData,
          }
        : {
            success: false,
            message: progressBuyMessage,
          },
      progressBuyStatus,
    );
  });
  return calls;
}

/**
 * SHARED LEADERBOARD API MOCKS:
 * The standalone leaderboard reads from three endpoint shapes:
 *
 * - shared Master, Word Hunt, and Meaning Bridge endpoints;
 * - Passage Reconstruction's own leaderboard endpoint;
 * - Context Quiz's own leaderboard endpoint.
 *
 * Player-rank requests still use the shared rank endpoint for every board.
 * Options allow tests to exercise loading, empty, failure, refresh, and stale
 * request behaviour without calling MongoDB or changing leaderboard logic.
 */
export async function mockLeaderboardApis(page, options = {}) {
  const {
    rowsByBoard = MOCK_LEADERBOARD_ROWS,
    statusByBoard = {},
    delayMsByBoard = {},
    playerRanksByBoard = {},
    playerRankStatusByBoard = {},
    playerRankDelayMsByBoard = {},
  } = options;

  const calls = {
    board: {},
    rank: {},
    lastBoardRequests: [],
    lastRankRequests: [],
  };

  function increment(bucket, board) {
    bucket[board] = (bucket[board] ?? 0) + 1;
  }

  async function handleBoardRequest(route, board) {
    increment(calls.board, board);

    calls.lastBoardRequests.push({
      board,
      url: route.request().url(),
    });

    const waitMs = delayMsByBoard[board] ?? 0;
    if (waitMs > 0) {
      await delay(waitMs);
    }

    const status = statusByBoard[board] ?? 200;

    await fulfillJson(
      route,
      status === 200
        ? {
            success: true,
            data: rowsByBoard[board] ?? [],
          }
        : {
            success: false,
            message: `${board} leaderboard unavailable.`,
          },
      status,
    );
  }

  /**
   * WORD HUNT LEADERBOARD MOCK:
   * Word Hunt now reads from its dedicated leaderboard endpoint and returns
   * playerName/totalScore fields with bestTime formatted as "m:ss".
   * Convert the shared deterministic fixture rows into that real API shape.
   */
  await page.route(
    /\/api\/v1\/wordHunt\/leaderboard(?:\?|$)/,
    async (route) => {
      const board = "WordHunt";

      increment(calls.board, board);

      calls.lastBoardRequests.push({
        board,
        url: route.request().url(),
      });

      const waitMs = delayMsByBoard[board] ?? 0;

      if (waitMs > 0) {
        await delay(waitMs);
      }

      const status = statusByBoard[board] ?? 200;
      const rows = rowsByBoard[board] ?? [];

      const toWordHuntTime = (value) => {
        if (value == null) {
          return null;
        }

        if (typeof value === "string") {
          return value;
        }

        const totalSeconds = Number(value) / 1000;

        if (!Number.isFinite(totalSeconds)) {
          return null;
        }

        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds - minutes * 60;

        const secondsText = Number.isInteger(seconds)
          ? String(seconds).padStart(2, "0")
          : seconds.toFixed(1).padStart(4, "0");

        return `${minutes}:${secondsText}`;
      };

      await fulfillJson(
        route,
        status === 200
          ? {
              success: true,
              data: rows.map((row) => ({
                rank: row.rank,
                uuid: row.uuid,
                playerName: row.displayName,
                avatar: row.avatar ?? null,
                totalScore: row.score,
                bestTime: toWordHuntTime(row.bestTime),
              })),
            }
          : {
              success: false,
              message: `${board} leaderboard unavailable.`,
            },
        status,
      );
    },
  );

  await page.route(/\/api\/v1\/leaderboard\/rank(?:\?|$)/, async (route) => {
    const url = new URL(route.request().url());
    const board = url.searchParams.get("game") || "master";

    increment(calls.rank, board);

    calls.lastRankRequests.push({
      board,
      url: route.request().url(),
    });

    const waitMs = playerRankDelayMsByBoard[board] ?? 0;
    if (waitMs > 0) {
      await delay(waitMs);
    }

    const hasConfiguredRank = Object.prototype.hasOwnProperty.call(
      playerRanksByBoard,
      board,
    );

    const rankData = hasConfiguredRank ? playerRanksByBoard[board] : null;

    const status = playerRankStatusByBoard[board] ?? (rankData ? 200 : 404);

    await fulfillJson(
      route,
      status === 200
        ? {
            success: true,
            data: rankData,
          }
        : {
            success: false,
            message: "Player has no leaderboard record yet",
          },
      status,
    );
  });

  await page.route(/\/api\/v1\/fillInBlanks\/leaderboard(?:\?|$)/, (route) =>
    handleBoardRequest(route, "ContextQuiz"),
  );

  /**
   * MEANING BRIDGE LEADERBOARD MOCK:
   * Meaning Bridge now reads from its own score collection and returns `scores`
   * using playerName/totalScore fields. Mirror that real service contract here
   * while keeping the shared deterministic leaderboard test data.
   */
  await page.route(
    /\/api\/v1\/meaningBridge\/score\/leaderboard(?:\?|$)/,
    async (route) => {
      const board = "MeaningBridge";

      increment(calls.board, board);

      calls.lastBoardRequests.push({
        board,
        url: route.request().url(),
      });

      const waitMs = delayMsByBoard[board] ?? 0;

      if (waitMs > 0) {
        await delay(waitMs);
      }

      const status = statusByBoard[board] ?? 200;
      const rows = rowsByBoard[board] ?? [];

      await fulfillJson(
        route,
        status === 200
          ? {
              success: true,
              scores: rows.map((row) => ({
                uuid: row.uuid,
                playerName: row.displayName,
                avatar: row.avatar ?? null,
                totalScore: row.score,
                bestTime: row.bestTime ?? null,
              })),
            }
          : {
              success: false,
              message: `${board} leaderboard unavailable.`,
            },
        status,
      );
    },
  );

  await page.route(
    /\/api\/v1\/passageReconstruct\/leaderboard(?:\?|$)/,
    (route) => handleBoardRequest(route, "PassageReconstruction"),
  );

  await page.route(/\/api\/v1\/leaderboard(?:\?|$)/, async (route) => {
    const url = new URL(route.request().url());
    const board = url.searchParams.get("game") || "master";

    await handleBoardRequest(route, board);
  });

  return calls;
}

export const E2E_AUTH_ACTIONS = Object.freeze({
  EMAIL_SIGN_IN: "email-sign-in",
  EMAIL_SIGN_UP: "email-sign-up",
  GOOGLE_SIGN_IN: "google-sign-in",
});

/**
 * Configures deterministic auth behaviour before the application loads.
 * AuthContext reads this object only when VITE_E2E_AUTH_BYPASS is enabled.
 */
export async function configureE2EAuth(page, options = {}) {
  await page.addInitScript((config) => {
    window.__WORD_COMPLEX_E2E_AUTH__ = config;
    window.__WORD_COMPLEX_E2E_AUTH_CALLS__ = [];
  }, options);
}

export async function readE2EAuthCalls(page) {
  return page.evaluate(() => window.__WORD_COMPLEX_E2E_AUTH_CALLS__ ?? []);
}

/**
 * SHARED AUTH FLOW:
 * Uses the existing VITE_E2E_AUTH_BYPASS guest path. Authentication should stop
 * at the mandatory Story Picker rather than opening the launcher immediately.
 */
export async function loginAsGuest(page) {
  await page.goto("/");

  const guestButton = page.getByTestId("guest-login-button");

  await expect(guestButton).toBeVisible();
  await expect(guestButton).toBeEnabled();
  await guestButton.click();

  await expect(page.getByTestId("story-picker-page")).toBeVisible({
    timeout: 15_000,
  });
}

/**
 * SHARED STORY FLOW:
 * Selects one deterministic mocked story and confirms it through the real UI.
 */
export async function selectStoryAndOpenLauncher(
  page,
  storyId = TEST_STORY.storyId,
) {
  const storyCard = page.getByTestId(`story-card-${storyId}`);

  await expect(storyCard).toBeVisible();
  await storyCard.click();

  await expect(storyCard).toHaveAttribute("aria-pressed", "true");

  const confirmButton = page.getByTestId("story-picker-confirm-button");

  await expect(confirmButton).toBeVisible();
  await expect(confirmButton).toBeEnabled();
  await confirmButton.click();

  await expect(page.getByTestId("launcher-page")).toBeVisible({
    timeout: 15_000,
  });
}

/**
 * SHARED APPLICATION BOOTSTRAP:
 * Opens the application as an E2E guest and reaches the launcher with a selected
 * story. Game and platform specs reuse this instead of duplicating setup.
 */
export async function openAppAsGuest(page, storyId = TEST_STORY.storyId) {
  await loginAsGuest(page);
  await selectStoryAndOpenLauncher(page, storyId);
}

/**
 * SHARED GAME-SCENE FLOW:
 * Launches a game through its real launcher card and waits for the shared scene
 * wrapper plus the game's ZIM holder. This does not interact with game rules.
 */
export async function openGameScene(page, { gameId, zimTestId }) {
  const startButton = page.getByTestId(`game-start-${gameId}`);

  await expect(startButton).toBeVisible();
  await expect(startButton).toBeEnabled();
  await startButton.click();

  await expect(page.getByTestId(`game-scene-${gameId}`)).toBeVisible({
    timeout: 15_000,
  });

  await expect(page.getByTestId(`scene-canvas-${gameId}`)).toBeVisible();

  if (zimTestId) {
    await expect(page.getByTestId(zimTestId)).toBeVisible({
      timeout: 15_000,
    });
  }
}

/**
 * SHARED BACK-NAVIGATION FLOW:
 * Uses the real GameScene Back button and verifies the launcher is restored.
 */
export async function returnToLauncherFromScene(page, gameId) {
  const backButton = page.getByTestId(`game-scene-back-${gameId}`);

  await expect(backButton).toBeVisible();
  await backButton.click();

  await expect(page.getByTestId("launcher-page")).toBeVisible({
    timeout: 15_000,
  });
}
