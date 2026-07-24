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

/*
 * WORD HUNT PLAYWRIGHT FIXTURES
 * =============================
 *
 * Word Hunt runs entirely inside a ZIMJS canvas. These helpers provide:
 *
 * - deterministic responses for the exact Word Hunt frontend endpoints;
 * - request recording for query and JSON-body contract assertions;
 * - guest and signed-in application launch paths;
 * - access to the gated read-only Word Hunt state bridge;
 * - real browser mouse clicks against published canvas geometry.
 *
 * This file does not duplicate or replace:
 *
 * - language selection;
 * - POS classification;
 * - challenge-queue construction;
 * - word matching;
 * - scoring;
 * - hints;
 * - timers;
 * - round progression;
 * - persistence eligibility.
 *
 * Those behaviours remain owned by the production Word Hunt classes.
 */

export const WORD_HUNT_GAME_ID = "word-hunt";

export const WORD_HUNT_ZIM_TEST_ID = "word-hunt";

export const WORD_HUNT_STAGE_SIZE = Object.freeze({
  width: 1280,
  height: 720,
});

export const WORD_HUNT_LANGUAGES = Object.freeze({
  ENGLISH: "EN",
  SANSKRIT: "SA",
});

export const WORD_HUNT_GAME_TYPES = Object.freeze({
  NOUN: "Noun",
  VERB: "Verb",
  ADJECTIVE: "Adjective",
});

export const WORD_HUNT_SIGNED_IN_USER = Object.freeze({
  id: "word-hunt-reader-1",
  name: "Willa Word",
  nickname: "Willa",
  username: "willa.word@example.test",
  role: "Reader",
  isGuest: false,
});

/*
 * The English fixture deliberately contains several unique nouns, verbs, and
 * adjectives. All token text is normalized to lowercase because the current
 * production PassageDisplay normalizes clicked passage words before comparing
 * them with the lists produced by GameServiceManager.
 */
export const WORD_HUNT_ENGLISH_DATA = Object.freeze({
  passage:
    "The curious fox follows the bright trail. " +
    "A patient owl watches the quiet river.",

  passageArray: Object.freeze([
    "The",
    "curious",
    "fox",
    "follows",
    "the",
    "bright",
    "trail",
    ".",
    "A",
    "patient",
    "owl",
    "watches",
    "the",
    "quiet",
    "river",
    ".",
  ]),

  tokenizedPassage: Object.freeze([
    Object.freeze({
      text: "the",
      lemma: "the",
      pos: "DET",
    }),
    Object.freeze({
      text: "curious",
      lemma: "curious",
      pos: "ADJ",
    }),
    Object.freeze({
      text: "fox",
      lemma: "fox",
      pos: "NOUN",
    }),
    Object.freeze({
      text: "follows",
      lemma: "follow",
      pos: "VERB",
    }),
    Object.freeze({
      text: "bright",
      lemma: "bright",
      pos: "ADJ",
    }),
    Object.freeze({
      text: "trail",
      lemma: "trail",
      pos: "NOUN",
    }),
    Object.freeze({
      text: "patient",
      lemma: "patient",
      pos: "ADJ",
    }),
    Object.freeze({
      text: "owl",
      lemma: "owl",
      pos: "NOUN",
    }),
    Object.freeze({
      text: "watches",
      lemma: "watch",
      pos: "VERB",
    }),
    Object.freeze({
      text: "quiet",
      lemma: "quiet",
      pos: "ADJ",
    }),
    Object.freeze({
      text: "river",
      lemma: "river",
      pos: "NOUN",
    }),
  ]),
});

/*
 * Sanskrit passage data mirrors the current server contract:
 *
 * - passage is an array;
 * - tokenizedPassage uses text and upos;
 * - passageArray is not required by the Sanskrit endpoint.
 *
 * Danda punctuation is intentionally present in the visible passage. The
 * production normalize() function removes it before matching.
 */
