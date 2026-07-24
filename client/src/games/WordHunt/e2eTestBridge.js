/*
 * WORD HUNT PLAYWRIGHT BRIDGE
 * ===========================
 *
 * Word Hunt renders its player-facing experience inside ZIMJS canvas. Canvas
 * objects do not appear as normal DOM controls, so Playwright cannot inspect
 * landing controls, passage words, score, hints, timer, or result messages
 * through ordinary locators.
 *
 * This module provides development/E2E-only OBSERVABILITY.
 *
 * Safety rules:
 *
 * 1. It reads the existing Word Hunt objects.
 * 2. It returns copied values where practical.
 * 3. It does not calculate gameplay results.
 * 4. It does not select words or dispatch game actions.
 * 5. It does not change scoring, hints, timing, progression, or persistence.
 * 6. It is unavailable outside development or an explicitly enabled E2E run.
 * 7. Its globals are removed when the React GameScene unmounts.
 *
 * Player-facing production behavior remains owned by the existing Word Hunt
 * classes. This file is test plumbing only.
 */

export function shouldExposeWordHuntE2E() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    import.meta.env.DEV ||
    import.meta.env.VITE_E2E === "true" ||
    window.localStorage?.getItem("wordHuntE2E") === "1"
  );
}

/*
 * Return a shallow copy of a list.
 *
 * Primitive values are copied directly. Plain object entries are copied so a
 * browser test cannot accidentally mutate the live token or passage objects.
 */
function copyList(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => {
    if (item && typeof item === "object") {
      return { ...item };
    }

    return item;
  });
}

function toFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

/*
 * Return every production subgame instance currently known by the parent Game.
 *
 * The array is kept in gameplay order. No instance is created by this bridge.
 */
function getSubgameCandidates(game) {
  return [
    {
      type: game.nounGameKey,
      instance: game.findNounsGame,
    },
    {
      type: game.verbGameKey,
      instance: game.findVerbGame,
    },
    {
      type: game.adjGameKey,
      instance: game.findAdjectiveGame,
    },
  ];
}

/*
 * Determine whether an existing subgame still owns live stage content.
 *
 * Word Hunt's result Continue callbacks start the next subgame directly. They
 * do not update currentGameIndex. Consequently, the queue index alone may refer
 * to the previous challenge even though the player is visibly playing the next
 * one.
 *
 * This check observes existing display objects and timer state only. It does
 * not advance the queue, create a game, or change any production flag.
 */
function isLiveSubgame(game, instance) {
  if (!instance) {
    return false;
  }

  return Boolean(
    instance.timer?.isActive ||
    isAttachedToStage(instance.blackboard, game.stage) ||
    isAttachedToStage(instance.passageDisplay?.scrollWindow, game.stage) ||
    isAttachedToStage(instance.messageBar?.winningContainer, game.stage) ||
    isAttachedToStage(instance.messageBar?.timeOverContainer, game.stage),
  );
}

/*
 * Resolve the latest subgame that is actually attached to the production stage.
 *
 * Candidates are inspected in reverse order so a later challenge takes
 * precedence if stale references from an earlier challenge still exist.
 */
function getLiveSubgame(game) {
  const candidates = getSubgameCandidates(game);

  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    const candidate = candidates[index];

    if (isLiveSubgame(game, candidate.instance)) {
      return candidate;
    }
  }

  return null;
}

/*
 * Prefer the visible production subgame. During initial startup or countdown,
 * fall back to the authoritative queue entry.
 */
function getActiveGameType(game) {
  const liveSubgame = getLiveSubgame(game);

  return liveSubgame?.type || game.gameQueue?.[game.currentGameIndex] || null;
}

/*
 * Return the live production subgame instance where possible.
 *
 * The queue fallback preserves the existing countdown and initial-round state
 * before a Find*Game instance has been constructed.
 */
function getActiveGame(game) {
  const liveSubgame = getLiveSubgame(game);

  if (liveSubgame) {
    return liveSubgame.instance;
  }

  switch (getActiveGameType(game)) {
    case game.nounGameKey:
      return game.findNounsGame;

    case game.verbGameKey:
      return game.findVerbGame;

    case game.adjGameKey:
      return game.findAdjectiveGame;

    default:
      return null;
  }
}

/*
 * Derive a readable screen name exclusively from existing production objects.
 *
 * No new screen-state variable is introduced. The order matters:
 *
 * - result messages take priority over gameplay flags;
 * - countdown is identified by isStartingGame;
 * - loading is identified by the disabled landing button;
 * - the landing page is identified by its live container.
 */
