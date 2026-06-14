import { createZimGame } from "../createZimGame";
import {
  generateMeaningBridgeRound,
  getMeaningBridgeLeaderboard,
  submitMeaningBridgeRound,
} from "../../services/api";
import landingBackgroundUrl from "./assets/meaning-bridge-landing.png";

export const meta = {
  id: "meaning-bridge",
  cardNumber: "02",
  cardArt: "art-sea",
  title: "Meaning Bridge",
  description: "Connect words to Sanskrit, meanings, synonyms, and antonyms.",
};

const MODES = [
  {
    value: "english-to-sanskrit",
    label: "English → Sanskrit",
  },
  {
    value: "sanskrit-to-english",
    label: "Sanskrit → English",
  },
  {
    value: "word-to-definition",
    label: "Word → Definition",
  },
  {
    value: "word-to-synonym",
    label: "Word → Synonym",
  },
  {
    value: "word-to-antonym",
    label: "Word → Antonym",
  },
];

const DIFFICULTIES = ["easy", "medium", "hard"];
const PAIR_COUNTS = [4, 5, 6];

/*
  Round type options
  ------------------
  Practice mode has no countdown pressure.
  Timed mode will later use timerSeconds during gameplay.
*/
const ROUND_TYPES = [
  {
    value: "practice",
    label: "Practice",
    description: "No timer. Learn at your pace.",
  },
  {
    value: "timed",
    label: "Timed",
    description: "Race against the clock.",
  },
];

const TIMER_OPTIONS = [
  {
    value: 120,
    label: "2:00",
  },
  {
    value: 300,
    label: "5:00",
  },
  {
    value: 600,
    label: "10:00",
  },
];

const FONT = "Arial";

