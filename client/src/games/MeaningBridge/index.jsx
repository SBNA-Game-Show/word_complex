import { createZimGame } from "../createZimGame";
import { emit } from "../../scenes/sceneBus";
import {
  fetchMeaningBridgeLeaderboard,
  fetchMeaningBridgeRound,
  submitMeaningBridgeScore,
} from "../../services/meaningBridgeApi";

const PAIR_COUNTS = [4, 5, 6];

const TIMED_CHALLENGE_SECONDS = 90;

const CUSTOM_TIMER_PRESET = "custom";
const MAX_CUSTOM_TIMER_MINUTES = 60;

const TIMER_PRESETS = [
  { value: 120, label: "2:00" },
  { value: 300, label: "5:00" },
  { value: 600, label: "10:00" },
  { value: CUSTOM_TIMER_PRESET, label: "Custom" },
];

const PLAY_MODES = [
  {
    key: "p",
    id: "practice",
    title: "Practice",
    subtitle: "Play at your own pace with no timer.",
    icon: "🌱",
    accent: "#3a8a3a",
  },
  {
    key: "t",
    id: "timed",
    title: "Timed Challenge",
    subtitle: "Build as many bridges as you can before time runs out.",
    icon: "⏱️",
    accent: "#ff9a3c",
  },
];

const CHALLENGE_MODES = [
  {
    key: "1",
    mode: "word-to-synonym",
    title: "Synonym Bridge",
    shortTitle: "Synonyms",
    subtitle: "Find words that mean almost the same thing.",
    kidText: "Match each word with its meaning buddy.",
    icon: "🌈",
    accent: "#3a8a3a",
    level: "Warm-up",
  },
  {
    key: "2",
    mode: "word-to-definition",
    title: "Definition Bridge",
    shortTitle: "Definitions",
    subtitle: "Connect each word to its simple meaning.",
    kidText: "Build a bridge from a word to what it means.",
    icon: "📖",
    accent: "#6b48cc",
    level: "Story Builder",
  },
  {
    key: "3",
    mode: "word-to-antonym",
    title: "Opposite Bridge",
    shortTitle: "Antonyms",
    subtitle: "Find words with opposite meanings.",
    kidText: "Match each word with its opposite.",
    icon: "↔️",
    accent: "#1a7a99",
    level: "Challenge",
  },
];

export const meta = {
  id: "meaning-bridge",
  cardNumber: "02",
  cardArt: "art-sea",
  title: "Meaning Bridge",
  description: "Connect words to their synonyms, antonyms, and definitions.",
};