export const WORD_HUNT_SANSKRIT_DATA = Object.freeze({
  passage: Object.freeze([
    "जिज्ञासुः बालकः वनं पश्यति।",
    "प्रसन्ना बालिका शीघ्रं धावति।",
  ]),

  tokenizedPassage: Object.freeze([
    Object.freeze({
      text: "जिज्ञासुः",
      lemma: "जिज्ञासु",
      upos: "ADJ",
    }),
    Object.freeze({
      text: "बालकः",
      lemma: "बालक",
      upos: "NOUN",
    }),
    Object.freeze({
      text: "वनं",
      lemma: "वन",
      upos: "NOUN",
    }),
    Object.freeze({
      text: "पश्यति",
      lemma: "दृश्",
      upos: "VERB",
    }),
    Object.freeze({
      text: "प्रसन्ना",
      lemma: "प्रसन्न",
      upos: "ADJ",
    }),
    Object.freeze({
      text: "बालिका",
      lemma: "बालिका",
      upos: "NOUN",
    }),
    Object.freeze({
      text: "शीघ्रं",
      lemma: "शीघ्र",
      upos: "ADV",
    }),
    Object.freeze({
      text: "धावति",
      lemma: "धाव्",
      upos: "VERB",
    }),
  ]),
});

export const WORD_HUNT_EMPTY_PLAYER_INFO = Object.freeze({
  storyId: TEST_STORY.storyId,
  earnedCoins: 0,
  earnedScore: 0,

  games: Object.freeze({
    Noun: null,
    Verb: null,
    Adjective: null,
  }),
});