function getScreen(game, activeGame) {
  /*
   * Result wrappers remain referenced after their containing stage children have
   * been removed. Treat them as visible results only while they are still
   * attached to the current production stage.
   */
  if (isAttachedToStage(activeGame?.messageBar?.winningContainer, game.stage)) {
    return "round-complete";
  }

  if (
    isAttachedToStage(activeGame?.messageBar?.timeOverContainer, game.stage)
  ) {
    return "time-up";
  }

  if (game.hasGameStarted && activeGame) {
    return "gameplay";
  }

  if (game.isStartingGame) {
    return "countdown";
  }

  if (
    game.landingPage?.container &&
    game.landingPage?.button?.mouseEnabled === false
  ) {
    return "loading";
  }

  if (game.landingPage?.container) {
    return "landing";
  }

  return "initializing";
}

/*
 * Select the authoritative target list for the currently queued challenge.
 */
function getTargetWords(game, activeGameType, activeGame) {
  if (activeGameType === game.nounGameKey) {
    return activeGame?.nouns || [];
  }

  if (activeGameType === game.verbGameKey) {
    return activeGame?.verbs || [];
  }

  if (activeGameType === game.adjGameKey) {
    return activeGame?.adjectives || [];
  }

  return [];
}

/*
 * Identify the POS category from the production wordTypes lists.
 *
 * This does not decide whether the click is correct. The active Find*Game class
 * remains responsible for that. The category is published only so tests can
 * select a known noun, verb, or adjective from the live passage geometry.
 */
function getWordCategory(game, normalizedText) {
  if (game.wordTypes?.nouns?.includes(normalizedText)) {
    return "noun";
  }

  if (game.wordTypes?.verbs?.includes(normalizedText)) {
    return "verb";
  }

  if (game.wordTypes?.adjectives?.includes(normalizedText)) {
    return "adjective";
  }

  return null;
}

function getActiveCategory(game, activeGameType) {
  if (activeGameType === game.nounGameKey) {
    return "noun";
  }

  if (activeGameType === game.verbGameKey) {
    return "verb";
  }

  if (activeGameType === game.adjGameKey) {
    return "adjective";
  }

  return null;
}

/*
 * Confirm that a ZIM/CreateJS display object is still attached to the active
 * stage. Objects may keep a parent reference after a containing screen has been
 * removed, so walking to the stage is more reliable than checking parent alone.
 */
function isAttachedToStage(displayObject, stage) {
  let current = displayObject;

  while (current) {
    if (current === stage) {
      return true;
    }

    current = current.parent || null;
  }

  return false;
}

/*
 * Read the local bounds of an existing display object.
 *
 * ZIM buttons and containers generally expose width/height directly, while
 * labels may expose getBounds(). Fallback dimensions are used only for known
 * controls whose production constructors already define fixed dimensions.
 */
function readLocalBounds(displayObject, fallbackWidth = 0, fallbackHeight = 0) {
  let bounds = null;

  try {
    bounds = displayObject?.getBounds?.() || null;
  } catch {
    bounds = null;
  }

  const x = toFiniteNumber(bounds?.x, 0);
  const y = toFiniteNumber(bounds?.y, 0);

  const width = toFiniteNumber(
    bounds?.width,
    toFiniteNumber(displayObject?.width, fallbackWidth),
  );

  const height = toFiniteNumber(
    bounds?.height,
    toFiniteNumber(displayObject?.height, fallbackHeight),
  );

  return {
    x,
    y,
    width,
    height,
  };
}

function readGlobalPoint(displayObject, x, y) {
  try {
    const point = displayObject?.localToGlobal?.(x, y);

    if (!point) {
      return null;
    }

    return {
      x: toFiniteNumber(point.x),
      y: toFiniteNumber(point.y),
    };
  } catch {
    return null;
  }
}

function rectanglesIntersect(first, second) {
  if (!first || !second) {
    return false;
  }

  return !(
    first.x + first.width <= second.x ||
    second.x + second.width <= first.x ||
    first.y + first.height <= second.y ||
    second.y + second.height <= first.y
  );
}

/*
 * Convert an existing ZIM/CreateJS object into stage-space geometry.
 *
 * All four local corners are converted so nested containers, current scroll
 * position, and normal scaling are reflected in the published bounds. This
 * function does not move, resize, enable, disable, or dispatch the object.
 */