export default createZimGame({
  id: "zim-meaning-bridge",
  width: 1100,
  height: 720,
  color: "#fde8f2",
  outerColor: "#1d2b66",

  setup({ stage, W, H, zim, authUser }) {
    const FONT = "Fredoka";
    let disposed = false;
    const scheduledTimeouts = new Set();

    function scheduleTimeout(callback, delay) {
      const timeoutId = setTimeout(() => {
        scheduledTimeouts.delete(timeoutId);
        if (!disposed) callback();
      }, delay);
      scheduledTimeouts.add(timeoutId);
      return timeoutId;
    }

    function clearScheduledTimeouts() {
      scheduledTimeouts.forEach(clearTimeout);
      scheduledTimeouts.clear();
    }

    // ── Palette ──────────────────────────────────────────────────────
    const C = {
      ink: "#1d2b66",
      bg: "#fef5e4", // warm ivory — light and clean
      sunshine: "#ffd84d",
      tangerine: "#ff9a3c",
      bubblegum: "#ff6fb5",
      grape: "#9b6bff",
      leaf: "#46c97a",
      ocean: "#2fb6d6",
      white: "#ffffff",
      sub: "#8892b0",
    };

    const SHORTCUT_BLUE = "#1a7a99";

    // 6 pair colors — each pair gets its own identity
    const PC = [
      "#ff6fb5",
      "#2fb6d6",
      "#9b6bff",
      "#ff9a3c",
      "#46c97a",
      "#ffc42e",
    ];
    const PD = [
      "#c94f8a",
      "#1f8fb5",
      "#6b48cc",
      "#c97428",
      "#2ea85e",
      "#c9a010",
    ];

    function rgba(hex, a) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${a})`;
    }

    // ── Session state ────────────────────────────────────────────────
    let screen = "landing";

    let roundIndex = 0;
    let totalScore = 0;
    let roundStartScore = 0;
    let sessionBest = 0;
    let currentMode = "word-to-synonym";
    let playMode = "practice";

    let timerPreset = 120;
    let customTimerMinutes = "3";
    let isEditingCustomTimer = false;
    let replaceCustomTimerOnNextInput = false;

    let timedSecondsTotal = TIMED_CHALLENGE_SECONDS;
    let timedSecondsLeft = TIMED_CHALLENGE_SECONDS;
    let timedEndsAt = 0;
    let timedTimerId = null;
    let timerLabel = null;

    let completedPuzzles = 0;

    let puzzle = null;
    let errorMessage = "";

    let lastHintText = "";

    let roundStartedAt = Date.now();
    let roundHintsUsed = 0;
    let roundWrongAttempts = 0;
    let hintedLeftIds = new Set();

    let completedRoundSubmissions = [];
    let submittedRoundIds = new Set();
    let isSubmittingScore = false;
    let scoreSubmitMessage = "";
    let scoreSubmitError = "";

    let submittedResultSummary = null;

    let scoreSubmitRequestId = 0;
    let exitConfirmPreviousScreen = "gameplay";

    let leaderboard = [];
    let leaderboardReturnScreen = "landing";
    let isLoadingLeaderboard = false;
    let leaderboardError = "";

    // Per-round state
    let selectedLeft = null;
    let selectedRight = null;
    let matches = {};
    let flashWrong = null;
    let lastMatchLeft = null;
    let freshRound = true; // true only on first render after loading; suppresses re-entrance animation on clicks

    // ── Layout ───────────────────────────────────────────────────────
    // Header bar (dark navy) contains title + mode tabs + score
    const HEADER_H = 82; // height including 4px accent strip at bottom
    const CARD_W = 308;
    const LEFT_X = 55;
    const RIGHT_X = W - 55 - CARD_W; // 675, bridge zone = 250px

    let CARD_H = 80;
    let RIGHT_CARD_H = 100;
    let START_Y = 148;
    let GAP = 140;
    let BOTTOM_BAR_H = 62; // taller for 4-pair round only

    function calcLayout() {
      const n = puzzle.leftItems.length;
      const isDef = currentMode === "word-to-definition";
      // Left and right cards are the same height; definitions mode gets extra height on right only
      if (n >= 6) {
        CARD_H = 54;
        RIGHT_CARD_H = isDef ? 72 : 54;
      } else if (n >= 5) {
        CARD_H = 60;
        RIGHT_CARD_H = isDef ? 82 : 60;
      } else {
        CARD_H = 68;
        RIGHT_CARD_H = isDef ? 93 : 68;
      }
      // instruction(12+18) + col-header(+28) + gap(+16) = 74
      const baseStartY = HEADER_H + 74;
      // 4-pair round gets a taller bottom bar and slightly more breathing room
      BOTTOM_BAR_H = n === 4 ? 78 : 62;
      const avail = H - baseStartY - RIGHT_CARD_H - BOTTOM_BAR_H;
      if (n <= 1) {
        GAP = 0;
        START_Y = baseStartY;
      } else {
        // For 4 pairs: slightly wider gap + push cards down to split dead space top/bottom
        const MAX_GAP = n === 4 ? 105 : 95;
        GAP = Math.min(Math.floor(avail / (n - 1)), MAX_GAP);
        START_Y = n === 4 ? baseStartY + 40 : baseStartY;
      }
    }

    // ── HEADER (dark bar with embedded mode tabs) ─────────────────────
    function drawHeader({ showExit = true } = {}) {
      // Dark bar
      new zim.Rectangle(W, HEADER_H - 4, "#7ec87e").addTo(stage).loc(0, 0);
      // Darker green accent line
      new zim.Rectangle(W, 4, "#5aaa5a").addTo(stage).loc(0, HEADER_H - 4);

      // ── Exit button left ─────────────────────────────────────────
      if (showExit) {
        const eb = new zim.Container()
          .addTo(stage)
          .loc(18, (HEADER_H - 36) / 2);
        eb.mouseChildren = false;
        new zim.Rectangle({
          width: 90,
          height: 36,
          color: C.white,
          borderColor: "transparent",
          borderWidth: 0,
          corner: 18,
        }).addTo(eb);
        new zim.Label({
          text: "← Exit",
          size: 15,
          font: FONT,
          color: "#2e6b2e",
          align: "center",
          valign: "center",
          bold: true,
        })
          .addTo(eb)
          .loc(45, 18);
        eb.cursor = "pointer";
        eb.on("click", requestExitToMainMenu);
      }

      // ── Current mode badge (locked during active play) ─────────────
      const activeChallenge = getActiveChallenge();
      const activePlayMode = getActivePlayMode();

      const modeBadgeW = 380;
      const modeBadgeH = 44;
      const modeBadge = new zim.Container()
        .addTo(stage)
        .loc((W - modeBadgeW) / 2, (HEADER_H - 4 - modeBadgeH) / 2);
      modeBadge.mouseChildren = false;

      new zim.Rectangle({
        width: modeBadgeW,
        height: modeBadgeH,
        color: C.white,
        borderColor: rgba(activeChallenge.accent, 0.35),
        borderWidth: 2,
        corner: modeBadgeH / 2,
      }).addTo(modeBadge);

      new zim.Label({
        text: `${activeChallenge.icon} ${activeChallenge.shortTitle} • ${activePlayMode.title}`,
        size: 18,
        font: FONT,
        color: activeChallenge.accent,
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(modeBadge)
        .loc(modeBadgeW / 2, modeBadgeH / 2);

      // ── Score badge right ────────────────────────────────────────
      const sb = new zim.Container()
        .addTo(stage)
        .loc(W - 180, (HEADER_H - 4 - 36) / 2);
      sb.mouseChildren = false;
      new zim.Rectangle({
        width: 162,
        height: 36,
        color: C.white,
        borderColor: "#c9a010",
        borderWidth: 1.5,
        corner: 18,
      }).addTo(sb);
      timerLabel = new zim.Label({
        text: getSessionStatusText(),
        size: 13,
        font: FONT,
        color: "#3a7a3a",
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(sb)
        .loc(81, 11);
      new zim.Label({
        text: `⭐ ${totalScore} pts`,
        size: 15,
        font: FONT,
        color: "#7a5800",
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(sb)
        .loc(81, 26);
    }

    function drawPlayModeToggle({ x, y }) {
      new zim.Label({
        text: "Play Mode",
        size: 16,
        font: FONT,
        color: C.ink,
        bold: true,
      })
        .addTo(stage)
        .loc(x, y - 24);

      PLAY_MODES.forEach((mode, index) => {
        const selected = mode.id === playMode;
        const cardW = 286;
        const cardH = 50;
        const gap = 20;
        const px = x + index * (cardW + gap);

        const card = new zim.Container().addTo(stage).loc(px, y);
        card.mouseChildren = false;

        new zim.Rectangle({
          width: cardW,
          height: cardH,
          color: selected ? rgba(mode.accent, 0.14) : "rgba(255,255,255,0.9)",
          borderColor: selected ? mode.accent : rgba(mode.accent, 0.28),
          borderWidth: selected ? 3 : 2,
          corner: 22,
        }).addTo(card);

        new zim.Label({
          text: mode.icon,
          size: 22,
          font: FONT,
          align: "center",
          valign: "center",
        })
          .addTo(card)
          .loc(32, 25);

        new zim.Label({
          text: mode.title,
          size: 18,
          font: FONT,
          color: mode.accent,
          bold: true,
        })
          .addTo(card)
          .loc(66, 9);

        new zim.Label({
          text:
            mode.id === "practice"
              ? "No timer. Learn at your pace."
              : "Race against the clock.",
          size: 11,
          font: FONT,
          color: C.sub,
          lineWidth: 190,
        })
          .addTo(card)
          .loc(66, 31);

        new zim.Circle(12, C.white, mode.accent, 2)
          .addTo(card)
          .loc(cardW - 26, 25);

        new zim.Label({
          text: mode.key.toUpperCase(),
          size: 11,
          font: FONT,
          color: mode.accent,
          align: "center",
          valign: "center",
          bold: true,
        })
          .addTo(card)
          .loc(cardW - 26, 25);

        card.cursor = "pointer";
        card.on("click", () => setPlayMode(mode.id));
      });
    }

    function drawTimerOptionsSection({ x, y }) {
      if (!isTimedMode()) {
        return;
      }

      new zim.Label({
        text: "Timer",
        size: 14,
        font: FONT,
        color: C.ink,
        bold: true,
      })
        .addTo(stage)
        .loc(x, y - 22);

      TIMER_PRESETS.forEach((preset, index) => {
        const selected = timerPreset === preset.value;
        const pillW = preset.value === CUSTOM_TIMER_PRESET ? 104 : 82;
        const pillH = 34;
        const gap = 12;
        const px =
          x +
          TIMER_PRESETS.slice(0, index).reduce(
            (sum, item) =>
              sum + (item.value === CUSTOM_TIMER_PRESET ? 104 : 82) + gap,
            0,
          );

        const pill = new zim.Container().addTo(stage).loc(px, y);
        pill.mouseChildren = false;

        new zim.Rectangle({
          width: pillW,
          height: pillH,
          color: selected ? rgba(C.tangerine, 0.18) : C.white,
          borderColor: selected ? C.tangerine : rgba(C.tangerine, 0.35),
          borderWidth: selected ? 3 : 2,
          corner: 17,
        }).addTo(pill);

        new zim.Label({
          text: preset.label,
          size: 14,
          font: FONT,
          color: selected ? C.tangerine : C.ink,
          align: "center",
          valign: "center",
          bold: true,
        })
          .addTo(pill)
          .loc(pillW / 2, pillH / 2);

        pill.cursor = "pointer";
        pill.on("click", () => setTimerPreset(preset.value));
      });
    }

    function drawCustomTimerEditor({ x, y }) {
      if (!isTimedMode() || !isCustomTimerSelected()) {
        return;
      }

      const minutes = clampCustomTimerMinutes(customTimerMinutes);

      const panel = new zim.Container().addTo(stage).loc(x, y);
      panel.mouseChildren = false;

      new zim.Rectangle({
        width: 470,
        height: 44,
        color: "rgba(255,255,255,0.9)",
        borderColor: rgba(C.tangerine, 0.35),
        borderWidth: 2,
        corner: 22,
      }).addTo(panel);

      new zim.Label({
        text: "Custom Time",
        size: 14,
        font: FONT,
        color: C.ink,
        bold: true,
      })
        .addTo(panel)
        .loc(24, 8);

      new zim.Label({
        text: "Choose 1 to 60 minutes.",
        size: 11,
        font: FONT,
        color: C.sub,
      })
        .addTo(panel)
        .loc(24, 27);

      drawKidButton({
        x: x + 265,
        y: y + 4,
        width: 36,
        height: 36,
        label: "−",
        color: C.white,
        textColor: C.tangerine,
        borderColor: rgba(C.tangerine, 0.5),
        onClick: () => adjustCustomTimerMinutes(-1),
      });

      const valuePill = new zim.Container().addTo(stage).loc(x + 310, y + 4);
      valuePill.mouseChildren = false;

      new zim.Rectangle({
        width: 82,
        height: 36,
        color: isEditingCustomTimer ? rgba(C.tangerine, 0.16) : C.white,
        borderColor: isEditingCustomTimer
          ? C.tangerine
          : rgba(C.tangerine, 0.45),
        borderWidth: isEditingCustomTimer ? 3 : 2,
        corner: 18,
      }).addTo(valuePill);

      new zim.Label({
        text: isEditingCustomTimer
          ? `${customTimerMinutes || "1"}| min`
          : `${minutes} min`,
        size: 14,
        font: FONT,
        color: C.tangerine,
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(valuePill)
        .loc(41, 18);

      valuePill.cursor = "pointer";
      valuePill.on("click", beginCustomTimerEdit);

      drawKidButton({
        x: x + 402,
        y: y + 4,
        width: 36,
        height: 36,
        label: "+",
        color: C.white,
        textColor: C.tangerine,
        borderColor: rgba(C.tangerine, 0.5),
        onClick: () => adjustCustomTimerMinutes(1),
      });
    }

    // ── BRIDGES (bezier arcs with glow) ──────────────────────────────
    function drawBridgeLine(li, ri, color, lw, dashed) {
      const offsetY = (RIGHT_CARD_H - CARD_H) / 2;
      const x1 = LEFT_X + CARD_W + 6;
      const x2 = RIGHT_X - 6;
      const y1 = START_Y + li * GAP + offsetY + CARD_H / 2;
      const y2 = START_Y + ri * GAP + RIGHT_CARD_H / 2;

      // bezier control point — arc bows upward by 25% of vertical distance
      const cx = (x1 + x2) / 2;
      const bow = Math.abs(y2 - y1) * 0.28 + 16;
      const cy = Math.min(y1, y2) - bow;

      if (!dashed) {
        // outer glow
        const g = new zim.Shape().addTo(stage);
        g.s(rgba(color, 0.2)).ss(lw * 4, "round", "round");
        g.mt(x1, y1).bt(cx, cy, cx, cy, x2, y2);

        // mid glow
        const g2 = new zim.Shape().addTo(stage);
        g2.s(rgba(color, 0.15)).ss(lw * 2.2, "round", "round");
        g2.mt(x1, y1).bt(cx, cy, cx, cy, x2, y2);
      }

      // core line
      const ln = new zim.Shape().addTo(stage);
      if (dashed) ln.s(rgba(color, 0.55)).ss(lw, "round", "round").sd([10, 9]);
      else ln.s(color).ss(lw, "round", "round");
      ln.mt(x1, y1).bt(cx, cy, cx, cy, x2, y2);

      // endpoint dots
      const d = new zim.Shape().addTo(stage);
      d.f(color).dc(x1, y1, 5.5).dc(x2, y2, 5.5);
    }

    function drawBridges() {
      Object.entries(matches).forEach(([leftId, rightId]) => {
        const li = puzzle.leftItems.findIndex((l) => l.id === leftId);
        const ri = puzzle.rightItems.findIndex((r) => r.id === rightId);
        drawBridgeLine(li, ri, PC[li % PC.length], 3, false);
      });
      if (flashWrong) {
        const li = puzzle.leftItems.findIndex(
          (l) => l.id === flashWrong.leftId,
        );
        const ri = puzzle.rightItems.findIndex(
          (r) => r.id === flashWrong.rightId,
        );
        drawBridgeLine(li, ri, "#ff3333", 3, false);
      }
      if (selectedLeft && selectedRight) {
        const li = puzzle.leftItems.findIndex((l) => l.id === selectedLeft.id);
        const ri = puzzle.rightItems.findIndex(
          (r) => r.id === selectedRight.id,
        );
        drawBridgeLine(li, ri, "#aaaacc", 2, true);
      }
    }

    // ── CARDS ─────────────────────────────────────────────────────────
    function drawCards() {
      puzzle.leftItems.forEach((item, i) => {
        const offsetY = (RIGHT_CARD_H - CARD_H) / 2;
        drawCard({
          item,
          x: LEFT_X,
          y: START_Y + i * GAP + offsetY,
          cardH: CARD_H,
          side: "left",
          pairIdx: i,
          matchPairIdx: i,
          isMatched: !!matches[item.id],
          isSelected: selectedLeft?.id === item.id,
          isWrong: flashWrong?.leftId === item.id,
          isJustMatched: lastMatchLeft === item.id,
        });
      });

      puzzle.rightItems.forEach((item, i) => {
        const isMatched = Object.values(matches).includes(item.id);
        const matchedLeftId = isMatched
          ? Object.keys(matches).find((k) => matches[k] === item.id)
          : null;
        const matchPairIdx = matchedLeftId
          ? puzzle.leftItems.findIndex((l) => l.id === matchedLeftId)
          : 0;
        drawCard({
          item,
          x: RIGHT_X,
          y: START_Y + i * GAP,
          cardH: RIGHT_CARD_H,
          side: "right",
          pairIdx: i,
          matchPairIdx,
          isMatched,
          isSelected: selectedRight?.id === item.id,
          isWrong: flashWrong?.rightId === item.id,
          isJustMatched: matchedLeftId === lastMatchLeft,
        });
      });
    }

    const G = { base: "#5aaa5a", dark: "#3a7a3a" };

    function drawBackground() {
      // Milky pink → milky green gradient top-to-bottom
      const grad = new zim.GradientColor(
        ["#fde8f2", "#e8f5ee"],
        [0, 1],
        0,
        0,
        0,
        H,
      );
      new zim.Rectangle(W, H, grad).addTo(stage);
    }

    function isTimedMode() {
      return playMode === "timed";
    }

    function isCustomTimerSelected() {
      return timerPreset === CUSTOM_TIMER_PRESET;
    }

    function clampCustomTimerMinutes(value) {
      const parsed = Number.parseInt(String(value || "1"), 10);

      if (!Number.isFinite(parsed)) {
        return 1;
      }

      return Math.min(MAX_CUSTOM_TIMER_MINUTES, Math.max(1, parsed));
    }

    function getSelectedTimerSeconds() {
      if (!isTimedMode()) {
        return 0;
      }

      if (isCustomTimerSelected()) {
        return clampCustomTimerMinutes(customTimerMinutes) * 60;
      }

      return Number(timerPreset) || TIMED_CHALLENGE_SECONDS;
    }

    function getPlayButtonLabel() {
      if (!isTimedMode()) {
        return "Play Now →";
      }

      return `Start ${formatSeconds(getSelectedTimerSeconds())} →`;
    }

    function setPlayMode(nextMode) {
      playMode = nextMode;

      if (playMode === "timed" && !timerPreset) {
        timerPreset = 120;
      }

      isEditingCustomTimer = false;
      replaceCustomTimerOnNextInput = false;

      drawChallengeScene();
    }

    function setTimerPreset(nextPreset) {
      playMode = "timed";
      timerPreset = nextPreset;

      if (isCustomTimerSelected()) {
        isEditingCustomTimer = true;
        replaceCustomTimerOnNextInput = true;
      } else {
        isEditingCustomTimer = false;
        replaceCustomTimerOnNextInput = false;
      }

      drawChallengeScene();
    }

    function finishCustomTimerEdit() {
      customTimerMinutes = String(clampCustomTimerMinutes(customTimerMinutes));
      isEditingCustomTimer = false;
      replaceCustomTimerOnNextInput = false;
      drawChallengeScene();
    }

    function beginCustomTimerEdit() {
      playMode = "timed";
      timerPreset = CUSTOM_TIMER_PRESET;
      isEditingCustomTimer = true;
      replaceCustomTimerOnNextInput = true;
      drawChallengeScene();
    }

    function adjustCustomTimerMinutes(delta) {
      const current = clampCustomTimerMinutes(customTimerMinutes);
      customTimerMinutes = String(clampCustomTimerMinutes(current + delta));
      playMode = "timed";
      timerPreset = CUSTOM_TIMER_PRESET;
      isEditingCustomTimer = false;
      replaceCustomTimerOnNextInput = false;
      drawChallengeScene();
    }

    function handleCustomTimerTyping(event) {
      if (event.key === "Enter") {
        event.preventDefault();
        finishCustomTimerEdit();
        return true;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        finishCustomTimerEdit();
        return true;
      }

      if (event.key === "Backspace") {
        event.preventDefault();

        if (replaceCustomTimerOnNextInput) {
          customTimerMinutes = "";
          replaceCustomTimerOnNextInput = false;
        } else {
          customTimerMinutes = customTimerMinutes.slice(0, -1);
        }

        drawChallengeScene();
        return true;
      }

      if (/^\d$/.test(event.key)) {
        event.preventDefault();

        if (replaceCustomTimerOnNextInput) {
          customTimerMinutes = "";
          replaceCustomTimerOnNextInput = false;
        }

        const nextValue = `${customTimerMinutes}${event.key}`.replace(
          /^0+/,
          "",
        );
        customTimerMinutes = String(clampCustomTimerMinutes(nextValue || "1"));

        drawChallengeScene();
        return true;
      }

      return false;
    }

    function getActivePlayMode() {
      return PLAY_MODES.find((mode) => mode.id === playMode) || PLAY_MODES[0];
    }

    function getCurrentPairCount() {
      return PAIR_COUNTS[roundIndex % PAIR_COUNTS.length];
    }

    function formatSeconds(seconds) {
      const safeSeconds = Math.max(0, Number(seconds) || 0);
      const minutes = Math.floor(safeSeconds / 60);
      const remainder = safeSeconds % 60;

      return `${minutes}:${String(remainder).padStart(2, "0")}`;
    }

    function getSessionStatusText() {
      if (isTimedMode()) {
        return `⏱ ${formatSeconds(timedSecondsLeft)}`;
      }

      return `Practice • Puzzle ${roundIndex + 1}`;
    }

    function stopTimedTimer() {
      if (timedTimerId) {
        clearInterval(timedTimerId);
        timedTimerId = null;
      }

      timerLabel = null;
    }

    function updateTimedClock() {
      if (disposed) {
        stopTimedTimer();
        return;
      }

      if (!isTimedMode()) {
        return;
      }

      timedSecondsLeft = Math.max(
        0,
        Math.ceil((timedEndsAt - Date.now()) / 1000),
      );

      if (timerLabel) {
        timerLabel.text = `⏱ ${formatSeconds(timedSecondsLeft)}`;
        publishDebugState();
        stage.update();
      }

      if (
        timedSecondsLeft <= 0 &&
        ["loading", "gameplay", "round-complete"].includes(screen)
      ) {
        stopTimedTimer();
        showFinalScore();
      }
    }

    function startTimedSession() {
      if (disposed) return;
      stopTimedTimer();

      timedSecondsTotal = getSelectedTimerSeconds();
      timedSecondsLeft = timedSecondsTotal;
      timedEndsAt = Date.now() + timedSecondsTotal * 1000;

      timedTimerId = setInterval(updateTimedClock, 500);
      updateTimedClock();
    }

    function startSelectedPlaySession() {
      const activeChallenge = getActiveChallenge();
      const selectedPlayMode = playMode;

      resetSessionForNewAdventure();

      currentMode = activeChallenge.mode;
      playMode = selectedPlayMode;

      if (isTimedMode()) {
        startTimedSession();
      }

      loadRound();
    }

    function finishPracticeSession() {
      stopTimedTimer();
      showFinalScore();
    }

    function getAuthDisplayName() {
      const candidates = [
        authUser?.name,
        authUser?.displayName,
        authUser?.nickname,
        authUser?.username,
        authUser?.email,
      ];

      const resolved = candidates
        .map((value) => String(value || "").trim())
        .find(Boolean);

      if (!resolved || resolved.toLowerCase() === "guest") {
        return authUser?.isGuest ? "Guest" : "Reader";
      }

      return resolved;
    }

    function getPlayerIdentityType() {
      return authUser?.isGuest ? "Guest" : "Signed in";
    }

    function getNormalizedPlayerName() {
      return getAuthDisplayName();
    }

    function getMatchedCount() {
      return Object.keys(matches || {}).length;
    }

    function getTotalPairs() {
      return puzzle?.leftItems?.length || getCurrentPairCount();
    }

    function getDebugMatches() {
      return { ...(matches || {}) };
    }

    function publishDebugState() {
      if (typeof window === "undefined") {
        return;
      }

      window.__meaningBridgeZimDebug = {
        screen,
        playerName: getNormalizedPlayerName(),
        isEditingPlayerName: false,
        playerIdentityType: getPlayerIdentityType(),
        currentMode,
        activeChallenge: getActiveChallenge()?.shortTitle || "",
        roundIndex,
        roundNumber: roundIndex + 1,
        pairCount: getCurrentPairCount(),
        totalScore,
        roundStartScore,
        sessionBest,
        puzzleRoundId: puzzle?.roundId || null,
        instruction: puzzle?.instruction || "",
        selectedLeftId: selectedLeft?.id || null,
        selectedRightId: selectedRight?.id || null,
        matchedCount: getMatchedCount(),
        totalPairs: getTotalPairs(),
        matches: getDebugMatches(),
        isLoading: screen === "loading",
        errorMessage,
        hasPuzzle: Boolean(puzzle),
        roundHintsUsed,
        roundWrongAttempts,
        completedRounds: completedRoundSubmissions.length,
        submittedRounds: submittedRoundIds.size,
        isSubmittingScore,
        scoreSubmitMessage,
        scoreSubmitError,
        submittedResultSummary,
        lastHintText,
        currentPuzzleResultSummary: getCurrentPuzzleResultSummary(),
        leaderboardCount: leaderboard.length,
        isLoadingLeaderboard,
        leaderboardError,
        playMode,
        activePlayMode: getActivePlayMode()?.title || "",
        timedSecondsLeft,
        timedSecondsTotal,
        timerPreset,
        customTimerMinutes: clampCustomTimerMinutes(customTimerMinutes),
        isCustomTimerSelected: isCustomTimerSelected(),
        isEditingCustomTimer,
        selectedTimerSeconds: getSelectedTimerSeconds(),
        completedPuzzles,
        currentPairCount: getCurrentPairCount(),
      };
    }

    function shouldExposeMeaningBridgeTestHooks() {
      if (typeof window === "undefined") {
        return false;
      }

      return (
        import.meta.env.DEV ||
        import.meta.env.VITE_E2E === "true" ||
        window.localStorage?.getItem("meaningBridgeE2E") === "1"
      );
    }

    function publishMeaningBridgeTestHooks() {
      if (!shouldExposeMeaningBridgeTestHooks()) {
        return;
      }

      window.__meaningBridgeZimTestHooks = {
        getState() {
          publishDebugState();
          return window.__meaningBridgeZimDebug;
        },

        goToLandingForTest() {
          drawLandingScene();
          return true;
        },

        goToChallengeForTest() {
          drawChallengeScene();
          return true;
        },

        chooseChallengeForTest(mode) {
          const challenge =
            CHALLENGE_MODES.find((item) => item.mode === mode) ||
            CHALLENGE_MODES[0];

          currentMode = challenge.mode;
          drawChallengeScene();
          return currentMode;
        },

        setPracticeForTest() {
          playMode = "practice";
          isEditingCustomTimer = false;
          replaceCustomTimerOnNextInput = false;
          drawChallengeScene();
          return true;
        },

        setTimedForTest(seconds = 120) {
          playMode = "timed";

          const safeSeconds = Math.max(60, Number(seconds) || 120);

          if ([120, 300, 600].includes(safeSeconds)) {
            timerPreset = safeSeconds;
          } else {
            timerPreset = CUSTOM_TIMER_PRESET;
            customTimerMinutes = String(
              clampCustomTimerMinutes(Math.ceil(safeSeconds / 60)),
            );
          }

          isEditingCustomTimer = false;
          replaceCustomTimerOnNextInput = false;
          drawChallengeScene();
          return getSelectedTimerSeconds();
        },

        setCustomTimerMinutesForTest(minutes) {
          playMode = "timed";
          timerPreset = CUSTOM_TIMER_PRESET;
          customTimerMinutes = String(clampCustomTimerMinutes(minutes));
          isEditingCustomTimer = false;
          replaceCustomTimerOnNextInput = false;
          drawChallengeScene();

          return clampCustomTimerMinutes(customTimerMinutes);
        },

        async startPracticeForTest(mode = currentMode) {
          currentMode = mode;
          playMode = "practice";
          startSelectedPlaySession();
          return true;
        },

        async startTimedForTest(mode = currentMode, seconds = 120) {
          currentMode = mode;
          playMode = "timed";

          const safeSeconds = Math.max(60, Number(seconds) || 120);

          if ([120, 300, 600].includes(safeSeconds)) {
            timerPreset = safeSeconds;
          } else {
            timerPreset = CUSTOM_TIMER_PRESET;
            customTimerMinutes = String(
              clampCustomTimerMinutes(Math.ceil(safeSeconds / 60)),
            );
          }

          startSelectedPlaySession();
          return true;
        },

        selectFirstLeftCardForTest() {
          if (!puzzle?.leftItems?.length) {
            return null;
          }

          selectedLeft = puzzle.leftItems[0];
          selectedRight = null;
          renderGame();

          return selectedLeft;
        },

        requestHintForTest() {
          requestHintForSelectedCard();
          return lastHintText;
        },

        getFirstHintForTest() {
          const firstLeft = puzzle?.leftItems?.[0];

          if (!firstLeft) {
            return "";
          }

          return puzzle?.hints?.[firstLeft.id] || "";
        },

        completeCurrentPuzzleForTest(options = {}) {
          if (!puzzle?.leftItems?.length) {
            return false;
          }

          const wrongAttempts = Math.max(0, Number(options.wrongAttempts) || 0);
          const hintsUsed = Math.max(0, Number(options.hintsUsed) || 0);
          const timeSeconds = Math.max(0, Number(options.timeSeconds) || 0);

          if (timeSeconds > 0) {
            roundStartedAt = Date.now() - timeSeconds * 1000;
          }

          roundWrongAttempts = wrongAttempts;
          roundHintsUsed = hintsUsed;

          hintedLeftIds = new Set(
            puzzle.leftItems.slice(0, hintsUsed).map((item) => item.id),
          );

          matches = {};
          puzzle.leftItems.forEach((leftItem) => {
            matches[leftItem.id] = puzzle.answerKey[leftItem.id];
          });

          const correctPoints =
            puzzle.leftItems.length * (Number(puzzle.scoreRules?.correct) || 0);
          const wrongPenalty =
            wrongAttempts *
            (Number(puzzle.scoreRules?.wrongAttemptPenalty) || 0);

          totalScore = Math.max(
            0,
            roundStartScore + correctPoints - wrongPenalty,
          );

          completedPuzzles += 1;
          snapshotCompletedRoundForSubmit();
          showRoundComplete();

          return true;
        },

        advanceAfterRoundCompleteForTest() {
          advanceAfterRoundComplete();
          return true;
        },

        finishPracticeForTest() {
          finishPracticeSession();
          return true;
        },

        async submitScoreForTest() {
          await submitCompletedSessionScore();
          publishDebugState();
          return window.__meaningBridgeZimDebug;
        },

        openLeaderboardForTest(returnScreen = screen) {
          openLeaderboard(returnScreen);
          return true;
        },

        requestExitForTest() {
          requestExitToMainMenu();
          return true;
        },

        cancelExitForTest() {
          restoreAfterExitCancel();
          return true;
        },

        confirmExitForTest() {
          returnToMainMenu();
          return true;
        },

        expireTimerForTest() {
          timedSecondsLeft = 0;
          stopTimedTimer();
          showFinalScore();
          return true;
        },

        resetForTest() {
          resetSessionForNewAdventure();
          drawLandingScene();
          return true;
        },
      };
    }

    function safeUpdate() {
      publishDebugState();
      publishMeaningBridgeTestHooks();
      stage.update();
    }

    function selectChallengeByIndex(index) {
      const challenge = CHALLENGE_MODES[index];

      if (!challenge) {
        return;
      }

      currentMode = challenge.mode;
      drawChallengeScene();
    }

    function retryCurrentRound() {
      totalScore = roundStartScore;
      selectedLeft = null;
      selectedRight = null;
      matches = {};
      flashWrong = null;
      lastMatchLeft = null;
      freshRound = true;
      loadRound();
    }

    function skipCurrentRound() {
      totalScore = roundStartScore;
      roundIndex += 1;
      loadRound();
    }

    function advanceAfterRoundComplete() {
      roundIndex += 1;
      loadRound();
    }

    function getElapsedRoundSeconds() {
      return Math.max(0, Math.round((Date.now() - roundStartedAt) / 1000));
    }

    function buildCurrentRoundMatchArray() {
      return Object.entries(matches || {}).map(([leftId, rightId]) => ({
        leftId,
        rightId,
      }));
    }

    function getCurrentPuzzleResultSummary() {
      const lastCompletedRound =
        completedRoundSubmissions[completedRoundSubmissions.length - 1];

      if (lastCompletedRound) {
        const correctMatches = Array.isArray(lastCompletedRound.matches)
          ? lastCompletedRound.matches.length
          : 0;
        const wrongAttempts = Number(lastCompletedRound.wrongAttempts) || 0;
        const totalAttempts = correctMatches + wrongAttempts;

        const accuracy =
          totalAttempts > 0
            ? Math.round((correctMatches / totalAttempts) * 100)
            : 0;

        return {
          accuracy,
          timeSeconds: Number(lastCompletedRound.timeSeconds) || 0,
          hintsUsed: Number(lastCompletedRound.hintsUsed) || 0,
          wrongAttempts,
        };
      }

      const correctMatches = Object.keys(matches || {}).length;
      const wrongAttempts = Number(roundWrongAttempts) || 0;
      const totalAttempts = correctMatches + wrongAttempts;

      const accuracy =
        totalAttempts > 0
          ? Math.round((correctMatches / totalAttempts) * 100)
          : 0;

      return {
        accuracy,
        timeSeconds: getElapsedRoundSeconds(),
        hintsUsed: Number(roundHintsUsed) || 0,
        wrongAttempts,
      };
    }

    function drawPuzzleResultStrip(cx, y) {
      const summary = getCurrentPuzzleResultSummary();

      const stripW = 420;
      const stripH = 46;
      const stripX = cx - stripW / 2;

      const strip = new zim.Container().addTo(stage).loc(stripX, y);
      strip.mouseChildren = false;

      new zim.Rectangle({
        width: stripW,
        height: stripH,
        color: rgba(C.leaf, 0.08),
        borderColor: rgba(C.leaf, 0.35),
        borderWidth: 2,
        corner: 20,
      }).addTo(strip);

      new zim.Label({
        text: `Accuracy ${summary.accuracy}% • Time ${formatSeconds(summary.timeSeconds)}`,
        size: 14,
        font: FONT,
        color: C.ink,
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(strip)
        .loc(stripW / 2, 15);

      new zim.Label({
        text: `Hints ${summary.hintsUsed} • Misses ${summary.wrongAttempts}`,
        size: 13,
        font: FONT,
        color: C.sub,
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(strip)
        .loc(stripW / 2, 32);
    }

    function buildSubmittedResultSummary(serverResult = null) {
      const rounds = completedRoundSubmissions || [];

      const correctMatches = rounds.reduce(
        (sum, round) =>
          sum + (Array.isArray(round.matches) ? round.matches.length : 0),
        0,
      );

      const totalPairs = rounds.reduce(
        (sum, round) =>
          sum +
          (Number(round.pairCount) ||
            (Array.isArray(round.matches) ? round.matches.length : 0)),
        0,
      );

      const wrongAttempts = rounds.reduce(
        (sum, round) => sum + (Number(round.wrongAttempts) || 0),
        0,
      );

      const hintsUsed = rounds.reduce(
        (sum, round) => sum + (Number(round.hintsUsed) || 0),
        0,
      );

      const timeSeconds = rounds.reduce(
        (sum, round) => sum + (Number(round.timeSeconds) || 0),
        0,
      );

      const totalAttempts = correctMatches + wrongAttempts;
      const accuracy =
        totalAttempts > 0
          ? Math.round((correctMatches / totalAttempts) * 100)
          : 0;

      return {
        score: totalScore,
        accuracy,
        correctMatches,
        totalPairs,
        timeSeconds,
        hintsUsed,
        wrongAttempts,
        puzzlesCompleted: rounds.length,
        message: serverResult?.message || "Score saved! Great bridge building.",
      };
    }

    function drawSubmittedResultSummary(cx, y) {
      if (!submittedResultSummary) {
        return false;
      }

      const summary = submittedResultSummary;
      const panelW = 470;
      const panelH = 52;
      const panelX = cx - panelW / 2;

      const panel = new zim.Container().addTo(stage).loc(panelX, y);
      panel.mouseChildren = false;

      new zim.Rectangle({
        width: panelW,
        height: panelH,
        color: rgba(C.leaf, 0.1),
        borderColor: rgba(C.leaf, 0.45),
        borderWidth: 2,
        corner: 22,
      }).addTo(panel);

      new zim.Label({
        text: "Saved Result",
        size: 13,
        font: FONT,
        color: "#3a7a3a",
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(panel)
        .loc(panelW / 2, 14);

      new zim.Label({
        text: `Accuracy ${summary.accuracy}% • Time ${formatSeconds(
          summary.timeSeconds,
        )} • Hints ${summary.hintsUsed} • Misses ${summary.wrongAttempts}`,
        size: 14,
        font: FONT,
        color: C.ink,
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(panel)
        .loc(panelW / 2, 34);

      return true;
    }

    function snapshotCompletedRoundForSubmit() {
      if (!puzzle?.roundId) {
        return;
      }

      const alreadyCaptured = completedRoundSubmissions.some(
        (round) => round.roundId === puzzle.roundId,
      );

      if (alreadyCaptured) {
        return;
      }

      completedRoundSubmissions.push({
        roundId: puzzle.roundId,
        mode: currentMode,
        pairCount: puzzle.leftItems?.length || getCurrentPairCount(),
        matches: buildCurrentRoundMatchArray(),
        timeSeconds: getElapsedRoundSeconds(),
        hintsUsed: roundHintsUsed,
        wrongAttempts: roundWrongAttempts,
        clientScore: totalScore - roundStartScore,
      });
    }

    function emitHelperHint(text, holdMs = 4200) {
      lastHintText = String(text || "");

      emit("hint", {
        text: lastHintText,
        holdMs,
      });

      publishDebugState();
    }

    function requestHintForSelectedCard() {
      if (!selectedLeft) {
        emitHelperHint(
          "Pick a word from the left side first, then I can help!",
          4200,
        );
        return;
      }

      const hint = puzzle?.hints?.[selectedLeft.id];

      if (!hint) {
        emitHelperHint(
          "I do not have a hint for this word yet. Try another match!",
          4200,
        );
        return;
      }

      if (!hintedLeftIds.has(selectedLeft.id)) {
        hintedLeftIds.add(selectedLeft.id);
        roundHintsUsed += 1;
      }

      emitHelperHint(hint, 5500);
    }

    async function submitCompletedSessionScore() {
      if (isSubmittingScore) {
        return;
      }

      const requestId = scoreSubmitRequestId + 1;
      scoreSubmitRequestId = requestId;

      if (!completedRoundSubmissions.length) {
        scoreSubmitMessage = "";
        scoreSubmitError = "Finish at least one round before submitting.";
        showFinalScore();
        return;
      }

      isSubmittingScore = true;
      scoreSubmitMessage = "Saving your score...";
      scoreSubmitError = "";

      submittedResultSummary = null;
      showFinalScore();

      try {
        let latestResult = null;

        for (const round of completedRoundSubmissions) {
          if (submittedRoundIds.has(round.roundId)) {
            continue;
          }

          latestResult = await submitMeaningBridgeScore({
            roundId: round.roundId,
            playerName: getNormalizedPlayerName(),
            matches: round.matches,
            timeSeconds: round.timeSeconds,
            hintsUsed: round.hintsUsed,
            wrongAttempts: round.wrongAttempts,
          });

          submittedRoundIds.add(round.roundId);
        }

        submittedResultSummary = buildSubmittedResultSummary(latestResult);

        scoreSubmitMessage =
          submittedResultSummary.message ||
          "Score saved! Great bridge building.";
        scoreSubmitError = "";

        await refreshLeaderboard({ silent: true });
      } catch (error) {
        scoreSubmitMessage = "";
        scoreSubmitError =
          error instanceof Error ? error.message : "Could not submit score.";
      } finally {
        if (scoreSubmitRequestId !== requestId) {
          return;
        }

        isSubmittingScore = false;

        if (screen === "final-score") {
          showFinalScore();
        }
      }
    }

    async function refreshLeaderboard({ silent = false } = {}) {
      isLoadingLeaderboard = true;
      leaderboardError = "";

      if (!silent) {
        drawLeaderboardScene();
      }

      try {
        const data = await fetchMeaningBridgeLeaderboard(10);
        leaderboard = Array.isArray(data?.scores) ? data.scores : [];
      } catch (error) {
        leaderboardError =
          error instanceof Error
            ? error.message
            : "Could not load leaderboard.";
      } finally {
        isLoadingLeaderboard = false;
      }

      if (!silent) {
        drawLeaderboardScene();
      }
    }

    function openLeaderboard(returnScreen = screen) {
      leaderboardReturnScreen =
        returnScreen === "final-score" ? "final-score" : "landing";
      refreshLeaderboard({ silent: false });
    }

    function closeLeaderboard() {
      if (leaderboardReturnScreen === "final-score") {
        showFinalScore();
        return;
      }

      drawLandingScene();
    }

    function returnToMainMenu() {
      scoreSubmitRequestId += 1;
      isSubmittingScore = false;
      scoreSubmitMessage = "";
      scoreSubmitError = "";

      resetSessionForNewAdventure();
      drawLandingScene();
    }

    function requestExitToMainMenu() {
      if (["gameplay", "round-complete", "loading"].includes(screen)) {
        showExitConfirm();
        return;
      }

      returnToMainMenu();
    }

    function restoreAfterExitCancel() {
      const previousScreen = exitConfirmPreviousScreen;

      if (previousScreen === "round-complete") {
        showRoundComplete();
        return;
      }

      if (puzzle) {
        screen = "gameplay";
        renderGame();
        return;
      }

      drawChallengeScene();
    }

    function showExitConfirm() {
      exitConfirmPreviousScreen = screen;
      screen = "confirm-exit";

      stage.removeAllChildren();
      drawBackground();

      const modalW = 560;
      const modalH = 250;
      const modalX = (W - modalW) / 2;
      const modalY = (H - modalH) / 2;

      new zim.Rectangle({
        width: modalW,
        height: modalH,
        color: rgba(C.ink, 0.08),
        corner: 30,
      })
        .addTo(stage)
        .loc(modalX + 3, modalY + 5);

      new zim.Rectangle({
        width: modalW,
        height: modalH,
        color: C.white,
        borderColor: rgba(C.tangerine, 0.45),
        borderWidth: 2,
        corner: 30,
      })
        .addTo(stage)
        .loc(modalX, modalY);

      new zim.Label({
        text: "Leave this game?",
        size: 36,
        font: FONT,
        color: C.ink,
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(stage)
        .loc(W / 2, modalY + 62);

      new zim.Label({
        text: "Your current puzzle progress will be cleared.",
        size: 18,
        font: FONT,
        color: C.sub,
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(stage)
        .loc(W / 2, modalY + 112);

      drawKidButton({
        x: W / 2 - 245,
        y: modalY + 168,
        width: 220,
        height: 52,
        label: "Keep Playing",
        color: C.white,
        textColor: "#3a7a3a",
        borderColor: rgba(C.leaf, 0.55),
        onClick: restoreAfterExitCancel,
      });

      drawKidButton({
        x: W / 2 + 25,
        y: modalY + 168,
        width: 220,
        height: 52,
        label: "Exit to Menu",
        color: C.tangerine,
        onClick: returnToMainMenu,
      });

      safeUpdate();
    }

    function getActiveChallenge() {
      return (
        CHALLENGE_MODES.find((challenge) => challenge.mode === currentMode) ||
        CHALLENGE_MODES[0]
      );
    }

    function resetSessionForNewAdventure() {
      stopTimedTimer();

      roundIndex = 0;
      totalScore = 0;
      roundStartScore = 0;
      completedPuzzles = 0;

      timedSecondsLeft = timedSecondsTotal;
      timedEndsAt = 0;

      puzzle = null;
      selectedLeft = null;
      selectedRight = null;
      matches = {};
      flashWrong = null;
      lastMatchLeft = null;
      freshRound = true;
      errorMessage = "";

      lastHintText = "";

      roundStartedAt = Date.now();
      roundHintsUsed = 0;
      roundWrongAttempts = 0;
      hintedLeftIds = new Set();

      completedRoundSubmissions = [];
      submittedRoundIds = new Set();
      isSubmittingScore = false;
      scoreSubmitMessage = "";
      scoreSubmitError = "";

      submittedResultSummary = null;
    }

    function drawSoftCloud(x, y, scale = 1) {
      const cloud = new zim.Container().addTo(stage).loc(x, y);
      cloud.mouseChildren = false;

      new zim.Circle(28 * scale, "rgba(255,255,255,0.82)")
        .addTo(cloud)
        .loc(0, 12 * scale);

      new zim.Circle(36 * scale, "rgba(255,255,255,0.9)")
        .addTo(cloud)
        .loc(34 * scale, 0);

      new zim.Circle(26 * scale, "rgba(255,255,255,0.82)")
        .addTo(cloud)
        .loc(76 * scale, 14 * scale);

      new zim.Rectangle({
        width: 92 * scale,
        height: 28 * scale,
        color: "rgba(255,255,255,0.86)",
        corner: 16 * scale,
      })
        .addTo(cloud)
        .loc(-8 * scale, 16 * scale);

      return cloud;
    }

    function drawShortcutStrip({
      text,
      x,
      y,
      width = 620,
      height = 30,
      accent = C.grape,
    }) {
      const strip = new zim.Container().addTo(stage).loc(x, y);
      strip.mouseChildren = false;

      new zim.Rectangle({
        width,
        height,
        color: "rgba(255,255,255,0.72)",
        borderColor: rgba(accent, 0.22),
        borderWidth: 1.5,
        corner: height / 2,
      }).addTo(strip);

      const label = new zim.Label({
        text,
        size: 12,
        font: FONT,
        color: SHORTCUT_BLUE,
        align: "center",
        valign: "center",
        bold: true,
        lineWidth: width - 24,
      })
        .addTo(strip)
        .loc(width / 2, height / 2);

      label.alpha = 0.86;

      return strip;
    }

    function drawKidButton({
      x,
      y,
      width,
      height,
      label,
      color = C.tangerine,
      textColor = C.white,
      borderColor = "transparent",
      onClick,
    }) {
      const button = new zim.Container().addTo(stage).loc(x, y);
      button.mouseChildren = false;

      new zim.Rectangle({
        width,
        height,
        color: rgba(C.ink, 0.08),
        corner: height / 2,
      })
        .addTo(button)
        .loc(2, 4);

      new zim.Rectangle({
        width,
        height,
        color,
        borderColor,
        borderWidth: borderColor === "transparent" ? 0 : 2,
        corner: height / 2,
      }).addTo(button);

      new zim.Label({
        text: label,
        size: 18,
        font: FONT,
        color: textColor,
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(button)
        .loc(width / 2, height / 2);

      button.cursor = "pointer";
      button.on("click", onClick);

      return button;
    }

    function drawPlayerIdentityPill({ x, y }) {
      const pill = new zim.Container().addTo(stage).loc(x, y);
      pill.mouseChildren = false;

      new zim.Rectangle({
        width: 240,
        height: 48,
        color: "rgba(255,255,255,0.88)",
        borderColor: rgba(C.leaf, 0.45),
        borderWidth: 2,
        corner: 24,
      }).addTo(pill);

      new zim.Label({
        text: getPlayerIdentityType(),
        size: 11,
        font: FONT,
        color: C.sub,
        bold: true,
      })
        .addTo(pill)
        .loc(20, 8);

      new zim.Label({
        text: `Playing as ${getNormalizedPlayerName()}`,
        size: 15,
        font: FONT,
        color: C.ink,
        bold: true,
        lineWidth: 198,
      })
        .addTo(pill)
        .loc(20, 26);

      return pill;
    }

    function drawModeBadge({ x, y, challenge, selected = false, onClick }) {
      const card = new zim.Container().addTo(stage).loc(x, y);
      card.mouseChildren = false;

      new zim.Rectangle({
        width: 285,
        height: 142,
        color: rgba(C.ink, 0.08),
        corner: 28,
      })
        .addTo(card)
        .loc(2, 5);

      new zim.Rectangle({
        width: 285,
        height: 142,
        color: selected ? rgba(challenge.accent, 0.16) : C.white,
        borderColor: selected ? challenge.accent : rgba(challenge.accent, 0.35),
        borderWidth: selected ? 3 : 2,
        corner: 28,
      }).addTo(card);

      new zim.Circle(30, rgba(challenge.accent, 0.16), challenge.accent, 2)
        .addTo(card)
        .loc(46, 44);

      new zim.Label({
        text: challenge.icon,
        size: 30,
        font: FONT,
        align: "center",
        valign: "center",
      })
        .addTo(card)
        .loc(46, 43);

      new zim.Label({
        text: challenge.shortTitle,
        size: 22,
        font: FONT,
        color: challenge.accent,
        bold: true,
      })
        .addTo(card)
        .loc(86, 24);

      new zim.Label({
        text: challenge.level,
        size: 12,
        font: FONT,
        color: C.sub,
        bold: true,
      })
        .addTo(card)
        .loc(88, 52);

      new zim.Label({
        text: challenge.kidText,
        size: 14,
        font: FONT,
        color: C.ink,
        lineWidth: 230,
        align: "center",
        valign: "center",
      })
        .addTo(card)
        .loc(142, 96);

      if (selected) {
        new zim.Rectangle({
          width: 74,
          height: 24,
          color: challenge.accent,
          corner: 12,
        })
          .addTo(card)
          .loc(190, 14);

        new zim.Label({
          text: "READY",
          size: 11,
          font: FONT,
          color: C.white,
          align: "center",
          valign: "center",
          bold: true,
        })
          .addTo(card)
          .loc(227, 26);
      }

      new zim.Circle(14, C.white, challenge.accent, 2).addTo(card).loc(24, 24);

      new zim.Label({
        text: challenge.key,
        size: 14,
        font: FONT,
        color: challenge.accent,
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(card)
        .loc(24, 24);

      card.cursor = "pointer";
      card.on("click", onClick);

      return card;
    }

    function drawLandingScene() {
      screen = "landing";
      stage.removeAllChildren();
      drawBackground();

      drawSoftCloud(90, 72, 0.9);
      drawSoftCloud(835, 96, 0.75);

      new zim.Circle(62, rgba(C.sunshine, 0.55), rgba(C.tangerine, 0.55), 4)
        .addTo(stage)
        .loc(946, 120);

      new zim.Label({
        text: "🌉",
        size: 72,
        font: FONT,
        align: "center",
        valign: "center",
      })
        .addTo(stage)
        .loc(W / 2, 116);

      new zim.Label({
        text: "Meaning Bridge",
        size: 54,
        font: FONT,
        color: C.ink,
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(stage)
        .loc(W / 2, 194);

      new zim.Label({
        text: "Connect words, build bridges, and grow your vocabulary.",
        size: 22,
        font: FONT,
        color: "#3a7a3a",
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(stage)
        .loc(W / 2, 246);

      const panel = new zim.Container().addTo(stage).loc(190, 300);
      panel.mouseChildren = false;

      new zim.Rectangle({
        width: 720,
        height: 176,
        color: rgba(C.ink, 0.07),
        corner: 34,
      })
        .addTo(panel)
        .loc(2, 5);

      new zim.Rectangle({
        width: 720,
        height: 176,
        color: "rgba(255,255,255,0.88)",
        borderColor: rgba(C.leaf, 0.35),
        borderWidth: 2,
        corner: 34,
      }).addTo(panel);

      new zim.Label({
        text: "How it works",
        size: 24,
        font: FONT,
        color: C.ink,
        bold: true,
      })
        .addTo(panel)
        .loc(42, 30);

      const tips = [
        "1. Choose a challenge.",
        "2. Pick a word card.",
        "3. Match it to the correct card.",
        "4. Practice freely or race the timer!",
      ];

      tips.forEach((tip, index) => {
        new zim.Label({
          text: tip,
          size: 17,
          font: FONT,
          color: index % 2 === 0 ? "#3a7a3a" : "#6b48cc",
          bold: true,
        })
          .addTo(panel)
          .loc(48 + (index % 2) * 320, 76 + Math.floor(index / 2) * 42);
      });

      drawKidButton({
        x: W / 2 - 165,
        y: 520,
        width: 330,
        height: 58,
        label: "Start Adventure →",
        color: C.tangerine,
        onClick: drawChallengeScene,
      });

      drawKidButton({
        x: W / 2 - 135,
        y: 596,
        width: 270,
        height: 46,
        label: "How to Play",
        color: C.white,
        textColor: "#3a7a3a",
        borderColor: rgba(C.leaf, 0.55),
        onClick: drawRulesScene,
      });

      drawKidButton({
        x: W / 2 - 135,
        y: 654,
        width: 270,
        height: 42,
        label: "Leaderboard",
        color: C.white,
        textColor: "#6b48cc",
        borderColor: rgba(C.grape, 0.45),
        onClick: () => openLeaderboard("landing"),
      });

      safeUpdate();
    }

    function drawRulesScene() {
      screen = "rules";
      stage.removeAllChildren();
      drawBackground();

      new zim.Label({
        text: "How to Play",
        size: 48,
        font: FONT,
        color: C.ink,
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(stage)
        .loc(W / 2, 108);

      const card = new zim.Container().addTo(stage).loc(170, 170);
      card.mouseChildren = false;

      new zim.Rectangle({
        width: 760,
        height: 360,
        color: rgba(C.ink, 0.07),
        corner: 32,
      })
        .addTo(card)
        .loc(2, 5);

      new zim.Rectangle({
        width: 760,
        height: 360,
        color: C.white,
        borderColor: rgba(C.grape, 0.3),
        borderWidth: 2,
        corner: 32,
      }).addTo(card);

      const rows = [
        ["👈", "Pick a word", "Choose one word from the left side."],
        [
          "👉",
          "Find its match",
          "Choose the synonym, definition, or opposite on the right.",
        ],
        [
          "🌉",
          "Build the bridge",
          "Correct matches create colorful bridge lines.",
        ],
        [
          "⭐",
          "Score points",
          "In Practice, finish when ready. In Timed Challenge, beat the clock!",
        ],
      ];

      rows.forEach(([icon, title, text], index) => {
        const y = 38 + index * 78;

        new zim.Label({
          text: icon,
          size: 34,
          font: FONT,
          align: "center",
          valign: "center",
        })
          .addTo(card)
          .loc(60, y + 22);

        new zim.Label({
          text: title,
          size: 21,
          font: FONT,
          color: C.ink,
          bold: true,
        })
          .addTo(card)
          .loc(108, y);

        new zim.Label({
          text,
          size: 16,
          font: FONT,
          color: C.sub,
          lineWidth: 570,
        })
          .addTo(card)
          .loc(108, y + 28);
      });

      drawShortcutStrip({
        text: "Keyboard: ? Help • Enter Continue • 1-3 Challenge • P Practice • T Timed • H Hint • Esc Back",
        x: W / 2 - 360,
        y: 540,
        width: 720,
        accent: C.grape,
      });

      drawKidButton({
        x: W / 2 - 280,
        y: 580,
        width: 240,
        height: 52,
        label: "← Back",
        color: C.white,
        textColor: "#3a7a3a",
        borderColor: rgba(C.leaf, 0.55),
        onClick: drawLandingScene,
      });

      drawKidButton({
        x: W / 2 + 40,
        y: 580,
        width: 240,
        height: 52,
        label: "Choose Challenge →",
        color: C.tangerine,
        onClick: drawChallengeScene,
      });

      safeUpdate();
    }

    function drawChallengeScene() {
      screen = "challenge";
      stage.removeAllChildren();
      drawBackground();

      drawPlayerIdentityPill({
        x: W - 280,
        y: 24,
      });

      new zim.Label({
        text: "Choose Your Challenge",
        size: 40,
        font: FONT,
        color: C.ink,
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(stage)
        .loc(W / 2, 78);

      new zim.Label({
        text: "Pick a bridge type, then choose how you want to play.",
        size: 17,
        font: FONT,
        color: "#3a7a3a",
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(stage)
        .loc(W / 2, 118);

      const startX = 92;
      const cardY = 166;
      const gap = 32;

      CHALLENGE_MODES.forEach((challenge, index) => {
        drawModeBadge({
          x: startX + index * (285 + gap),
          y: cardY,
          challenge,
          selected: challenge.mode === currentMode,
          onClick: () => {
            currentMode = challenge.mode;
            drawChallengeScene();
          },
        });
      });

      const active = getActiveChallenge();

      const preview = new zim.Container().addTo(stage).loc(230, 326);
      preview.mouseChildren = false;

      new zim.Rectangle({
        width: 640,
        height: 62,
        color: "rgba(255,255,255,0.86)",
        borderColor: rgba(active.accent, 0.25),
        borderWidth: 2,
        corner: 24,
      }).addTo(preview);

      new zim.Label({
        text: `${active.icon} ${active.title}`,
        size: 22,
        font: FONT,
        color: active.accent,
        bold: true,
      })
        .addTo(preview)
        .loc(26, 13);

      new zim.Label({
        text: active.subtitle,
        size: 14,
        font: FONT,
        color: C.ink,
        lineWidth: 540,
      })
        .addTo(preview)
        .loc(28, 39);

      drawPlayModeToggle({
        x: W / 2 - 296,
        y: 424,
      });

      if (isTimedMode()) {
        drawTimerOptionsSection({
          x: W / 2 - 198,
          y: 500,
        });

        if (isCustomTimerSelected()) {
          drawCustomTimerEditor({
            x: W / 2 - 235,
            y: 552,
          });
        }
      }

      const actionY = isTimedMode()
        ? isCustomTimerSelected()
          ? 644
          : 614
        : 596;

      drawShortcutStrip({
        text: isTimedMode()
          ? "Shortcuts: 1-3 Challenge • P Practice • T Timed • C Custom • Enter Start • Esc Home"
          : "Shortcuts: 1-3 Challenge • P Practice • T Timed • Enter Start • Esc Home",
        x: W / 2 - 350,
        y: actionY - 40,
        width: 700,
        accent: isTimedMode() ? C.tangerine : active.accent,
      });

      drawKidButton({
        x: W / 2 - 270,
        y: actionY,
        width: 220,
        height: 52,
        label: "← Home",
        color: C.white,
        textColor: "#3a7a3a",
        borderColor: rgba(C.leaf, 0.55),
        onClick: drawLandingScene,
      });

      drawKidButton({
        x: W / 2 + 50,
        y: actionY,
        width: 240,
        height: 52,
        label: getPlayButtonLabel(),
        color: isTimedMode() ? C.tangerine : active.accent,
        onClick: startSelectedPlaySession,
      });

      safeUpdate();
    }

    function drawCard({
      item,
      x,
      y,
      cardH,
      side,
      pairIdx,
      matchPairIdx,
      isMatched,
      isSelected,
      isWrong,
      isJustMatched,
    }) {
      const mColor = PC[matchPairIdx % PC.length];
      const mDark = PD[matchPairIdx % PD.length];

      let accent, border, textCol, subCol;

      const modeAccent =
        currentMode === "word-to-synonym"
          ? "#3a8a3a"
          : currentMode === "word-to-antonym"
            ? "#1a7a99"
            : "#6b48cc";

      if (isWrong) {
        accent = "#ff3333";
        border = rgba("#ff3333", 0.6);
        textCol = "#c00000";
        subCol = "#ff6666";
      } else if (isMatched) {
        accent = mColor;
        border = rgba(mColor, 0.55);
        textCol = mDark;
        subCol = mDark;
      } else if (isSelected) {
        accent = modeAccent;
        border = modeAccent;
        textCol = G.dark;
        subCol = G.dark;
      } else {
        accent = modeAccent;
        border = rgba(modeAccent, 0.35);
        textCol = G.dark;
        subCol = G.base;
      }

      const cardBg =
        isWrong || isMatched || isSelected ? C.white : rgba(modeAccent, 0.07);

      const card = new zim.Container()
        .addTo(stage)
        .loc(x, isSelected ? y - 3 : y);
      card.mouseChildren = false;

      // Shadow
      new zim.Rectangle({
        width: CARD_W,
        height: cardH,
        color: rgba(C.ink, 0.07),
        corner: 15,
      })
        .addTo(card)
        .loc(1, 4);

      // Card body
      new zim.Rectangle({
        width: CARD_W,
        height: cardH,
        color: cardBg,
        borderColor: border,
        borderWidth: isSelected ? 2.5 : 1.8,
        corner: 15,
      }).addTo(card);

      // Left accent bar
      new zim.Rectangle({
        width: 7,
        height: cardH - 10,
        color: accent,
        corner: [4, 0, 0, 4],
      })
        .addTo(card)
        .loc(2, 5);

      const n = puzzle.leftItems.length;
      const fs = n >= 6 ? 18 : n >= 5 ? 20 : 22;

      if (side === "left") {
        new zim.Label({
          text: item.label,
          size: fs,
          font: FONT,
          color: textCol,
          align: "center",
          valign: "center",
          bold: true,
        })
          .addTo(card)
          .loc(CARD_W / 2 + 4, cardH / 2 - 6);

        // POS badge — pill in top-right corner
        const badgeW = Math.max(item.sublabel.length * 9 + 14, 46);
        new zim.Rectangle({
          width: badgeW,
          height: 20,
          color: rgba(accent, 0.14),
          corner: 10,
        })
          .addTo(card)
          .loc(CARD_W - badgeW - 6, 6);
        new zim.Label({
          text: item.sublabel,
          size: 11,
          font: FONT,
          color: isWrong ? "#c00000" : accent,
          align: "center",
          valign: "center",
          bold: true,
        })
          .addTo(card)
          .loc(CARD_W - badgeW / 2 - 6, 16);
      } else {
        new zim.Label({
          text: item.label,
          size: fs,
          font: FONT,
          color: textCol,
          align: "center",
          valign: "center",
          bold: true,
          lineWidth: CARD_W - 26,
        })
          .addTo(card)
          .loc(CARD_W / 2 + 4, cardH / 2 - 8);

        new zim.Label({
          text: item.sublabel,
          size: 11,
          font: FONT,
          color: subCol,
          align: "center",
          valign: "center",
        })
          .addTo(card)
          .loc(CARD_W / 2 + 4, cardH - 13);
      }

      if (isJustMatched) {
        card.animate({
          props: { scaleX: 1.08, scaleY: 1.08 },
          time: 0.13,
          rewind: true,
        });
      }

      // Entrance animation — stagger by card index
      if (freshRound && !isMatched && !isSelected && !isWrong) {
        card.alpha = 0;
        const delay =
          (side === "left"
            ? pairIdx
            : puzzle.rightItems.findIndex((r) => r.id === item.id)) * 0.07;
        card.animate({
          props: { alpha: 1 },
          time: 0.22,
          wait: delay,
          ease: "backOut",
        });
      }

      if (!isMatched && !isWrong) {
        card.cursor = "pointer";
        card.on("click", () => onCardClick(item, side, y, cardH));
      }
    }

    // ── COLUMN PILL BADGE ────────────────────────────────────────────
    function drawColumnPill(text, cx, cy, color) {
      const pw = text.length * 13 + 28,
        ph = 30;
      const pill = new zim.Container()
        .addTo(stage)
        .loc(cx - pw / 2, cy - ph / 2);
      pill.mouseChildren = false;
      new zim.Rectangle({
        width: pw,
        height: ph,
        color: rgba(color, 0.12),
        borderColor: color,
        borderWidth: 1.5,
        corner: ph / 2,
      }).addTo(pill);
      new zim.Label({
        text,
        size: 16,
        font: FONT,
        color,
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(pill)
        .loc(pw / 2, ph / 2);
    }

    // ── PANEL CONTAINER (wraps all cards on one side) ─────────────────
    function drawPanelContainer(x, y, w, h) {
      const PAD = 10;
      // Shadow
      new zim.Rectangle({
        width: w + PAD * 2,
        height: h + PAD * 2,
        color: rgba(C.ink, 0.06),
        corner: 20,
      })
        .addTo(stage)
        .loc(x - PAD + 2, y - PAD + 4);
      // Panel body
      new zim.Rectangle({
        width: w + PAD * 2,
        height: h + PAD * 2,
        color: "rgba(254,248,240,0.9)",
        borderColor: rgba("#5aaa5a", 0.22),
        borderWidth: 1.5,
        corner: 20,
      })
        .addTo(stage)
        .loc(x - PAD, y - PAD);
    }

    // ── RENDER GAME ───────────────────────────────────────────────────
    function renderGame() {
      calcLayout();
      stage.removeAllChildren();

      // Background
      drawBackground();

      drawHeader({ showExit: true });

      // Bridge zone — clean white strip with a very subtle green tint from the header
      const bx = LEFT_X + CARD_W;
      const bw = RIGHT_X - bx;
      new zim.Rectangle(bw, H - HEADER_H, rgba("#7ec87e", 0.05))
        .addTo(stage)
        .loc(bx, HEADER_H);

      // Thin vertical dashed dividers at each edge of the bridge zone
      [bx, bx + bw].forEach((dx) => {
        const dv = new zim.Shape().addTo(stage);
        dv.s(rgba("#5aaa5a", 0.18)).ss(1.5, "round", "round").sd([6, 7]);
        dv.mt(dx, HEADER_H + 12).lt(dx, H - 12);
      });

      // Instruction text
      const instrColor =
        currentMode === "word-to-synonym"
          ? "#3a8a3a"
          : currentMode === "word-to-antonym"
            ? "#1a7a99"
            : "#6b48cc";
      const instr = new zim.Label({
        text: puzzle.instruction,
        size: 21,
        font: FONT,
        color: instrColor,
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(stage)
        .center(stage);
      instr.y = HEADER_H + 18;
      instr.alpha = 0;
      instr.animate({
        props: { y: HEADER_H + 32, alpha: 1 },
        time: 0.4,
        ease: "backOut",
      });

      // Column header pills — sit clearly above the first card row
      const rightLabel =
        currentMode === "word-to-synonym"
          ? "Synonym"
          : currentMode === "word-to-antonym"
            ? "Antonym"
            : "Definition";
      const CHY = HEADER_H + 36;
      drawColumnPill("Word", LEFT_X + CARD_W / 2, CHY, instrColor);
      drawColumnPill(rightLabel, RIGHT_X + CARD_W / 2, CHY, instrColor);

      // Single container wrapping both panels + bridge zone
      const n = puzzle.leftItems.length;
      const offsetY = (RIGHT_CARD_H - CARD_H) / 2;
      // For 4 pairs: extend panel above first card and below last card symmetrically
      const TOP_PAD = n === 4 ? 28 : 0;
      const panelTop = START_Y + offsetY - TOP_PAD;
      const panelH =
        n === 4
          ? H - BOTTOM_BAR_H - 8 - panelTop
          : (n - 1) * GAP + RIGHT_CARD_H;
      drawPanelContainer(LEFT_X, panelTop, RIGHT_X + CARD_W - LEFT_X, panelH);

      // Bridges first (behind cards)
      drawBridges();
      drawCards();
      drawBottomBar();
      safeUpdate();
      freshRound = false; // entrance animation only plays on first render per round
    }

    function drawBottomBar() {
      const barH = BOTTOM_BAR_H;
      const barY = H - barH;

      // Bottom bar background
      new zim.Rectangle(W, barH, rgba("#5aaa5a", 0.08))
        .addTo(stage)
        .loc(0, barY);
      new zim.Rectangle(W, 2, "#5aaa5a").addTo(stage).loc(0, barY); // solid top border

      const matched = Object.keys(matches).length;
      const total = puzzle.leftItems.length;

      // Progress bar (centered, wider, more prominent)
      const progW = 320,
        progH = 10,
        progX = W / 2 - progW / 2,
        progY = barY + 26;
      new zim.Rectangle({
        width: progW,
        height: progH,
        color: rgba("#5aaa5a", 0.18),
        corner: progH / 2,
      })
        .addTo(stage)
        .loc(progX, progY);
      if (matched > 0) {
        const fillW = Math.round((progW * matched) / total);
        new zim.Rectangle({
          width: fillW,
          height: progH,
          color: "#5aaa5a",
          corner: progH / 2,
        })
          .addTo(stage)
          .loc(progX, progY);
      }
      // Progress label — above the bar
      new zim.Label({
        text: `${matched} of ${total} matched`,
        size: 14,
        font: FONT,
        color: "#3a7a3a",
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(stage)
        .loc(W / 2, barY + 14);

      const gameplayShortcutText = isTimedMode()
        ? "H Hint • R Retry • S Skip • Esc Exit"
        : "H Hint • R Retry • S Next • F Finish • Esc Exit";

      const gameplayShortcutLabel = new zim.Label({
        text: gameplayShortcutText,
        size: 11,
        font: FONT,
        color: SHORTCUT_BLUE,
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(stage)
        .loc(W / 2, barY + 50);

      gameplayShortcutLabel.alpha = 0.72;

      // Hint button (right side)
      const hintBtn = new zim.Container().addTo(stage).loc(W - 140, barY + 11);
      hintBtn.mouseChildren = false;
      new zim.Rectangle({
        width: 110,
        height: 38,
        color: "#e8eaf6",
        borderColor: "#7986cb",
        borderWidth: 2,
        corner: 19,
      }).addTo(hintBtn);
      new zim.Label({
        text: "💡 H Hint",
        size: 16,
        font: FONT,
        color: "#3949ab",
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(hintBtn)
        .loc(55, 19);
      hintBtn.cursor = "pointer";
      hintBtn.on("click", requestHintForSelectedCard);

      // Skip button (left side)
      const skipBtn = new zim.Container().addTo(stage).loc(30, barY + 11);
      skipBtn.mouseChildren = false;
      new zim.Rectangle({
        width: 110,
        height: 38,
        color: "#e8eaf6",
        borderColor: "#7986cb",
        borderWidth: 2,
        corner: 19,
      }).addTo(skipBtn);
      new zim.Label({
        text: isTimedMode() ? "S Skip" : "S Next",
        size: 16,
        font: FONT,
        color: "#3949ab",
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(skipBtn)
        .loc(55, 19);
      skipBtn.cursor = "pointer";
      skipBtn.on("click", skipCurrentRound);
    }

    // ── LOADING / ERROR ───────────────────────────────────────────────
    function showLoading() {
      stage.removeAllChildren();
      drawBackground();
      drawHeader({ showExit: false });

      // Pulsing dots
      const dots = new zim.Container().addTo(stage).center(stage);
      [0, 1, 2].forEach((i) => {
        const dot = new zim.Circle(9, PC[i]).addTo(dots).loc(i * 34 - 34, 0);
        dot.animate({
          props: { y: -14 },
          time: 0.45,
          ease: "backOut",
          loop: true,
          rewind: true,
          wait: i * 0.15,
        });
      });
      new zim.Label({
        text: "Loading…",
        size: 22,
        font: FONT,
        color: C.sub,
        align: "center",
        valign: "center",
      })
        .addTo(stage)
        .loc(W / 2, H / 2 + 36);

      safeUpdate();
    }

    function showError(msg) {
      screen = "error";
      errorMessage = String(msg || "Could not load this round.");

      stage.removeAllChildren();
      drawBackground();

      new zim.Label({
        text: "Oops, the bridge did not load!",
        size: 38,
        font: FONT,
        color: C.ink,
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(stage)
        .loc(W / 2, 160);

      new zim.Label({
        text: "The server answered, but it could not build this challenge yet.",
        size: 18,
        font: FONT,
        color: "#3a7a3a",
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(stage)
        .loc(W / 2, 214);

      const panel = new zim.Container().addTo(stage).loc(200, 270);
      panel.mouseChildren = false;

      new zim.Rectangle({
        width: 700,
        height: 150,
        color: C.white,
        borderColor: rgba("#ff3333", 0.25),
        borderWidth: 2,
        corner: 28,
      }).addTo(panel);

      new zim.Label({
        text: errorMessage,
        size: 17,
        font: FONT,
        color: "#cc0000",
        lineWidth: 620,
        align: "center",
        valign: "center",
      })
        .addTo(panel)
        .loc(350, 75);

      drawKidButton({
        x: W / 2 - 270,
        y: 500,
        width: 230,
        height: 52,
        label: "Choose Challenge",
        color: C.white,
        textColor: "#3a7a3a",
        borderColor: rgba(C.leaf, 0.55),
        onClick: drawChallengeScene,
      });

      drawKidButton({
        x: W / 2 + 40,
        y: 500,
        width: 230,
        height: 52,
        label: "Try Again",
        color: C.tangerine,
        onClick: loadRound,
      });

      safeUpdate();
    }

    async function loadRound() {
      if (disposed) return;
      screen = "loading";
      errorMessage = "";
      roundStartScore = totalScore;
      showLoading();

      try {
        const data = await fetchMeaningBridgeRound(
          currentMode,
          getCurrentPairCount(),
        );

        if (disposed) return;

        puzzle = data.puzzle;
        matches = {};
        selectedLeft = null;
        selectedRight = null;
        flashWrong = null;
        lastMatchLeft = null;
        freshRound = true;

        roundStartedAt = Date.now();
        roundHintsUsed = 0;
        roundWrongAttempts = 0;
        hintedLeftIds = new Set();

        screen = "gameplay";

        renderGame();
      } catch (error) {
        if (disposed) return;

        console.error("Meaning Bridge round load failed:", error);

        showError(
          error instanceof Error
            ? error.message
            : "Could not load puzzle — make sure the server is running.",
        );
      }
    }

    // ── CLICK LOGIC ────────────────────────────────────────────────────
    let promptTimeout = null;

    function showPrompt(msg, cardY, cardH) {
      const old = stage.getChildByName("prompt_toast");
      if (old) stage.removeChild(old);
      if (promptTimeout) clearTimeout(promptTimeout);

      const toastW = 220,
        toastH = 40;
      // Position to the LEFT of the right panel, vertically centered on the clicked card
      const tx = RIGHT_X - toastW - 16;
      const ty = cardY + cardH / 2 - toastH / 2;

      const toast = new zim.Container().addTo(stage);
      toast.name = "prompt_toast";
      toast.mouseChildren = false;

      // Shadow
      new zim.Rectangle({
        width: toastW,
        height: toastH,
        color: rgba("#1d2b66", 0.15),
        corner: 20,
      })
        .addTo(toast)
        .loc(1, 3);
      // Body
      new zim.Rectangle({
        width: toastW,
        height: toastH,
        color: "#1d2b66",
        corner: 20,
      }).addTo(toast);
      // Small right-pointing arrow tip
      const tip = new zim.Shape().addTo(toast);
      tip
        .f("#1d2b66")
        .mt(toastW, toastH / 2 - 7)
        .lt(toastW + 10, toastH / 2)
        .lt(toastW, toastH / 2 + 7)
        .cp();

      new zim.Label({
        text: msg,
        size: 13,
        font: FONT,
        color: "#ffffff",
        align: "center",
        valign: "center",
        lineWidth: toastW - 16,
      })
        .addTo(toast)
        .loc(toastW / 2, toastH / 2);
      toast.loc(tx, ty);
      stage.update();

      promptTimeout = scheduleTimeout(() => {
        if (stage.contains(toast)) stage.removeChild(toast);
        stage.update();
      }, 1800);
    }

    function onCardClick(item, side, cardY, cardH) {
      // Enforce: must pick a word (left) before picking a meaning (right)
      if (side === "right" && !selectedLeft) {
        showPrompt("👈 Pick a word from the left panel first!", cardY, cardH);
        return;
      }

      flashWrong = null;
      lastMatchLeft = null;
      if (side === "left") {
        if (selectedLeft?.id === item.id) {
          selectedLeft = null; // tap same word → deselect
        } else {
          selectedLeft = item; // switch to new word
          selectedRight = null; // reset right whenever left changes
        }
      } else {
        selectedRight = selectedRight?.id === item.id ? null : item;
      }

      if (selectedLeft && selectedRight) {
        renderGame();
        scheduleTimeout(checkPair, 300);
        return;
      }
      renderGame();
    }

    function checkPair() {
      if (!selectedLeft || !selectedRight) return;
      const correct = puzzle.answerKey[selectedLeft.id] === selectedRight.id;

      if (correct) {
        matches[selectedLeft.id] = selectedRight.id;
        lastMatchLeft = selectedLeft.id;
        totalScore += puzzle.scoreRules.correct;
        selectedLeft = selectedRight = null;

        if (Object.keys(matches).length === puzzle.leftItems.length) {
          completedPuzzles += 1;
          snapshotCompletedRoundForSubmit();
          renderGame();
          scheduleTimeout(showRoundComplete, 700);
          return;
        }
      } else {
        roundWrongAttempts += 1;

        totalScore = Math.max(
          0,
          totalScore - puzzle.scoreRules.wrongAttemptPenalty,
        );
        flashWrong = { leftId: selectedLeft.id, rightId: selectedRight.id };
        selectedRight = null; // keep left selected — user can keep guessing from the right
        renderGame();
        scheduleTimeout(() => {
          flashWrong = null;
          renderGame();
        }, 650);
        return;
      }
      renderGame();
    }

    // ── ROUND COMPLETE ────────────────────────────────────────────────
    function showRoundComplete() {
      screen = "round-complete";
      stage.removeAllChildren();
      drawBackground();
      drawHeader({ showExit: true });

      // Modal card
      const mW = 540,
        mH = 330;
      const mX = (W - mW) / 2,
        mY = HEADER_H + (H - HEADER_H - mH) / 2;

      new zim.Rectangle({
        width: mW,
        height: mH,
        color: rgba(C.ink, 0.05),
        corner: 28,
      })
        .addTo(stage)
        .loc(mX + 2, mY + 4);
      new zim.Rectangle({
        width: mW,
        height: mH,
        color: C.white,
        borderColor: rgba(C.leaf, 0.4),
        borderWidth: 2,
        corner: 28,
      })
        .addTo(stage)
        .loc(mX, mY);
      // Top accent
      new zim.Rectangle({
        width: mW,
        height: 6,
        color: C.leaf,
        corner: [28, 28, 0, 0],
      })
        .addTo(stage)
        .loc(mX, mY);

      const cx = mX + mW / 2;
      new zim.Label({
        text: "🎉  Well done!",
        size: 40,
        font: FONT,
        color: C.ink,
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(stage)
        .loc(cx, mY + 70);
      new zim.Label({
        text: `Puzzle ${roundIndex + 1} complete`,
        size: 22,
        font: FONT,
        color: C.sub,
        align: "center",
        valign: "center",
      })
        .addTo(stage)
        .loc(cx, mY + 138);

      // Score pill
      const sp = new zim.Container().addTo(stage).loc(cx - 70, mY + 165);
      sp.mouseChildren = false;
      new zim.Rectangle({
        width: 140,
        height: 32,
        color: rgba(C.sunshine, 0.18),
        borderColor: rgba(C.sunshine, 0.6),
        borderWidth: 1.5,
        corner: 16,
      }).addTo(sp);
      new zim.Label({
        text: `⭐ ${totalScore} pts`,
        size: 17,
        font: FONT,
        color: "#a07800",
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(sp)
        .loc(70, 16);

      drawPuzzleResultStrip(cx, mY + 204);

      const btn = new zim.Button({
        width: isTimedMode() ? 220 : 190,
        height: 48,
        label: "Next Puzzle →",
        backgroundColor: C.tangerine,
        rollBackgroundColor: "#e88030",
        color: C.white,
        corner: 24,
      })
        .addTo(stage)
        .loc(isTimedMode() ? cx - 110 : cx - 200, mY + mH - 60);
      btn.label.size = 20;
      btn.label.font = FONT;
      btn.on("click", advanceAfterRoundComplete);

      if (!isTimedMode()) {
        const finishBtn = new zim.Button({
          width: 190,
          height: 48,
          label: "See Results",
          backgroundColor: C.grape,
          rollBackgroundColor: "#7a50e0",
          color: C.white,
          corner: 24,
        })
          .addTo(stage)
          .loc(cx + 10, mY + mH - 60);

        finishBtn.label.size = 20;
        finishBtn.label.font = FONT;
        finishBtn.on("click", finishPracticeSession);
      }

      safeUpdate();
    }

    function drawLeaderboardScene() {
      screen = "leaderboard";
      stage.removeAllChildren();
      drawBackground();

      new zim.Label({
        text: "Leaderboard",
        size: 48,
        font: FONT,
        color: C.ink,
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(stage)
        .loc(W / 2, 90);

      new zim.Label({
        text: "Top bridge builders from this server session.",
        size: 18,
        font: FONT,
        color: "#3a7a3a",
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(stage)
        .loc(W / 2, 132);

      const panel = new zim.Container().addTo(stage).loc(210, 170);
      panel.mouseChildren = false;

      new zim.Rectangle({
        width: 680,
        height: 380,
        color: "rgba(255,255,255,0.9)",
        borderColor: rgba(C.grape, 0.3),
        borderWidth: 2,
        corner: 30,
      }).addTo(panel);

      if (isLoadingLeaderboard) {
        new zim.Label({
          text: "Loading leaderboard...",
          size: 22,
          font: FONT,
          color: C.sub,
          align: "center",
          valign: "center",
          bold: true,
        })
          .addTo(panel)
          .loc(340, 190);
      } else if (leaderboardError) {
        new zim.Label({
          text: leaderboardError,
          size: 18,
          font: FONT,
          color: "#cc0000",
          lineWidth: 580,
          align: "center",
          valign: "center",
          bold: true,
        })
          .addTo(panel)
          .loc(340, 190);
      } else if (!leaderboard.length) {
        new zim.Label({
          text: "No scores yet. Finish a game and submit your score!",
          size: 19,
          font: FONT,
          color: C.sub,
          lineWidth: 560,
          align: "center",
          valign: "center",
          bold: true,
        })
          .addTo(panel)
          .loc(340, 190);
      } else {
        leaderboard.slice(0, 8).forEach((player, index) => {
          const y = 32 + index * 42;
          const rank = index + 1;
          const medal =
            rank === 1
              ? "🥇"
              : rank === 2
                ? "🥈"
                : rank === 3
                  ? "🥉"
                  : `${rank}.`;

          new zim.Label({
            text: medal,
            size: 20,
            font: FONT,
            color: C.ink,
            align: "center",
            valign: "center",
            bold: true,
          })
            .addTo(panel)
            .loc(54, y + 16);

          new zim.Label({
            text: player.playerName || "Bridge Builder",
            size: 18,
            font: FONT,
            color: C.ink,
            bold: true,
          })
            .addTo(panel)
            .loc(94, y + 4);

          new zim.Label({
            text: `${player.roundsPlayed || 0} rounds • ${player.accuracyAverage || 0}% accuracy`,
            size: 12,
            font: FONT,
            color: C.sub,
          })
            .addTo(panel)
            .loc(94, y + 26);

          new zim.Label({
            text: `⭐ ${player.totalScore || 0}`,
            size: 17,
            font: FONT,
            color: "#7a5800",
            align: "right",
            valign: "center",
            bold: true,
          })
            .addTo(panel)
            .loc(610, y + 17);
        });
      }

      drawKidButton({
        x: W / 2 - 260,
        y: 590,
        width: 220,
        height: 52,
        label: "← Back",
        color: C.white,
        textColor: "#3a7a3a",
        borderColor: rgba(C.leaf, 0.55),
        onClick: closeLeaderboard,
      });

      drawKidButton({
        x: W / 2 + 40,
        y: 590,
        width: 220,
        height: 52,
        label: "Refresh",
        color: C.tangerine,
        onClick: () => refreshLeaderboard({ silent: false }),
      });

      safeUpdate();
    }

    // ── FINAL SCORE ───────────────────────────────────────────────────
    function showFinalScore() {
      stopTimedTimer();

      screen = "final-score";
      stage.removeAllChildren();
      drawBackground();
      drawHeader({ showExit: true });

      // Update session best
      const isNewBest = totalScore >= sessionBest;
      if (isNewBest) sessionBest = totalScore;
      const LOW_SCORE = 30;
      const isLowScore = totalScore < LOW_SCORE;

      // ── Sad faces (low score) or Falling flowers (good score) ────
      if (isLowScore) {
        const sadFaces = ["😢", "😔", "😞", "😿", "😭"];
        for (let i = 0; i < 14; i++) {
          const face = new zim.Label({
            text: sadFaces[i % sadFaces.length],
            size: 26 + Math.random() * 22,
            align: "center",
            valign: "center",
          }).addTo(stage);
          const sx = 40 + Math.random() * (W - 80);
          face.loc(sx, H + 30);
          face.alpha = 0.8;
          face.animate({
            props: {
              y: HEADER_H - 30,
              x: sx + (Math.random() - 0.5) * 100,
            },
            time: 2.8 + Math.random() * 2.2,
            wait: Math.random() * 3.5,
            ease: "linear",
            loop: true,
          });
        }
      } else {
        const flowerPalette = [
          { petal: C.bubblegum, center: C.sunshine },
          { petal: C.tangerine, center: C.bubblegum },
          { petal: C.grape, center: C.sunshine },
          { petal: C.ocean, center: C.white },
          { petal: C.leaf, center: C.sunshine },
          { petal: C.sunshine, center: C.tangerine },
        ];
        for (let i = 0; i < 20; i++) {
          const col = flowerPalette[i % flowerPalette.length];
          const size = 12 + Math.random() * 16;
          const px = Math.random() * W;
          const f = new zim.Container().addTo(stage);
          const dist = size * 0.48;
          for (let p = 0; p < 5; p++) {
            const rad = (((p / 5) * 360 - 90) * Math.PI) / 180;
            new zim.Circle(size * 0.36, col.petal)
              .addTo(f)
              .loc(Math.cos(rad) * dist, Math.sin(rad) * dist);
          }
          new zim.Circle(size * 0.26, col.center).addTo(f).loc(0, 0);
          f.alpha = 0.9;
          f.loc(px, HEADER_H - size - Math.random() * 100);
          f.animate({
            props: {
              y: H + size + 20,
              x: px + (Math.random() - 0.5) * 80,
              rotation:
                (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 180),
            },
            time: 2.2 + Math.random() * 2,
            wait: Math.random() * 3,
            ease: "linear",
            loop: true,
          });
        }
      }

      // Modal card
      const mW = 560,
        mH = 320;
      const mX = (W - mW) / 2,
        mY = HEADER_H + (H - HEADER_H - mH) / 2;
      const modalBorder = isLowScore
        ? rgba(C.ocean, 0.45)
        : rgba(C.sunshine, 0.5);
      const modalAccent = isLowScore ? C.ocean : C.sunshine;
      new zim.Rectangle({
        width: mW,
        height: mH,
        color: rgba(C.ink, 0.05),
        corner: 28,
      })
        .addTo(stage)
        .loc(mX + 2, mY + 4);
      new zim.Rectangle({
        width: mW,
        height: mH,
        color: C.white,
        borderColor: modalBorder,
        borderWidth: 2,
        corner: 28,
      })
        .addTo(stage)
        .loc(mX, mY);
      new zim.Rectangle({
        width: mW,
        height: 6,
        color: modalAccent,
        corner: [28, 28, 0, 0],
      })
        .addTo(stage)
        .loc(mX, mY);

      const cx = mX + mW / 2;

      // Title — varies by outcome
      const titleText = isTimedMode()
        ? "Time's up! ⏱️"
        : isLowScore
          ? "Don't give up! 😔"
          : isNewBest
            ? "🥇 New Best!"
            : "You finished! ⭐";
      new zim.Label({
        text: titleText,
        size: 42,
        font: FONT,
        color: C.ink,
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(stage)
        .loc(cx, mY + 68);

      new zim.Label({
        text: `Final Score: ${totalScore}`,
        size: 34,
        font: FONT,
        color: C.tangerine,
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(stage)
        .loc(cx, mY + 142);
      new zim.Label({
        text: `${completedPuzzles} puzzle${completedPuzzles === 1 ? "" : "s"} completed`,
        size: 16,
        font: FONT,
        color: C.sub,
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(stage)
        .loc(cx, mY + 172);

      const hasSubmittedSummary = drawSubmittedResultSummary(cx, mY + 184);

      if (!hasSubmittedSummary) {
        // existing trophy row / placeholder message block stays inside here
        // Trophy row — show when not at the top (second+ play with a lower score)
        if (!isNewBest && sessionBest > totalScore) {
          const tw = 310,
            th = 36;
          const tr = new zim.Container().addTo(stage);
          tr.mouseChildren = false;
          new zim.Rectangle({
            width: tw,
            height: th,
            color: rgba(C.sunshine, 0.14),
            borderColor: rgba(C.sunshine, 0.55),
            borderWidth: 1.5,
            corner: th / 2,
          }).addTo(tr);
          new zim.Label({
            text: `🏆 Top: ${sessionBest} pts — Can you beat it?`,
            size: 15,
            font: FONT,
            color: "#7a5800",
            align: "center",
            valign: "center",
            bold: true,
          })
            .addTo(tr)
            .loc(tw / 2, th / 2);
          tr.loc(cx - tw / 2, mY + 190);
        } else {
          new zim.Label({
            text: "Pick a mode above to play again!",
            size: 18,
            font: FONT,
            color: C.sub,
            align: "center",
            valign: "center",
          })
            .addTo(stage)
            .loc(cx, mY + 196);
        }
      }

      // Play Again button
      const shouldShowSubmitStatus =
        isSubmittingScore ||
        scoreSubmitError ||
        (scoreSubmitMessage && !submittedResultSummary);

      if (shouldShowSubmitStatus) {
        new zim.Label({
          text: isSubmittingScore
            ? "Saving your score..."
            : scoreSubmitError || scoreSubmitMessage,
          size: 15,
          font: FONT,
          color: scoreSubmitError ? "#cc0000" : "#3a7a3a",
          align: "center",
          valign: "center",
          lineWidth: 460,
          bold: true,
        })
          .addTo(stage)
          .loc(cx, mY + 232);
      }

      const submitBtn = new zim.Button({
        width: 160,
        height: 44,
        label: submittedRoundIds.size > 0 ? "Saved ✓" : "Submit Score",
        backgroundColor: submittedRoundIds.size > 0 ? C.leaf : C.tangerine,
        rollBackgroundColor: submittedRoundIds.size > 0 ? "#3aa866" : "#e88030",
        color: C.white,
        corner: 22,
      })
        .addTo(stage)
        .loc(cx - 250, mY + mH - 56);
      submitBtn.label.size = 16;
      submitBtn.label.font = FONT;
      submitBtn.on("click", submitCompletedSessionScore);

      const leaderBtn = new zim.Button({
        width: 160,
        height: 44,
        label: "Leaderboard",
        backgroundColor: C.grape,
        rollBackgroundColor: "#7a50e0",
        color: C.white,
        corner: 22,
      })
        .addTo(stage)
        .loc(cx - 80, mY + mH - 56);
      leaderBtn.label.size = 16;
      leaderBtn.label.font = FONT;
      leaderBtn.on("click", () => openLeaderboard("final-score"));

      const playBtn = new zim.Button({
        width: 160,
        height: 44,
        label: "Play Again",
        backgroundColor: C.white,
        rollBackgroundColor: "#f2f2f2",
        color: C.grape,
        corner: 22,
      })
        .addTo(stage)
        .loc(cx + 90, mY + mH - 56);
      playBtn.label.size = 16;
      playBtn.label.font = FONT;
      playBtn.on("click", returnToMainMenu);

      safeUpdate();
    }

    function handleMeaningBridgeKeyDown(event) {
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      if (isEditingCustomTimer) {
        if (handleCustomTimerTyping(event)) {
          return;
        }
      }

      const key = String(event.key || "").toLowerCase();
      const isEnter = event.key === "Enter";
      const isSpace = event.key === " " || event.code === "Space";
      const isHelp = key === "h" || key === "?" || key === "/";

      if (isHelp && screen !== "gameplay") {
        event.preventDefault();
        drawRulesScene();
        return;
      }

      if (screen === "landing") {
        if (key === "l") {
          event.preventDefault();
          openLeaderboard("landing");
          return;
        }

        if (key === "p") {
          event.preventDefault();
          playMode = "practice";
          drawChallengeScene();
          return;
        }

        if (key === "t") {
          event.preventDefault();
          playMode = "timed";
          drawChallengeScene();
          return;
        }

        if (isEnter || isSpace) {
          event.preventDefault();
          drawChallengeScene();
        }

        return;
      }

      if (screen === "rules") {
        if (isEnter || isSpace) {
          event.preventDefault();
          drawChallengeScene();
          return;
        }

        if (event.key === "Escape") {
          event.preventDefault();
          drawLandingScene();
        }

        return;
      }

      if (screen === "challenge") {
        if (["1", "2", "3"].includes(key)) {
          event.preventDefault();
          selectChallengeByIndex(Number(key) - 1);
          return;
        }

        if (key === "p") {
          event.preventDefault();
          setPlayMode("practice");
          return;
        }

        if (key === "t") {
          event.preventDefault();
          setPlayMode("timed");
          return;
        }

        if (key === "c" && isTimedMode()) {
          event.preventDefault();
          setTimerPreset(CUSTOM_TIMER_PRESET);
          return;
        }

        if (isEnter || isSpace) {
          event.preventDefault();
          startSelectedPlaySession();
          return;
        }

        if (event.key === "Escape") {
          event.preventDefault();
          drawLandingScene();
        }

        return;
      }

      if (screen === "leaderboard") {
        if (key === "r") {
          event.preventDefault();
          refreshLeaderboard({ silent: false });
          return;
        }

        if (event.key === "Escape" || isEnter || isSpace) {
          event.preventDefault();
          closeLeaderboard();
        }

        return;
      }

      if (screen === "loading") {
        if (event.key === "Escape") {
          event.preventDefault();
          requestExitToMainMenu();
        }

        return;
      }

      if (screen === "error") {
        if (key === "r" || isEnter || isSpace) {
          event.preventDefault();
          loadRound();
          return;
        }

        if (event.key === "Escape") {
          event.preventDefault();
          drawChallengeScene();
        }

        return;
      }

      if (screen === "gameplay") {
        if (key === "r") {
          event.preventDefault();
          retryCurrentRound();
          return;
        }

        if (key === "f" && !isTimedMode()) {
          event.preventDefault();
          finishPracticeSession();
          return;
        }

        if (key === "s") {
          event.preventDefault();
          skipCurrentRound();
          return;
        }

        if (key === "h") {
          event.preventDefault();
          requestHintForSelectedCard();
          return;
        }

        if (event.key === "Escape") {
          event.preventDefault();
          requestExitToMainMenu();
        }

        return;
      }

      if (screen === "round-complete") {
        if (isEnter || isSpace) {
          event.preventDefault();
          advanceAfterRoundComplete();
          return;
        }

        if (event.key === "Escape") {
          event.preventDefault();
          requestExitToMainMenu();
        }

        return;
      }

      if (screen === "final-score") {
        if (key === "s") {
          event.preventDefault();
          submitCompletedSessionScore();
          return;
        }

        if (key === "l") {
          event.preventDefault();
          openLeaderboard("final-score");
          return;
        }

        if (isEnter || isSpace || event.key === "Escape") {
          event.preventDefault();
          returnToMainMenu();
        }
      }
    }

    if (typeof window !== "undefined") {
      if (window.__meaningBridgeKeyCleanup) {
        window.__meaningBridgeKeyCleanup();
      }

      window.addEventListener("keydown", handleMeaningBridgeKeyDown);

      window.__meaningBridgeKeyCleanup = () => {
        window.removeEventListener("keydown", handleMeaningBridgeKeyDown);
      };
    }

    // ── Kick off ──────────────────────────────────────────────────────
    drawLandingScene();

    return () => {
      disposed = true;
      stopTimedTimer();
      if (promptTimeout) {
        clearTimeout(promptTimeout);
        promptTimeout = null;
      }
      clearScheduledTimeouts();
      if (typeof window !== "undefined" && window.__meaningBridgeKeyCleanup) {
        window.__meaningBridgeKeyCleanup();
        window.__meaningBridgeKeyCleanup = null;
      }
      stage.removeAllChildren();
      stage.update();
    };
  },
});