function cloneJson(value) {
  if (value == null) {
    return value;
  }

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

function readJsonBody(request) {
  try {
    return request.postDataJSON();
  } catch {
    return null;
  }
}

/*
 * A status sequence allows tests to serve, for example, a failed request first
 * and a successful retry second without installing overlapping route handlers.
 *
 * When requests exceed the configured sequence, the last sequence value is
 * reused.
 */
function getRequestStatus(sequence, fallback, requestIndex) {
  if (!Array.isArray(sequence) || sequence.length === 0) {
    return fallback;
  }

  const index = Math.min(requestIndex, sequence.length - 1);

  return sequence[index];
}

/*
 * WORD HUNT API FIXTURES
 * ======================
 *
 * The Vite-only Playwright environment does not start Express or MongoDB.
 * These route handlers replace only backend responses.
 *
 * The production application still uses:
 *
 * - wordHuntService.js;
 * - URLSearchParams;
 * - fetch();
 * - GameServiceManager;
 * - the StoryInfo and GameInfo DTOs;
 * - the existing guest/Sanskrit persistence rules.
 */
export async function mockWordHuntApis(page, options = {}) {
  const {
    englishData = WORD_HUNT_ENGLISH_DATA,
    sanskritData = WORD_HUNT_SANSKRIT_DATA,

    englishStatus = 200,
    sanskritStatus = 200,

    englishStatusSequence = null,
    sanskritStatusSequence = null,

    englishDelayMs = 0,
    sanskritDelayMs = 0,

    englishError = "English Word Hunt passage is unavailable.",
    sanskritError = "Sanskrit Word Hunt passage is unavailable.",

    playerInfo = WORD_HUNT_EMPTY_PLAYER_INFO,
    playerInfoStatus = 200,
    playerInfoStatusSequence = null,
    playerInfoDelayMs = 0,
    playerInfoError = "Player information is unavailable.",

    storyInfoStatus = 200,
    storyInfoStatusSequence = null,
    storyInfoDelayMs = 0,
    storyInfoResponse = {
      success: true,
      message: {
        success: true,
        message: "Story Info Registered Successfully",
      },
    },
    storyInfoError = "Story information could not be saved.",

    gameDataStatus = 200,
    gameDataStatusSequence = null,
    gameDataDelayMs = 0,
    gameDataResponse = {
      success: true,
      message: {
        success: true,
        message: "Game Saved",
      },
    },
    gameDataError = "Game information could not be saved.",
  } = options;

  const calls = {
    englishRequests: [],
    sanskritRequests: [],
    playerInfoRequests: [],
    storyInfoRequests: [],
    gameDataRequests: [],
  };

  /*
   * GET /wordHunt/POSEnglish?storyId=...
   */
  await page.route(/\/api\/v1\/wordHunt\/POSEnglish(?:\?|$)/, async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    const storyId = url.searchParams.get("storyId");

    calls.englishRequests.push({
      method: request.method(),
      url: request.url(),
      storyId,
    });

    const requestIndex = calls.englishRequests.length - 1;

    const status = getRequestStatus(
      englishStatusSequence,
      englishStatus,
      requestIndex,
    );

    if (englishDelayMs > 0) {
      await delay(englishDelayMs);
    }

    await fulfillJson(
      route,
      status === 200
        ? {
            success: true,
            data: cloneJson(englishData),
          }
        : {
            success: false,
            message: englishError,
          },
      status,
    );
  });

  /*
   * GET /wordHunt/POSSanskrit?storyId=...
   */
  await page.route(
    /\/api\/v1\/wordHunt\/POSSanskrit(?:\?|$)/,
    async (route) => {
      const request = route.request();
      const url = new URL(request.url());

      const storyId = url.searchParams.get("storyId");

      calls.sanskritRequests.push({
        method: request.method(),
        url: request.url(),
        storyId,
      });

      const requestIndex = calls.sanskritRequests.length - 1;

      const status = getRequestStatus(
        sanskritStatusSequence,
        sanskritStatus,
        requestIndex,
      );

      if (sanskritDelayMs > 0) {
        await delay(sanskritDelayMs);
      }

      await fulfillJson(
        route,
        status === 200
          ? {
              success: true,
              data: cloneJson(sanskritData),
            }
          : {
              success: false,
              message: sanskritError,
            },
        status,
      );
    },
  );

  /*
   * GET /wordHunt/playerData
   *
   * Query fields are recorded exactly as produced by getPlayerInfo():
   *
   * - gameId
   * - storyId
   * - playerName
   */
  await page.route(/\/api\/v1\/wordHunt\/playerData(?:\?|$)/, async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    const gameId = url.searchParams.get("gameId");

    const storyId = url.searchParams.get("storyId");

    const playerName = url.searchParams.get("playerName");

    calls.playerInfoRequests.push({
      method: request.method(),
      url: request.url(),
      gameId,
      storyId,
      playerName,
    });

    const requestIndex = calls.playerInfoRequests.length - 1;

    const status = getRequestStatus(
      playerInfoStatusSequence,
      playerInfoStatus,
      requestIndex,
    );

    if (playerInfoDelayMs > 0) {
      await delay(playerInfoDelayMs);
    }

    const responsePlayerInfo = {
      ...cloneJson(playerInfo),
      storyId: storyId || playerInfo?.storyId || null,
    };

    await fulfillJson(
      route,
      status === 200
        ? {
            success: true,
            message: responsePlayerInfo,
          }
        : {
            success: false,
            message: playerInfoError,
          },
      status,
    );
  });

  /*
   * POST /wordHunt/addStoryInfo
   *
   * The production client reaches this endpoint only when the player is both:
   *
   * - signed in; and
   * - playing the Sanskrit version.
   */
  await page.route(
    /\/api\/v1\/wordHunt\/addStoryInfo(?:\?|$)/,
    async (route) => {
      const request = route.request();
      const body = readJsonBody(request);

      calls.storyInfoRequests.push({
        method: request.method(),
        url: request.url(),
        body,
      });

      const requestIndex = calls.storyInfoRequests.length - 1;

      const status = getRequestStatus(
        storyInfoStatusSequence,
        storyInfoStatus,
        requestIndex,
      );

      if (storyInfoDelayMs > 0) {
        await delay(storyInfoDelayMs);
      }

      await fulfillJson(
        route,
        status === 200
          ? cloneJson(storyInfoResponse)
          : {
              success: false,
              message: storyInfoError,
            },
        status,
      );
    },
  );

  /*
   * POST /wordHunt/addGameData
   *
   * The production GameInfo DTO contains:
   *
   * gameId, storyId, playerId, playerName, bestTime, coins, totalScore,
   * hintsUsed, foundWords, and gameInstance.
   */
  await page.route(
    /\/api\/v1\/wordHunt\/addGameData(?:\?|$)/,
    async (route) => {
      const request = route.request();
      const body = readJsonBody(request);

      calls.gameDataRequests.push({
        method: request.method(),
        url: request.url(),
        body,
      });

      const requestIndex = calls.gameDataRequests.length - 1;

      const status = getRequestStatus(
        gameDataStatusSequence,
        gameDataStatus,
        requestIndex,
      );

      if (gameDataDelayMs > 0) {
        await delay(gameDataDelayMs);
      }

      await fulfillJson(
        route,
        status === 200
          ? cloneJson(gameDataResponse)
          : {
              success: false,
              message: gameDataError,
            },
        status,
      );
    },
  );

  return calls;
}

/*
 * E2E FEATURE FLAG
 * ================
 *
 * Enable the gated Word Hunt bridge before the first application script runs.
 */
export async function enableWordHuntE2E(page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("wordHuntE2E", "1");
  });
}