function formatTimer(seconds) {
  const totalSeconds = Number(seconds) || 0;
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function clampCustomTimerMinutes(value) {
  const parsed = Number.parseInt(String(value || "1"), 10);

  if (!Number.isFinite(parsed)) {
    return 1;
  }

  return Math.min(60, Math.max(1, parsed));
}

/*
  Landing layout constants
  ------------------------
  The landing image already contains the visual title, bridge, characters,
  Start Adventure button, How to Play button, and Settings button.

  These coordinates create real ZIMJS click zones over the artwork.
*/
const LANDING_LAYOUT = {
  startHotspot: {
    x: 386,
    y: 455,
    width: 330,
    height: 72,
  },
  howToPlayHotspot: {
    x: 388,
    y: 585,
    width: 190,
    height: 56,
  },
  settingsHotspot: {
    x: 590,
    y: 585,
    width: 190,
    height: 56,
  },
  soundHotspot: {
    x: 1010,
    y: 28,
    width: 68,
    height: 68,
  },
  playerHotspot: {
    x: 24,
    y: 28,
    width: 220,
    height: 76,
  },
  leaderboardHotspot: {
    x: 880,
    y: 620,
    width: 190,
    height: 72,
  },
};

/*
  Gameplay layout constants
  -------------------------
  This is the main in-round screen.

  The goal is to move from a simple POC layout toward a polished adventure game
  layout while keeping the existing game logic stable.
*/
const GAMEPLAY_LAYOUT = {
  header: {
    titleY: 24,
    progressY: 64,
    timerY: 92,
  },
  passage: {
    x: 120,
    y: 132,
    width: 860,
    height: 112,
  },
  leftPanel: {
    x: 70,
    y: 286,
    width: 306,
    height: 330,
  },
  rightPanel: {
    x: 724,
    y: 286,
    width: 306,
    height: 330,
  },
  centerPanel: {
    x: 404,
    y: 286,
    width: 292,
  },
  feedback: {
    y: 392,
    height: 82,
  },
  controls: {
    y: 488,
    secondaryY: 536,
  },
  card: {
    width: 252,
    height: 38,
    step: 45,
    xOffset: 27,
    yOffset: 58,
  },
  leaderboard: {
    x: 120,
    y: 638,
    width: 860,
    height: 54,
  },
};

/*
  Setup/menu layout constants
  ---------------------------
  This screen prepares the player before gameplay:
  - player name
  - round type
  - timer length
  - challenge type
  - difficulty
  - pair count

  Timer now has its own panel because custom timers need more room.
*/
const MENU_LAYOUT = {
  panel: {
    x: 110,
    y: 64,
    width: 880,
    height: 610,
  },
  playerPanel: {
    x: 708,
    y: 92,
    width: 220,
    height: 64,
  },
  roundType: {
    x: 142,
    y: 190,
    cardWidth: 210,
    cardHeight: 66,
    gap: 16,
  },
  timerPanel: {
    x: 594,
    y: 166,
    width: 344,
    height: 112,
  },
  timer: {
    x: 612,
    y: 206,
    buttonWidth: 60,
    buttonHeight: 34,
    gap: 8,
    customWidth: 86,
  },
  modeTitle: {
    x: 142,
    y: 292,
  },
  modeGrid: {
    x: 142,
    y: 326,
    cardWidth: 216,
    cardHeight: 56,
    columnGap: 34,
    rowGap: 16,
  },
  difficulty: {
    labelX: 238,
    labelY: 500,
    x: 156,
    y: 528,
    buttonWidth: 92,
    buttonHeight: 36,
    gap: 12,
  },
  pairs: {
    labelX: 790,
    labelY: 500,
    x: 708,
    y: 528,
    buttonWidth: 76,
    buttonHeight: 36,
    gap: 12,
  },
  startButton: {
    x: 445,
    y: 590,
    width: 210,
    height: 48,
  },
};

/*
  Short helper for menu subtitles.
  This gives each challenge mode a clearer purpose without adding extra data
  to the backend.
*/
function getModeDescription(modeValue) {
  switch (modeValue) {
    case "english-to-sanskrit":
      return "Match English words to Sanskrit.";
    case "sanskrit-to-english":
      return "Read Sanskrit and find English.";
    case "word-to-definition":
      return "Connect words to meanings.";
    case "word-to-synonym":
      return "Find similar meanings.";
    case "word-to-antonym":
      return "Find opposite meanings.";
    default:
      return "Build word connections.";
  }
}

function shortText(value, maxLength) {
  const text = String(value || "").trim();

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 1))}…`;
}

function wrapText(value, maxCharsPerLine, maxLines) {
  const words = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (candidate.length > maxCharsPerLine && currentLine) {
      lines.push(currentLine);
      currentLine = word;

      if (lines.length === maxLines) {
        break;
      }
    } else {
      currentLine = candidate;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  const original = words.join(" ");
  const displayed = lines.join(" ");

  if (original.length > displayed.length && lines.length > 0) {
    lines[lines.length - 1] = `${lines[lines.length - 1]}…`;
  }

  return lines;
}

export default createZimGame({
  id: "zim-meaning-bridge-game",
  width: 1100,
  height: 720,
  color: "#dff6ff",
  outerColor: "#151019",

  setup({ stage, W, H, zim }) {
    if (typeof stage.enableMouseOver === "function") {
      stage.enableMouseOver(20);
    }

    let screen = "landing";

    let playerName = "Guest Player";
    let isEditingPlayerName = false;
    let replacePlayerNameOnNextInput = false;

    let mode = "english-to-sanskrit";
    let difficulty = "easy";
    let pairCount = 4;
    let roundType = "practice";

    /*
  Timer setup state
  -----------------
  timerOption can be:
  - 120
  - 300
  - 600
  - "custom"

  timerSeconds is the actual countdown value used by gameplay.
*/
    let timerOption = 120;
    let timerSeconds = 120;
    let customTimerMinutes = "3";
    let isEditingCustomTimer = false;
    let replaceCustomTimerOnNextInput = false;

    let roundData = null;
    let leaderboard = [];
    let leaderboardReturnScreen = "menu";
    let rulesReturnScreen = "landing";
    let selectedLeftId = null;
    let matches = [];
    let hintsUsed = 0;
    let wrongAttempts = 0;
    let result = null;
    let status = "Loading Meaning Bridge...";
    let feedback = "Generating your first bridge round...";
    let feedbackType = "neutral";
    let roundStartedAt = Date.now();

    /*
  Quit confirmation state
  -----------------------
  Used when the player tries to leave an active round.

  quitConfirmAction can be:
  - "menu"
  - "new-round"
*/
    let quitConfirmVisible = false;
    let quitConfirmAction = null;

    /*
  Timed round runtime state
  -------------------------
  roundType and timerSeconds are selected on the setup screen.

  These runtime values control the active gameplay countdown:
  - remainingRoundSeconds: what the player sees
  - timerDeadlineAt: browser timestamp for accurate countdown
  - roundTimerId: active interval id
  - timedRoundEnded: prevents repeated auto-submit calls
  - isSubmittingRound: prevents double submit
*/
    let remainingRoundSeconds = timerSeconds;
    let timerDeadlineAt = null;
    let roundTimerId = null;
    let timedRoundEnded = false;
    let isSubmittingRound = false;

    /*
  Landing art image
  -----------------
  This image is imported through Vite, preloaded with the browser Image API,
  and then drawn into the ZIM stage as a Bitmap.

  If the image is still loading or Bitmap is unavailable, the game falls back
  to the existing drawn ZIM background.
*/
    let landingImageElement = null;
    let landingImageReady = false;
    let landingImageFailed = false;

    /*
  Sound state
  -----------
  Uses browser Web Audio API, so we do not need audio files.

  soundMuted controls whether game sound effects play.
  audioContext is created lazily after user interaction.
  lastTimerWarningSecond prevents timer warning sounds from repeating too much.
*/
    let soundMuted = false;
    let audioContext = null;
    let lastTimerWarningSecond = null;

    function publishDebugState() {
      if (typeof window === "undefined") {
        return;
      }

      window.__meaningBridgeZimDebug = {
        screen,
        playerName,
        isEditingPlayerName,
        mode,
        difficulty,
        pairCount,
        roundType,
        timerOption,
        timerSeconds,
        customTimerMinutes,
        isEditingCustomTimer,
        remainingRoundSeconds,
        timerRunning: Boolean(roundTimerId),
        timedRoundEnded,
        isSubmittingRound,
        roundId: roundData?.puzzle?.roundId || null,
        passageTitle: roundData?.passage?.title || "",
        matches,
        selectedLeftId,
        hintsUsed,
        wrongAttempts,
        resultVisible: Boolean(result),
        quitConfirmVisible,
        quitConfirmAction,
        soundMuted,
        leaderboard,
        leaderboardReturnScreen,
        rulesReturnScreen,
      };
    }

    function addLabel({
      text,
      x,
      y,
      size = 16,
      color = "#0f172a",
      bold = false,
      align = "left",
      valign = "top",
      container = stage,
    }) {
      const label = new zim.Label({
        text: String(text || ""),
        size,
        font: FONT,
        color,
        align,
        valign,
        bold,
      });

      /*
    Labels are visual only.

    Without this, text labels can sit above cards/buttons and steal pointer
    events from the real clickable object underneath.
  */
      label.mouseEnabled = false;

      label.addTo(container).loc(x, y);
      return label;
    }

    function addWrappedLabel({
      text,
      x,
      y,
      maxCharsPerLine,
      maxLines,
      size = 14,
      lineHeight = 18,
      color = "#334155",
      bold = false,
    }) {
      wrapText(text, maxCharsPerLine, maxLines).forEach((line, index) => {
        addLabel({
          text: line,
          x,
          y: y + index * lineHeight,
          size,
          color,
          bold,
        });
      });
    }

    function addPanel({ x, y, width, height, fill, stroke, corner = 22 }) {
      return new zim.Rectangle(width, height, fill, stroke, 2, corner)
        .addTo(stage)
        .loc(x, y);
    }

    function addButton({
      x,
      y,
      width,
      height,
      label,
      background = "#4f46e5",
      rollBackground = "#6366f1",
      color = "#ffffff",
      borderColor = null,
      onClick,
    }) {
      const buttonLabel = new zim.Label({
        text: label,
        size: 15,
        font: FONT,
        color,
        bold: true,
        align: "center",
        valign: "center",
      });

      const button = new zim.Button({
        width,
        height,
        label: buttonLabel,
        backgroundColor: background,
        rollBackgroundColor: rollBackground,
        color,
        rollColor: color,
        borderColor,
        borderWidth: borderColor ? 2 : 0,
        corner: 18,
      });

      button.addTo(stage).loc(x, y);
      button.cursor = "pointer";
      button.on("click", () => {
        playSound("button");

        if (typeof onClick === "function") {
          onClick();
        }
      });

      return button;
    }

    function setFeedback(message, type = "neutral") {
      feedback = message;
      feedbackType = type;
    }

    function getAudioContext() {
      if (typeof window === "undefined") {
        return null;
      }

      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) {
        return null;
      }

      if (!audioContext) {
        audioContext = new AudioContextClass();
      }

      if (audioContext.state === "suspended") {
        void audioContext.resume();
      }

      return audioContext;
    }

    function playTone({
      frequency = 440,
      duration = 0.08,
      volume = 0.035,
      type = "sine",
      delay = 0,
    } = {}) {
      if (soundMuted) {
        return;
      }

      const context = getAudioContext();

      if (!context) {
        return;
      }

      const startAt = context.currentTime + delay;
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, startAt);

      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start(startAt);
      oscillator.stop(startAt + duration + 0.03);
    }

    function playSound(kind = "button") {
      /*
    Small generated sound effects.

    No external files are needed. These are intentionally short so they feel
    like game UI feedback instead of music.
  */

      if (soundMuted) {
        return;
      }

      switch (kind) {
        case "correct":
          playTone({ frequency: 660, duration: 0.07, volume: 0.04 });
          playTone({
            frequency: 880,
            duration: 0.09,
            volume: 0.035,
            delay: 0.07,
          });
          break;

        case "wrong":
          playTone({
            frequency: 180,
            duration: 0.1,
            volume: 0.045,
            type: "sawtooth",
          });
          playTone({
            frequency: 130,
            duration: 0.11,
            volume: 0.035,
            type: "sawtooth",
            delay: 0.08,
          });
          break;

        case "hint":
          playTone({
            frequency: 480,
            duration: 0.07,
            volume: 0.03,
            type: "triangle",
          });
          playTone({
            frequency: 620,
            duration: 0.07,
            volume: 0.03,
            type: "triangle",
            delay: 0.06,
          });
          break;

        case "submit":
          playTone({ frequency: 520, duration: 0.07, volume: 0.035 });
          playTone({
            frequency: 660,
            duration: 0.07,
            volume: 0.035,
            delay: 0.06,
          });
          playTone({
            frequency: 780,
            duration: 0.09,
            volume: 0.035,
            delay: 0.12,
          });
          break;

        case "result":
          playTone({ frequency: 740, duration: 0.08, volume: 0.035 });
          playTone({
            frequency: 880,
            duration: 0.12,
            volume: 0.035,
            delay: 0.08,
          });
          break;

        case "perfect":
          playTone({ frequency: 660, duration: 0.07, volume: 0.04 });
          playTone({
            frequency: 880,
            duration: 0.08,
            volume: 0.04,
            delay: 0.07,
          });
          playTone({
            frequency: 990,
            duration: 0.12,
            volume: 0.035,
            delay: 0.15,
          });
          break;

        case "warning":
          playTone({
            frequency: 740,
            duration: 0.08,
            volume: 0.035,
            type: "square",
          });
          break;

        case "button":
        default:
          playTone({
            frequency: 520,
            duration: 0.045,
            volume: 0.025,
            type: "triangle",
          });
          break;
      }
    }

    function toggleSoundMuted() {
      const wasMuted = soundMuted;
      soundMuted = !soundMuted;

      // When turning sound back on, play one confirmation sound.
      if (wasMuted) {
        playSound("button");
      }

      renderScene();
    }

    function drawSoundToggle({ x, y, width = 112, height = 34 } = {}) {
      addButton({
        x,
        y,
        width,
        height,
        label: soundMuted ? "Muted" : "Sound On",
        background: soundMuted ? "#475569" : "#059669",
        rollBackground: soundMuted ? "#334155" : "#047857",
        onClick: toggleSoundMuted,
      });
    }

    function preloadLandingImage() {
      if (typeof window === "undefined") {
        return;
      }

      const image = new Image();

      image.onload = () => {
        landingImageElement = image;
        landingImageReady = true;
        landingImageFailed = false;
        renderScene();
      };

      image.onerror = () => {
        landingImageElement = null;
        landingImageReady = false;
        landingImageFailed = true;
        renderScene();
      };

      image.src = landingBackgroundUrl;
    }

    function goToSetupMenu() {
      screen = "menu";
      status = "Choose your bridge challenge.";
      setFeedback(
        "Choose a mode, difficulty, and pair count to begin.",
        "neutral",
      );
      renderScene();
    }

    function openLeaderboardScreen(returnScreen = screen) {
      /*
    Dedicated leaderboard screen
    ----------------------------
    This screen is safe to open from landing, setup, or result.

    During active gameplay we avoid interrupting the timed/matching flow.
  */

      leaderboardReturnScreen =
        returnScreen === "leaderboard" ? "menu" : returnScreen || "menu";

      screen = "leaderboard";
      status = "Viewing Top Explorers.";
      setFeedback("Top Explorers leaderboard opened.", "neutral");

      renderScene();

      void loadLeaderboard(10).then(() => {
        renderScene();
      });
    }

    function closeLeaderboardScreen() {
      screen = leaderboardReturnScreen || "menu";
      status = "Choose your bridge challenge.";
      renderScene();
    }

    function openRulesScreen(returnScreen = screen) {
      /*
    Rules / How to Play screen
    --------------------------
    This screen explains Meaning Bridge rules, scoring, timed mode,
    custom timers, keyboard shortcuts, and future multiplayer ideas.

    We avoid opening it during active gameplay because it should not hide a
    running timed round.
  */

      rulesReturnScreen =
        returnScreen === "rules" ? "landing" : returnScreen || "landing";

      screen = "rules";
      status = "Viewing How to Play.";
      setFeedback("How to Play opened.", "neutral");
      renderScene();
    }

    function closeRulesScreen() {
      screen = rulesReturnScreen || "landing";
      status = "Choose your bridge challenge.";
      renderScene();
    }

    function stopRoundTimer({ reset = false } = {}) {
      if (roundTimerId) {
        window.clearInterval(roundTimerId);
      }

      roundTimerId = null;
      timerDeadlineAt = null;

      if (reset) {
        remainingRoundSeconds = timerSeconds;
        timedRoundEnded = false;
      }
    }

    function updateRemainingRoundSeconds() {
      if (roundType !== "timed" || !timerDeadlineAt) {
        remainingRoundSeconds = timerSeconds;
        return remainingRoundSeconds;
      }

      remainingRoundSeconds = Math.max(
        0,
        Math.ceil((timerDeadlineAt - Date.now()) / 1000),
      );

      return remainingRoundSeconds;
    }

    function startRoundTimer() {
      stopRoundTimer({ reset: true });

      if (roundType !== "timed") {
        return;
      }

      remainingRoundSeconds = timerSeconds;
      timerDeadlineAt = Date.now() + timerSeconds * 1000;
      timedRoundEnded = false;

      roundTimerId = window.setInterval(() => {
        const remaining = updateRemainingRoundSeconds();

        if (remaining <= 0) {
          stopRoundTimer();
          void handleTimerExpired();
          return;
        }

        renderScene();
      }, 1000);
    }

    async function handleTimerExpired() {
      if (timedRoundEnded || result || isSubmittingRound) {
        return;
      }

      timedRoundEnded = true;
      remainingRoundSeconds = 0;
      status = "Time expired.";
      setFeedback("Time is up. Submitting your bridge automatically.", "error");
      renderScene();

      await submitRound({
        force: true,
        reason: "timer",
      });
    }

    function isGameplayLocked() {
      return (
        Boolean(result) ||
        isSubmittingRound ||
        timedRoundEnded ||
        quitConfirmVisible
      );
    }

    function getNormalizedPlayerName() {
      return String(playerName || "").trim() || "Guest Player";
    }

    function getCustomTimerSeconds() {
      return clampCustomTimerMinutes(customTimerMinutes) * 60;
    }

    function getSelectedTimerSeconds() {
      return timerOption === "custom" ? getCustomTimerSeconds() : timerOption;
    }

    function syncTimerSecondsFromSelection() {
      timerSeconds = getSelectedTimerSeconds();
    }

    function beginCustomTimerEdit() {
      roundType = "timed";
      timerOption = "custom";
      isEditingCustomTimer = true;
      isEditingPlayerName = false;
      replacePlayerNameOnNextInput = false;
      replaceCustomTimerOnNextInput = true;
      syncTimerSecondsFromSelection();

      setFeedback(
        "Type a custom timer in minutes from 1 to 60, then press Enter.",
        "neutral",
      );

      renderScene();
    }

    function finishCustomTimerEdit() {
      customTimerMinutes = String(clampCustomTimerMinutes(customTimerMinutes));
      timerOption = "custom";
      isEditingCustomTimer = false;
      replaceCustomTimerOnNextInput = false;
      syncTimerSecondsFromSelection();
      renderScene();
    }

    function beginPlayerNameEdit() {
      isEditingCustomTimer = false;
      replaceCustomTimerOnNextInput = false;

      isEditingPlayerName = true;
      replacePlayerNameOnNextInput =
        getNormalizedPlayerName() === "Guest Player";
      setFeedback(
        "Type your player name, then press Enter to save.",
        "neutral",
      );
      renderScene();
    }

    function finishPlayerNameEdit() {
      playerName = getNormalizedPlayerName();
      isEditingPlayerName = false;
      replacePlayerNameOnNextInput = false;
      renderScene();
    }

    function handlePlayerNameKeyDown(event) {
      /*
    Global Meaning Bridge keyboard handler
    --------------------------------------
    Supports:
    - player name editing
    - custom timer editing
    - landing shortcuts
    - setup shortcuts
    - rules shortcuts
    - leaderboard shortcuts
    - quit confirmation shortcuts
    - gameplay shortcuts
    - result shortcuts
  */

      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      const key = String(event.key || "").toLowerCase();
      const isSpace = event.key === " " || event.code === "Space";
      const isHelpKey =
        event.key === "?" || key === "/" || event.code === "Slash";

      /*
    Custom timer editing
  */
      if (screen === "menu" && isEditingCustomTimer) {
        if (event.key === "Enter" || event.key === "Escape") {
          event.preventDefault();
          finishCustomTimerEdit();
          return;
        }

        if (event.key === "Backspace") {
          event.preventDefault();

          if (replaceCustomTimerOnNextInput) {
            customTimerMinutes = "";
            replaceCustomTimerOnNextInput = false;
          } else {
            customTimerMinutes = customTimerMinutes.slice(0, -1);
          }

          syncTimerSecondsFromSelection();
          renderScene();
          return;
        }

        if (/^\d$/.test(event.key)) {
          event.preventDefault();

          if (replaceCustomTimerOnNextInput) {
            customTimerMinutes = "";
            replaceCustomTimerOnNextInput = false;
          }

          if (customTimerMinutes.length < 2) {
            customTimerMinutes += event.key;
          }

          syncTimerSecondsFromSelection();
          renderScene();
          return;
        }

        return;
      }

      /*
    Player name editing
  */
      if (screen === "menu" && isEditingPlayerName) {
        if (event.key === "Enter" || event.key === "Escape") {
          event.preventDefault();
          finishPlayerNameEdit();
          return;
        }

        if (event.key === "Backspace") {
          event.preventDefault();

          if (replacePlayerNameOnNextInput) {
            playerName = "";
            replacePlayerNameOnNextInput = false;
          } else {
            playerName = playerName.slice(0, -1);
          }

          renderScene();
          return;
        }

        if (event.key.length === 1) {
          event.preventDefault();

          if (replacePlayerNameOnNextInput) {
            playerName = "";
            replacePlayerNameOnNextInput = false;
          }

          if (playerName.length < 24) {
            playerName += event.key;
          }

          renderScene();
          return;
        }

        return;
      }

      /*
  Global sound toggle
*/
      if (key === "v") {
        event.preventDefault();
        toggleSoundMuted();
        return;
      }

      /*
    Rules screen shortcuts
  */
      if (screen === "rules") {
        if (event.key === "Enter") {
          event.preventDefault();
          goToSetupMenu();
          return;
        }

        if (key === "m" || event.key === "Escape" || isHelpKey) {
          event.preventDefault();
          closeRulesScreen();
          return;
        }

        return;
      }

      /*
    Leaderboard screen shortcuts
  */
      if (screen === "leaderboard") {
        if (event.key === "Enter") {
          event.preventDefault();
          goToSetupMenu();
          return;
        }

        if (key === "m" || key === "l" || event.key === "Escape") {
          event.preventDefault();
          closeLeaderboardScreen();
          return;
        }

        return;
      }

      /*
    Quit confirmation shortcuts
  */
      if (screen === "gameplay" && quitConfirmVisible) {
        if (event.key === "Enter") {
          event.preventDefault();
          confirmQuitRound();
          return;
        }

        if (event.key === "Escape" || key === "m") {
          event.preventDefault();
          cancelQuitConfirmation();
          return;
        }

        return;
      }

      /*
    Landing shortcuts
  */
      if (screen === "landing") {
        if (event.key === "Enter" || isSpace) {
          event.preventDefault();
          goToSetupMenu();
          return;
        }

        if (key === "l") {
          event.preventDefault();
          openLeaderboardScreen("landing");
          return;
        }

        if (key === "h" || isHelpKey) {
          event.preventDefault();
          openRulesScreen("landing");
          return;
        }

        return;
      }

      /*
    Setup/menu shortcuts
  */
      if (screen === "menu") {
        if (event.key === "Enter") {
          event.preventDefault();
          startBridgeRound();
          return;
        }

        if (key === "p") {
          event.preventDefault();
          selectMenuRoundType("practice");
          return;
        }

        if (key === "t") {
          event.preventDefault();
          selectMenuRoundType("timed");
          return;
        }

        if (key === "1") {
          event.preventDefault();
          selectMenuTimerSeconds(120);
          return;
        }

        if (key === "2") {
          event.preventDefault();
          selectMenuTimerSeconds(300);
          return;
        }

        if (key === "3") {
          event.preventDefault();
          selectMenuTimerSeconds(600);
          return;
        }

        if (key === "c") {
          event.preventDefault();
          beginCustomTimerEdit();
          return;
        }

        if (key === "e") {
          event.preventDefault();
          beginPlayerNameEdit();
          return;
        }

        if (key === "l") {
          event.preventDefault();
          openLeaderboardScreen("menu");
          return;
        }

        if (key === "h" || isHelpKey) {
          event.preventDefault();
          openRulesScreen("menu");
          return;
        }

        return;
      }

      /*
    Result overlay shortcuts
  */
      if (screen === "gameplay" && result) {
        if (event.key === "Enter" || key === "n") {
          event.preventDefault();
          void loadRound();
          return;
        }

        if (key === "l") {
          event.preventDefault();
          openLeaderboardScreen("gameplay");
          return;
        }

        if (key === "h" || isHelpKey) {
          event.preventDefault();
          openRulesScreen("gameplay");
          return;
        }

        if (key === "m" || event.key === "Escape") {
          event.preventDefault();
          backToMenu();
          return;
        }

        return;
      }

      /*
    Active gameplay shortcuts
  */
      if (screen === "gameplay") {
        if (/^[1-6]$/.test(key)) {
          event.preventDefault();
          activateGameplayNumberShortcut(Number(key));
          return;
        }

        if (key === "h") {
          event.preventDefault();
          useHint();
          return;
        }

        if (key === "r") {
          event.preventDefault();
          resetRound();
          return;
        }

        if (key === "s" || event.key === "Enter") {
          event.preventDefault();

          if (!isSubmittingRound) {
            void submitRound();
          }

          return;
        }

        if (key === "n") {
          event.preventDefault();
          requestNewRound();
          return;
        }

        if (key === "l") {
          event.preventDefault();
          setFeedback(
            "Finish or submit the round to view the full leaderboard.",
            "neutral",
          );
          renderScene();
          return;
        }

        if (isHelpKey) {
          event.preventDefault();
          setFeedback(
            "Submit or return to the menu to view the full How to Play screen.",
            "neutral",
          );
          renderScene();
          return;
        }

        if (key === "m" || event.key === "Escape") {
          event.preventDefault();
          requestBackToMenu();
        }
      }
    }

    function selectMenuMode(nextMode) {
      mode = nextMode;
      renderScene();
    }

    function selectMenuDifficulty(nextDifficulty) {
      difficulty = nextDifficulty;
      renderScene();
    }

    function selectMenuPairCount(nextPairCount) {
      pairCount = nextPairCount;
      renderScene();
    }

    function selectMenuRoundType(nextRoundType) {
      roundType = nextRoundType;
      isEditingCustomTimer = false;
      replaceCustomTimerOnNextInput = false;

      if (nextRoundType === "timed") {
        syncTimerSecondsFromSelection();
      }

      renderScene();
    }

    function selectMenuTimerSeconds(nextTimerSeconds) {
      roundType = "timed";
      timerOption = nextTimerSeconds;
      timerSeconds = nextTimerSeconds;
      isEditingCustomTimer = false;
      replaceCustomTimerOnNextInput = false;
      renderScene();
    }

    function hasActiveGameplayRound() {
      /*
    Active round means:
    - player is on gameplay screen
    - a puzzle exists
    - result screen is not open
    - submit is not currently running
  */
      return (
        screen === "gameplay" &&
        Boolean(roundData?.puzzle) &&
        !result &&
        !isSubmittingRound
      );
    }

    function openQuitConfirmation(action = "menu") {
      if (!hasActiveGameplayRound()) {
        if (action === "new-round") {
          void loadRound();
          return;
        }

        backToMenu();
        return;
      }

      quitConfirmVisible = true;
      quitConfirmAction = action;
      setFeedback(
        "Confirm before leaving this round. Your current progress will be lost.",
        "neutral",
      );
      renderScene();
    }

    function cancelQuitConfirmation() {
      quitConfirmVisible = false;
      quitConfirmAction = null;
      setFeedback("Keep playing. Your round is still active.", "neutral");
      renderScene();
    }

    function confirmQuitRound() {
      const action = quitConfirmAction || "menu";

      quitConfirmVisible = false;
      quitConfirmAction = null;

      if (action === "new-round") {
        void loadRound();
        return;
      }

      backToMenu();
    }

    function requestBackToMenu() {
      openQuitConfirmation("menu");
    }

    function requestNewRound() {
      openQuitConfirmation("new-round");
    }

    function startBridgeRound() {
      quitConfirmVisible = false;
      quitConfirmAction = null;

      playerName = getNormalizedPlayerName();
      isEditingPlayerName = false;
      replacePlayerNameOnNextInput = false;

      if (isEditingCustomTimer) {
        finishCustomTimerEdit();
      } else {
        syncTimerSecondsFromSelection();
      }

      screen = "gameplay";

      void loadRound({
        mode,
        difficulty,
        pairCount,
      });
    }

    function backToMenu() {
      stopRoundTimer({ reset: true });

      quitConfirmVisible = false;
      quitConfirmAction = null;

      screen = "menu";
      selectedLeftId = null;
      matches = [];
      hintsUsed = 0;
      wrongAttempts = 0;
      result = null;
      isEditingPlayerName = false;
      replacePlayerNameOnNextInput = false;
      status = "Choose your bridge challenge.";
      setFeedback(
        "Choose a mode, difficulty, and pair count to begin.",
        "neutral",
      );
      renderScene();
    }

    async function loadLeaderboard(limit = 10) {
      try {
        const response = await getMeaningBridgeLeaderboard(limit);
        leaderboard = response.scores || [];
      } catch {
        leaderboard = [];
      }
    }

    async function loadRound(options = {}) {
      stopRoundTimer({ reset: true });

      quitConfirmVisible = false;
      quitConfirmAction = null;

      screen = "gameplay";
      status = "Generating round...";
      setFeedback("Building a new Meaning Bridge round...", "neutral");
      result = null;
      selectedLeftId = null;
      matches = [];
      hintsUsed = 0;
      wrongAttempts = 0;
      timedRoundEnded = false;
      isSubmittingRound = false;
      roundStartedAt = Date.now();
      renderScene();

      try {
        mode = options.mode || mode;
        difficulty = options.difficulty || difficulty;
        pairCount = options.pairCount || pairCount;

        const response = await generateMeaningBridgeRound({
          mode,
          difficulty,
          pairCount,
          previousPassageId: roundData?.passage?.passageId || null,
        });

        roundData = response;
        status = "ZIMJS gameplay connected to Express backend.";
        setFeedback(
          "Select a word card, then select its matching meaning card.",
          "neutral",
        );

        await loadLeaderboard();

        roundStartedAt = Date.now();
        startRoundTimer();
      } catch (error) {
        status = "Unable to generate round.";
        setFeedback(
          error instanceof Error
            ? error.message
            : "Failed to generate Meaning Bridge round.",
          "error",
        );
        stopRoundTimer({ reset: true });
      }

      renderScene();
    }

    function isLeftMatched(leftId) {
      return matches.some((match) => match.leftId === leftId);
    }

    function isRightMatched(rightId) {
      return matches.some((match) => match.rightId === rightId);
    }

    function getCompletionPercent() {
      const totalPairs = roundData?.puzzle?.leftItems?.length || 0;

      if (totalPairs === 0) {
        return 0;
      }

      return Math.round((matches.length / totalPairs) * 100);
    }

    function getResultTitle() {
      if (!result) {
        return "Round Complete";
      }

      if (result.perfectRound && result.roundPoints > 0) {
        return "Perfect Bridge!";
      }

      if (result.accuracy >= 75) {
        return "Strong Attempt!";
      }

      return "Keep Practicing!";
    }

    function getResultBadge() {
      if (!result) {
        return "⭐";
      }

      if (result.perfectRound && result.roundPoints > 0) {
        return "🏆";
      }

      if (result.accuracy >= 75) {
        return "⭐";
      }

      return "🌱";
    }

    function handleLeftCard(item) {
      if (isGameplayLocked()) {
        return;
      }

      if (isLeftMatched(item.id)) {
        setFeedback("That word is already matched.", "neutral");
        renderScene();
        return;
      }

      selectedLeftId = item.id;
      setFeedback(
        `Selected "${item.label}". Now choose the matching card.`,
        "neutral",
      );
      renderScene();
    }

    function handleRightCard(item) {
      if (isGameplayLocked()) {
        return;
      }
      const puzzle = roundData?.puzzle;

      if (!puzzle) {
        return;
      }

      if (!selectedLeftId) {
        setFeedback("Choose a word card first.", "neutral");
        renderScene();
        return;
      }

      if (isRightMatched(item.id)) {
        setFeedback("That meaning card is already matched.", "neutral");
        renderScene();
        return;
      }

      const expectedRightId = puzzle.answerKey[selectedLeftId];

      if (expectedRightId === item.id) {
        matches = [
          ...matches,
          {
            leftId: selectedLeftId,
            rightId: item.id,
          },
        ];

        playSound("correct");

        selectedLeftId = null;

        const completed = matches.length === puzzle.leftItems.length;

        setFeedback(
          completed
            ? "All pairs matched. Submit your bridge!"
            : "Correct match! Keep building the bridge.",
          "success",
        );
      } else {
        wrongAttempts += 1;
        playSound("wrong");
        setFeedback("Not quite. Try another meaning card.", "error");
      }

      renderScene();
    }

    function activateGameplayNumberShortcut(cardNumber) {
      /*
    Number-key card selection
    -------------------------
    If no word card is selected, number keys select from the left word cards.
    If a word card is already selected, number keys select from the right
    meaning cards.

    Example:
    - Press 1 to select the first word card.
    - Press 3 to match it with the third meaning card.
  */

      if (isGameplayLocked()) {
        return;
      }

      const puzzle = roundData?.puzzle;

      if (!puzzle) {
        return;
      }

      const index = cardNumber - 1;

      if (selectedLeftId) {
        const rightItem = puzzle.rightItems[index];

        if (!rightItem) {
          setFeedback(
            `There is no meaning card ${cardNumber} in this round.`,
            "neutral",
          );
          renderScene();
          return;
        }

        handleRightCard(rightItem);
        return;
      }

      const leftItem = puzzle.leftItems[index];

      if (!leftItem) {
        setFeedback(
          `There is no word card ${cardNumber} in this round.`,
          "neutral",
        );
        renderScene();
        return;
      }

      handleLeftCard(leftItem);
    }

    function resetRound() {
      if (isSubmittingRound) {
        return;
      }

      stopRoundTimer({ reset: true });

      selectedLeftId = null;
      matches = [];
      hintsUsed = 0;
      wrongAttempts = 0;
      result = null;
      timedRoundEnded = false;
      roundStartedAt = Date.now();

      setFeedback("Round reset. Select a word card to begin again.", "neutral");

      if (roundType === "timed") {
        startRoundTimer();
      }

      renderScene();
    }

    function useHint() {
      if (isGameplayLocked()) {
        return;
      }
      const puzzle = roundData?.puzzle;

      if (!puzzle) {
        return;
      }

      if (!selectedLeftId) {
        setFeedback(
          "Select a word card first, then ask for a hint.",
          "neutral",
        );
        renderScene();
        return;
      }

      hintsUsed += 1;
      playSound("hint");
      setFeedback(
        puzzle.hints[selectedLeftId] || "No hint available.",
        "neutral",
      );
      renderScene();
    }

    async function submitRound({ force = false, reason = "manual" } = {}) {
      const puzzle = roundData?.puzzle;

      if (!puzzle || result || isSubmittingRound) {
        return;
      }

      if (!force && matches.length === 0) {
        setFeedback("Match at least one pair before submitting.", "neutral");
        renderScene();
        return;
      }

      if (roundType === "timed") {
        updateRemainingRoundSeconds();
      }

      isSubmittingRound = true;
      stopRoundTimer();
      playSound(reason === "timer" ? "warning" : "submit");

      status =
        reason === "timer"
          ? "Time expired. Submitting round..."
          : "Submitting round...";

      setFeedback(
        reason === "timer"
          ? "Time is up. Your current matches are being scored."
          : "Submitting your bridge round...",
        reason === "timer" ? "error" : "neutral",
      );

      renderScene();

      try {
        const elapsedSeconds = Math.max(
          1,
          Math.round((Date.now() - roundStartedAt) / 1000),
        );

        const timeSeconds =
          roundType === "timed"
            ? Math.min(timerSeconds, elapsedSeconds)
            : elapsedSeconds;

        result = await submitMeaningBridgeRound({
          roundId: puzzle.roundId,
          playerName: getNormalizedPlayerName(),
          matches,
          timeSeconds,
          hintsUsed,
          wrongAttempts,
        });

        playSound(result.perfectRound ? "perfect" : "result");

        status =
          reason === "timer"
            ? "Time expired. Round submitted."
            : "Round submitted.";

        setFeedback(
          reason === "timer"
            ? "Time expired. Your score has been submitted."
            : result.message || "Round submitted.",
          reason === "timer" ? "error" : "success",
        );

        await loadLeaderboard();
      } catch (error) {
        isSubmittingRound = false;
        timedRoundEnded = false;
        lastTimerWarningSecond = null;

        setFeedback(
          error instanceof Error
            ? error.message
            : "Failed to submit Meaning Bridge round.",
          "error",
        );

        status = "Submit failed.";

        if (roundType === "timed" && remainingRoundSeconds > 0 && !force) {
          timerDeadlineAt = Date.now() + remainingRoundSeconds * 1000;

          roundTimerId = window.setInterval(() => {
            const remaining = updateRemainingRoundSeconds();

            if (
              [10, 5, 3, 2, 1].includes(remaining) &&
              lastTimerWarningSecond !== remaining
            ) {
              lastTimerWarningSecond = remaining;
              playSound("warning");
            }

            if (remaining <= 0) {
              stopRoundTimer();
              void handleTimerExpired();
              return;
            }

            renderScene();
          }, 1000);
        }
      }

      isSubmittingRound = false;
      renderScene();
    }

    function drawLandingImageBackground() {
      /*
    Draw imported landing art inside ZIM.

    The Bitmap is scaled with "cover" logic:
    - fill the whole 1100x720 canvas
    - crop gently if aspect ratio differs
    - keep the artwork centered
  */

      if (!landingImageReady || !landingImageElement || !zim.Bitmap) {
        drawBackground();
        return;
      }

      const bitmap = new zim.Bitmap(landingImageElement);
      const scale = Math.max(
        W / landingImageElement.width,
        H / landingImageElement.height,
      );

      bitmap.scaleX = scale;
      bitmap.scaleY = scale;
      bitmap.x = (W - landingImageElement.width * scale) / 2;
      bitmap.y = (H - landingImageElement.height * scale) / 2;
      stage.addChild(bitmap);

      // Soft readability overlay so ZIM text/buttons stay readable.
      new zim.Rectangle(W, H, "rgba(7,22,79,0.18)").addTo(stage).loc(0, 0);
    }

    function drawBackground() {
      /*
    Adventure-style ZIM background
    ------------------------------
    This is still drawn with ZIM shapes, not a baked screenshot.

    Later we can replace this with a clean layered background asset, but this
    version already gives the gameplay screen a more polished game feel.
  */

      new zim.Rectangle(W, H, "#dff6ff").addTo(stage).loc(0, 0);

      // Sky glow.
      new zim.Circle(300, "rgba(255,255,255,0.38)").addTo(stage).loc(550, 144);

      // Sun.
      new zim.Circle(44, "#facc15").addTo(stage).loc(982, 78);
      new zim.Circle(58, "rgba(250,204,21,0.16)").addTo(stage).loc(982, 78);

      // Clouds.
      new zim.Circle(20, "#ffffff").addTo(stage).loc(110, 72);
      new zim.Circle(28, "#ffffff").addTo(stage).loc(140, 62);
      new zim.Circle(20, "#ffffff").addTo(stage).loc(172, 72);
      new zim.Rectangle(86, 20, "#ffffff", null, 0, 14)
        .addTo(stage)
        .loc(100, 72);

      new zim.Circle(18, "rgba(255,255,255,0.9)").addTo(stage).loc(814, 88);
      new zim.Circle(26, "rgba(255,255,255,0.9)").addTo(stage).loc(846, 78);
      new zim.Rectangle(86, 18, "rgba(255,255,255,0.9)", null, 0, 14)
        .addTo(stage)
        .loc(796, 88);

      // Distant hills.
      const hills = new zim.Shape().addTo(stage);
      hills
        .f("#bbf7d0")
        .mt(0, 192)
        .bt(180, 92, 330, 210, 500, 138)
        .bt(680, 62, 850, 185, W, 106)
        .lt(W, H)
        .lt(0, H)
        .cp();

      const farHills = new zim.Shape().addTo(stage);
      farHills
        .f("rgba(134,239,172,0.48)")
        .mt(0, 260)
        .bt(160, 160, 290, 276, 470, 206)
        .bt(650, 142, 830, 250, W, 198)
        .lt(W, H)
        .lt(0, H)
        .cp();

      // River.
      const river = new zim.Shape().addTo(stage);
      river
        .f("#7dd3fc")
        .mt(0, 300)
        .bt(220, 250, 330, 355, 540, 300)
        .bt(720, 250, 840, 360, W, 312)
        .lt(W, H)
        .lt(0, H)
        .cp();

      const riverHighlight = new zim.Shape().addTo(stage);
      riverHighlight
        .s("rgba(255,255,255,0.42)")
        .ss(4)
        .mt(322, 420)
        .bt(450, 392, 520, 470, 650, 430)
        .bt(740, 402, 790, 448, 900, 418);

      // Grass banks.
      new zim.Rectangle(300, 92, "#65a30d", null, 0, 42)
        .addTo(stage)
        .loc(-40, 348);

      new zim.Rectangle(300, 92, "#65a30d", null, 0, 42)
        .addTo(stage)
        .loc(840, 348);

      // Soft vignette to frame the game.
      new zim.Rectangle(W, H, "rgba(7,22,79,0.05)").addTo(stage).loc(0, 0);
    }

    function drawBridge() {
      /*
    Adventure bridge center
    -----------------------
    This is the visual heart of the gameplay screen.

    It shows:
    - stone bridge arch
    - match slots
    - completion badge
    - progress glow
  */

      const progress = getCompletionPercent();
      const puzzle = roundData?.puzzle;
      const totalPairs = puzzle?.leftItems?.length || pairCount;
      const completedPairs = matches.length;

      const bridgeX = 404;
      const bridgeY = 330;
      const bridgeWidth = 292;

      // Soft bridge shadow.
      const shadow = new zim.Shape().addTo(stage);
      shadow.mouseEnabled = false;
      shadow
        .s("rgba(120,53,15,0.18)")
        .ss(18)
        .mt(bridgeX + 18, bridgeY + 112)
        .bt(
          bridgeX + 78,
          bridgeY + 52,
          bridgeX + 214,
          bridgeY + 52,
          bridgeX + 274,
          bridgeY + 112,
        );

      // Main stone arch.
      const arch = new zim.Shape().addTo(stage);
      arch.mouseEnabled = false;
      arch
        .s("#8b5e34")
        .ss(13)
        .mt(bridgeX + 18, bridgeY + 104)
        .bt(
          bridgeX + 78,
          bridgeY + 42,
          bridgeX + 214,
          bridgeY + 42,
          bridgeX + 274,
          bridgeY + 104,
        );

      // Bridge deck.
      const deck = new zim.Shape().addTo(stage);
      deck.mouseEnabled = false;
      deck
        .s("#b45309")
        .ss(14)
        .mt(bridgeX + 10, bridgeY + 126)
        .lt(bridgeX + bridgeWidth - 10, bridgeY + 126);

      // Stone blocks.
      for (let index = 0; index < 8; index += 1) {
        const block = new zim.Rectangle(30, 18, "#d6b078", "#8b5e34", 1, 5)
          .addTo(stage)
          .loc(bridgeX + 28 + index * 30, bridgeY + 116);

        block.mouseEnabled = false;
      }

      // Match slots on the arch.
      for (let index = 0; index < totalPairs; index += 1) {
        const slotX =
          bridgeX + 44 + index * (200 / Math.max(1, totalPairs - 1));
        const slotY =
          bridgeY +
          76 -
          Math.sin((index / Math.max(1, totalPairs - 1)) * Math.PI) * 28;

        const complete = index < completedPairs;

        const slot = new zim.Circle(
          17,
          complete ? "#22c55e" : "rgba(255,255,255,0.82)",
          complete ? "#16a34a" : "#d6b078",
          3,
        )
          .addTo(stage)
          .loc(slotX, slotY);

        slot.mouseEnabled = false;

        if (complete) {
          addLabel({
            text: "✓",
            x: slotX,
            y: slotY - 11,
            size: 17,
            color: "#ffffff",
            bold: true,
            align: "center",
          });
        }
      }

      // Progress badge.
      addPanel({
        x: bridgeX + 78,
        y: bridgeY + 132,
        width: 136,
        height: 78,
        fill: "rgba(255,255,255,0.96)",
        stroke: "#fde68a",
        corner: 24,
      });

      addLabel({
        text: `${completedPairs} / ${totalPairs}`,
        x: bridgeX + 146,
        y: bridgeY + 146,
        size: 26,
        color: "#92400e",
        bold: true,
        align: "center",
      });

      addLabel({
        text: "pairs matched",
        x: bridgeX + 146,
        y: bridgeY + 180,
        size: 11,
        color: "#64748b",
        bold: true,
        align: "center",
      });

      addLabel({
        text: `${progress}% complete`,
        x: bridgeX + 146,
        y: bridgeY + 196,
        size: 11,
        color: "#2563eb",
        bold: true,
        align: "center",
      });
    }

    function drawHeader() {
      addPanel({
        x: 28,
        y: 22,
        width: 112,
        height: 36,
        fill: "#ffffff",
        stroke: "#bfdbfe",
        corner: 18,
      });

      addLabel({
        text: "Game 02",
        x: 84,
        y: 32,
        size: 13,
        color: "#1e3a8a",
        bold: true,
        align: "center",
      });

      addLabel({
        text: "Meaning Bridge",
        x: W / 2,
        y: GAMEPLAY_LAYOUT.header.titleY,
        size: 34,
        color: "#07164f",
        bold: true,
        align: "center",
      });

      addPanel({
        x: W / 2 - 116,
        y: GAMEPLAY_LAYOUT.header.progressY,
        width: 232,
        height: 32,
        fill: "rgba(255,255,255,0.9)",
        stroke: "#a7f3d0",
        corner: 16,
      });

      addLabel({
        text: `${getCompletionPercent()}% complete`,
        x: W / 2,
        y: GAMEPLAY_LAYOUT.header.progressY + 8,
        size: 15,
        color: "#047857",
        bold: true,
        align: "center",
      });

      if (roundType === "timed") {
        const danger = remainingRoundSeconds <= 10;

        addPanel({
          x: W / 2 - 78,
          y: GAMEPLAY_LAYOUT.header.timerY,
          width: 156,
          height: 36,
          fill: danger ? "#fef2f2" : "#fff7ed",
          stroke: danger ? "#fca5a5" : "#fed7aa",
          corner: 18,
        });

        addLabel({
          text: `⏱ ${formatTimer(remainingRoundSeconds)}`,
          x: W / 2,
          y: GAMEPLAY_LAYOUT.header.timerY + 8,
          size: 17,
          color: danger ? "#b91c1c" : "#c2410c",
          bold: true,
          align: "center",
        });
      }

      addPanel({
        x: W - 356,
        y: 24,
        width: 316,
        height: 42,
        fill: "rgba(255,255,255,0.9)",
        stroke: "#bfdbfe",
        corner: 18,
      });

      addLabel({
        text: shortText(status, 44),
        x: W - 338,
        y: 38,
        size: 12,
        color: "#1e3a8a",
        bold: true,
      });

      drawSoundToggle({
        x: W - 150,
        y: 76,
        width: 110,
        height: 34,
      });
    }

    function drawMenuPlayerNamePanel() {
      /*
    Player name panel
    -----------------
    This stays inside the ZIMJS menu canvas.

    Click behavior:
    - Click panel to edit.
    - Type name.
    - Enter/Escape saves.
    - Empty name falls back to "Guest Player".
  */

      const { x, y, width, height } = MENU_LAYOUT.playerPanel;

      addPanel({
        x,
        y,
        width,
        height,
        fill: isEditingPlayerName ? "#eff6ff" : "#ffffff",
        stroke: isEditingPlayerName ? "#2563eb" : "#bfdbfe",
        corner: 18,
      });

      addLabel({
        text: "Player",
        x: x + 16,
        y: y + 10,
        size: 11,
        color: "#64748b",
        bold: true,
      });

      const displayName = isEditingPlayerName
        ? playerName || "Type name..."
        : getNormalizedPlayerName();

      addLabel({
        text: shortText(displayName, 17),
        x: x + 16,
        y: y + 30,
        size: 15,
        color: isEditingPlayerName ? "#1d4ed8" : "#07164f",
        bold: true,
      });

      addLabel({
        text: isEditingPlayerName ? "Enter to save" : "Click to edit",
        x: x + 16,
        y: y + 50,
        size: 10,
        color: "#94a3b8",
        bold: true,
      });

      const clickLayer = new zim.Rectangle(
        width,
        height,
        "rgba(255,255,255,0.01)",
        null,
        0,
        18,
      );

      clickLayer.addTo(stage).loc(x, y);
      clickLayer.cursor = "pointer";
      clickLayer.on("click", beginPlayerNameEdit);
    }

    function addLandingHotspot({ x, y, width, height, onClick }) {
      /*
    Invisible ZIMJS click zone.

    The landing image already has the button artwork baked in, so we only need
    a transparent rectangle to make that area interactive.
  */
      const hotspot = new zim.Rectangle(
        width,
        height,
        "rgba(255,255,255,0.01)",
        null,
        0,
        18,
      );

      hotspot.addTo(stage).loc(x, y);
      hotspot.cursor = "pointer";
      hotspot.on("click", onClick);

      return hotspot;
    }

    function drawLandingScene() {
      /*
    ZIMJS landing scene
    -------------------
    The illustrated landing image is the visual UI.

    We do not draw extra title panels or duplicate buttons here because the
    artwork already includes them. Instead, we place real transparent ZIMJS
    click zones over the visible image buttons.
  */

      drawLandingImageBackground();

      addLandingHotspot({
        ...LANDING_LAYOUT.startHotspot,
        onClick: goToSetupMenu,
      });

      addLandingHotspot({
        ...LANDING_LAYOUT.settingsHotspot,
        onClick: goToSetupMenu,
      });

      addLandingHotspot({
        ...LANDING_LAYOUT.playerHotspot,
        onClick: goToSetupMenu,
      });

      addLandingHotspot({
        ...LANDING_LAYOUT.howToPlayHotspot,
        onClick: () => {
          openRulesScreen("landing");
        },
      });

      addLandingHotspot({
        ...LANDING_LAYOUT.leaderboardHotspot,
        onClick: () => {
          openLeaderboardScreen("landing");
        },
      });

      addLandingHotspot({
        ...LANDING_LAYOUT.soundHotspot,
        onClick: toggleSoundMuted,
      });

      if (soundMuted) {
        addPanel({
          x: 940,
          y: 96,
          width: 126,
          height: 34,
          fill: "rgba(15,23,42,0.72)",
          stroke: "#475569",
          corner: 17,
        });

        addLabel({
          text: "Sound Muted",
          x: 1003,
          y: 106,
          size: 12,
          color: "#ffffff",
          bold: true,
          align: "center",
        });
      }

      if (landingImageFailed) {
        addPanel({
          x: 350,
          y: 300,
          width: 400,
          height: 120,
          fill: "rgba(255,255,255,0.9)",
          stroke: "#bfdbfe",
          corner: 24,
        });

        addLabel({
          text: "Meaning Bridge",
          x: W / 2,
          y: 324,
          size: 34,
          color: "#07164f",
          bold: true,
          align: "center",
        });

        addLabel({
          text: "Landing art fallback active",
          x: W / 2,
          y: 374,
          size: 14,
          color: "#64748b",
          bold: true,
          align: "center",
        });
      }
    }

    function drawMenuScene() {
      /*
    ZIMJS setup/menu scene
    ----------------------
    This is the real setup screen before gameplay.

    The landing screen is the front page.
    This setup screen lets the player configure the round:
    - player name
    - practice/timed mode
    - timer length
    - challenge type
    - difficulty
    - pair count
  */

      const panel = MENU_LAYOUT.panel;

      addPanel({
        x: panel.x,
        y: panel.y,
        width: panel.width,
        height: panel.height,
        fill: "rgba(255,255,255,0.95)",
        stroke: "#bfdbfe",
        corner: 34,
      });

      addLabel({
        text: "Setup Your Bridge",
        x: panel.x + 42,
        y: panel.y + 34,
        size: 38,
        color: "#07164f",
        bold: true,
      });

      addLabel({
        text: "Choose the rules for this round before starting.",
        x: panel.x + 44,
        y: panel.y + 80,
        size: 15,
        color: "#475569",
        bold: true,
      });

      drawMenuPlayerNamePanel();

      /*
    Round type cards
  */
      addLabel({
        text: "Round Type",
        x: MENU_LAYOUT.roundType.x,
        y: MENU_LAYOUT.roundType.y - 30,
        size: 18,
        color: "#065f46",
        bold: true,
      });

      ROUND_TYPES.forEach((entry, index) => {
        const selected = entry.value === roundType;
        const x =
          MENU_LAYOUT.roundType.x +
          index * (MENU_LAYOUT.roundType.cardWidth + MENU_LAYOUT.roundType.gap);
        const y = MENU_LAYOUT.roundType.y;

        addPanel({
          x,
          y,
          width: MENU_LAYOUT.roundType.cardWidth,
          height: MENU_LAYOUT.roundType.cardHeight,
          fill: selected ? "#ecfdf5" : "#ffffff",
          stroke: selected ? "#059669" : "#dbeafe",
          corner: 20,
        });

        addLabel({
          text: entry.label,
          x: x + 18,
          y: y + 12,
          size: 18,
          color: selected ? "#047857" : "#07164f",
          bold: true,
        });

        addLabel({
          text: entry.description,
          x: x + 18,
          y: y + 40,
          size: 11,
          color: selected ? "#047857" : "#64748b",
          bold: true,
        });

        if (selected) {
          new zim.Rectangle(46, 22, "#059669", null, 0, 11)
            .addTo(stage)
            .loc(x + MENU_LAYOUT.roundType.cardWidth - 64, y + 12);

          addLabel({
            text: "ON",
            x: x + MENU_LAYOUT.roundType.cardWidth - 41,
            y: y + 16,
            size: 11,
            color: "#ffffff",
            bold: true,
            align: "center",
          });
        }

        const clickLayer = new zim.Rectangle(
          MENU_LAYOUT.roundType.cardWidth,
          MENU_LAYOUT.roundType.cardHeight,
          "rgba(255,255,255,0.01)",
          null,
          0,
          20,
        );

        clickLayer.addTo(stage).loc(x, y);
        clickLayer.cursor = "pointer";
        clickLayer.on("click", () => {
          selectMenuRoundType(entry.value);
        });
      });

      /*
  Timer selector
  --------------
  Timer now lives inside its own visual panel so the Custom option does not
  crowd the round type cards or player panel.
*/
      addPanel({
        x: MENU_LAYOUT.timerPanel.x,
        y: MENU_LAYOUT.timerPanel.y,
        width: MENU_LAYOUT.timerPanel.width,
        height: MENU_LAYOUT.timerPanel.height,
        fill: roundType === "timed" ? "#faf5ff" : "#f8fafc",
        stroke: roundType === "timed" ? "#ddd6fe" : "#e2e8f0",
        corner: 22,
      });

      addLabel({
        text: "Timer",
        x: MENU_LAYOUT.timerPanel.x + 18,
        y: MENU_LAYOUT.timerPanel.y + 14,
        size: 18,
        color: roundType === "timed" ? "#5b21b6" : "#94a3b8",
        bold: true,
      });

      TIMER_OPTIONS.forEach((entry, index) => {
        const selected = timerOption === entry.value;
        const disabled = roundType !== "timed";

        addButton({
          x:
            MENU_LAYOUT.timer.x +
            index * (MENU_LAYOUT.timer.buttonWidth + MENU_LAYOUT.timer.gap),
          y: MENU_LAYOUT.timer.y,
          width: MENU_LAYOUT.timer.buttonWidth,
          height: MENU_LAYOUT.timer.buttonHeight,
          label: entry.label,
          background: disabled ? "#e2e8f0" : selected ? "#7c3aed" : "#ffffff",
          rollBackground: disabled
            ? "#e2e8f0"
            : selected
              ? "#6d28d9"
              : "#f5f3ff",
          color: disabled ? "#94a3b8" : selected ? "#ffffff" : "#5b21b6",
          borderColor: disabled || selected ? null : "#ddd6fe",
          onClick: () => {
            if (!disabled) {
              selectMenuTimerSeconds(entry.value);
            }
          },
        });
      });

      const customTimerSelected = timerOption === "custom";
      const customTimerDisabled = roundType !== "timed";
      const customTimerX =
        MENU_LAYOUT.timer.x +
        TIMER_OPTIONS.length *
          (MENU_LAYOUT.timer.buttonWidth + MENU_LAYOUT.timer.gap);

      addButton({
        x: customTimerX,
        y: MENU_LAYOUT.timer.y,
        width: MENU_LAYOUT.timer.customWidth,
        height: MENU_LAYOUT.timer.buttonHeight,
        label: customTimerSelected
          ? formatTimer(getCustomTimerSeconds())
          : "Custom",
        background: customTimerDisabled
          ? "#e2e8f0"
          : customTimerSelected
            ? "#7c3aed"
            : "#ffffff",
        rollBackground: customTimerDisabled
          ? "#e2e8f0"
          : customTimerSelected
            ? "#6d28d9"
            : "#f5f3ff",
        color: customTimerDisabled
          ? "#94a3b8"
          : customTimerSelected
            ? "#ffffff"
            : "#5b21b6",
        borderColor:
          customTimerDisabled || customTimerSelected ? null : "#ddd6fe",
        onClick: () => {
          if (!customTimerDisabled) {
            beginCustomTimerEdit();
          }
        },
      });

      addLabel({
        text: isEditingCustomTimer
          ? `Custom: ${customTimerMinutes || "_"} min · Enter to save`
          : roundType === "timed"
            ? `Selected: ${formatTimer(getSelectedTimerSeconds())}`
            : "Practice mode: no countdown",
        x: MENU_LAYOUT.timerPanel.x + 18,
        y: MENU_LAYOUT.timerPanel.y + 84,
        size: 11,
        color: roundType === "timed" ? "#5b21b6" : "#64748b",
        bold: true,
      });

      /*
    Challenge mode section
  */
      addLabel({
        text: "Challenge Mode",
        x: MENU_LAYOUT.modeTitle.x,
        y: MENU_LAYOUT.modeTitle.y,
        size: 20,
        color: "#1e3a8a",
        bold: true,
      });

      MODES.forEach((entry, index) => {
        const selected = entry.value === mode;
        const col = index % 3;
        const row = Math.floor(index / 3);

        const x =
          MENU_LAYOUT.modeGrid.x +
          col *
            (MENU_LAYOUT.modeGrid.cardWidth + MENU_LAYOUT.modeGrid.columnGap);

        const y =
          MENU_LAYOUT.modeGrid.y +
          row * (MENU_LAYOUT.modeGrid.cardHeight + MENU_LAYOUT.modeGrid.rowGap);

        addPanel({
          x,
          y,
          width: MENU_LAYOUT.modeGrid.cardWidth,
          height: MENU_LAYOUT.modeGrid.cardHeight,
          fill: selected ? "#eff6ff" : "#ffffff",
          stroke: selected ? "#2563eb" : "#dbeafe",
          corner: 18,
        });

        addLabel({
          text: shortText(entry.label, 22),
          x: x + 16,
          y: y + 8,
          size: 14,
          color: selected ? "#1d4ed8" : "#07164f",
          bold: true,
        });

        addLabel({
          text: getModeDescription(entry.value),
          x: x + 16,
          y: y + 30,
          size: 9,
          color: selected ? "#2563eb" : "#64748b",
          bold: true,
        });

        const clickLayer = new zim.Rectangle(
          MENU_LAYOUT.modeGrid.cardWidth,
          MENU_LAYOUT.modeGrid.cardHeight,
          "rgba(255,255,255,0.01)",
          null,
          0,
          18,
        );

        clickLayer.addTo(stage).loc(x, y);
        clickLayer.cursor = "pointer";
        clickLayer.on("click", () => {
          selectMenuMode(entry.value);
        });
      });

      /*
    Difficulty selector
  */
      addLabel({
        text: "Difficulty",
        x: MENU_LAYOUT.difficulty.labelX,
        y: MENU_LAYOUT.difficulty.labelY,
        size: 16,
        color: "#047857",
        bold: true,
        align: "center",
      });

      DIFFICULTIES.forEach((entry, index) => {
        const selected = entry === difficulty;

        addButton({
          x:
            MENU_LAYOUT.difficulty.x +
            index *
              (MENU_LAYOUT.difficulty.buttonWidth + MENU_LAYOUT.difficulty.gap),
          y: MENU_LAYOUT.difficulty.y,
          width: MENU_LAYOUT.difficulty.buttonWidth,
          height: MENU_LAYOUT.difficulty.buttonHeight,
          label: entry,
          background: selected ? "#059669" : "#ffffff",
          rollBackground: selected ? "#047857" : "#ecfdf5",
          color: selected ? "#ffffff" : "#047857",
          borderColor: selected ? null : "#a7f3d0",
          onClick: () => {
            selectMenuDifficulty(entry);
          },
        });
      });

      /*
    Pair-count selector
  */
      addLabel({
        text: "Pairs",
        x: MENU_LAYOUT.pairs.labelX,
        y: MENU_LAYOUT.pairs.labelY,
        size: 16,
        color: "#5b21b6",
        bold: true,
        align: "center",
      });

      PAIR_COUNTS.forEach((entry, index) => {
        const selected = entry === pairCount;

        addButton({
          x:
            MENU_LAYOUT.pairs.x +
            index * (MENU_LAYOUT.pairs.buttonWidth + MENU_LAYOUT.pairs.gap),
          y: MENU_LAYOUT.pairs.y,
          width: MENU_LAYOUT.pairs.buttonWidth,
          height: MENU_LAYOUT.pairs.buttonHeight,
          label: `${entry}`,
          background: selected ? "#7c3aed" : "#ffffff",
          rollBackground: selected ? "#6d28d9" : "#f5f3ff",
          color: selected ? "#ffffff" : "#5b21b6",
          borderColor: selected ? null : "#ddd6fe",
          onClick: () => {
            selectMenuPairCount(entry);
          },
        });
      });

      drawSoundToggle({
        x: 836,
        y: MENU_LAYOUT.startButton.y + 5,
        width: 110,
        height: 38,
      });

      /*
    Start action
  */

      addButton({
        x: 170,
        y: MENU_LAYOUT.startButton.y + 5,
        width: 138,
        height: 38,
        label: "Leaderboard",
        background: "#f59e0b",
        rollBackground: "#d97706",
        onClick: () => {
          openLeaderboardScreen("menu");
        },
      });

      addButton({
        x: 322,
        y: MENU_LAYOUT.startButton.y + 5,
        width: 108,
        height: 38,
        label: "Rules",
        background: "#2563eb",
        rollBackground: "#1d4ed8",
        onClick: () => {
          openRulesScreen("menu");
        },
      });

      addButton({
        x: MENU_LAYOUT.startButton.x,
        y: MENU_LAYOUT.startButton.y,
        width: MENU_LAYOUT.startButton.width,
        height: MENU_LAYOUT.startButton.height,
        label:
          roundType === "timed"
            ? `Start ${formatTimer(getSelectedTimerSeconds())}`
            : "Start Practice",
        background: "#4f46e5",
        rollBackground: "#4338ca",
        onClick: startBridgeRound,
      });

      addLabel({
        text: `${
          MODES.find((entry) => entry.value === mode)?.label || "Mode"
        } · ${difficulty} · ${pairCount} pairs · ${
          roundType === "timed"
            ? formatTimer(getSelectedTimerSeconds())
            : "practice"
        }`,
        x: W / 2,
        y: 648,
        size: 12,
        color: "#64748b",
        bold: true,
        align: "center",
      });
    }

    function drawPassagePanel() {
      const passage = roundData?.passage;
      const { x, y, width, height } = GAMEPLAY_LAYOUT.passage;

      addPanel({
        x,
        y,
        width,
        height,
        fill: "rgba(255,255,255,0.96)",
        stroke: "#fed7aa",
        corner: 28,
      });

      new zim.Circle(28, "#7c3aed").addTo(stage).loc(x + 42, y + 52);

      addLabel({
        text: "📖",
        x: x + 42,
        y: y + 34,
        size: 25,
        color: "#ffffff",
        bold: true,
        align: "center",
      });

      if (!passage) {
        addLabel({
          text: "Loading passage...",
          x: x + 90,
          y: y + 38,
          size: 20,
          color: "#475569",
          bold: true,
        });
        return;
      }

      addLabel({
        text: passage.title,
        x: x + 90,
        y: y + 20,
        size: 26,
        color: "#07164f",
        bold: true,
      });

      addLabel({
        text: `${passage.difficulty} · ${passage.theme}`,
        x: x + width - 180,
        y: y + 24,
        size: 12,
        color: "#047857",
        bold: true,
      });

      addWrappedLabel({
        text: passage.text,
        x: x + 90,
        y: y + 58,
        maxCharsPerLine: 96,
        maxLines: 2,
        size: 13,
        lineHeight: 17,
        color: "#334155",
        bold: true,
      });
    }

    function drawCard({ item, side, x, y }) {
      const matched =
        side === "left" ? isLeftMatched(item.id) : isRightMatched(item.id);

      const selected = side === "left" && selectedLeftId === item.id;

      const isLeft = side === "left";

      const fill = matched ? "#dcfce7" : selected ? "#dbeafe" : "#ffffff";
      const stroke = matched ? "#16a34a" : selected ? "#2563eb" : "#e5e7eb";
      const textColor = matched ? "#064e3b" : selected ? "#1e3a8a" : "#111827";
      const subTextColor = matched
        ? "#15803d"
        : selected
          ? "#2563eb"
          : "#64748b";

      const iconFill = isLeft
        ? selected
          ? "#2563eb"
          : "#3b82f6"
        : matched
          ? "#16a34a"
          : "#10b981";

      function activateCard() {
        if (side === "left") {
          handleLeftCard(item);
        } else {
          handleRightCard(item);
        }
      }

      /*
    Card shadow.
  */
      const shadow = new zim.Rectangle(
        GAMEPLAY_LAYOUT.card.width,
        GAMEPLAY_LAYOUT.card.height,
        "rgba(15,23,42,0.12)",
        null,
        0,
        14,
      )
        .addTo(stage)
        .loc(x + 3, y + 4);

      shadow.mouseEnabled = false;

      /*
    Card visual base.
  */
      const base = new zim.Rectangle(
        GAMEPLAY_LAYOUT.card.width,
        GAMEPLAY_LAYOUT.card.height,
        fill,
        stroke,
        selected ? 4 : matched ? 3 : 2,
        14,
      )
        .addTo(stage)
        .loc(x, y);

      base.mouseEnabled = false;

      /*
    Left-side drag dots.
  */
      for (let index = 0; index < 3; index += 1) {
        const dot = new zim.Circle(2.2, "#cbd5e1")
          .addTo(stage)
          .loc(x + 14, y + 13 + index * 7);

        dot.mouseEnabled = false;
      }

      /*
    Icon tile.
  */
      const iconTile = new zim.Rectangle(36, 30, iconFill, null, 0, 10)
        .addTo(stage)
        .loc(x + 28, y + 4);

      iconTile.mouseEnabled = false;

      addLabel({
        text: isLeft ? "A" : "M",
        x: x + 46,
        y: y + 10,
        size: 14,
        color: "#ffffff",
        bold: true,
        align: "center",
      });

      addLabel({
        text: shortText(item.label, 23),
        x: x + 78,
        y: y + 6,
        size: 14,
        color: textColor,
        bold: true,
      });

      addLabel({
        text: shortText(item.sublabel, 27),
        x: x + 78,
        y: y + 23,
        size: 9,
        color: subTextColor,
        bold: true,
      });

      /*
    Speaker / status area.
    Visual only for now. It can become audio support later.
  */
      if (matched) {
        const matchedCircle = new zim.Circle(10, "#16a34a")
          .addTo(stage)
          .loc(x + GAMEPLAY_LAYOUT.card.width - 22, y + 19);

        matchedCircle.mouseEnabled = false;

        addLabel({
          text: "✓",
          x: x + GAMEPLAY_LAYOUT.card.width - 22,
          y: y + 10,
          size: 13,
          color: "#ffffff",
          bold: true,
          align: "center",
        });
      } else if (selected) {
        const selectedCircle = new zim.Circle(10, "#2563eb")
          .addTo(stage)
          .loc(x + GAMEPLAY_LAYOUT.card.width - 22, y + 19);

        selectedCircle.mouseEnabled = false;

        addLabel({
          text: "●",
          x: x + GAMEPLAY_LAYOUT.card.width - 22,
          y: y + 10,
          size: 12,
          color: "#ffffff",
          bold: true,
          align: "center",
        });
      } else {
        addLabel({
          text: "›",
          x: x + GAMEPLAY_LAYOUT.card.width - 22,
          y: y + 7,
          size: 22,
          color: "#94a3b8",
          bold: true,
          align: "center",
        });
      }

      /*
    Reliable card hit area.
    ----------------------
    This transparent layer sits above labels/icons so every part of the card
    responds to input.

    We use mousedown because timed mode redraws the canvas every second.
  */
      const hitLayer = new zim.Rectangle(
        GAMEPLAY_LAYOUT.card.width + 12,
        GAMEPLAY_LAYOUT.card.height + 10,
        "rgba(255,255,255,0.01)",
        null,
        0,
        16,
      );

      hitLayer.addTo(stage).loc(x - 6, y - 5);
      hitLayer.cursor = "pointer";
      hitLayer.on("mousedown", activateCard);
    }

    function drawCards() {
      const puzzle = roundData?.puzzle;
      const left = GAMEPLAY_LAYOUT.leftPanel;
      const right = GAMEPLAY_LAYOUT.rightPanel;
      const card = GAMEPLAY_LAYOUT.card;

      /*
    Word card panel
  */
      addPanel({
        x: left.x,
        y: left.y,
        width: left.width,
        height: left.height,
        fill: "rgba(239,246,255,0.96)",
        stroke: "#60a5fa",
        corner: 28,
      });

      new zim.Rectangle(178, 42, "#2563eb", "#1d4ed8", 2, 16)
        .addTo(stage)
        .loc(left.x + 54, left.y - 22);

      addLabel({
        text: "Word Cards",
        x: left.x + 154,
        y: left.y - 10,
        size: 18,
        color: "#ffffff",
        bold: true,
        align: "center",
      });

      addLabel({
        text: "A",
        x: left.x + 74,
        y: left.y - 11,
        size: 16,
        color: "#ffffff",
        bold: true,
        align: "center",
      });

      /*
    Meaning card panel
  */
      addPanel({
        x: right.x,
        y: right.y,
        width: right.width,
        height: right.height,
        fill: "rgba(240,253,244,0.96)",
        stroke: "#4ade80",
        corner: 28,
      });

      new zim.Rectangle(196, 42, "#059669", "#047857", 2, 16)
        .addTo(stage)
        .loc(right.x + 48, right.y - 22);

      addLabel({
        text: "Meaning Cards",
        x: right.x + 160,
        y: right.y - 10,
        size: 18,
        color: "#ffffff",
        bold: true,
        align: "center",
      });

      addLabel({
        text: "📖",
        x: right.x + 74,
        y: right.y - 14,
        size: 18,
        color: "#ffffff",
        bold: true,
        align: "center",
      });

      if (!puzzle) {
        addLabel({
          text: "Loading cards...",
          x: W / 2,
          y: 456,
          size: 20,
          color: "#475569",
          bold: true,
          align: "center",
        });
        return;
      }

      puzzle.leftItems.forEach((item, index) => {
        drawCard({
          item,
          side: "left",
          x: left.x + card.xOffset,
          y: left.y + card.yOffset + index * card.step,
        });
      });

      puzzle.rightItems.forEach((item, index) => {
        drawCard({
          item,
          side: "right",
          x: right.x + card.xOffset,
          y: right.y + card.yOffset + index * card.step,
        });
      });
    }

    function drawConnections() {
      const puzzle = roundData?.puzzle;

      if (!puzzle) {
        return;
      }

      /*
    Connection vines
    ----------------
    These are drawn before the card panels in renderScene after the next step.
    Mouse is disabled so the connectors never block card clicking.
  */

      const left = GAMEPLAY_LAYOUT.leftPanel;
      const right = GAMEPLAY_LAYOUT.rightPanel;
      const card = GAMEPLAY_LAYOUT.card;

      matches.forEach((match) => {
        const leftIndex = puzzle.leftItems.findIndex(
          (item) => item.id === match.leftId,
        );

        const rightIndex = puzzle.rightItems.findIndex(
          (item) => item.id === match.rightId,
        );

        if (leftIndex < 0 || rightIndex < 0) {
          return;
        }

        const leftX = left.x + card.xOffset + card.width;
        const rightX = right.x + card.xOffset;

        const y1 =
          left.y + card.yOffset + leftIndex * card.step + card.height / 2;
        const y2 =
          right.y + card.yOffset + rightIndex * card.step + card.height / 2;

        const connector = new zim.Shape().addTo(stage);
        connector.mouseEnabled = false;

        connector
          .s("rgba(34,197,94,0.72)")
          .ss(7)
          .mt(leftX, y1)
          .bt(470, y1 - 24, 630, y2 - 24, rightX, y2);

        const connectorHighlight = new zim.Shape().addTo(stage);
        connectorHighlight.mouseEnabled = false;

        connectorHighlight
          .s("#bbf7d0")
          .ss(2)
          .mt(leftX, y1)
          .bt(470, y1 - 24, 630, y2 - 24, rightX, y2);

        const leftDot = new zim.Circle(6, "#22c55e")
          .addTo(stage)
          .loc(leftX, y1);
        const rightDot = new zim.Circle(6, "#22c55e")
          .addTo(stage)
          .loc(rightX, y2);

        leftDot.mouseEnabled = false;
        rightDot.mouseEnabled = false;
      });
    }

    function drawFeedbackPanel() {
      const fill =
        feedbackType === "success"
          ? "#ecfdf5"
          : feedbackType === "error"
            ? "#fef2f2"
            : "#eff6ff";

      const stroke =
        feedbackType === "success"
          ? "#86efac"
          : feedbackType === "error"
            ? "#fca5a5"
            : "#93c5fd";

      const color =
        feedbackType === "success"
          ? "#047857"
          : feedbackType === "error"
            ? "#b91c1c"
            : "#1d4ed8";

      const x = GAMEPLAY_LAYOUT.centerPanel.x;
      const y = GAMEPLAY_LAYOUT.feedback.y;
      const width = GAMEPLAY_LAYOUT.centerPanel.width;

      addPanel({
        x,
        y,
        width,
        height: GAMEPLAY_LAYOUT.feedback.height,
        fill,
        stroke,
        corner: 22,
      });

      addLabel({
        text: "Guide Message",
        x: x + 20,
        y: y + 14,
        size: 13,
        color: "#64748b",
        bold: true,
      });

      addWrappedLabel({
        text: feedback,
        x: x + 20,
        y: y + 38,
        maxCharsPerLine: 34,
        maxLines: 2,
        size: 14,
        lineHeight: 18,
        color,
        bold: true,
      });

      addLabel({
        text: `Hints ${hintsUsed} · Wrong ${wrongAttempts}`,
        x: x + 20,
        y: y + 74,
        size: 11,
        color: "#475569",
        bold: true,
      });
    }

    function drawControls() {
      const x = GAMEPLAY_LAYOUT.centerPanel.x;
      const y = GAMEPLAY_LAYOUT.controls.y;

      /*
    Primary action row
  */
      addButton({
        x,
        y,
        width: 84,
        height: 38,
        label: "Hint",
        background: "#7c3aed",
        rollBackground: "#6d28d9",
        onClick: useHint,
      });

      addButton({
        x: x + 100,
        y,
        width: 86,
        height: 38,
        label: "Reset",
        background: "#f59e0b",
        rollBackground: "#d97706",
        onClick: resetRound,
      });

      addButton({
        x: x + 202,
        y: y - 4,
        width: 116,
        height: 46,
        label: isSubmittingRound ? "Wait..." : "Submit",
        background:
          matches.length === roundData?.puzzle?.leftItems?.length
            ? "#059669"
            : "#10b981",
        rollBackground: "#047857",
        onClick: () => {
          if (!isSubmittingRound) {
            void submitRound();
          }
        },
      });

      /*
    Secondary action row
  */
      addButton({
        x: x + 34,
        y: GAMEPLAY_LAYOUT.controls.secondaryY,
        width: 104,
        height: 38,
        label: "Menu",
        background: "#2563eb",
        rollBackground: "#1d4ed8",
        onClick: requestBackToMenu,
      });

      addButton({
        x: x + 154,
        y: GAMEPLAY_LAYOUT.controls.secondaryY,
        width: 132,
        height: 38,
        label: "New Round",
        background: "#ea580c",
        rollBackground: "#c2410c",
        onClick: requestNewRound,
      });

      /*
    Tip ribbon.
  */
      addPanel({
        x: x - 26,
        y: GAMEPLAY_LAYOUT.controls.secondaryY + 52,
        width: 344,
        height: 30,
        fill: "rgba(255,255,255,0.92)",
        stroke: "#bfdbfe",
        corner: 15,
      });

      addLabel({
        text: "Keys: 1–6 cards · H hint · R reset · S submit · N new · M menu",
        x: x + 146,
        y: GAMEPLAY_LAYOUT.controls.secondaryY + 60,
        size: 11,
        color: "#2563eb",
        bold: true,
        align: "center",
      });
    }

    function drawRoundSummary() {
      const x = GAMEPLAY_LAYOUT.centerPanel.x;
      const y = GAMEPLAY_LAYOUT.centerPanel.y;
      const width = GAMEPLAY_LAYOUT.centerPanel.width;

      addPanel({
        x,
        y,
        width,
        height: 92,
        fill: "rgba(255,255,255,0.96)",
        stroke: "#fde68a",
        corner: 24,
      });

      addLabel({
        text: "Bridge Progress",
        x: x + 20,
        y: y + 14,
        size: 14,
        color: "#92400e",
        bold: true,
      });

      addLabel({
        text: shortText(getNormalizedPlayerName(), 22),
        x: x + 20,
        y: y + 36,
        size: 13,
        color: "#07164f",
        bold: true,
      });

      addLabel({
        text: `${matches.length}/${
          roundData?.puzzle?.leftItems?.length || pairCount
        } pairs · ${getCompletionPercent()}%`,
        x: x + 20,
        y: y + 58,
        size: 18,
        color: "#047857",
        bold: true,
      });

      addLabel({
        text:
          roundType === "timed"
            ? `Timer ${formatTimer(remainingRoundSeconds)}`
            : "Practice Mode",
        x: x + width - 20,
        y: y + 18,
        size: 12,
        color: roundType === "timed" ? "#c2410c" : "#64748b",
        bold: true,
        align: "right",
      });
    }

    function drawQuitConfirmationPanel() {
      if (!quitConfirmVisible) {
        return;
      }

      /*
    Quit confirmation modal
    -----------------------
    Drawn on top of gameplay when the player tries to leave an active round.

    The dim layer intentionally catches pointer input so underlying gameplay
    buttons/cards are not accidentally clicked.
  */

      const dim = new zim.Rectangle(W, H, "rgba(15,23,42,0.42)")
        .addTo(stage)
        .loc(0, 0);

      dim.cursor = "default";
      dim.on("mousedown", () => {});

      const panelX = 330;
      const panelY = 220;
      const panelWidth = 440;
      const panelHeight = 250;

      addPanel({
        x: panelX,
        y: panelY,
        width: panelWidth,
        height: panelHeight,
        fill: "rgba(255,255,255,0.98)",
        stroke: "#fca5a5",
        corner: 30,
      });

      new zim.Circle(36, "#ef4444").addTo(stage).loc(panelX + 70, panelY + 68);

      addLabel({
        text: "!",
        x: panelX + 70,
        y: panelY + 44,
        size: 34,
        color: "#ffffff",
        bold: true,
        align: "center",
      });

      addLabel({
        text:
          quitConfirmAction === "new-round"
            ? "Start a new round?"
            : "Quit current round?",
        x: panelX + 126,
        y: panelY + 42,
        size: 28,
        color: "#07164f",
        bold: true,
      });

      addWrappedLabel({
        text:
          quitConfirmAction === "new-round"
            ? "Your current matches, timer progress, hints, and wrong attempts will be lost if you start over."
            : "Your current matches, timer progress, hints, and wrong attempts will be lost if you return to setup.",
        x: panelX + 126,
        y: panelY + 88,
        maxCharsPerLine: 42,
        maxLines: 3,
        size: 13,
        lineHeight: 18,
        color: "#475569",
        bold: true,
      });

      addButton({
        x: panelX + 76,
        y: panelY + 176,
        width: 132,
        height: 42,
        label: "Cancel",
        background: "#2563eb",
        rollBackground: "#1d4ed8",
        onClick: cancelQuitConfirmation,
      });

      addButton({
        x: panelX + 232,
        y: panelY + 176,
        width: 148,
        height: 42,
        label: quitConfirmAction === "new-round" ? "Start Over" : "Quit Round",
        background: "#dc2626",
        rollBackground: "#b91c1c",
        onClick: confirmQuitRound,
      });

      addLabel({
        text: "Keys: Esc cancel · Enter confirm",
        x: panelX + panelWidth / 2,
        y: panelY + 228,
        size: 11,
        color: "#64748b",
        bold: true,
        align: "center",
      });
    }

    function drawResultPanel() {
      if (!result) {
        return;
      }

      /*
    Adventure-style result screen
    -----------------------------
    This appears after the player submits or timed mode auto-submits.

    It shows:
    - final score
    - round point result
    - accuracy and performance stats
    - top explorers leaderboard
    - keyboard shortcuts for next/menu
  */

      const perfectScore = result.perfectRound && result.roundPoints > 0;
      const title = getResultTitle();
      const badgeIcon = getResultBadge();

      const dim = new zim.Rectangle(W, H, "rgba(15,23,42,0.34)")
        .addTo(stage)
        .loc(0, 0);

      dim.mouseEnabled = false;

      const panelX = 190;
      const panelY = 82;
      const panelWidth = 720;
      const panelHeight = 552;

      addPanel({
        x: panelX,
        y: panelY,
        width: panelWidth,
        height: panelHeight,
        fill: "rgba(255,255,255,0.985)",
        stroke: perfectScore ? "#22c55e" : "#facc15",
        corner: 34,
      });

      /*
    Header badge
  */
      new zim.Circle(54, perfectScore ? "#22c55e" : "#f59e0b")
        .addTo(stage)
        .loc(panelX + 86, panelY + 82);

      addLabel({
        text: badgeIcon,
        x: panelX + 86,
        y: panelY + 50,
        size: 42,
        color: "#ffffff",
        bold: true,
        align: "center",
      });

      addLabel({
        text: "Bridge Complete",
        x: panelX + 160,
        y: panelY + 38,
        size: 16,
        color: perfectScore ? "#047857" : "#b45309",
        bold: true,
      });

      addLabel({
        text: title,
        x: panelX + 160,
        y: panelY + 66,
        size: 34,
        color: "#07164f",
        bold: true,
      });

      addWrappedLabel({
        text: result.message || "Your bridge round has been submitted.",
        x: panelX + 160,
        y: panelY + 112,
        maxCharsPerLine: 56,
        maxLines: 2,
        size: 13,
        lineHeight: 18,
        color: "#475569",
        bold: true,
      });

      /*
    Main score card
  */
      addPanel({
        x: panelX + 36,
        y: panelY + 176,
        width: 190,
        height: 142,
        fill: "#fff7ed",
        stroke: "#fed7aa",
        corner: 24,
      });

      addLabel({
        text: "Score",
        x: panelX + 58,
        y: panelY + 194,
        size: 14,
        color: "#92400e",
        bold: true,
      });

      addLabel({
        text: `${result.score}`,
        x: panelX + 130,
        y: panelY + 218,
        size: 54,
        color: "#111827",
        bold: true,
        align: "center",
      });

      addLabel({
        text: "points earned",
        x: panelX + 130,
        y: panelY + 284,
        size: 13,
        color: "#64748b",
        bold: true,
        align: "center",
      });

      /*
    Round point card
  */
      addPanel({
        x: panelX + 36,
        y: panelY + 336,
        width: 190,
        height: 92,
        fill: perfectScore ? "#ecfdf5" : "#f8fafc",
        stroke: perfectScore ? "#86efac" : "#e2e8f0",
        corner: 22,
      });

      addLabel({
        text: "Round Point",
        x: panelX + 58,
        y: panelY + 354,
        size: 13,
        color: "#64748b",
        bold: true,
      });

      addLabel({
        text: result.roundPoints > 0 ? "+1 earned" : "Not earned",
        x: panelX + 58,
        y: panelY + 382,
        size: 22,
        color: result.roundPoints > 0 ? "#047857" : "#475569",
        bold: true,
      });

      /*
    Performance stat grid
  */
      const stats = [
        ["Accuracy", `${result.accuracy}%`],
        ["Correct", `${result.correctMatches}/${result.totalMatches}`],
        ["Time", `${result.timeSeconds}s`],
        ["Hints", `${result.hintsUsed}`],
        ["Wrong", `${result.wrongAttempts}`],
        ["Perfect", result.perfectRound ? "Yes" : "No"],
      ];

      stats.forEach(([label, value], index) => {
        const col = index % 3;
        const row = Math.floor(index / 3);

        const statX = panelX + 260 + col * 138;
        const statY = panelY + 176 + row * 82;

        addPanel({
          x: statX,
          y: statY,
          width: 122,
          height: 62,
          fill: "#f8fafc",
          stroke: "#e2e8f0",
          corner: 18,
        });

        addLabel({
          text: label,
          x: statX + 14,
          y: statY + 11,
          size: 11,
          color: "#64748b",
          bold: true,
        });

        addLabel({
          text: value,
          x: statX + 14,
          y: statY + 34,
          size: 18,
          color:
            label === "Perfect" && value === "Yes"
              ? "#047857"
              : label === "Wrong" && Number(result.wrongAttempts) > 0
                ? "#b91c1c"
                : "#111827",
          bold: true,
        });
      });

      /*
    Top Explorers result leaderboard
  */
      addPanel({
        x: panelX + 260,
        y: panelY + 350,
        width: 404,
        height: 114,
        fill: "#f0fdf4",
        stroke: "#bbf7d0",
        corner: 22,
      });

      addLabel({
        text: "🏆 Top Explorers",
        x: panelX + 284,
        y: panelY + 368,
        size: 16,
        color: "#065f46",
        bold: true,
      });

      const topEntries = leaderboard.slice(0, 3);

      if (topEntries.length === 0) {
        addLabel({
          text: "No scores yet.",
          x: panelX + 284,
          y: panelY + 410,
          size: 13,
          color: "#64748b",
          bold: true,
        });
      } else {
        topEntries.forEach((entry, index) => {
          const rowX = panelX + 284 + index * 122;

          new zim.Circle(14, index === 0 ? "#facc15" : "#e2e8f0")
            .addTo(stage)
            .loc(rowX, panelY + 420);

          addLabel({
            text: `${index + 1}`,
            x: rowX,
            y: panelY + 411,
            size: 11,
            color: index === 0 ? "#92400e" : "#475569",
            bold: true,
            align: "center",
          });

          addLabel({
            text: shortText(entry.playerName, 10),
            x: rowX + 22,
            y: panelY + 402,
            size: 11,
            color: "#111827",
            bold: true,
          });

          addLabel({
            text: `${entry.totalScore} pts`,
            x: rowX + 22,
            y: panelY + 420,
            size: 10,
            color: "#64748b",
            bold: true,
          });
        });
      }

      /*
    Action buttons
  */
      addButton({
        x: panelX + 154,
        y: panelY + 492,
        width: 116,
        height: 42,
        label: "Menu",
        background: "#2563eb",
        rollBackground: "#1d4ed8",
        onClick: backToMenu,
      });

      addButton({
        x: panelX + 292,
        y: panelY + 492,
        width: 142,
        height: 42,
        label: "Leaderboard",
        background: "#f59e0b",
        rollBackground: "#d97706",
        onClick: () => {
          openLeaderboardScreen("gameplay");
        },
      });

      addButton({
        x: panelX + 456,
        y: panelY + 492,
        width: 158,
        height: 42,
        label: "Next Round",
        background: "#059669",
        rollBackground: "#047857",
        onClick: () => {
          void loadRound();
        },
      });

      addLabel({
        text: "Keys: Enter/N next round · L leaderboard · M/Esc menu",
        x: panelX + panelWidth / 2,
        y: panelY + 538,
        size: 11,
        color: "#64748b",
        bold: true,
        align: "center",
      });
    }

    function drawLeaderboard() {
      const { x, y, width, height } = GAMEPLAY_LAYOUT.leaderboard;

      addPanel({
        x,
        y,
        width,
        height,
        fill: "rgba(255,255,255,0.94)",
        stroke: "#fde68a",
        corner: 22,
      });

      addLabel({
        text: "🏆 Top Explorers",
        x: x + 28,
        y: y + 17,
        size: 16,
        color: "#92400e",
        bold: true,
      });

      if (leaderboard.length === 0) {
        addLabel({
          text: "No scores yet.",
          x: x + 188,
          y: y + 18,
          size: 14,
          color: "#64748b",
          bold: true,
        });
        return;
      }

      leaderboard.slice(0, 4).forEach((entry, index) => {
        const rowX = x + 210 + index * 155;

        new zim.Circle(13, index === 0 ? "#facc15" : "#e2e8f0")
          .addTo(stage)
          .loc(rowX, y + 27);

        addLabel({
          text: `${index + 1}`,
          x: rowX,
          y: y + 18,
          size: 11,
          color: index === 0 ? "#92400e" : "#475569",
          bold: true,
          align: "center",
        });

        addLabel({
          text: shortText(entry.playerName, 11),
          x: rowX + 22,
          y: y + 12,
          size: 12,
          color: "#111827",
          bold: true,
        });

        addLabel({
          text: `${entry.totalScore} pts`,
          x: rowX + 22,
          y: y + 30,
          size: 10,
          color: "#64748b",
          bold: true,
        });
      });
    }

    function drawLeaderboardScreen() {
      /*
    Full Top Explorers screen
    -------------------------
    Dedicated leaderboard scene for Meaning Bridge.

    This is separate from:
    - the small gameplay leaderboard strip
    - the mini leaderboard shown on the result overlay
  */

      addPanel({
        x: 130,
        y: 74,
        width: 840,
        height: 570,
        fill: "rgba(255,255,255,0.97)",
        stroke: "#fde68a",
        corner: 34,
      });

      addButton({
        x: 160,
        y: 100,
        width: 102,
        height: 36,
        label: "Back",
        background: "#2563eb",
        rollBackground: "#1d4ed8",
        onClick: closeLeaderboardScreen,
      });

      addLabel({
        text: "🏆 Top Explorers",
        x: W / 2,
        y: 106,
        size: 38,
        color: "#07164f",
        bold: true,
        align: "center",
      });

      addLabel({
        text: "Best Meaning Bridge players across submitted rounds.",
        x: W / 2,
        y: 156,
        size: 15,
        color: "#64748b",
        bold: true,
        align: "center",
      });

      addPanel({
        x: 190,
        y: 200,
        width: 720,
        height: 54,
        fill: "#f8fafc",
        stroke: "#e2e8f0",
        corner: 18,
      });

      addLabel({
        text: "Rank",
        x: 222,
        y: 218,
        size: 13,
        color: "#64748b",
        bold: true,
      });

      addLabel({
        text: "Player",
        x: 330,
        y: 218,
        size: 13,
        color: "#64748b",
        bold: true,
      });

      addLabel({
        text: "Score",
        x: 650,
        y: 218,
        size: 13,
        color: "#64748b",
        bold: true,
      });

      addLabel({
        text: "Round Points",
        x: 770,
        y: 218,
        size: 13,
        color: "#64748b",
        bold: true,
      });

      if (leaderboard.length === 0) {
        addPanel({
          x: 300,
          y: 310,
          width: 500,
          height: 120,
          fill: "#f8fafc",
          stroke: "#e2e8f0",
          corner: 24,
        });

        addLabel({
          text: "No scores yet.",
          x: W / 2,
          y: 340,
          size: 26,
          color: "#07164f",
          bold: true,
          align: "center",
        });

        addLabel({
          text: "Play a round and submit your bridge to appear here.",
          x: W / 2,
          y: 382,
          size: 14,
          color: "#64748b",
          bold: true,
          align: "center",
        });
      } else {
        leaderboard.slice(0, 10).forEach((entry, index) => {
          const rowY = 270 + index * 34;
          const firstPlace = index === 0;

          addPanel({
            x: 190,
            y: rowY,
            width: 720,
            height: 28,
            fill: firstPlace
              ? "#fffbeb"
              : index % 2 === 0
                ? "#ffffff"
                : "#f8fafc",
            stroke: firstPlace ? "#fde68a" : "#e2e8f0",
            corner: 12,
          });

          const rankCircle = new zim.Circle(
            12,
            firstPlace ? "#facc15" : "#e2e8f0",
          )
            .addTo(stage)
            .loc(236, rowY + 14);

          rankCircle.mouseEnabled = false;

          addLabel({
            text: `${index + 1}`,
            x: 236,
            y: rowY + 6,
            size: 10,
            color: firstPlace ? "#92400e" : "#475569",
            bold: true,
            align: "center",
          });

          addLabel({
            text: shortText(entry.playerName, 24),
            x: 330,
            y: rowY + 7,
            size: 13,
            color: "#111827",
            bold: true,
          });

          addLabel({
            text: `${entry.totalScore || 0}`,
            x: 650,
            y: rowY + 7,
            size: 13,
            color: "#047857",
            bold: true,
          });

          addLabel({
            text: `${entry.roundPoints || 0}`,
            x: 820,
            y: rowY + 7,
            size: 13,
            color: "#5b21b6",
            bold: true,
            align: "center",
          });
        });
      }

      addButton({
        x: 370,
        y: 586,
        width: 150,
        height: 42,
        label: "Setup",
        background: "#4f46e5",
        rollBackground: "#4338ca",
        onClick: goToSetupMenu,
      });

      addButton({
        x: 546,
        y: 586,
        width: 170,
        height: 42,
        label: "Refresh",
        background: "#059669",
        rollBackground: "#047857",
        onClick: () => {
          void loadLeaderboard(10).then(() => {
            renderScene();
          });
        },
      });

      addLabel({
        text: "Keys: L leaderboard · Esc/M back · Enter setup",
        x: W / 2,
        y: 660,
        size: 11,
        color: "#64748b",
        bold: true,
        align: "center",
      });
    }

    function drawRulesScreen() {
      /*
    Full How to Play / Rules screen
    -------------------------------
    This explains the game now that Meaning Bridge has moved beyond POC.

    It is intentionally separate from the setup screen so players can learn
    the rules without starting a round.
  */

      addPanel({
        x: 110,
        y: 58,
        width: 880,
        height: 604,
        fill: "rgba(255,255,255,0.97)",
        stroke: "#bfdbfe",
        corner: 34,
      });

      addButton({
        x: 142,
        y: 90,
        width: 102,
        height: 36,
        label: "Back",
        background: "#2563eb",
        rollBackground: "#1d4ed8",
        onClick: closeRulesScreen,
      });

      addLabel({
        text: "How to Play",
        x: W / 2,
        y: 88,
        size: 38,
        color: "#07164f",
        bold: true,
        align: "center",
      });

      addLabel({
        text: "Build a bridge by matching word cards with their correct meanings.",
        x: W / 2,
        y: 140,
        size: 15,
        color: "#64748b",
        bold: true,
        align: "center",
      });

      const cards = [
        {
          title: "1. Choose a Challenge",
          body: "Pick English → Sanskrit, Sanskrit → English, Word → Definition, Word → Synonym, or Word → Antonym.",
          x: 150,
          y: 190,
          color: "#eff6ff",
          stroke: "#bfdbfe",
          titleColor: "#1d4ed8",
        },
        {
          title: "2. Match the Cards",
          body: "Select a word card, then select the meaning card that belongs with it. Correct matches build the bridge.",
          x: 430,
          y: 190,
          color: "#ecfdf5",
          stroke: "#a7f3d0",
          titleColor: "#047857",
        },
        {
          title: "3. Submit the Round",
          body: "Submit when you are ready. Your score uses your matches, accuracy, time, hints, and wrong attempts.",
          x: 710,
          y: 190,
          color: "#fff7ed",
          stroke: "#fed7aa",
          titleColor: "#c2410c",
        },
        {
          title: "Practice Mode",
          body: "Practice mode has no countdown. Use it to learn the words and improve your accuracy.",
          x: 150,
          y: 340,
          color: "#f8fafc",
          stroke: "#e2e8f0",
          titleColor: "#334155",
        },
        {
          title: "Timed Mode",
          body: "Timed mode uses 2:00, 5:00, 10:00, or a custom timer. When time expires, the current round auto-submits.",
          x: 430,
          y: 340,
          color: "#faf5ff",
          stroke: "#ddd6fe",
          titleColor: "#5b21b6",
        },
        {
          title: "Perfect Bridge",
          body: "A perfect round earns a round point. Wrong attempts and hints make it harder to earn a clean result.",
          x: 710,
          y: 340,
          color: "#fffbeb",
          stroke: "#fde68a",
          titleColor: "#92400e",
        },
      ];

      cards.forEach((card) => {
        addPanel({
          x: card.x,
          y: card.y,
          width: 230,
          height: 118,
          fill: card.color,
          stroke: card.stroke,
          corner: 22,
        });

        addLabel({
          text: card.title,
          x: card.x + 18,
          y: card.y + 16,
          size: 15,
          color: card.titleColor,
          bold: true,
        });

        addWrappedLabel({
          text: card.body,
          x: card.x + 18,
          y: card.y + 44,
          maxCharsPerLine: 27,
          maxLines: 3,
          size: 11,
          lineHeight: 15,
          color: "#475569",
          bold: true,
        });
      });

      /*
    Keyboard shortcut strip
  */
      addPanel({
        x: 150,
        y: 492,
        width: 790,
        height: 72,
        fill: "#f8fafc",
        stroke: "#e2e8f0",
        corner: 22,
      });

      addLabel({
        text: "Keyboard Shortcuts",
        x: 176,
        y: 510,
        size: 17,
        color: "#07164f",
        bold: true,
      });

      addWrappedLabel({
        text: "Landing: Enter/Space start · Setup: P practice, T timed, 1/2/3 timers, C custom, E edit name · Gameplay: 1–6 cards, H hint, R reset, S submit, N new, M menu · Result: Enter/N next, L leaderboard · V mute",
        x: 176,
        y: 538,
        maxCharsPerLine: 112,
        maxLines: 2,
        size: 11,
        lineHeight: 15,
        color: "#475569",
        bold: true,
      });

      /*
    Future feature note
  */
      addPanel({
        x: 250,
        y: 584,
        width: 600,
        height: 48,
        fill: "#ecfeff",
        stroke: "#a5f3fc",
        corner: 20,
      });

      addLabel({
        text: "Coming later: Bridge Battle multiplayer with 2:00, 5:00, and 10:00 race modes.",
        x: W / 2,
        y: 600,
        size: 13,
        color: "#0e7490",
        bold: true,
        align: "center",
      });

      addLabel({
        text: "Keys: ? or / help · Esc/M back · Enter setup",
        x: W / 2,
        y: 646,
        size: 11,
        color: "#64748b",
        bold: true,
        align: "center",
      });
    }

    function renderScene() {
      stage.removeAllChildren();

      if (screen === "landing") {
        drawLandingScene();
        publishDebugState();
        stage.update();
        return;
      }

      drawBackground();

      if (screen === "leaderboard") {
        drawLeaderboardScreen();
        publishDebugState();
        stage.update();
        return;
      }

      if (screen === "rules") {
        drawRulesScreen();
        publishDebugState();
        stage.update();
        return;
      }

      if (screen === "menu") {
        drawMenuScene();
        publishDebugState();
        stage.update();
        return;
      }

      drawBridge();
      drawHeader();
      drawPassagePanel();

      /*
  Connections are drawn before cards so they never sit above the transparent
  card hit layers.
*/
      drawConnections();
      drawCards();

      drawRoundSummary();
      drawFeedbackPanel();
      drawControls();

      if (!result) {
        drawLeaderboard();
      }

      if (quitConfirmVisible && !result) {
        drawQuitConfirmationPanel();
      }

      if (result) {
        drawResultPanel();
      }

      publishDebugState();
      stage.update();
    }

    if (typeof window !== "undefined") {
      if (window.__meaningBridgePlayerNameKeyCleanup) {
        window.__meaningBridgePlayerNameKeyCleanup();
      }

      if (window.__meaningBridgeTimerCleanup) {
        window.__meaningBridgeTimerCleanup();
      }

      window.addEventListener("keydown", handlePlayerNameKeyDown);

      window.__meaningBridgePlayerNameKeyCleanup = () => {
        window.removeEventListener("keydown", handlePlayerNameKeyDown);
      };

      window.__meaningBridgeTimerCleanup = () => {
        stopRoundTimer();
      };
    }

    status = "Welcome to Meaning Bridge.";
    setFeedback(
      "Start the adventure, then choose your challenge settings.",
      "neutral",
    );

    preloadLandingImage();
    renderScene();

    void loadLeaderboard().then(() => {
      renderScene();
    });
  },
});
