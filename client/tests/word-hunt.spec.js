import { expect, test } from "@playwright/test";

import {
  TEST_STORY,
  returnToLauncherFromScene,
} from "./helpers/app-fixtures.js";

import {
  WORD_HUNT_GAME_ID,
  WORD_HUNT_GAME_TYPES,
  WORD_HUNT_LANGUAGES,
  WORD_HUNT_SIGNED_IN_USER,
  WORD_HUNT_ZIM_TEST_ID,
  clickWordHuntControl,
  clickWordHuntGeometry,
  clickWordHuntWord,
  findWordHuntWord,
  openWordHuntAsGuest,
  openWordHuntAsSignedIn,
  readWordHuntState,
  setWordHuntLanguage,
  waitForWordHuntScreen,
} from "./helpers/word-hunt-fixtures.js";

/*
 * WORD HUNT PLAYWRIGHT E2E TESTS
 * ==============================
 *
 * These tests enter Word Hunt through the real application path:
 *
 * guest authentication
 * → Story Picker
 * → launcher
 * → shared GameScene
 * → Word Hunt ZIM canvas
 *
 * The Express server, MongoDB, Firebase, and external story services are not
 * started by Playwright. Only their network responses are deterministic.
 *
 * The production frontend still owns:
 *
 * - selected-story retrieval;
 * - language selection;
 * - API serialization;
 * - POS-list processing;
 * - challenge-queue construction;
 * - ZIM rendering;
 * - canvas pointer handling;
 * - word matching;
 * - scoring;
 * - visual feedback.
 *
 * Canvas interactions in this file use browser mouse coordinates derived from
 * the live ZIM geometry. The tests do not call word-match callbacks directly.
 */

const EXPECTED_ENGLISH_WORD_TYPES = Object.freeze({
  nouns: Object.freeze(["fox", "trail", "owl", "river"]),

  verbs: Object.freeze(["follows", "watches"]),

  adjectives: Object.freeze(["curious", "bright", "patient", "quiet"]),
});

const EXPECTED_ENGLISH_QUEUE = Object.freeze([
  WORD_HUNT_GAME_TYPES.NOUN,
  WORD_HUNT_GAME_TYPES.VERB,
  WORD_HUNT_GAME_TYPES.ADJECTIVE,
]);

/*
 * SANSKRIT PLAYWRIGHT EXPECTATIONS:
 * GameServiceManager normalizes Sanskrit token text and preserves the first
 * occurrence order through its noun, verb, and adjective Sets.
 */
const EXPECTED_SANSKRIT_WORD_TYPES = Object.freeze({
  nouns: Object.freeze(["बालकः", "वनं", "बालिका"]),

  verbs: Object.freeze(["पश्यति", "धावति"]),

  adjectives: Object.freeze(["जिज्ञासुः", "प्रसन्ना"]),
});

const EXPECTED_SANSKRIT_QUEUE = Object.freeze([
  WORD_HUNT_GAME_TYPES.NOUN,
  WORD_HUNT_GAME_TYPES.VERB,
  WORD_HUNT_GAME_TYPES.ADJECTIVE,
]);

/*
 * REAL TIMER FIXTURE:
 * Word Hunt uses a player's previous best time as the duration for the next
 * attempt. Supplying an eight-second noun history lets Playwright exercise the
 * genuine Date.now() + ZIM Ticker timeout path without fake timers, direct
 * callback invocation, or production-code changes.
 */
const WORD_HUNT_FAST_TIMEOUT_PLAYER_INFO = Object.freeze({
  storyId: TEST_STORY.storyId,
  earnedCoins: 0,
  earnedScore: 0,

  games: Object.freeze({
    Noun: Object.freeze({
      bestTime: "0:08",
      totalScore: 0,
    }),

    Verb: null,
    Adjective: null,
  }),
});

/*
 * Open the deterministic English noun round through the complete application
 * path. The helper clicks the real Start Adventure canvas button and waits for
 * the production READY / 3 / 2 / 1 / GO countdown to finish.
 */
async function openEnglishWordHuntRound(page) {
  return openWordHuntAsGuest(page, {
    language: WORD_HUNT_LANGUAGES.ENGLISH,

    startAdventure: true,
  });
}

/*
 * Open an English noun round whose duration comes from the production
 * best-history path.
 *
 * Nothing in the timer implementation is replaced. The existing Timer.start()
 * reads Date.now(), registers its normal ZIM ticker, and reaches the existing
 * timeout callback naturally after eight seconds.
 */
async function openEnglishWordHuntTimeoutRound(page) {
  return openWordHuntAsGuest(page, {
    language: WORD_HUNT_LANGUAGES.ENGLISH,

    startAdventure: true,

    apiOptions: {
      playerInfo: WORD_HUNT_FAST_TIMEOUT_PLAYER_INFO,
    },
  });
}

/*
 * Complete the current noun round exclusively through real browser clicks on
 * each live passage label.
 *
 * The helper waits after every word so a later click always uses a fresh state
 * snapshot and the production foundWords array remains the authority.
 */
async function completeEnglishNounRound(page) {
  for (const noun of EXPECTED_ENGLISH_WORD_TYPES.nouns) {
    await clickWordHuntWord(page, {
      normalizedText: noun,
      category: "noun",

      isTargetForActiveRound: true,

      found: false,
    });

    await expect
      .poll(async () => {
        const state = await readWordHuntState(page);

        return state?.foundWords?.includes(noun) ?? false;
      })
      .toBe(true);
  }

  return waitForWordHuntScreen(page, "round-complete", 8_000);
}

/*
 * Complete whichever target round is currently active through real browser
 * clicks. The target list comes from the live production subgame rather than
 * being reconstructed by the Playwright test.
 */
async function completeCurrentWordHuntRound(page) {
  const initialState = await readWordHuntState(page);

  const targetWords = [...(initialState?.targetWords || [])];

  if (targetWords.length === 0) {
    throw new Error("Word Hunt has no active target words to complete");
  }

  for (const targetWord of targetWords) {
    await clickWordHuntWord(page, {
      normalizedText: targetWord,

      isTargetForActiveRound: true,

      found: false,
    });

    await expect
      .poll(async () => {
        const state = await readWordHuntState(page);

        return state?.foundWords?.includes(targetWord) ?? false;
      })
      .toBe(true);
  }

  return waitForWordHuntScreen(page, "round-complete", 8_000);
}

/*
 * Wait for the genuine production timer to expire.
 *
 * Timeout-focused tests open the round with an eight-second historical best
 * time. This helper performs no clock emulation and does not invoke Timer's
 * completion callback directly.
 */
async function waitForCurrentWordHuntTimeout(page) {
  return waitForWordHuntScreen(page, "time-up", 12_000);
}

/*
 * Open the real English verb round through the production noun Next control.
 */
async function openEnglishVerbRound(page) {
  await openEnglishWordHuntRound(page);

  await clickWordHuntControl(page, "next");

  const state = await waitForWordHuntScreen(page, "gameplay", 15_000);

  expect(state.activeGameType).toBe(WORD_HUNT_GAME_TYPES.VERB);

  return state;
}