function buildDisplayGeometry(
  game,
  displayObject,
  { id, role, label = null, fallbackWidth = 0, fallbackHeight = 0 },
) {
  if (!displayObject) {
    return null;
  }

  const localBounds = readLocalBounds(
    displayObject,
    fallbackWidth,
    fallbackHeight,
  );

  if (localBounds.width <= 0 || localBounds.height <= 0) {
    return null;
  }

  const corners = [
    readGlobalPoint(displayObject, localBounds.x, localBounds.y),
    readGlobalPoint(
      displayObject,
      localBounds.x + localBounds.width,
      localBounds.y,
    ),
    readGlobalPoint(
      displayObject,
      localBounds.x,
      localBounds.y + localBounds.height,
    ),
    readGlobalPoint(
      displayObject,
      localBounds.x + localBounds.width,
      localBounds.y + localBounds.height,
    ),
  ];

  if (corners.some((corner) => corner == null)) {
    return null;
  }

  const xs = corners.map((corner) => corner.x);
  const ys = corners.map((corner) => corner.y);

  const x = Math.min(...xs);
  const y = Math.min(...ys);
  const width = Math.max(...xs) - x;
  const height = Math.max(...ys) - y;

  const geometry = {
    id,
    role,
    label,
    x,
    y,
    width,
    height,
    centerX: x + width / 2,
    centerY: y + height / 2,
    alpha: toFiniteNumber(displayObject.alpha, 1),
    visible: displayObject.visible !== false,
    mouseEnabled: displayObject.mouseEnabled !== false,
    cursor: displayObject.cursor || null,
    attachedToStage: isAttachedToStage(displayObject, game.stage),
  };

  geometry.intersectsStage = rectanglesIntersect(geometry, {
    x: 0,
    y: 0,
    width: game.width,
    height: game.height,
  });

  return geometry;
}

/*
 * Read the current text from a raw ZIM Button or from the label child inside a
 * custom ZimButton container. This is display inspection only.
 */
function readDisplayLabel(displayObject, fallback = null) {
  if (typeof displayObject?.label?.text === "string") {
    return displayObject.label.text;
  }

  const childCount = toFiniteNumber(displayObject?.numChildren, 0);

  for (let index = 0; index < childCount; index += 1) {
    const child = displayObject.getChildAt?.(index);

    if (typeof child?.text === "string") {
      return child.text;
    }
  }

  return fallback;
}

/*
 * Publish the existing landing, gameplay, and result controls.
 *
 * Result buttons are read from each ZimButton wrapper's already-created
 * container. createButton() is never called here, so the bridge cannot create a
 * replacement control or attach a duplicate callback.
 */
function buildControlGeometry(game, activeGame) {
  const controlPanel = activeGame?.controlPanel;
  const messageBar = activeGame?.messageBar;

  const startAdventure = game.landingPage?.button || null;

  const languageToggle = game.landingPage?.toggleButton || null;

  const hint = controlPanel?.hintButton || null;

  const back = controlPanel?.backButton || null;

  const next = controlPanel?.nextButton || null;

  const continueButton = messageBar?.continueButton?.container || null;

  const restartButton = messageBar?.restartButton?.container || null;

  const exitButton = messageBar?.exitButton?.container || null;

  return {
    startAdventure: buildDisplayGeometry(game, startAdventure, {
      id: "start-adventure",
      role: "landing-control",
      label: readDisplayLabel(startAdventure, "Start Adventure"),
      fallbackWidth: 340,
      fallbackHeight: 90,
    }),

    languageToggle: buildDisplayGeometry(game, languageToggle, {
      id: "language-toggle",
      role: "landing-control",
      label:
        game.landingPage?.toggleButtonLabelRef?.label?.text ||
        readDisplayLabel(languageToggle, game.LANGUAGE),
      fallbackWidth: 80,
      fallbackHeight: 40,
    }),

    hint: buildDisplayGeometry(game, hint, {
      id: "hint",
      role: "gameplay-control",
      label: readDisplayLabel(hint, "Hint"),
      fallbackWidth: 100,
      fallbackHeight: 38,
    }),

    back: buildDisplayGeometry(game, back, {
      id: "back",
      role: "gameplay-control",
      label: readDisplayLabel(back, "← Back"),
      fallbackWidth: 90,
      fallbackHeight: 35,
    }),

    next: buildDisplayGeometry(game, next, {
      id: "next",
      role: "gameplay-control",
      label: readDisplayLabel(next, "Next →"),
      fallbackWidth: 90,
      fallbackHeight: 38,
    }),

    continue: buildDisplayGeometry(game, continueButton, {
      id: "continue",
      role: "result-control",
      label: messageBar?.continueButton?.text || "Continue",
      fallbackWidth: 140,
      fallbackHeight: 40,
    }),

    restart: buildDisplayGeometry(game, restartButton, {
      id: "restart",
      role: "result-control",
      label: messageBar?.restartButton?.text || "Restart",
      fallbackWidth: 80,
      fallbackHeight: 40,
    }),

    exit: buildDisplayGeometry(game, exitButton, {
      id: "exit",
      role: "result-control",
      label: messageBar?.exitButton?.text || "Exit",
      fallbackWidth: messageBar?.winningContainer ? 140 : 80,
      fallbackHeight: 40,
    }),
  };
}