export async function waitForWordHuntHooks(page) {
  await expect
    .poll(
      () =>
        page.evaluate(
          () => typeof window.__wordHuntZimTestHooks?.getState === "function",
        ),
      {
        timeout: 15_000,
      },
    )
    .toBe(true);
}

export async function readWordHuntState(page) {
  return page.evaluate(() => {
    const hooks = window.__wordHuntZimTestHooks;

    if (!hooks || typeof hooks.getState !== "function") {
      return null;
    }

    return hooks.getState();
  });
}

export async function waitForWordHuntScreen(page, screen, timeout = 15_000) {
  await expect
    .poll(() => readWordHuntState(page), {
      timeout,
    })
    .toMatchObject({
      screen,
    });

  return readWordHuntState(page);
}

/*
 * Return the actual ZIM canvas owned by Word Hunt.
 */
export function getWordHuntCanvas(page) {
  return page.getByTestId(WORD_HUNT_ZIM_TEST_ID).locator("canvas").first();
}

/*
 * Convert one published stage-space point into browser coordinates and perform
 * a normal Playwright mouse click.
 *
 * No ZIM event is invoked directly. The browser click enters the same pointer
 * and tap handlers used by a player.
 */
export async function clickWordHuntGeometry(page, geometry) {
  if (!geometry) {
    throw new Error("Word Hunt canvas geometry is unavailable");
  }

  if (geometry.attachedToStage === false) {
    throw new Error(
      `Word Hunt object is detached from the stage: ${geometry.id}`,
    );
  }

  if (geometry.visible === false) {
    throw new Error(`Word Hunt object is not visible: ${geometry.id}`);
  }

  if (geometry.mouseEnabled === false) {
    throw new Error(`Word Hunt object is not mouse-enabled: ${geometry.id}`);
  }

  const canvas = getWordHuntCanvas(page);

  await expect(canvas).toBeVisible();

  const box = await canvas.boundingBox();

  if (!box) {
    throw new Error("Word Hunt canvas has no browser bounding box");
  }

  const browserX =
    box.x + (geometry.centerX / WORD_HUNT_STAGE_SIZE.width) * box.width;

  const browserY =
    box.y + (geometry.centerY / WORD_HUNT_STAGE_SIZE.height) * box.height;

  await page.mouse.click(browserX, browserY);
}

/*
 * Click one existing landing, gameplay, or result control by its geometry key.
 *
 * Supported keys currently published by the bridge:
 *
 * startAdventure
 * languageToggle
 * hint
 * back
 * next
 * continue
 * restart
 * exit
 */
export async function clickWordHuntControl(page, controlName) {
  const state = await readWordHuntState(page);

  const geometry = state?.controlGeometry?.[controlName];

  if (!geometry) {
    throw new Error(
      `Word Hunt control geometry is unavailable: ${controlName}`,
    );
  }

  await clickWordHuntGeometry(page, geometry);

  return readWordHuntState(page);
}

function matchesWordCriteria(word, criteria) {
  if (typeof criteria === "string") {
    return word.normalizedText === criteria || word.displayedText === criteria;
  }

  if (
    criteria.normalizedText != null &&
    word.normalizedText !== criteria.normalizedText
  ) {
    return false;
  }

  if (
    criteria.displayedText != null &&
    word.displayedText !== criteria.displayedText
  ) {
    return false;
  }

  if (criteria.category != null && word.category !== criteria.category) {
    return false;
  }

  if (
    criteria.isTargetForActiveRound != null &&
    word.isTargetForActiveRound !== criteria.isTargetForActiveRound
  ) {
    return false;
  }

  if (criteria.found != null && word.found !== criteria.found) {
    return false;
  }

  if (criteria.safeOnly !== false && word.safeClickCandidate !== true) {
    return false;
  }

  return true;
}

/*
 * Find one live passage word from the state published by the production canvas.
 *
 * The default chooses the first safe, unfound target for the active challenge.
 */
export function findWordHuntWord(
  state,
  criteria = {
    isTargetForActiveRound: true,
    found: false,
  },
) {
  const normalizedCriteria =
    typeof criteria === "string"
      ? criteria
      : {
          isTargetForActiveRound: true,
          found: false,
          safeOnly: true,
          ...criteria,
        };

  const matchingWords = (state?.wordGeometry || []).filter((word) =>
    matchesWordCriteria(word, normalizedCriteria),
  );

  const occurrence =
    typeof normalizedCriteria === "object"
      ? (normalizedCriteria.occurrence ?? 0)
      : 0;

  return matchingWords[occurrence] || null;
}