/*
 * Reach adjective gameplay through the production noun and verb Next controls.
 *
 * This deliberately does not invoke a test-only progression command.
 */
async function openEnglishAdjectiveRound(page) {
  await openEnglishVerbRound(page);

  await clickWordHuntControl(page, "next");

  const state = await waitForWordHuntScreen(page, "gameplay", 15_000);

  expect(state.activeGameType).toBe(WORD_HUNT_GAME_TYPES.ADJECTIVE);

  return state;
}

/*
 * Reach Sanskrit adjective gameplay through the real signed-in application
 * path and the production noun/verb Next controls.
 *
 * No earlier round is completed, so any addGameData request observed afterward
 * belongs to the adjective completion being tested.
 */
async function openSignedInSanskritAdjectiveRound(page) {
  const calls = await openWordHuntAsSignedIn(page, {
    language: WORD_HUNT_LANGUAGES.SANSKRIT,

    startAdventure: true,

    apiOptions: {
      playerInfo: WORD_HUNT_SANSKRIT_ADJECTIVE_HISTORY,
    },
  });

  await clickWordHuntControl(page, "next");

  let state = await waitForWordHuntScreen(page, "gameplay", 15_000);

  expect(state.activeGameType).toBe(WORD_HUNT_GAME_TYPES.VERB);

  await clickWordHuntControl(page, "next");

  state = await waitForWordHuntScreen(page, "gameplay", 15_000);

  expect(state).toMatchObject({
    language: WORD_HUNT_LANGUAGES.SANSKRIT,

    activeGameType: WORD_HUNT_GAME_TYPES.ADJECTIVE,

    targetWords: EXPECTED_SANSKRIT_WORD_TYPES.adjectives,

    targetCount: 2,

    foundWords: [],
    foundCount: 0,

    isInputLocked: false,
    timerActive: true,
  });

  expect(state.gameTimeMinutes).toBeCloseTo(1, 8);

  return calls;
}

/*
 * SANSKRIT ADJECTIVE SCORE FIXTURE:
 * Give the adjective round a one-minute previous best time. This keeps the
 * production timer and multiplier calculation deterministic enough for the
 * completed-round persistence assertion without replacing any clock behavior.
 */
const WORD_HUNT_SANSKRIT_ADJECTIVE_HISTORY = Object.freeze({
  storyId: TEST_STORY.storyId,
  earnedCoins: 0,
  earnedScore: 0,

  games: Object.freeze({
    Noun: null,
    Verb: null,

    Adjective: Object.freeze({
      bestTime: "1:00",
      totalScore: 0,
    }),
  }),
});