/*
 * Publish every currently rendered passage label with its live stage-space
 * geometry and current display state.
 *
 * The bridge does not call the word's tap callback. Playwright will later use
 * centerX/centerY to perform a normal browser mouse click against the canvas.
 */
function buildPassageGeometry(game, activeGame, activeGameType) {
  const passageDisplay = activeGame?.passageDisplay;

  const passageWindow = buildDisplayGeometry(
    game,
    passageDisplay?.scrollWindow,
    {
      id: "passage-window",
      role: "passage-window",
      label: null,
      fallbackWidth: game.width - 120,
      fallbackHeight: 380,
    },
  );

  const activeCategory = getActiveCategory(game, activeGameType);

  const foundWords = activeGame?.foundWords || [];

  const words = (passageDisplay?.wordLabels || [])
    .map((wordEntry, index) => {
      const wrapper = wordEntry?.instance;
      const displayObject = wrapper?.label;

      const normalizedText = String(wordEntry?.text || "");

      const category = getWordCategory(game, normalizedText);

      const geometry = buildDisplayGeometry(game, displayObject, {
        id: `passage-word-${index}`,
        role: "passage-word",
        label: displayObject?.text || wrapper?.text || normalizedText,
      });

      if (!geometry) {
        return null;
      }

      const found = foundWords.includes(normalizedText);

      const visibleInPassageWindow = rectanglesIntersect(
        geometry,
        passageWindow,
      );

      return {
        ...geometry,
        index,
        normalizedText,

        displayedText: displayObject?.text || wrapper?.text || normalizedText,

        category,

        isTargetForActiveRound: category != null && category === activeCategory,

        found,
        color: displayObject?.color || null,
        visibleInPassageWindow,

        /*
         * safeClickCandidate is only a Playwright selection convenience. The
         * production tap handler remains the authority after the mouse click.
         */
        safeClickCandidate: Boolean(
          geometry.attachedToStage &&
          geometry.visible &&
          geometry.mouseEnabled &&
          geometry.intersectsStage &&
          visibleInPassageWindow &&
          category != null &&
          !found,
        ),
      };
    })
    .filter(Boolean);

  return {
    passageWindow,
    words,
  };
}

/*
 * Build one fresh read-only snapshot from the current production objects.
 *
 * Every call reads the live Game and Find*Game instances. The bridge does not
 * retain an independent score, timer, word list, queue, or progression state.
 */