/*
 * Perform a genuine browser click on a currently visible passage word.
 */
export async function clickWordHuntWord(
  page,
  criteria = {
    isTargetForActiveRound: true,
    found: false,
  },
) {
  const state = await readWordHuntState(page);

  const word = findWordHuntWord(state, criteria);

  if (!word) {
    throw new Error(
      `No Word Hunt passage word matched: ${JSON.stringify(criteria)}`,
    );
  }

  await clickWordHuntGeometry(page, word);

  return {
    word,
    state: await readWordHuntState(page),
  };
}

/*
 * Use the real language-toggle canvas control.
 */
export async function setWordHuntLanguage(page, language) {
  if (
    language !== WORD_HUNT_LANGUAGES.ENGLISH &&
    language !== WORD_HUNT_LANGUAGES.SANSKRIT
  ) {
    throw new Error(`Unsupported Word Hunt language: ${language}`);
  }

  let state = await readWordHuntState(page);

  if (state?.language === language) {
    return state;
  }

  await clickWordHuntControl(page, "languageToggle");

  await expect
    .poll(async () => (await readWordHuntState(page))?.language, {
      timeout: 5_000,
    })
    .toBe(language);

  state = await readWordHuntState(page);

  return state;
}

/*
 * Start the real production adventure by clicking the live landing button.
 *
 * Failure tests may set waitForGameplay=false so they can inspect the restored
 * landing state after an API error.
 */
export async function startWordHuntAdventure(page, options = {}) {
  const { waitForGameplay = true, timeout = 20_000 } = options;

  await clickWordHuntControl(page, "startAdventure");

  if (!waitForGameplay) {
    return readWordHuntState(page);
  }

  return waitForWordHuntScreen(page, "gameplay", timeout);
}

/*
 * GUEST APPLICATION BOOTSTRAP
 * ===========================
 *
 * This enters Word Hunt through:
 *
 * guest authentication
 * → Story Picker
 * → launcher
 * → Word Hunt GameScene
 * → Word Hunt ZIM canvas
 */
export async function openWordHuntAsGuest(page, options = {}) {
  const {
    storyId = TEST_STORY.storyId,

    platformOptions = {},
    apiOptions = {},

    language = WORD_HUNT_LANGUAGES.ENGLISH,

    startAdventure = false,
  } = options;

  await enableWordHuntE2E(page);

  const platformCalls = await mockSharedPlatformApis(page, platformOptions);

  const wordHuntCalls = await mockWordHuntApis(page, apiOptions);

  await openAppAsGuest(page, storyId);

  await openGameScene(page, {
    gameId: WORD_HUNT_GAME_ID,
    zimTestId: WORD_HUNT_ZIM_TEST_ID,
  });

  await waitForWordHuntHooks(page);

  await waitForWordHuntScreen(page, "landing");

  await setWordHuntLanguage(page, language);

  if (startAdventure) {
    await startWordHuntAdventure(page);
  }

  return {
    platformCalls,
    wordHuntCalls,
  };
}

/*
 * SIGNED-IN APPLICATION BOOTSTRAP
 * ===============================
 *
 * The signed-in path uses the existing deterministic email-auth bypass and the
 * real login, Story Picker, launcher, and GameScene UI.
 */
export async function openWordHuntAsSignedIn(page, options = {}) {
  const {
    storyId = TEST_STORY.storyId,

    user = WORD_HUNT_SIGNED_IN_USER,
    email = WORD_HUNT_SIGNED_IN_USER.username,
    password = "word-hunt-e2e-password",

    authOptions = {},
    platformOptions = {},
    apiOptions = {},

    language = WORD_HUNT_LANGUAGES.ENGLISH,

    startAdventure = false,
  } = options;

  await enableWordHuntE2E(page);

  const platformCalls = await mockSharedPlatformApis(page, platformOptions);

  const wordHuntCalls = await mockWordHuntApis(page, apiOptions);

  await configureE2EAuth(page, {
    ...authOptions,

    userByAction: {
      ...(authOptions.userByAction ?? {}),

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
    gameId: WORD_HUNT_GAME_ID,
    zimTestId: WORD_HUNT_ZIM_TEST_ID,
  });

  await waitForWordHuntHooks(page);

  await waitForWordHuntScreen(page, "landing");

  await setWordHuntLanguage(page, language);

  if (startAdventure) {
    await startWordHuntAdventure(page);
  }

  return {
    platformCalls,
    wordHuntCalls,
  };
}