test.describe("Word Hunt", () => {
  test("landing exposes the selected story and real canvas controls", async ({
    page,
  }) => {
    const { platformCalls, wordHuntCalls } = await openWordHuntAsGuest(page);

    const state = await readWordHuntState(page);

    expect(state).toMatchObject({
      screen: "landing",

      stageSize: {
        width: 1280,
        height: 720,
      },

      language: WORD_HUNT_LANGUAGES.ENGLISH,

      selectedStoryId: TEST_STORY.storyId,

      activeStorySetId: "e2e-active-story-set",

      playerId: "e2e-user",
      playerName: "E2E Reader",
      isGuest: true,

      storyLoaded: false,

      gameQueue: [],
      currentGameIndex: 0,
      activeGameType: null,

      hasGameStarted: false,
      isStartingGame: false,
      isInputLocked: false,
    });

    /*
     * Game.start() retrieves the active Story Set before rendering the landing
     * screen. No Word Hunt passage or player-history request should occur until
     * the player presses Start Adventure.
     */
    expect(platformCalls.storySetActive).toBe(1);

    expect(wordHuntCalls.englishRequests).toHaveLength(0);

    expect(wordHuntCalls.sanskritRequests).toHaveLength(0);

    expect(wordHuntCalls.playerInfoRequests).toHaveLength(0);

    expect(wordHuntCalls.storyInfoRequests).toHaveLength(0);

    expect(wordHuntCalls.gameDataRequests).toHaveLength(0);

    const startAdventure = state.controlGeometry.startAdventure;

    expect(startAdventure).toMatchObject({
      id: "start-adventure",
      role: "landing-control",
      label: "Start Adventure",
      attachedToStage: true,
      visible: true,
      mouseEnabled: true,
      intersectsStage: true,
    });

    expect(startAdventure.width).toBeGreaterThan(0);

    expect(startAdventure.height).toBeGreaterThan(0);

    const languageToggle = state.controlGeometry.languageToggle;

    expect(languageToggle).toMatchObject({
      id: "language-toggle",
      role: "landing-control",
      label: WORD_HUNT_LANGUAGES.ENGLISH,
      attachedToStage: true,
      visible: true,
      mouseEnabled: true,
      intersectsStage: true,
    });

    expect(languageToggle.width).toBeGreaterThan(0);

    expect(languageToggle.height).toBeGreaterThan(0);
  });

  test("language toggle changes the landing selection through a real canvas click", async ({
    page,
  }) => {
    const { wordHuntCalls } = await openWordHuntAsGuest(page);

    const state = await setWordHuntLanguage(page, WORD_HUNT_LANGUAGES.SANSKRIT);

    expect(state).toMatchObject({
      screen: "landing",
      language: WORD_HUNT_LANGUAGES.SANSKRIT,
      storyLoaded: false,
      gameQueue: [],
    });

    expect(state.controlGeometry.languageToggle?.label).toBe(
      WORD_HUNT_LANGUAGES.SANSKRIT,
    );

    /*
     * Merely changing the landing selection must not retrieve either language.
     * The production request begins only after Start Adventure is pressed.
     */
    expect(wordHuntCalls.englishRequests).toHaveLength(0);

    expect(wordHuntCalls.sanskritRequests).toHaveLength(0);

    expect(wordHuntCalls.playerInfoRequests).toHaveLength(0);
  });

  test("English Start Adventure sends the selected story and builds the production queue", async ({
    page,
  }) => {
    const { wordHuntCalls } = await openEnglishWordHuntRound(page);

    const state = await readWordHuntState(page);

    expect(state).toMatchObject({
      screen: "gameplay",

      language: WORD_HUNT_LANGUAGES.ENGLISH,

      selectedStoryId: TEST_STORY.storyId,

      activeStorySetId: "e2e-active-story-set",

      storyLoaded: true,
      storyValueType: "string",

      gameQueue: EXPECTED_ENGLISH_QUEUE,

      currentGameIndex: 0,

      activeGameType: WORD_HUNT_GAME_TYPES.NOUN,

      wordTypes: EXPECTED_ENGLISH_WORD_TYPES,

      targetWords: EXPECTED_ENGLISH_WORD_TYPES.nouns,

      targetCount: EXPECTED_ENGLISH_WORD_TYPES.nouns.length,

      foundWords: [],
      foundCount: 0,

      roundScore: 0,
      allowedHints: 1,
      hintsUsed: 0,

      hasGameStarted: true,
      isStartingGame: false,
      isInputLocked: false,

      timerActive: true,
      roundGameOver: false,

      hasWinningMessage: false,
      hasTimeUpMessage: false,
    });

    /*
     * Four noun targets at five seconds per word produce a 20-second noun
     * round. gameTime is stored by production in minutes.
     */
    expect(state.gameTimeMinutes).toBeCloseTo(20 / 60, 8);

    /*
     * CURRENT PRODUCTION TAP CONTRACT:
     * A real canvas click may cause the current ZIM Start button to emit more than
     * one equivalent request. The game guards duplicate startup with its existing
     * isStartingGame lifecycle flag.
     *
     * Playwright therefore verifies that at least one request occurred and that
     * every emitted request used the selected Story Picker story. This test does
     * not alter or conceal the production request path.
     */
    expect(wordHuntCalls.englishRequests.length).toBeGreaterThanOrEqual(1);

    for (const request of wordHuntCalls.englishRequests) {
      expect(request).toMatchObject({
        method: "GET",
        storyId: TEST_STORY.storyId,
      });
    }

    expect(wordHuntCalls.sanskritRequests).toHaveLength(0);

    /*
     * Player information is retrieved by each completed startup request path.
     * Verify every observed query rather than assuming a browser-specific count.
     */
    expect(wordHuntCalls.playerInfoRequests.length).toBeGreaterThanOrEqual(1);

    for (const request of wordHuntCalls.playerInfoRequests) {
      expect(request).toMatchObject({
        method: "GET",
        gameId: "e2e-active-story-set",
        storyId: TEST_STORY.storyId,
        playerName: "E2E Reader",
      });
    }

    /*
     * English guest play does not satisfy the production Sanskrit persistence
     * condition, so neither write endpoint should have been called.
     */
    expect(wordHuntCalls.storyInfoRequests).toHaveLength(0);

    expect(wordHuntCalls.gameDataRequests).toHaveLength(0);
  });

  test("gameplay publishes live passage words and real Back, Hint, and Next controls", async ({
    page,
  }) => {
    await openEnglishWordHuntRound(page);

    const state = await readWordHuntState(page);

    const passageWindow = state.passageWindowGeometry;

    expect(passageWindow).toMatchObject({
      id: "passage-window",
      role: "passage-window",
      attachedToStage: true,
      visible: true,
      intersectsStage: true,
    });

    expect(passageWindow.width).toBeGreaterThan(0);

    expect(passageWindow.height).toBeGreaterThan(0);

    /*
     * The rendered passage contains:
     *
     * 14 visible words total
     * 4 nouns
     * 2 verbs
     * 4 adjectives
     * 4 non-POS words that production marks unclickable
     */
    expect(state.wordGeometry).toHaveLength(14);

    const safeWords = state.wordGeometry.filter(
      (word) => word.safeClickCandidate,
    );

    expect(safeWords).toHaveLength(10);

    const nounTargets = state.wordGeometry.filter(
      (word) => word.isTargetForActiveRound && word.safeClickCandidate,
    );

    expect(nounTargets.map((word) => word.normalizedText)).toEqual(
      EXPECTED_ENGLISH_WORD_TYPES.nouns,
    );

    for (const word of nounTargets) {
      expect(word).toMatchObject({
        category: "noun",
        isTargetForActiveRound: true,
        found: false,

        attachedToStage: true,
        visible: true,
        mouseEnabled: true,

        intersectsStage: true,

        visibleInPassageWindow: true,

        safeClickCandidate: true,
      });

      expect(word.width).toBeGreaterThan(0);

      expect(word.height).toBeGreaterThan(0);
    }

    const { back, hint, next } = state.controlGeometry;

    expect(back).toMatchObject({
      id: "back",
      role: "gameplay-control",
      attachedToStage: true,
      visible: true,
      mouseEnabled: true,
      intersectsStage: true,
    });

    expect(hint).toMatchObject({
      id: "hint",
      role: "gameplay-control",
      attachedToStage: true,
      visible: true,
      mouseEnabled: true,
      intersectsStage: true,
    });

    expect(next).toMatchObject({
      id: "next",
      role: "gameplay-control",
      attachedToStage: true,
      visible: true,
      mouseEnabled: true,
      intersectsStage: true,
    });
  });

  test("real noun click uses the production match and scoring path", async ({
    page,
  }) => {
    await openEnglishWordHuntRound(page);

    /*
     * clickWordHuntWord converts the published ZIM center point into browser
     * coordinates and performs a normal Playwright mouse click on the canvas.
     */
    await clickWordHuntWord(page, {
      normalizedText: "fox",
      category: "noun",

      isTargetForActiveRound: true,

      found: false,
    });

    await expect
      .poll(async () => (await readWordHuntState(page))?.foundWords)
      .toContain("fox");

    const state = await readWordHuntState(page);

    expect(state).toMatchObject({
      screen: "gameplay",

      activeGameType: WORD_HUNT_GAME_TYPES.NOUN,

      foundWords: ["fox"],
      foundCount: 1,

      roundScore: 10,

      targetCount: EXPECTED_ENGLISH_WORD_TYPES.nouns.length,

      roundGameOver: false,
      hasWinningMessage: false,
    });

    const foundFox = findWordHuntWord(state, {
      normalizedText: "fox",
      category: "noun",

      isTargetForActiveRound: true,

      found: true,
      safeOnly: false,
    });

    /*
     * The production callback marks the custom ZimLabel wrapper as disabled, while
     * the raw inner ZIM label currently remains mouse-enabled. Duplicate scoring is
     * independently blocked by the production foundWords guard.
     *
     * Assert the stable player-visible and gameplay outcomes without changing that
     * existing wrapper behaviour:
     *
     * - the noun is recorded as found;
     * - the noun is painted green;
     * - it is no longer an eligible unfound Playwright click candidate.
     */
    expect(foundFox).toMatchObject({
      normalizedText: "fox",
      category: "noun",

      found: true,
      color: "#00ff88",

      safeClickCandidate: false,
    });
  });

  test("real incorrect verb click preserves noun progress and uses production feedback", async ({
    page,
  }) => {
    await openEnglishWordHuntRound(page);

    const before = await readWordHuntState(page);

    const verb = findWordHuntWord(before, {
      normalizedText: "follows",

      category: "verb",

      isTargetForActiveRound: false,

      found: false,
    });

    expect(verb).toMatchObject({
      normalizedText: "follows",
      category: "verb",

      isTargetForActiveRound: false,

      found: false,
      safeClickCandidate: true,
    });

    await clickWordHuntWord(page, {
      normalizedText: "follows",
      category: "verb",

      isTargetForActiveRound: false,

      found: false,
    });

    await expect
      .poll(async () => {
        const current = await readWordHuntState(page);

        return current?.wordGeometry?.find(
          (word) => word.normalizedText === "follows",
        )?.color;
      })
      .toBe("red");

    const state = await readWordHuntState(page);

    /*
     * The noun round's existing incorrect-verb branch colors the clicked verb
     * red and emits feedback. It does not add the verb to foundWords and does
     * not award noun points.
     */
    expect(state).toMatchObject({
      screen: "gameplay",

      activeGameType: WORD_HUNT_GAME_TYPES.NOUN,

      foundWords: [],
      foundCount: 0,
      roundScore: 0,

      roundGameOver: false,
      hasWinningMessage: false,
    });

    const clickedVerb = findWordHuntWord(state, {
      normalizedText: "follows",

      category: "verb",

      isTargetForActiveRound: false,

      found: false,
      safeOnly: false,
    });

    expect(clickedVerb).toMatchObject({
      normalizedText: "follows",
      category: "verb",

      found: false,
      color: "red",

      mouseEnabled: true,
      safeClickCandidate: true,
    });
  });

  test("clicking an already-found noun cannot award duplicate progress or score", async ({
    page,
  }) => {
    await openEnglishWordHuntRound(page);

    await clickWordHuntWord(page, {
      normalizedText: "fox",
      category: "noun",

      isTargetForActiveRound: true,

      found: false,
    });

    await expect
      .poll(async () => {
        const state = await readWordHuntState(page);

        return {
          foundCount: state?.foundCount,

          roundScore: state?.roundScore,
        };
      })
      .toEqual({
        foundCount: 1,
        roundScore: 10,
      });

    const firstState = await readWordHuntState(page);

    /*
     * The current production wrapper leaves the underlying ZIM label clickable.
     * Use that real live geometry to verify the separate foundWords guard blocks
     * duplicate scoring.
     */
    const foundFox = findWordHuntWord(firstState, {
      normalizedText: "fox",
      category: "noun",
      found: true,
      safeOnly: false,
    });

    expect(foundFox).not.toBeNull();

    await clickWordHuntGeometry(page, foundFox);

    /*
     * Allow the normal ZIM tap callback and stage update to finish before reading
     * the final production state.
     */
    await page.waitForTimeout(200);

    const finalState = await readWordHuntState(page);

    expect(finalState).toMatchObject({
      screen: "gameplay",

      foundWords: ["fox"],
      foundCount: 1,
      roundScore: 10,

      roundGameOver: false,
      hasWinningMessage: false,
    });

    expect(finalState.foundWords.filter((word) => word === "fox")).toHaveLength(
      1,
    );
  });

  test("Hint highlights unfound noun targets and restores them after expiry", async ({
    page,
  }) => {
    await openEnglishWordHuntRound(page);

    await clickWordHuntControl(page, "hint");

    /*
     * The production Hint control opens for two seconds, increments its own
     * counter, and paints every unfound noun green.
     */
    await expect
      .poll(
        async () => {
          const state = await readWordHuntState(page);

          const nounColors = state?.wordGeometry
            ?.filter((word) => word.isTargetForActiveRound)
            .map((word) => word.color);

          return {
            hintsUsed: state?.hintsUsed,

            hintOpen: state?.hintOpen,

            nounColors,
          };
        },
        {
          timeout: 1_500,
        },
      )
      .toEqual({
        hintsUsed: 1,
        hintOpen: true,

        nounColors: ["green", "green", "green", "green"],
      });

    /*
     * Exercise the real two-second production auto-close timer rather than
     * invoking the expiry callback through test plumbing.
     */
    await expect
      .poll(async () => (await readWordHuntState(page))?.hintOpen, {
        timeout: 5_000,
      })
      .toBe(false);

    const expiredState = await readWordHuntState(page);

    expect(expiredState.hintsUsed).toBe(1);

    expect(
      expiredState.wordGeometry
        .filter((word) => word.isTargetForActiveRound)
        .map((word) => word.color),
    ).toEqual(["white", "white", "white", "white"]);

    expect(expiredState.foundWords).toEqual([]);

    expect(expiredState.roundScore).toBe(0);
  });

  test("completing every noun displays the real result controls", async ({
    page,
  }) => {
    const { wordHuntCalls } = await openEnglishWordHuntRound(page);

    const state = await completeEnglishNounRound(page);

    expect(state).toMatchObject({
      screen: "round-complete",

      activeGameType: WORD_HUNT_GAME_TYPES.NOUN,

      targetWords: EXPECTED_ENGLISH_WORD_TYPES.nouns,

      foundWords: EXPECTED_ENGLISH_WORD_TYPES.nouns,

      targetCount: 4,
      foundCount: 4,

      roundScore: 40,
      roundGameOver: true,

      hasGameStarted: false,
      isInputLocked: true,
      timerActive: false,

      hasWinningMessage: true,
      hasTimeUpMessage: false,
    });

    /*
     * The rendered result message must identify the production noun challenge.
     */
    expect(state.winningMessageText).toContain(WORD_HUNT_GAME_TYPES.NOUN);

    const continueControl = state.controlGeometry.continue;

    expect(continueControl).toMatchObject({
      id: "continue",
      role: "result-control",
      label: "Continue",

      attachedToStage: true,
      visible: true,
      mouseEnabled: true,
      intersectsStage: true,
    });

    expect(continueControl.width).toBeGreaterThan(0);

    expect(continueControl.height).toBeGreaterThan(0);

    const exitControl = state.controlGeometry.exit;

    expect(exitControl).toMatchObject({
      id: "exit",
      role: "result-control",
      label: "Exit",

      attachedToStage: true,
      visible: true,
      mouseEnabled: true,
      intersectsStage: true,
    });

    /*
     * Guest English play does not satisfy the production signed-in Sanskrit
     * persistence rule even after a perfect completion.
     */
    expect(wordHuntCalls.storyInfoRequests).toHaveLength(0);

    expect(wordHuntCalls.gameDataRequests).toHaveLength(0);
  });

  test("Continue advances from the completed noun result to live verb gameplay", async ({
    page,
  }) => {
    await openEnglishWordHuntRound(page);

    await completeEnglishNounRound(page);

    /*
     * Click the already-created production Continue control. Its existing
     * MessageBar callback removes the noun stage and starts the verb countdown.
     */
    await clickWordHuntControl(page, "continue");

    const state = await waitForWordHuntScreen(page, "gameplay", 15_000);

    expect(state).toMatchObject({
      screen: "gameplay",

      gameQueue: EXPECTED_ENGLISH_QUEUE,

      activeGameType: WORD_HUNT_GAME_TYPES.VERB,

      targetWords: EXPECTED_ENGLISH_WORD_TYPES.verbs,

      targetCount: 2,

      foundWords: [],
      foundCount: 0,
      roundScore: 0,

      roundGameOver: false,

      hasGameStarted: true,
      isStartingGame: false,
      isInputLocked: false,

      timerActive: true,

      hasWinningMessage: false,
      hasTimeUpMessage: false,
    });

    /*
     * The live bridge must now classify verbs—not nouns—as the active targets.
     */
    const liveVerbTargets = state.wordGeometry.filter(
      (word) => word.isTargetForActiveRound && word.safeClickCandidate,
    );

    expect(liveVerbTargets.map((word) => word.normalizedText)).toEqual(
      EXPECTED_ENGLISH_WORD_TYPES.verbs,
    );

    expect(state.controlGeometry.continue).toBeNull();

    expect(state.controlGeometry.hint).toMatchObject({
      id: "hint",
      attachedToStage: true,
      visible: true,
    });
  });

  test("Back returns from noun gameplay to the Word Hunt landing page", async ({
    page,
  }) => {
    const { wordHuntCalls } = await openEnglishWordHuntRound(page);

    const passageRequestCount = wordHuntCalls.englishRequests.length;

    /*
     * Use the already-created production Back control. Its existing callback
     * stops the timer, clears the canvas, and calls Game.start().
     */
    await clickWordHuntControl(page, "back");

    const state = await waitForWordHuntScreen(page, "landing", 10_000);

    expect(state).toMatchObject({
      screen: "landing",

      language: WORD_HUNT_LANGUAGES.ENGLISH,

      selectedStoryId: TEST_STORY.storyId,

      activeStorySetId: "e2e-active-story-set",

      hasGameStarted: false,
      isStartingGame: false,
      isInputLocked: false,

      timerActive: false,

      hasWinningMessage: false,
      hasTimeUpMessage: false,
    });

    expect(state.controlGeometry.startAdventure).toMatchObject({
      id: "start-adventure",
      attachedToStage: true,
      visible: true,
      mouseEnabled: true,
    });

    expect(state.controlGeometry.languageToggle).toMatchObject({
      id: "language-toggle",
      attachedToStage: true,
      visible: true,
      mouseEnabled: true,
    });

    /*
     * Returning to the menu must not retrieve the passage again. A new passage
     * request begins only after another Start Adventure click.
     */
    expect(wordHuntCalls.englishRequests).toHaveLength(passageRequestCount);
  });

  test("real timer expiry displays the production Restart and Exit controls", async ({
    page,
  }) => {
    const { wordHuntCalls } = await openEnglishWordHuntTimeoutRound(page);

    /*
     * The player-history contract should reduce this noun attempt to eight
     * seconds through the existing GameManager timing path.
     */
    const gameplayState = await readWordHuntState(page);

    expect(gameplayState.gameTimeMinutes).toBeCloseTo(8 / 60, 8);

    const state = await waitForCurrentWordHuntTimeout(page);

    expect(state).toMatchObject({
      screen: "time-up",

      activeGameType: WORD_HUNT_GAME_TYPES.NOUN,

      targetCount: 4,

      foundWords: [],
      foundCount: 0,
      roundScore: 0,

      roundGameOver: true,

      hasGameStarted: true,
      isInputLocked: true,

      timerActive: false,

      hasWinningMessage: false,
      hasTimeUpMessage: true,
    });

    expect(state.controlGeometry.restart).toMatchObject({
      id: "restart",
      role: "result-control",
      label: "Restart",

      attachedToStage: true,
      visible: true,
      mouseEnabled: true,
      intersectsStage: true,
    });

    expect(state.controlGeometry.exit).toMatchObject({
      id: "exit",
      role: "result-control",
      label: "Exit",

      attachedToStage: true,
      visible: true,
      mouseEnabled: true,
      intersectsStage: true,
    });

    expect(state.controlGeometry.continue).toBeNull();

    /*
     * No words were found, and this is guest English play. No persistence request
     * should be generated by the timeout callback.
     */
    expect(wordHuntCalls.gameDataRequests).toHaveLength(0);
  });

  test("Restart begins a clean noun attempt after timeout", async ({
    page,
  }) => {
    await openEnglishWordHuntTimeoutRound(page);

    await clickWordHuntWord(page, {
      normalizedText: "fox",
      category: "noun",

      isTargetForActiveRound: true,

      found: false,
    });

    await expect
      .poll(async () => {
        const state = await readWordHuntState(page);

        return state?.foundCount;
      })
      .toBe(1);

    await waitForCurrentWordHuntTimeout(page);

    /*
     * Click the real Restart control created by MessageBar. The existing callback
     * resets found words and score, clears the stage, and renders the noun game
     * again using the same production FindNounsGame instance.
     */
    await clickWordHuntControl(page, "restart");

    const state = await waitForWordHuntScreen(page, "gameplay", 8_000);

    expect(state).toMatchObject({
      screen: "gameplay",

      activeGameType: WORD_HUNT_GAME_TYPES.NOUN,

      targetWords: EXPECTED_ENGLISH_WORD_TYPES.nouns,

      targetCount: 4,

      foundWords: [],
      foundCount: 0,
      roundScore: 0,

      roundGameOver: false,

      hasGameStarted: true,
      isInputLocked: false,

      timerActive: true,

      hasWinningMessage: false,
      hasTimeUpMessage: false,
    });

    expect(state.controlGeometry.restart).toBeNull();

    expect(
      state.wordGeometry
        .filter(
          (word) => word.isTargetForActiveRound && word.safeClickCandidate,
        )
        .map((word) => word.normalizedText),
    ).toEqual(EXPECTED_ENGLISH_WORD_TYPES.nouns);
  });

  test("Exit from the timeout result returns to the landing page", async ({
    page,
  }) => {
    const { wordHuntCalls } = await openEnglishWordHuntTimeoutRound(page);

    const passageRequestCount = wordHuntCalls.englishRequests.length;

    await waitForCurrentWordHuntTimeout(page);

    /*
     * Exercise the production MessageBar Exit callback rather than the shared
     * React GameScene Back button.
     */
    await clickWordHuntControl(page, "exit");

    const state = await waitForWordHuntScreen(page, "landing", 10_000);

    expect(state).toMatchObject({
      screen: "landing",

      language: WORD_HUNT_LANGUAGES.ENGLISH,

      hasGameStarted: false,
      isStartingGame: false,
      isInputLocked: false,

      timerActive: false,

      hasWinningMessage: false,
      hasTimeUpMessage: false,
    });

    expect(state.controlGeometry.startAdventure).toMatchObject({
      attachedToStage: true,
      visible: true,
      mouseEnabled: true,
    });

    /*
     * MessageBar retains references to the old timeout controls after Exit, but
     * their containing result panel has been removed from the production stage.
     *
     * The important lifecycle contract is that they are detached and therefore no
     * longer visible or clickable as part of the active landing screen.
     */
    expect(state.controlGeometry.restart).toMatchObject({
      id: "restart",
      role: "result-control",
      attachedToStage: false,
    });

    expect(state.controlGeometry.exit).toMatchObject({
      id: "exit",
      role: "result-control",
      attachedToStage: false,
    });

    expect(wordHuntCalls.englishRequests).toHaveLength(passageRequestCount);
  });

  test("signed-in Sanskrit play writes story metadata and completed noun data", async ({
    page,
  }) => {
    const { wordHuntCalls } = await openWordHuntAsSignedIn(page, {
      language: WORD_HUNT_LANGUAGES.SANSKRIT,

      startAdventure: true,
    });

    const gameplayState = await readWordHuntState(page);

    expect(gameplayState).toMatchObject({
      screen: "gameplay",

      language: WORD_HUNT_LANGUAGES.SANSKRIT,

      selectedStoryId: TEST_STORY.storyId,

      activeStorySetId: "e2e-active-story-set",

      playerId: WORD_HUNT_SIGNED_IN_USER.id,

      playerName: WORD_HUNT_SIGNED_IN_USER.name,

      isGuest: false,

      storyLoaded: true,
      storyValueType: "array",

      gameQueue: EXPECTED_SANSKRIT_QUEUE,

      activeGameType: WORD_HUNT_GAME_TYPES.NOUN,

      wordTypes: EXPECTED_SANSKRIT_WORD_TYPES,

      targetWords: EXPECTED_SANSKRIT_WORD_TYPES.nouns,

      targetCount: 3,

      foundWords: [],
      foundCount: 0,
      roundScore: 0,

      timerActive: true,
    });

    /*
     * Three noun targets at five seconds each produce a 15-second production
     * timer. gameTime is stored in minutes.
     */
    expect(gameplayState.gameTimeMinutes).toBeCloseTo(15 / 60, 8);

    expect(wordHuntCalls.sanskritRequests.length).toBeGreaterThanOrEqual(1);

    for (const request of wordHuntCalls.sanskritRequests) {
      expect(request).toMatchObject({
        method: "GET",
        storyId: TEST_STORY.storyId,
      });
    }

    expect(wordHuntCalls.englishRequests).toHaveLength(0);

    /*
     * Current canvas Start behavior may emit equivalent duplicate request paths.
     * Every resulting StoryInfo body must nevertheless contain the exact selected
     * Story Set, story, POS counts, and hint allocations.
     */
    expect(wordHuntCalls.storyInfoRequests.length).toBeGreaterThanOrEqual(1);

    for (const request of wordHuntCalls.storyInfoRequests) {
      expect(request).toMatchObject({
        method: "POST",

        body: {
          gameId: "e2e-active-story-set",

          storyId: TEST_STORY.storyId,

          nounGameWords: 3,
          nounGameHints: 1,

          verbGameWords: 2,
          verbGameHints: 1,

          adjGameWords: 2,
          adjGameHints: 1,
        },
      });
    }

    expect(wordHuntCalls.gameDataRequests).toHaveLength(0);

    const resultState = await completeCurrentWordHuntRound(page);

    expect(resultState).toMatchObject({
      screen: "round-complete",

      activeGameType: WORD_HUNT_GAME_TYPES.NOUN,

      targetWords: EXPECTED_SANSKRIT_WORD_TYPES.nouns,

      foundWords: EXPECTED_SANSKRIT_WORD_TYPES.nouns,

      targetCount: 3,
      foundCount: 3,

      roundScore: 30,
      roundGameOver: true,

      timerActive: false,
      hasWinningMessage: true,
    });

    /*
     * checkWin() displays the result before awaiting persistence, so poll the
     * intercepted endpoint independently.
     */
    await expect
      .poll(() => wordHuntCalls.gameDataRequests.length, {
        timeout: 8_000,
      })
      .toBeGreaterThanOrEqual(1);

    for (const request of wordHuntCalls.gameDataRequests) {
      expect(request.method).toBe("POST");

      expect(request.body).toMatchObject({
        gameId: "e2e-active-story-set",

        storyId: TEST_STORY.storyId,

        playerId: WORD_HUNT_SIGNED_IN_USER.id,

        playerName: WORD_HUNT_SIGNED_IN_USER.name,

        hintsUsed: 0,
        foundWords: 3,

        gameInstance: WORD_HUNT_GAME_TYPES.NOUN,
      });

      expect(request.body.bestTime).toMatch(/^\d+:\d{2}$/);

      expect(typeof request.body.totalScore).toBe("number");

      expect(request.body.totalScore).toBeGreaterThan(0);

      expect(typeof request.body.coins).toBe("number");

      expect(request.body.coins).toBeGreaterThanOrEqual(0);
    }
  });

  test("shared GameScene Back unmounts Word Hunt and removes its E2E globals", async ({
    page,
  }) => {
    await openEnglishWordHuntRound(page);

    await expect(
      page.evaluate(() => typeof window.__wordHuntZimTestHooks),
    ).resolves.toBe("object");

    await expect(
      page.evaluate(() => typeof window.__wordHuntZimDebug),
    ).resolves.toBe("object");

    /*
     * Use the shared React GameScene Back button rather than Word Hunt's internal
     * canvas Back control. This unmounts the complete ZIM game component.
     */
    await returnToLauncherFromScene(page, WORD_HUNT_GAME_ID);

    await expect
      .poll(() =>
        page.evaluate(() => ({
          hooks: typeof window.__wordHuntZimTestHooks,

          debug: typeof window.__wordHuntZimDebug,
        })),
      )
      .toEqual({
        hooks: "undefined",
        debug: "undefined",
      });

    /*
     * The shared scene should also remove the Word Hunt holder and its canvas,
     * not merely hide them behind the launcher.
     */
    await expect(page.getByTestId(WORD_HUNT_ZIM_TEST_ID)).toHaveCount(0);

    await expect(page.getByTestId("launcher-page")).toBeVisible();
  });

  test("Next skips the noun round and starts unlocked verb gameplay", async ({
    page,
  }) => {
    const { wordHuntCalls } = await openEnglishWordHuntRound(page);

    const passageRequestCount = wordHuntCalls.englishRequests.length;

    const playerRequestCount = wordHuntCalls.playerInfoRequests.length;

    /*
     * Click the existing production Next canvas control. The noun callback calls
     * Game.nextGame(), which should skip the unfinished noun challenge and start
     * the next queued challenge.
     */
    await clickWordHuntControl(page, "next");

    const state = await waitForWordHuntScreen(page, "gameplay", 15_000);

    expect(state).toMatchObject({
      screen: "gameplay",

      gameQueue: EXPECTED_ENGLISH_QUEUE,

      currentGameIndex: 1,

      activeGameType: WORD_HUNT_GAME_TYPES.VERB,

      targetWords: EXPECTED_ENGLISH_WORD_TYPES.verbs,

      targetCount: 2,

      foundWords: [],
      foundCount: 0,
      roundScore: 0,

      roundGameOver: false,

      hasGameStarted: true,
      isStartingGame: false,

      /*
       * This is the important lifecycle assertion. A skipped noun challenge must
       * not leave the newly displayed verb challenge input-locked.
       */
      isInputLocked: false,

      timerActive: true,

      hasWinningMessage: false,
      hasTimeUpMessage: false,
    });

    /*
     * Skipping challenges reuses the already-loaded passage and player data.
     */
    expect(wordHuntCalls.englishRequests).toHaveLength(passageRequestCount);

    expect(wordHuntCalls.playerInfoRequests).toHaveLength(playerRequestCount);

    const liveTargets = state.wordGeometry.filter(
      (word) => word.isTargetForActiveRound && word.safeClickCandidate,
    );

    expect(liveTargets.map((word) => word.normalizedText)).toEqual(
      EXPECTED_ENGLISH_WORD_TYPES.verbs,
    );

    /*
     * Prove that the new challenge is not merely visible: perform a real browser
     * click on a verb and require the production verb scoring path to accept it.
     */
    await clickWordHuntWord(page, {
      normalizedText: "follows",
      category: "verb",

      isTargetForActiveRound: true,

      found: false,
    });

    await expect
      .poll(async () => {
        const current = await readWordHuntState(page);

        return {
          foundWords: current?.foundWords,

          foundCount: current?.foundCount,

          roundScore: current?.roundScore,
        };
      })
      .toEqual({
        foundWords: ["follows"],
        foundCount: 1,
        roundScore: 10,
      });
  });

  test("completing every verb displays its result and Continue starts adjective gameplay", async ({
    page,
  }) => {
    await openEnglishVerbRound(page);

    for (const verb of EXPECTED_ENGLISH_WORD_TYPES.verbs) {
      await clickWordHuntWord(page, {
        normalizedText: verb,
        category: "verb",

        isTargetForActiveRound: true,

        found: false,
      });

      await expect
        .poll(async () => {
          const state = await readWordHuntState(page);

          return state?.foundWords?.includes(verb) ?? false;
        })
        .toBe(true);
    }

    const resultState = await waitForWordHuntScreen(
      page,
      "round-complete",
      8_000,
    );

    expect(resultState).toMatchObject({
      screen: "round-complete",

      activeGameType: WORD_HUNT_GAME_TYPES.VERB,

      targetWords: EXPECTED_ENGLISH_WORD_TYPES.verbs,

      foundWords: EXPECTED_ENGLISH_WORD_TYPES.verbs,

      targetCount: 2,
      foundCount: 2,

      roundScore: 20,
      roundGameOver: true,

      hasGameStarted: false,
      isInputLocked: true,
      timerActive: false,

      hasWinningMessage: true,
      hasTimeUpMessage: false,
    });

    expect(resultState.controlGeometry.continue).toMatchObject({
      id: "continue",
      role: "result-control",
      label: "Continue",

      attachedToStage: true,
      visible: true,
      mouseEnabled: true,
    });

    /*
     * The rendered result message must identify the production verb challenge.
     */
    expect(resultState.winningMessageText).toContain(WORD_HUNT_GAME_TYPES.VERB);

    await clickWordHuntControl(page, "continue");

    const adjectiveState = await waitForWordHuntScreen(
      page,
      "gameplay",
      15_000,
    );

    expect(adjectiveState).toMatchObject({
      screen: "gameplay",

      activeGameType: WORD_HUNT_GAME_TYPES.ADJECTIVE,

      targetWords: EXPECTED_ENGLISH_WORD_TYPES.adjectives,

      targetCount: 4,

      foundWords: [],
      foundCount: 0,
      roundScore: 0,

      hasGameStarted: true,
      isStartingGame: false,
      isInputLocked: false,

      timerActive: true,
      roundGameOver: false,

      hasWinningMessage: false,
      hasTimeUpMessage: false,
    });

    expect(
      adjectiveState.wordGeometry
        .filter(
          (word) => word.isTargetForActiveRound && word.safeClickCandidate,
        )
        .map((word) => word.normalizedText),
    ).toEqual(EXPECTED_ENGLISH_WORD_TYPES.adjectives);
  });

  test("verb Hint restores input after its production expiry", async ({
    page,
  }) => {
    await openEnglishVerbRound(page);

    await clickWordHuntControl(page, "hint");

    await expect
      .poll(
        async () => {
          const state = await readWordHuntState(page);

          return {
            hintsUsed: state?.hintsUsed,

            hintOpen: state?.hintOpen,

            isInputLocked: state?.isInputLocked,

            verbColors: state?.wordGeometry
              ?.filter((word) => word.isTargetForActiveRound)
              .map((word) => word.color),
          };
        },
        {
          timeout: 1_500,
        },
      )
      .toEqual({
        hintsUsed: 1,
        hintOpen: true,
        isInputLocked: true,

        verbColors: ["green", "green"],
      });

    /*
     * The visual Hint expires after two seconds. At that point gameplay should
     * become usable again rather than leaving the verb challenge permanently
     * locked.
     */
    await expect
      .poll(
        async () => {
          const state = await readWordHuntState(page);

          return {
            hintOpen: state?.hintOpen,

            isInputLocked: state?.isInputLocked,
          };
        },
        {
          timeout: 5_000,
        },
      )
      .toEqual({
        hintOpen: false,
        isInputLocked: false,
      });

    await clickWordHuntWord(page, {
      normalizedText: "follows",
      category: "verb",

      isTargetForActiveRound: true,

      found: false,
    });

    await expect
      .poll(async () => {
        const state = await readWordHuntState(page);

        return {
          foundWords: state?.foundWords,

          foundCount: state?.foundCount,

          roundScore: state?.roundScore,
        };
      })
      .toEqual({
        foundWords: ["follows"],
        foundCount: 1,
        roundScore: 9.75,
      });
  });

  test("a correct adjective awards the documented base score", async ({
    page,
  }) => {
    await openEnglishAdjectiveRound(page);

    await clickWordHuntWord(page, {
      normalizedText: "curious",
      category: "adjective",

      isTargetForActiveRound: true,

      found: false,
    });

    await expect
      .poll(async () => {
        const state = await readWordHuntState(page);

        return {
          foundWords: state?.foundWords,

          foundCount: state?.foundCount,

          roundScore: state?.roundScore,
        };
      })
      .toEqual({
        foundWords: ["curious"],
        foundCount: 1,

        /*
         * Word Hunt documents ten base points for every correct word.
         */
        roundScore: 10,
      });

    const state = await readWordHuntState(page);

    const curious = findWordHuntWord(state, {
      normalizedText: "curious",
      category: "adjective",

      found: true,
      safeOnly: false,
    });

    expect(curious).toMatchObject({
      normalizedText: "curious",
      category: "adjective",

      found: true,
      color: "#00ff88",

      safeClickCandidate: false,
    });
  });

  test("incorrect verb selection during adjective gameplay shows orange feedback without a runtime error", async ({
    page,
  }) => {
    const runtimeErrors = [];

    page.on("pageerror", (error) => {
      runtimeErrors.push(error.message);
    });

    await openEnglishAdjectiveRound(page);

    await clickWordHuntWord(page, {
      normalizedText: "follows",
      category: "verb",

      isTargetForActiveRound: false,

      found: false,
    });

    /*
     * Give the normal ZIM tap callback and browser page-error event time to run.
     */
    await page.waitForTimeout(250);

    expect(
      runtimeErrors.filter((message) =>
        message.toLowerCase().includes("setcolor"),
      ),
    ).toEqual([]);

    const state = await readWordHuntState(page);

    expect(state).toMatchObject({
      screen: "gameplay",

      activeGameType: WORD_HUNT_GAME_TYPES.ADJECTIVE,

      foundWords: [],
      foundCount: 0,
      roundScore: 0,

      roundGameOver: false,
      hasWinningMessage: false,
    });

    const clickedVerb = findWordHuntWord(state, {
      normalizedText: "follows",
      category: "verb",

      isTargetForActiveRound: false,

      found: false,
      safeOnly: false,
    });

    expect(clickedVerb).toMatchObject({
      normalizedText: "follows",
      category: "verb",

      found: false,
      color: "orange",

      safeClickCandidate: true,
    });
  });

  test("completing every adjective displays its result and Continue starts usable noun gameplay", async ({
    page,
  }) => {
    await openEnglishAdjectiveRound(page);

    const resultState = await completeCurrentWordHuntRound(page);

    expect(resultState).toMatchObject({
      screen: "round-complete",

      activeGameType: WORD_HUNT_GAME_TYPES.ADJECTIVE,

      targetWords: EXPECTED_ENGLISH_WORD_TYPES.adjectives,

      foundWords: EXPECTED_ENGLISH_WORD_TYPES.adjectives,

      targetCount: 4,
      foundCount: 4,

      roundScore: 40,
      roundGameOver: true,

      hasGameStarted: false,
      isInputLocked: true,
      timerActive: false,

      hasWinningMessage: true,
      hasTimeUpMessage: false,
    });

    expect(resultState.controlGeometry.continue).toMatchObject({
      id: "continue",
      role: "result-control",
      label: "Continue",

      attachedToStage: true,
      visible: true,
      mouseEnabled: true,
    });

    /*
     * Diagnostic contract:
     * A completed adjective challenge must be described as Adjective—not Noun—in
     * the real player-visible result message.
     */
    expect(resultState.winningMessageText).toContain(
      WORD_HUNT_GAME_TYPES.ADJECTIVE,
    );

    expect(resultState.winningMessageText).not.toContain(
      WORD_HUNT_GAME_TYPES.NOUN,
    );

    /*
     * Adjective Continue is intended to cycle the complete activity back to the
     * noun challenge.
     */
    await clickWordHuntControl(page, "continue");

    const nounState = await waitForWordHuntScreen(page, "gameplay", 15_000);

    expect(nounState).toMatchObject({
      screen: "gameplay",

      activeGameType: WORD_HUNT_GAME_TYPES.NOUN,

      targetWords: EXPECTED_ENGLISH_WORD_TYPES.nouns,

      targetCount: 4,

      foundWords: [],
      foundCount: 0,
      roundScore: 0,

      roundGameOver: false,

      hasGameStarted: true,
      isStartingGame: false,

      /*
       * A new noun round must be interactive after leaving the adjective result.
       */
      isInputLocked: false,

      timerActive: true,

      hasWinningMessage: false,
      hasTimeUpMessage: false,
    });

    /*
     * Prove the returned noun screen is usable rather than merely rendered.
     */
    await clickWordHuntWord(page, {
      normalizedText: "fox",
      category: "noun",

      isTargetForActiveRound: true,

      found: false,
    });

    await expect
      .poll(async () => {
        const state = await readWordHuntState(page);

        return {
          foundWords: state?.foundWords,

          roundScore: state?.roundScore,
        };
      })
      .toEqual({
        foundWords: ["fox"],
        roundScore: 10,
      });
  });

  test("adjective Hint restores input after its production expiry", async ({
    page,
  }) => {
    await openEnglishAdjectiveRound(page);

    await clickWordHuntControl(page, "hint");

    await expect
      .poll(
        async () => {
          const state = await readWordHuntState(page);

          return {
            hintsUsed: state?.hintsUsed,

            hintOpen: state?.hintOpen,

            isInputLocked: state?.isInputLocked,

            adjectiveColors: state?.wordGeometry
              ?.filter((word) => word.isTargetForActiveRound)
              .map((word) => word.color),
          };
        },
        {
          timeout: 1_500,
        },
      )
      .toEqual({
        hintsUsed: 1,
        hintOpen: true,
        isInputLocked: true,

        adjectiveColors: ["green", "green", "green", "green"],
      });

    await expect
      .poll(
        async () => {
          const state = await readWordHuntState(page);

          return {
            hintOpen: state?.hintOpen,

            isInputLocked: state?.isInputLocked,
          };
        },
        {
          timeout: 5_000,
        },
      )
      .toEqual({
        hintOpen: false,
        isInputLocked: false,
      });

    await clickWordHuntWord(page, {
      normalizedText: "curious",
      category: "adjective",

      isTargetForActiveRound: true,

      found: false,
    });

    await expect
      .poll(async () => {
        const state = await readWordHuntState(page);

        return {
          foundWords: state?.foundWords,

          foundCount: state?.foundCount,

          roundScore: state?.roundScore,
        };
      })
      .toEqual({
        foundWords: ["curious"],
        foundCount: 1,
        roundScore: 9.75,
      });
  });

  test("signed-in Sanskrit adjective completion writes complete score and hint metadata", async ({
    page,
  }) => {
    const { wordHuntCalls } = await openSignedInSanskritAdjectiveRound(page);

    expect(wordHuntCalls.gameDataRequests).toHaveLength(0);

    const resultState = await completeCurrentWordHuntRound(page);

    expect(resultState).toMatchObject({
      screen: "round-complete",

      language: WORD_HUNT_LANGUAGES.SANSKRIT,

      activeGameType: WORD_HUNT_GAME_TYPES.ADJECTIVE,

      targetWords: EXPECTED_SANSKRIT_WORD_TYPES.adjectives,

      foundWords: EXPECTED_SANSKRIT_WORD_TYPES.adjectives,

      targetCount: 2,
      foundCount: 2,

      roundScore: 20,
      roundGameOver: true,

      timerActive: false,
      hasWinningMessage: true,
    });

    /*
     * The result is displayed before the asynchronous persistence call finishes.
     */
    await expect
      .poll(() => wordHuntCalls.gameDataRequests.length, {
        timeout: 8_000,
      })
      .toBeGreaterThanOrEqual(1);

    for (const request of wordHuntCalls.gameDataRequests) {
      expect(request.method).toBe("POST");

      expect(request.body).toMatchObject({
        gameId: "e2e-active-story-set",

        storyId: TEST_STORY.storyId,

        playerId: WORD_HUNT_SIGNED_IN_USER.id,

        playerName: WORD_HUNT_SIGNED_IN_USER.name,

        /*
         * GameInfo must retain an explicit zero rather than omitting the field.
         */
        hintsUsed: 0,

        foundWords: 2,

        gameInstance: WORD_HUNT_GAME_TYPES.ADJECTIVE,

        /*
         * Two correct adjectives produce 20 base points. With the one-minute
         * fixture and a fast no-hint completion, the production elite multiplier
         * should produce 200 total points and 20 coins.
         */
        totalScore: 200,
        coins: 20,
      });

      expect(request.body.bestTime).toMatch(/^\d+:\d{2}$/);
    }
  });
});