export function buildWordHuntE2EState(game) {
  const activeGameType = getActiveGameType(game);

  const activeGame = getActiveGame(game);

  const targetWords = getTargetWords(game, activeGameType, activeGame);

  const controlPanel = activeGame?.controlPanel;

  const timer = activeGame?.timer;

  const passageGeometry = buildPassageGeometry(
    game,
    activeGame,
    activeGameType,
  );

  /*
   * E2E RESULT OBSERVABILITY:
   * Read whether the production winning panel is currently attached. This does
   * not alter its label, visibility, callbacks, or lifecycle.
   */
  const winningMessageAttached = isAttachedToStage(
    activeGame?.messageBar?.winningContainer,
    game.stage,
  );

  return {
    /*
     * High-level canvas state.
     */
    screen: getScreen(game, activeGame),

    stageSize: {
      width: game.width,
      height: game.height,
    },

    /*
     * Session and player identity.
     */
    language: game.LANGUAGE,
    selectedStoryId: game.currentStoryId,
    activeStorySetId: game.currentGameId,

    playerId: game.playerId,
    playerName: game.player,
    isGuest: Boolean(game.authUser?.isGuest),

    /*
     * Existing production lifecycle flags.
     */
    hasGameStarted: Boolean(game.hasGameStarted),

    isStartingGame: Boolean(game.isStartingGame),

    isInputLocked: Boolean(game.isInputLocked),

    /*
     * Production challenge queue.
     */
    gameQueue: copyList(game.gameQueue),

    currentGameIndex: Number(game.currentGameIndex) || 0,

    activeGameType,

    /*
     * Loaded passage and POS data.
     */
    storyLoaded: Boolean(game.storyData?.story),

    storyValueType: Array.isArray(game.storyData?.story)
      ? "array"
      : typeof game.storyData?.story,

    passageArray: copyList(game.passageArray),

    tokenizedArray: copyList(game.tokenizedArray),

    wordTypes: {
      nouns: copyList(game.wordTypes?.nouns),

      verbs: copyList(game.wordTypes?.verbs),

      adjectives: copyList(game.wordTypes?.adjectives),
    },

    /*
     * Current production round.
     */
    targetWords: copyList(targetWords),

    foundWords: copyList(activeGame?.foundWords),

    targetCount: targetWords.length,

    foundCount: activeGame?.foundWords?.length || 0,

    roundScore: Number(activeGame?.score) || 0,

    totalScore: Number(game.TOTAL_SCORE) || 0,

    earnedCoins: Number(game.EARNED_COINS) || 0,

    roundGameOver: Boolean(activeGame?.gameOver),

    /*
     * Existing hint policy values.
     *
     * Noun uses hintsUsed, while the other current subgame implementations use
     * hintUsed. The ControlPanel counter remains the preferred live source.
     */
    allowedHints: Number(game.allowedHints) || 0,

    hintsUsed: Number(
      controlPanel?.hintCounter ??
        activeGame?.hintsUsed ??
        activeGame?.hintUsed ??
        0,
    ),

    hintPenalty: Number(game.hintPenalty) || 0,

    hintOpen: controlPanel == null ? false : controlPanel.isClosed === false,

    /*
     * Existing production timer state.
     *
     * getElapsedTime() is read only. It does not advance or complete the timer.
     */
    gameTimeMinutes: Number(game.gameTime) || 0,

    timerActive: Boolean(timer?.isActive),

    timerElapsedMs:
      typeof timer?.getElapsedTime === "function"
        ? Number(timer.getElapsedTime()) || 0
        : 0,

    /*
     * Live ZIM geometry for real browser mouse interaction.
     */
    passageWindowGeometry: passageGeometry.passageWindow,

    wordGeometry: passageGeometry.words,

    controlGeometry: buildControlGeometry(game, activeGame),

    hasWinningMessage: winningMessageAttached,

    /*
     * E2E RESULT OBSERVABILITY:
     * Read the actual live ZIM label text only while its winning container is
     * attached to the active production stage.
     */
    winningMessageText: winningMessageAttached
      ? String(activeGame?.messageBar?.winningLabel?.label?.text ?? "")
      : null,

    hasTimeUpMessage: isAttachedToStage(
      activeGame?.messageBar?.timeOverContainer,
      game.stage,
    ),
  };
}

/*
 * Publish a fresh snapshot for Playwright.
 *
 * The object is replaced on every publication rather than mutated in place.
 */
export function publishWordHuntE2EState(game) {
  if (!shouldExposeWordHuntE2E()) {
    return null;
  }

  const state = buildWordHuntE2EState(game);

  window.__wordHuntZimDebug = state;

  return state;
}

/*
 * Install the read-only hook.
 *
 * A2 still exposes only getState(). Playwright will interact through real
 * canvas coordinates rather than synthetic action commands.
 */
export function installWordHuntE2EBridge(game) {
  if (!shouldExposeWordHuntE2E()) {
    return;
  }

  window.__wordHuntZimTestHooks = {
    getState() {
      return publishWordHuntE2EState(game);
    },
  };

  publishWordHuntE2EState(game);
}

/*
 * Remove only the browser globals owned by this module.
 *
 * This must run on React/GameScene unmount, not from Game.destroy(), because
 * Word Hunt also calls Game.destroy() internally while changing subgames.
 */
export function removeWordHuntE2EBridge() {
  if (typeof window === "undefined") {
    return;
  }

  delete window.__wordHuntZimDebug;
  delete window.__wordHuntZimTestHooks;
}
