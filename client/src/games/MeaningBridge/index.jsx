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

const FONT = "Arial";

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
  playerHotspot: {
    x: 24,
    y: 28,
    width: 220,
    height: 76,
  },
};

const GAMEPLAY_LAYOUT = {
  passage: {
    x: 90,
    y: 154,
    width: 920,
    height: 104,
  },
  leftPanel: {
    x: 70,
    y: 282,
    width: 300,
    height: 338,
  },
  rightPanel: {
    x: 730,
    y: 282,
    width: 300,
    height: 338,
  },
  centerPanel: {
    x: 400,
    y: 282,
    width: 300,
  },
  feedback: {
    y: 384,
    height: 94,
  },
  controls: {
    y: 496,
    secondaryY: 552,
  },
  card: {
    width: 250,
    height: 36,
    step: 45,
    xOffset: 25,
    yOffset: 58,
  },
  leaderboard: {
    x: 70,
    y: 638,
    width: 960,
    height: 52,
  },
};

/*
  Menu layout constants
  ---------------------
  Controls the ZIMJS menu/start screen only.

  Design rule:
  - Title/subtitle get their own clean space.
  - Player panel stays top-right.
  - Challenge cards sit in the middle.
  - Difficulty, pairs, selected setup, and Start are grouped near the bottom.
*/
const MENU_LAYOUT = {
  panel: {
    x: 120,
    y: 86,
    width: 860,
    height: 560,
  },
  playerPanel: {
    x: 745,
    y: 130,
    width: 190,
    height: 60,
  },
  challengeTitle: {
    y: 238,
  },
  modeGrid: {
    x: 170,
    y: 282,
    cardWidth: 220,
    cardHeight: 52,
    columnGap: 34,
    rowGap: 16,
  },
  difficulty: {
    labelX: 255,
    labelY: 430,
    x: 174,
    y: 458,
    buttonWidth: 92,
    buttonHeight: 36,
    gap: 12,
  },
  pairs: {
    labelX: 758,
    labelY: 430,
    x: 676,
    y: 458,
    buttonWidth: 76,
    buttonHeight: 36,
    gap: 12,
  },
  selectedSetup: {
    x: 292,
    y: 522,
    width: 516,
    height: 30,
  },
  startButton: {
    x: 445,
    y: 568,
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
    let screen = "landing";

    let playerName = "Guest Player";
    let isEditingPlayerName = false;
    let replacePlayerNameOnNextInput = false;

    let mode = "english-to-sanskrit";
    let difficulty = "easy";
    let pairCount = 4;

    let roundData = null;
    let leaderboard = [];
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
        roundId: roundData?.puzzle?.roundId || null,
        passageTitle: roundData?.passage?.title || "",
        matches,
        selectedLeftId,
        hintsUsed,
        wrongAttempts,
        resultVisible: Boolean(result),
        leaderboard,
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
      button.on("click", onClick);

      return button;
    }

    function setFeedback(message, type = "neutral") {
      feedback = message;
      feedbackType = type;
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

    function getNormalizedPlayerName() {
      return String(playerName || "").trim() || "Guest Player";
    }

    function beginPlayerNameEdit() {
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
      if (screen !== "menu" || !isEditingPlayerName) {
        return;
      }

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

      if (
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        event.preventDefault();

        if (replacePlayerNameOnNextInput) {
          playerName = "";
          replacePlayerNameOnNextInput = false;
        }

        if (playerName.length < 24) {
          playerName += event.key;
        }

        renderScene();
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

    function startBridgeRound() {
      playerName = getNormalizedPlayerName();
      isEditingPlayerName = false;
      replacePlayerNameOnNextInput = false;

      screen = "gameplay";

      void loadRound({
        mode,
        difficulty,
        pairCount,
      });
    }

    function backToMenu() {
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

    async function loadLeaderboard() {
      try {
        const response = await getMeaningBridgeLeaderboard(5);
        leaderboard = response.scores || [];
      } catch {
        leaderboard = [];
      }
    }

    async function loadRound(options = {}) {
      screen = "gameplay";
      status = "Generating round...";
      setFeedback("Building a new Meaning Bridge round...", "neutral");
      result = null;
      selectedLeftId = null;
      matches = [];
      hintsUsed = 0;
      wrongAttempts = 0;
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
      } catch (error) {
        status = "Unable to generate round.";
        setFeedback(
          error instanceof Error
            ? error.message
            : "Failed to generate Meaning Bridge round.",
          "error",
        );
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
      if (result) {
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
      if (result) {
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
        setFeedback("Not quite. Try another meaning card.", "error");
      }

      renderScene();
    }

    function resetRound() {
      selectedLeftId = null;
      matches = [];
      hintsUsed = 0;
      wrongAttempts = 0;
      result = null;
      roundStartedAt = Date.now();
      setFeedback("Round reset. Select a word card to begin again.", "neutral");
      renderScene();
    }

    function useHint() {
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
      setFeedback(
        puzzle.hints[selectedLeftId] || "No hint available.",
        "neutral",
      );
      renderScene();
    }

    async function submitRound() {
      const puzzle = roundData?.puzzle;

      if (!puzzle) {
        return;
      }

      if (matches.length === 0) {
        setFeedback("Match at least one pair before submitting.", "neutral");
        renderScene();
        return;
      }

      status = "Submitting round...";
      renderScene();

      try {
        const timeSeconds = Math.max(
          1,
          Math.round((Date.now() - roundStartedAt) / 1000),
        );

        result = await submitMeaningBridgeRound({
          roundId: puzzle.roundId,
          playerName: getNormalizedPlayerName(),
          matches,
          timeSeconds,
          hintsUsed,
          wrongAttempts,
        });

        status = "Round submitted.";
        setFeedback(result.message || "Round submitted.", "success");

        await loadLeaderboard();
      } catch (error) {
        setFeedback(
          error instanceof Error
            ? error.message
            : "Failed to submit Meaning Bridge round.",
          "error",
        );
        status = "Submit failed.";
      }

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
      new zim.Rectangle(W, H, "#dff6ff").addTo(stage).loc(0, 0);

      new zim.Circle(44, "#facc15").addTo(stage).loc(982, 78);
      new zim.Circle(20, "#ffffff").addTo(stage).loc(110, 72);
      new zim.Circle(28, "#ffffff").addTo(stage).loc(140, 62);
      new zim.Circle(20, "#ffffff").addTo(stage).loc(172, 72);
      new zim.Rectangle(86, 20, "#ffffff", null, 0, 14)
        .addTo(stage)
        .loc(100, 72);

      const hills = new zim.Shape().addTo(stage);
      hills
        .f("#bbf7d0")
        .mt(0, 192)
        .bt(180, 92, 330, 210, 500, 138)
        .bt(680, 62, 850, 185, W, 106)
        .lt(W, H)
        .lt(0, H)
        .cp();

      const river = new zim.Shape().addTo(stage);
      river
        .f("#7dd3fc")
        .mt(0, 300)
        .bt(220, 250, 330, 355, 540, 300)
        .bt(720, 250, 840, 360, W, 312)
        .lt(W, H)
        .lt(0, H)
        .cp();

      new zim.Rectangle(280, 92, "#65a30d", null, 0, 42)
        .addTo(stage)
        .loc(-40, 345);

      new zim.Rectangle(280, 92, "#65a30d", null, 0, 42)
        .addTo(stage)
        .loc(860, 345);
    }

    function drawBridge() {
      const progress = getCompletionPercent();

      const shadow = new zim.Shape().addTo(stage);
      shadow
        .s("rgba(120,53,15,0.18)")
        .ss(18)
        .mt(410, 358)
        .bt(492, 304, 608, 304, 690, 358);

      const arch = new zim.Shape().addTo(stage);
      arch.s("#92400e").ss(11).mt(410, 350).bt(492, 292, 608, 292, 690, 350);

      const deck = new zim.Shape().addTo(stage);
      deck.s("#b45309").ss(13).mt(398, 370).lt(702, 370);

      for (let index = 0; index < 5; index += 1) {
        const postX = 432 + index * 58;
        const postY = 328 - Math.sin((index / 4) * Math.PI) * 28;

        new zim.Rectangle(7, 44, "#78350f", null, 0, 4)
          .addTo(stage)
          .loc(postX, postY);
      }

      const progressBridge = new zim.Shape().addTo(stage);
      progressBridge
        .s("#22c55e")
        .ss(6)
        .mt(410, 350)
        .bt(
          410 + progress * 0.78,
          326 - progress * 0.22,
          470 + progress * 1.08,
          292 + progress * 0.1,
          410 + progress * 2.8,
          350,
        );
    }

    function drawHeader() {
      addButton({
        x: 28,
        y: 24,
        width: 104,
        height: 34,
        label: "Game 02",
        background: "#0f172a",
        rollBackground: "#1e293b",
        onClick: () => {},
      });

      addLabel({
        text: "Meaning Bridge",
        x: W / 2,
        y: 26,
        size: 34,
        color: "#07164f",
        bold: true,
        align: "center",
      });

      addLabel({
        text: `${getCompletionPercent()}% complete`,
        x: W / 2,
        y: 68,
        size: 18,
        color: "#047857",
        bold: true,
        align: "center",
      });

      addPanel({
        x: W - 290,
        y: 26,
        width: 250,
        height: 40,
        fill: "rgba(255,255,255,0.88)",
        stroke: "#bfdbfe",
        corner: 16,
      });

      addLabel({
        text: shortText(status, 34),
        x: W - 272,
        y: 39,
        size: 12,
        color: "#1e3a8a",
        bold: true,
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
          setFeedback(
            "Match each word card to the correct meaning card. Complete the bridge, avoid wrong attempts, and earn round points.",
            "neutral",
          );
          goToSetupMenu();
        },
      });

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
    ZIMJS menu scene
    ----------------
    Main start screen for Meaning Bridge.

    React provides the outer app shell.
    ZIMJS owns the player-facing setup:
    - player name
    - challenge mode
    - difficulty
    - pair count
    - selected setup summary
    - start button
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

      /*
    Main title area.
    Nothing else should overlap this area.
  */
      addLabel({
        text: "Meaning Bridge",
        x: W / 2,
        y: panel.y + 28,
        size: 40,
        color: "#07164f",
        bold: true,
        align: "center",
      });

      addLabel({
        text: "Build a bridge between words and meaning.",
        x: W / 2,
        y: panel.y + 82,
        size: 17,
        color: "#475569",
        bold: true,
        align: "center",
      });

      drawMenuPlayerNamePanel();

      /*
    Challenge mode section.
  */
      addLabel({
        text: "Choose Your Challenge",
        x: W / 2,
        y: MENU_LAYOUT.challengeTitle.y,
        size: 23,
        color: "#1e3a8a",
        bold: true,
        align: "center",
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
    Difficulty selector.
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
    Pair-count selector.
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

      /*
    Compact selected setup summary.
    This replaces the large top panel so the title area stays clean.
  */

      addPanel({
        x: MENU_LAYOUT.selectedSetup.x,
        y: MENU_LAYOUT.selectedSetup.y,
        width: MENU_LAYOUT.selectedSetup.width,
        height: MENU_LAYOUT.selectedSetup.height,
        fill: "#f8fafc",
        stroke: "#e2e8f0",
        corner: 15,
      });

      addLabel({
        text: `${
          MODES.find((entry) => entry.value === mode)?.label || "Mode"
        } · ${difficulty} · ${pairCount} pairs`,
        x: W / 2,
        y: MENU_LAYOUT.selectedSetup.y + 8,
        size: 12,
        color: "#07164f",
        bold: true,
        align: "center",
      });

      /*
    Main start action.
  */
      addButton({
        x: MENU_LAYOUT.startButton.x,
        y: MENU_LAYOUT.startButton.y,
        width: MENU_LAYOUT.startButton.width,
        height: MENU_LAYOUT.startButton.height,
        label: "Start Bridge",
        background: "#4f46e5",
        rollBackground: "#4338ca",
        onClick: startBridgeRound,
      });

      addLabel({
        text: "Express backend + ZIMJS canvas migration active",
        x: W / 2,
        y: 628,
        size: 12,
        color: "#64748b",
        bold: true,
        align: "center",
      });
    }

    function drawOptionControls() {
      const modeStartX = 96;
      const modeY = 112;

      MODES.forEach((entry, index) => {
        const selected = entry.value === mode;

        addButton({
          x: modeStartX + index * 178,
          y: modeY,
          width: 164,
          height: 36,
          label: shortText(entry.label, 19),
          background: selected ? "#2563eb" : "#ffffff",
          rollBackground: selected ? "#1d4ed8" : "#eff6ff",
          color: selected ? "#ffffff" : "#1e3a8a",
          borderColor: selected ? null : "#bfdbfe",
          onClick: () => {
            void loadRound({ mode: entry.value });
          },
        });
      });

      DIFFICULTIES.forEach((entry, index) => {
        const selected = entry === difficulty;

        addButton({
          x: 316 + index * 112,
          y: 158,
          width: 96,
          height: 32,
          label: entry,
          background: selected ? "#059669" : "#ffffff",
          rollBackground: selected ? "#047857" : "#ecfdf5",
          color: selected ? "#ffffff" : "#047857",
          borderColor: selected ? null : "#a7f3d0",
          onClick: () => {
            void loadRound({ difficulty: entry });
          },
        });
      });

      PAIR_COUNTS.forEach((entry, index) => {
        const selected = entry === pairCount;

        addButton({
          x: 662 + index * 92,
          y: 158,
          width: 76,
          height: 32,
          label: `${entry} pairs`,
          background: selected ? "#7c3aed" : "#ffffff",
          rollBackground: selected ? "#6d28d9" : "#f5f3ff",
          color: selected ? "#ffffff" : "#5b21b6",
          borderColor: selected ? null : "#ddd6fe",
          onClick: () => {
            void loadRound({ pairCount: entry });
          },
        });
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
        fill: "rgba(255,255,255,0.95)",
        stroke: "#bfdbfe",
        corner: 24,
      });

      if (!passage) {
        addLabel({
          text: "Loading passage...",
          x: x + 24,
          y: y + 32,
          size: 18,
          color: "#475569",
          bold: true,
        });
        return;
      }

      addLabel({
        text: `${passage.difficulty} · ${passage.theme}`,
        x: x + 24,
        y: y + 14,
        size: 12,
        color: "#047857",
        bold: true,
      });

      addLabel({
        text: passage.title,
        x: x + 24,
        y: y + 36,
        size: 22,
        color: "#07164f",
        bold: true,
      });

      addWrappedLabel({
        text: passage.text,
        x: x + 24,
        y: y + 66,
        maxCharsPerLine: 112,
        maxLines: 2,
        size: 12,
        lineHeight: 14,
        color: "#475569",
      });
    }

    function drawCard({ item, side, x, y }) {
      const matched =
        side === "left" ? isLeftMatched(item.id) : isRightMatched(item.id);

      const selected = side === "left" && selectedLeftId === item.id;

      const fill = matched ? "#dcfce7" : selected ? "#dbeafe" : "#ffffff";
      const stroke = matched ? "#16a34a" : selected ? "#2563eb" : "#d1d5db";
      const textColor = matched ? "#064e3b" : selected ? "#1e3a8a" : "#111827";
      const subTextColor = matched
        ? "#15803d"
        : selected
          ? "#2563eb"
          : "#64748b";

      const card = new zim.Rectangle(
        GAMEPLAY_LAYOUT.card.width,
        GAMEPLAY_LAYOUT.card.height,
        fill,
        stroke,
        selected ? 4 : matched ? 3 : 2,
        12,
      )
        .addTo(stage)
        .loc(x, y);

      card.cursor = "pointer";
      card.on("click", () => {
        if (side === "left") {
          handleLeftCard(item);
        } else {
          handleRightCard(item);
        }
      });

      addLabel({
        text: shortText(item.label, 26),
        x: x + 14,
        y: y + 5,
        size: 14,
        color: textColor,
        bold: true,
      });

      addLabel({
        text: shortText(item.sublabel, 30),
        x: x + 14,
        y: y + 21,
        size: 9,
        color: subTextColor,
        bold: true,
      });

      if (matched) {
        new zim.Circle(10, "#16a34a").addTo(stage).loc(x + 226, y + 17);

        addLabel({
          text: "✓",
          x: x + 226,
          y: y + 8,
          size: 13,
          color: "#ffffff",
          bold: true,
          align: "center",
        });
      }

      if (selected && !matched) {
        new zim.Circle(10, "#2563eb").addTo(stage).loc(x + 226, y + 17);

        addLabel({
          text: "●",
          x: x + 226,
          y: y + 8,
          size: 12,
          color: "#ffffff",
          bold: true,
          align: "center",
        });
      }
    }

    function drawCards() {
      const puzzle = roundData?.puzzle;
      const left = GAMEPLAY_LAYOUT.leftPanel;
      const right = GAMEPLAY_LAYOUT.rightPanel;
      const card = GAMEPLAY_LAYOUT.card;

      addPanel({
        x: left.x,
        y: left.y,
        width: left.width,
        height: left.height,
        fill: "#ecfdf5",
        stroke: "#86efac",
        corner: 24,
      });

      addPanel({
        x: right.x,
        y: right.y,
        width: right.width,
        height: right.height,
        fill: "#f5f3ff",
        stroke: "#c4b5fd",
        corner: 24,
      });

      addLabel({
        text: "Word Cards",
        x: left.x + 24,
        y: left.y + 18,
        size: 20,
        color: "#065f46",
        bold: true,
      });

      addLabel({
        text: "Meaning Cards",
        x: right.x + 24,
        y: right.y + 18,
        size: 20,
        color: "#5b21b6",
        bold: true,
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
        connector
          .s("#22c55e")
          .ss(4)
          .mt(leftX, y1)
          .bt(460, y1, 640, y2, rightX, y2);

        new zim.Circle(5, "#22c55e").addTo(stage).loc(leftX, y1);
        new zim.Circle(5, "#22c55e").addTo(stage).loc(rightX, y2);
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
        corner: 20,
      });

      addLabel({
        text: "Bridge Feedback",
        x: x + 20,
        y: y + 14,
        size: 13,
        color: "#64748b",
        bold: true,
      });

      addWrappedLabel({
        text: feedback,
        x: x + 20,
        y: y + 40,
        maxCharsPerLine: 35,
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

      addButton({
        x,
        y,
        width: 86,
        height: 36,
        label: "Hint",
        background: "#d97706",
        rollBackground: "#b45309",
        onClick: useHint,
      });

      addButton({
        x: x + 100,
        y,
        width: 86,
        height: 36,
        label: "Reset",
        background: "#475569",
        rollBackground: "#334155",
        onClick: resetRound,
      });

      addButton({
        x: x + 200,
        y,
        width: 100,
        height: 36,
        label: "Submit",
        background:
          matches.length === roundData?.puzzle?.leftItems?.length
            ? "#059669"
            : "#64748b",
        rollBackground: "#047857",
        onClick: () => {
          void submitRound();
        },
      });

      addButton({
        x: x + 30,
        y: GAMEPLAY_LAYOUT.controls.secondaryY,
        width: 104,
        height: 36,
        label: "Menu",
        background: "#0f172a",
        rollBackground: "#1e293b",
        onClick: backToMenu,
      });

      addButton({
        x: x + 154,
        y: GAMEPLAY_LAYOUT.controls.secondaryY,
        width: 122,
        height: 36,
        label: "New Round",
        background: "#4f46e5",
        rollBackground: "#4338ca",
        onClick: () => {
          void loadRound();
        },
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
        height: 84,
        fill: "rgba(255,255,255,0.94)",
        stroke: "#dbeafe",
        corner: 20,
      });

      addLabel({
        text: "Round Summary",
        x: x + 20,
        y: y + 14,
        size: 13,
        color: "#64748b",
        bold: true,
      });

      addLabel({
        text: shortText(getNormalizedPlayerName(), 22),
        x: x + 20,
        y: y + 34,
        size: 13,
        color: "#07164f",
        bold: true,
      });

      addLabel({
        text: `${matches.length}/${roundData?.puzzle?.leftItems?.length || pairCount} pairs · ${getCompletionPercent()}%`,
        x: x + 20,
        y: y + 56,
        size: 16,
        color: "#047857",
        bold: true,
      });
    }

    function drawResultPanel() {
      if (!result) {
        return;
      }

      /*
    Result overlay
    --------------
    This overlay appears after submitting a round.

    It intentionally sits on top of the gameplay screen instead of replacing it.
    This keeps the player connected to the round they just completed while still
    making the score, round point, and leaderboard clear.
  */

      const perfectScore = result.perfectRound && result.roundPoints > 0;
      const title = getResultTitle();
      const badgeIcon = getResultBadge();

      // Soft dim layer over the gameplay screen.
      new zim.Rectangle(W, H, "rgba(15,23,42,0.28)").addTo(stage).loc(0, 0);

      const panelX = 210;
      const panelY = 112;
      const panelWidth = 680;
      const panelHeight = 500;

      addPanel({
        x: panelX,
        y: panelY,
        width: panelWidth,
        height: panelHeight,
        fill: "rgba(255,255,255,0.98)",
        stroke: perfectScore ? "#22c55e" : "#6366f1",
        corner: 32,
      });

      // Left badge circle.
      new zim.Circle(46, perfectScore ? "#22c55e" : "#6366f1")
        .addTo(stage)
        .loc(panelX + 72, panelY + 78);

      addLabel({
        text: badgeIcon,
        x: panelX + 72,
        y: panelY + 53,
        size: 38,
        color: "#ffffff",
        bold: true,
        align: "center",
      });

      addLabel({
        text: "Round Complete",
        x: panelX + 142,
        y: panelY + 38,
        size: 15,
        color: perfectScore ? "#047857" : "#4f46e5",
        bold: true,
      });

      addLabel({
        text: title,
        x: panelX + 142,
        y: panelY + 64,
        size: 32,
        color: "#07164f",
        bold: true,
      });

      addWrappedLabel({
        text: result.message || "Your bridge round has been submitted.",
        x: panelX + 142,
        y: panelY + 108,
        maxCharsPerLine: 54,
        maxLines: 2,
        size: 13,
        lineHeight: 17,
        color: "#475569",
        bold: true,
      });

      /*
    Score card
    ----------
    Shows the main score in a large visual treatment so the end state feels
    rewarding and easy to read during a demo.
  */
      addPanel({
        x: panelX + 34,
        y: panelY + 164,
        width: 190,
        height: 130,
        fill: "#f8fafc",
        stroke: "#e2e8f0",
        corner: 22,
      });

      addLabel({
        text: `${result.score}`,
        x: panelX + 70,
        y: panelY + 186,
        size: 54,
        color: "#111827",
        bold: true,
      });

      addLabel({
        text: "points",
        x: panelX + 80,
        y: panelY + 252,
        size: 16,
        color: "#64748b",
        bold: true,
      });

      /*
    Round point badge
    -----------------
    This is important to the Meaning Bridge scoring design:
    a round point is earned only for a clean perfect round.
  */
      addPanel({
        x: panelX + 34,
        y: panelY + 312,
        width: 190,
        height: 76,
        fill: perfectScore ? "#ecfdf5" : "#f8fafc",
        stroke: perfectScore ? "#86efac" : "#e2e8f0",
        corner: 20,
      });

      addLabel({
        text: "Round Point",
        x: panelX + 54,
        y: panelY + 328,
        size: 12,
        color: "#64748b",
        bold: true,
      });

      addLabel({
        text: result.roundPoints > 0 ? "+1 earned" : "Not earned",
        x: panelX + 54,
        y: panelY + 352,
        size: 20,
        color: result.roundPoints > 0 ? "#047857" : "#475569",
        bold: true,
      });

      /*
    Stat grid
    ---------
    Compact stats from the submitted round.
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
        const col = index % 2;
        const row = Math.floor(index / 2);

        const statX = panelX + 254 + col * 142;
        const statY = panelY + 164 + row * 70;

        addPanel({
          x: statX,
          y: statY,
          width: 124,
          height: 54,
          fill: "#f8fafc",
          stroke: "#e2e8f0",
          corner: 16,
        });

        addLabel({
          text: label,
          x: statX + 14,
          y: statY + 10,
          size: 11,
          color: "#64748b",
          bold: true,
        });

        addLabel({
          text: value,
          x: statX + 14,
          y: statY + 30,
          size: 17,
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
    Mini leaderboard
    ----------------
    Shows top scores inside the result overlay. The normal bottom leaderboard
    still exists during gameplay, but this version makes the final result screen
    feel complete.
  */
      addPanel({
        x: panelX + 540,
        y: panelY + 164,
        width: 112,
        height: 224,
        fill: "#f0fdf4",
        stroke: "#a7f3d0",
        corner: 18,
      });

      addLabel({
        text: "Top",
        x: panelX + 562,
        y: panelY + 182,
        size: 15,
        color: "#065f46",
        bold: true,
      });

      const topEntries = leaderboard.slice(0, 4);

      if (topEntries.length === 0) {
        addWrappedLabel({
          text: "No scores yet.",
          x: panelX + 558,
          y: panelY + 222,
          maxCharsPerLine: 13,
          maxLines: 2,
          size: 12,
          lineHeight: 16,
          color: "#64748b",
          bold: true,
        });
      } else {
        topEntries.forEach((entry, index) => {
          const rowY = panelY + 216 + index * 38;

          addLabel({
            text: `#${index + 1}`,
            x: panelX + 558,
            y: rowY,
            size: 11,
            color: "#047857",
            bold: true,
          });

          addLabel({
            text: shortText(entry.playerName, 9),
            x: panelX + 584,
            y: rowY,
            size: 10,
            color: "#111827",
            bold: true,
          });

          addLabel({
            text: `${entry.totalScore}`,
            x: panelX + 584,
            y: rowY + 16,
            size: 10,
            color: "#64748b",
            bold: true,
          });
        });
      }

      /*
    Result actions
    --------------
    Menu returns to the ZIMJS menu screen.
    Next Round keeps the same selected options and generates another round.
  */
      addButton({
        x: panelX + 240,
        y: panelY + 428,
        width: 118,
        height: 40,
        label: "Menu",
        background: "#0f172a",
        rollBackground: "#1e293b",
        onClick: backToMenu,
      });

      addButton({
        x: panelX + 376,
        y: panelY + 428,
        width: 150,
        height: 40,
        label: "Next Round",
        background: "#4f46e5",
        rollBackground: "#4338ca",
        onClick: () => {
          void loadRound();
        },
      });
    }

    function drawLeaderboard() {
      const { x, y, width, height } = GAMEPLAY_LAYOUT.leaderboard;

      addPanel({
        x,
        y,
        width,
        height,
        fill: "rgba(255,255,255,0.92)",
        stroke: "#a7f3d0",
        corner: 18,
      });

      addLabel({
        text: "Leaderboard",
        x: x + 24,
        y: y + 16,
        size: 15,
        color: "#065f46",
        bold: true,
      });

      if (leaderboard.length === 0) {
        addLabel({
          text: "No scores yet.",
          x: x + 150,
          y: y + 17,
          size: 14,
          color: "#64748b",
          bold: true,
        });
        return;
      }

      leaderboard.slice(0, 4).forEach((entry, index) => {
        addLabel({
          text: `#${index + 1} ${shortText(entry.playerName, 12)} · ${entry.totalScore} pts`,
          x: x + 160 + index * 190,
          y: y + 17,
          size: 13,
          color: "#111827",
          bold: true,
        });
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

      if (screen === "menu") {
        drawMenuScene();
        publishDebugState();
        stage.update();
        return;
      }

      drawBridge();
      drawHeader();
      drawPassagePanel();
      drawCards();
      drawConnections();
      drawRoundSummary();
      drawFeedbackPanel();
      drawControls();

      if (!result) {
        drawLeaderboard();
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

      window.addEventListener("keydown", handlePlayerNameKeyDown);

      window.__meaningBridgePlayerNameKeyCleanup = () => {
        window.removeEventListener("keydown", handlePlayerNameKeyDown);
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
