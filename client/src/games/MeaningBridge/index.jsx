import { createZimGame } from "../createZimGame";
import { fetchMeaningBridgeRound } from "../../services/meaningBridgeApi";

const PAIR_COUNTS = [4, 5, 6];

export const meta = {
  id:          "meaning-bridge",
  cardNumber:  "02",
  cardArt:     "art-sea",
  title:       "Meaning Bridge",
  description: "Connect words to their synonyms, antonyms, and definitions.",
};

export default createZimGame({
  id:         "zim-meaning-bridge",
  width:      1100,
  height:     720,
  color:      "#fde8f2",
  outerColor: "#1d2b66",

  setup({ stage, W, H, zim }) {
    const FONT = "Fredoka";

    // ── Palette ──────────────────────────────────────────────────────
    const C = {
      ink:       "#1d2b66",
      bg:        "#fef5e4",   // warm ivory — light and clean
      sunshine:  "#ffd84d",
      tangerine: "#ff9a3c",
      bubblegum: "#ff6fb5",
      grape:     "#9b6bff",
      leaf:      "#46c97a",
      ocean:     "#2fb6d6",
      white:     "#ffffff",
      sub:       "#8892b0",
    };

    // 6 pair colors — each pair gets its own identity
    const PC = ["#ff6fb5", "#2fb6d6", "#9b6bff", "#ff9a3c", "#46c97a", "#ffc42e"];
    const PD = ["#c94f8a", "#1f8fb5", "#6b48cc", "#c97428", "#2ea85e", "#c9a010"];

    function rgba(hex, a) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${a})`;
    }

    // ── Session state ────────────────────────────────────────────────
    let roundIndex   = 0;
    let totalScore   = 0;
    let sessionBest  = 0;   // tracks best score across plays in this session
    let currentMode  = "word-to-synonym";
    let puzzle       = null;

    // Per-round state
    let selectedLeft  = null;
    let selectedRight = null;
    let matches       = {};
    let flashWrong    = null;
    let lastMatchLeft = null;
    let freshRound    = true;   // true only on first render after loading; suppresses re-entrance animation on clicks

    // ── Layout ───────────────────────────────────────────────────────
    // Header bar (dark navy) contains title + mode tabs + score
    const HEADER_H = 82;   // height including 4px accent strip at bottom
    const CARD_W   = 308;
    const LEFT_X   = 55;
    const RIGHT_X  = W - 55 - CARD_W;   // 675, bridge zone = 250px

    let CARD_H        = 80;
    let RIGHT_CARD_H  = 100;
    let START_Y       = 148;
    let GAP           = 140;
    let BOTTOM_BAR_H  = 62;   // taller for 4-pair round only

    function calcLayout() {
      const n     = puzzle.leftItems.length;
      const isDef = currentMode === "word-to-definition";
      // Left and right cards are the same height; definitions mode gets extra height on right only
      if      (n >= 6) { CARD_H = 54; RIGHT_CARD_H = isDef ? 72  : 54; }
      else if (n >= 5) { CARD_H = 60; RIGHT_CARD_H = isDef ? 82  : 60; }
      else             { CARD_H = 68; RIGHT_CARD_H = isDef ? 93  : 68; }
      // instruction(12+18) + col-header(+28) + gap(+16) = 74
      const baseStartY = HEADER_H + 74;
      // 4-pair round gets a taller bottom bar and slightly more breathing room
      BOTTOM_BAR_H = (n === 4) ? 78 : 62;
      const avail = H - baseStartY - RIGHT_CARD_H - BOTTOM_BAR_H;
      if (n <= 1) {
        GAP     = 0;
        START_Y = baseStartY;
      } else {
        // For 4 pairs: slightly wider gap + push cards down to split dead space top/bottom
        const MAX_GAP = (n === 4) ? 105 : 95;
        GAP     = Math.min(Math.floor(avail / (n - 1)), MAX_GAP);
        START_Y = (n === 4) ? baseStartY + 40 : baseStartY;
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
        const eb = new zim.Container().addTo(stage).loc(18, (HEADER_H - 36) / 2);
        eb.mouseChildren = false;
        new zim.Rectangle({
          width: 90, height: 36,
          color: C.white, borderColor: "transparent",
          borderWidth: 0, corner: 18,
        }).addTo(eb);
        new zim.Label({
          text: "← Exit", size: 15, font: FONT,
          color: "#2e6b2e", align: "center", valign: "center", bold: true,
        }).addTo(eb).loc(45, 18);
        eb.cursor = "pointer";
        eb.on("click", () => { roundIndex = 0; totalScore = 0; loadRound(); });
      }

      // ── Mode tabs (centered in header) ──────────────────────────
      const TABS = [
        { mode: "word-to-synonym",    label: "Synonyms",    accent: "#3a8a3a" },
        { mode: "word-to-antonym",    label: "Antonyms",    accent: "#1a7a99" },
        { mode: "word-to-definition", label: "Definitions", accent: "#6b48cc" },
      ];
      const TW = 186, TH = 44, TGAP = 10;
      const totalTW = TABS.length * TW + (TABS.length - 1) * TGAP;
      const TX = (W - totalTW) / 2;
      const TY = (HEADER_H - 4 - TH) / 2;

      TABS.forEach(({ mode, label, accent }, i) => {
        const active = mode === currentMode;
        const x = TX + i * (TW + TGAP);
        const t = new zim.Container().addTo(stage).loc(x, TY);
        t.mouseChildren = false;

        new zim.Rectangle({
          width: TW, height: TH,
          color:       active ? accent : C.white,
          borderColor: "transparent",
          borderWidth: 0,
          corner: TH / 2,
        }).addTo(t);

        new zim.Label({
          text: label, size: 20, font: FONT,
          color: active ? C.white : "#2e6b2e",
          align: "center", valign: "center",
          bold: true,
        }).addTo(t).loc(TW / 2, TH / 2);

        if (!active) {
          t.cursor = "pointer";
          t.on("click", () => { currentMode = mode; roundIndex = 0; totalScore = 0; loadRound(); });
        }
      });

      // ── Score badge right ────────────────────────────────────────
      const sb = new zim.Container().addTo(stage).loc(W - 180, (HEADER_H - 4 - 36) / 2);
      sb.mouseChildren = false;
      new zim.Rectangle({ width: 162, height: 36, color: C.white, borderColor: "#c9a010", borderWidth: 1.5, corner: 18 }).addTo(sb);
      new zim.Label({ text: `Round ${roundIndex + 1}/3`, size: 13, font: FONT, color: "#3a7a3a", align: "center", valign: "center", bold: true }).addTo(sb).loc(81, 11);
      new zim.Label({ text: `⭐ ${totalScore} pts`, size: 15, font: FONT, color: "#7a5800", align: "center", valign: "center", bold: true }).addTo(sb).loc(81, 26);
    }

    // ── BRIDGES (bezier arcs with glow) ──────────────────────────────
    function drawBridgeLine(li, ri, color, lw, dashed) {
      const offsetY = (RIGHT_CARD_H - CARD_H) / 2;
      const x1 = LEFT_X + CARD_W + 6;
      const x2 = RIGHT_X - 6;
      const y1 = START_Y + li * GAP + offsetY + CARD_H / 2;
      const y2 = START_Y + ri * GAP + RIGHT_CARD_H / 2;

      // bezier control point — arc bows upward by 25% of vertical distance
      const cx  = (x1 + x2) / 2;
      const bow = Math.abs(y2 - y1) * 0.28 + 16;
      const cy  = Math.min(y1, y2) - bow;

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
      else        ln.s(color).ss(lw, "round", "round");
      ln.mt(x1, y1).bt(cx, cy, cx, cy, x2, y2);

      // endpoint dots
      const d = new zim.Shape().addTo(stage);
      d.f(color).dc(x1, y1, 5.5).dc(x2, y2, 5.5);
    }

    function drawBridges() {
      Object.entries(matches).forEach(([leftId, rightId]) => {
        const li = puzzle.leftItems.findIndex(l => l.id === leftId);
        const ri = puzzle.rightItems.findIndex(r => r.id === rightId);
        drawBridgeLine(li, ri, PC[li % PC.length], 3, false);
      });
      if (flashWrong) {
        const li = puzzle.leftItems.findIndex(l => l.id === flashWrong.leftId);
        const ri = puzzle.rightItems.findIndex(r => r.id === flashWrong.rightId);
        drawBridgeLine(li, ri, "#ff3333", 3, false);
      }
      if (selectedLeft && selectedRight) {
        const li = puzzle.leftItems.findIndex(l => l.id === selectedLeft.id);
        const ri = puzzle.rightItems.findIndex(r => r.id === selectedRight.id);
        drawBridgeLine(li, ri, "#aaaacc", 2, true);
      }
    }

    // ── CARDS ─────────────────────────────────────────────────────────
    function drawCards() {
      puzzle.leftItems.forEach((item, i) => {
        const offsetY = (RIGHT_CARD_H - CARD_H) / 2;
        drawCard({
          item, x: LEFT_X, y: START_Y + i * GAP + offsetY,
          cardH: CARD_H, side: "left", pairIdx: i, matchPairIdx: i,
          isMatched:     !!matches[item.id],
          isSelected:    selectedLeft?.id === item.id,
          isWrong:       flashWrong?.leftId === item.id,
          isJustMatched: lastMatchLeft === item.id,
        });
      });

      puzzle.rightItems.forEach((item, i) => {
        const isMatched     = Object.values(matches).includes(item.id);
        const matchedLeftId = isMatched ? Object.keys(matches).find(k => matches[k] === item.id) : null;
        const matchPairIdx  = matchedLeftId ? puzzle.leftItems.findIndex(l => l.id === matchedLeftId) : 0;
        drawCard({
          item, x: RIGHT_X, y: START_Y + i * GAP,
          cardH: RIGHT_CARD_H, side: "right", pairIdx: i, matchPairIdx,
          isMatched,
          isSelected:    selectedRight?.id === item.id,
          isWrong:       flashWrong?.rightId === item.id,
          isJustMatched: matchedLeftId === lastMatchLeft,
        });
      });
    }

    const G = { base: "#5aaa5a", dark: "#3a7a3a" };

    function drawBackground() {
      // Milky pink → milky green gradient top-to-bottom
      const grad = new zim.GradientColor(["#fde8f2", "#e8f5ee"], [0, 1], 0, 0, 0, H);
      new zim.Rectangle(W, H, grad).addTo(stage);
    }

    function drawCard({ item, x, y, cardH, side, pairIdx, matchPairIdx,
                        isMatched, isSelected, isWrong, isJustMatched }) {
      const mColor = PC[matchPairIdx % PC.length];
      const mDark  = PD[matchPairIdx % PD.length];

      let accent, border, textCol, subCol;

      const modeAccent = currentMode === "word-to-synonym" ? "#3a8a3a"
                       : currentMode === "word-to-antonym" ? "#1a7a99"
                       : "#6b48cc";

      if (isWrong) {
        accent = "#ff3333";
        border = rgba("#ff3333", 0.6); textCol = "#c00000"; subCol = "#ff6666";
      } else if (isMatched) {
        accent = mColor;
        border = rgba(mColor, 0.55); textCol = mDark; subCol = mDark;
      } else if (isSelected) {
        accent = modeAccent;
        border = modeAccent; textCol = G.dark; subCol = G.dark;
      } else {
        accent = modeAccent;
        border = rgba(modeAccent, 0.35); textCol = G.dark; subCol = G.base;
      }

      const cardBg = isWrong || isMatched || isSelected ? C.white : rgba(modeAccent, 0.07);

      const card = new zim.Container().addTo(stage).loc(x, isSelected ? y - 3 : y);
      card.mouseChildren = false;

      // Shadow
      new zim.Rectangle({
        width: CARD_W, height: cardH,
        color: rgba(C.ink, 0.07), corner: 15,
      }).addTo(card).loc(1, 4);

      // Card body
      new zim.Rectangle({
        width: CARD_W, height: cardH,
        color: cardBg, borderColor: border,
        borderWidth: isSelected ? 2.5 : 1.8,
        corner: 15,
      }).addTo(card);

      // Left accent bar
      new zim.Rectangle({
        width: 7, height: cardH - 10, color: accent,
        corner: [4, 0, 0, 4],
      }).addTo(card).loc(2, 5);

      const n  = puzzle.leftItems.length;
      const fs = n >= 6 ? 18 : n >= 5 ? 20 : 22;

      if (side === "left") {
        new zim.Label({
          text: item.label, size: fs, font: FONT,
          color: textCol, align: "center", valign: "center", bold: true,
        }).addTo(card).loc(CARD_W / 2 + 4, cardH / 2 - 6);

        // POS badge — pill in top-right corner
        const badgeW = Math.max(item.sublabel.length * 9 + 14, 46);
        new zim.Rectangle({
          width: badgeW, height: 20,
          color: rgba(accent, 0.14), corner: 10,
        }).addTo(card).loc(CARD_W - badgeW - 6, 6);
        new zim.Label({
          text: item.sublabel, size: 11, font: FONT,
          color: isWrong ? "#c00000" : accent,
          align: "center", valign: "center", bold: true,
        }).addTo(card).loc(CARD_W - badgeW / 2 - 6, 16);

      } else {
        new zim.Label({
          text: item.label, size: fs, font: FONT,
          color: textCol, align: "center", valign: "center",
          bold: true, lineWidth: CARD_W - 26,
        }).addTo(card).loc(CARD_W / 2 + 4, cardH / 2 - 8);

        new zim.Label({
          text: item.sublabel, size: 11, font: FONT,
          color: subCol, align: "center", valign: "center",
        }).addTo(card).loc(CARD_W / 2 + 4, cardH - 13);
      }

      if (isJustMatched) {
        card.animate({ props: { scaleX: 1.08, scaleY: 1.08 }, time: 0.13, rewind: true });
      }

      // Entrance animation — stagger by card index
      if (freshRound && !isMatched && !isSelected && !isWrong) {
        card.alpha = 0;
        const delay = (side === "left" ? pairIdx : puzzle.rightItems.findIndex(r => r.id === item.id)) * 0.07;
        card.animate({ props: { alpha: 1 }, time: 0.22, wait: delay, ease: "backOut" });
      }

      if (!isMatched && !isWrong) {
        card.cursor = "pointer";
        card.on("click", () => onCardClick(item, side, y, cardH));
      }
    }

    // ── COLUMN PILL BADGE ────────────────────────────────────────────
    function drawColumnPill(text, cx, cy, color) {
      const pw = text.length * 13 + 28, ph = 30;
      const pill = new zim.Container().addTo(stage).loc(cx - pw / 2, cy - ph / 2);
      pill.mouseChildren = false;
      new zim.Rectangle({ width: pw, height: ph, color: rgba(color, 0.12), borderColor: color, borderWidth: 1.5, corner: ph / 2 }).addTo(pill);
      new zim.Label({ text, size: 16, font: FONT, color, align: "center", valign: "center", bold: true }).addTo(pill).loc(pw / 2, ph / 2);
    }

    // ── PANEL CONTAINER (wraps all cards on one side) ─────────────────
    function drawPanelContainer(x, y, w, h) {
      const PAD = 10;
      // Shadow
      new zim.Rectangle({
        width: w + PAD * 2, height: h + PAD * 2,
        color: rgba(C.ink, 0.06), corner: 20,
      }).addTo(stage).loc(x - PAD + 2, y - PAD + 4);
      // Panel body
      new zim.Rectangle({
        width: w + PAD * 2, height: h + PAD * 2,
        color: "rgba(254,248,240,0.9)",
        borderColor: rgba("#5aaa5a", 0.22),
        borderWidth: 1.5, corner: 20,
      }).addTo(stage).loc(x - PAD, y - PAD);
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
      new zim.Rectangle(bw, H - HEADER_H, rgba("#7ec87e", 0.05)).addTo(stage).loc(bx, HEADER_H);

      // Thin vertical dashed dividers at each edge of the bridge zone
      [bx, bx + bw].forEach(dx => {
        const dv = new zim.Shape().addTo(stage);
        dv.s(rgba("#5aaa5a", 0.18)).ss(1.5, "round", "round").sd([6, 7]);
        dv.mt(dx, HEADER_H + 12).lt(dx, H - 12);
      });

      // Instruction text
      const instrColor = currentMode === "word-to-synonym" ? "#3a8a3a"
                       : currentMode === "word-to-antonym" ? "#1a7a99"
                       : "#6b48cc";
      const instr = new zim.Label({
        text: puzzle.instruction,
        size: 21, font: FONT, color: instrColor, align: "center", valign: "center", bold: true,
      }).addTo(stage).center(stage);
      instr.y = HEADER_H + 18;
      instr.alpha = 0;
      instr.animate({ props: { y: HEADER_H + 32, alpha: 1 }, time: 0.4, ease: "backOut" });

      // Column header pills — sit clearly above the first card row
      const rightLabel = currentMode === "word-to-synonym"
        ? "Synonym" : currentMode === "word-to-antonym"
        ? "Antonym" : "Definition";
      const CHY = HEADER_H + 36;
      drawColumnPill("Word",       LEFT_X  + CARD_W / 2, CHY, instrColor);
      drawColumnPill(rightLabel,   RIGHT_X + CARD_W / 2, CHY, instrColor);

      // Single container wrapping both panels + bridge zone
      const n        = puzzle.leftItems.length;
      const offsetY  = (RIGHT_CARD_H - CARD_H) / 2;
      // For 4 pairs: extend panel above first card and below last card symmetrically
      const TOP_PAD  = (n === 4) ? 28 : 0;
      const panelTop = START_Y + offsetY - TOP_PAD;
      const panelH   = (n === 4)
        ? (H - BOTTOM_BAR_H - 8 - panelTop)
        : (n - 1) * GAP + RIGHT_CARD_H;
      drawPanelContainer(LEFT_X, panelTop, RIGHT_X + CARD_W - LEFT_X, panelH);

      // Bridges first (behind cards)
      drawBridges();
      drawCards();
      drawBottomBar();
      stage.update();
      freshRound = false;   // entrance animation only plays on first render per round
    }

    function drawBottomBar() {
      const barH  = BOTTOM_BAR_H;
      const barY  = H - barH;

      // Bottom bar background
      new zim.Rectangle(W, barH, rgba("#5aaa5a", 0.08)).addTo(stage).loc(0, barY);
      new zim.Rectangle(W, 2, "#5aaa5a").addTo(stage).loc(0, barY);   // solid top border

      const matched = Object.keys(matches).length;
      const total   = puzzle.leftItems.length;

      // Progress bar (centered, wider, more prominent)
      const progW = 320, progH = 10, progX = W / 2 - progW / 2, progY = barY + 26;
      new zim.Rectangle({ width: progW, height: progH, color: rgba("#5aaa5a", 0.18), corner: progH / 2 }).addTo(stage).loc(progX, progY);
      if (matched > 0) {
        const fillW = Math.round(progW * matched / total);
        new zim.Rectangle({ width: fillW, height: progH, color: "#5aaa5a", corner: progH / 2 }).addTo(stage).loc(progX, progY);
      }
      // Progress label — above the bar
      new zim.Label({
        text: `${matched} of ${total} matched`,
        size: 14, font: FONT, color: "#3a7a3a",
        align: "center", valign: "center", bold: true,
      }).addTo(stage).loc(W / 2, barY + 14);

      // Hint button (right side)
      const hintBtn = new zim.Container().addTo(stage).loc(W - 140, barY + 11);
      hintBtn.mouseChildren = false;
      new zim.Rectangle({ width: 110, height: 38, color: "#e8eaf6", borderColor: "#7986cb", borderWidth: 2, corner: 19 }).addTo(hintBtn);
      new zim.Label({ text: "💡 Hint", size: 16, font: FONT, color: "#3949ab", align: "center", valign: "center", bold: true }).addTo(hintBtn).loc(55, 19);
      hintBtn.cursor = "pointer";
      hintBtn.on("click", () => {
        if (!selectedLeft) {
          showPrompt("👈 Pick a word from the left panel first!", H - 90, 38);
          return;
        }
        const hint = puzzle.hints?.[selectedLeft.id];
        if (hint) showHint(hint);
      });

      // Skip button (left side)
      const skipBtn = new zim.Container().addTo(stage).loc(30, barY + 11);
      skipBtn.mouseChildren = false;
      new zim.Rectangle({ width: 110, height: 38, color: "#e8eaf6", borderColor: "#7986cb", borderWidth: 2, corner: 19 }).addTo(skipBtn);
      new zim.Label({ text: "⏭ Skip", size: 16, font: FONT, color: "#3949ab", align: "center", valign: "center", bold: true }).addTo(skipBtn).loc(55, 19);
      skipBtn.cursor = "pointer";
      skipBtn.on("click", () => { roundIndex = Math.min(roundIndex + 1, PAIR_COUNTS.length - 1); loadRound(); });
    }

    function showHint(text) {
      const old = stage.getChildByName("hint_bubble");
      if (old) stage.removeChild(old);

      const bW = 420, bH = 52;
      const bx  = (W - bW) / 2;
      const by  = H - 62 - bH - 10;

      const bubble = new zim.Container().addTo(stage);
      bubble.name = "hint_bubble";
      bubble.mouseChildren = false;

      new zim.Rectangle({ width: bW, height: bH, color: "#fffbe6", borderColor: "#c9a830", borderWidth: 1.5, corner: 14 }).addTo(bubble);
      new zim.Label({ text: text, size: 15, font: FONT, color: "#7a5800", align: "center", valign: "center", lineWidth: bW - 24 }).addTo(bubble).loc(bW / 2, bH / 2);
      bubble.loc(bx, by);
      stage.update();

      setTimeout(() => { if (stage.contains(bubble)) { stage.removeChild(bubble); stage.update(); } }, 3000);
    }

    // ── LOADING / ERROR ───────────────────────────────────────────────
    function showLoading() {
      stage.removeAllChildren();
      drawBackground();
      drawHeader({ showExit: false });

      // Pulsing dots
      const dots = new zim.Container().addTo(stage).center(stage);
      [0, 1, 2].forEach(i => {
        const dot = new zim.Circle(9, PC[i]).addTo(dots).loc(i * 34 - 34, 0);
        dot.animate({
          props: { y: -14 }, time: 0.45, ease: "backOut",
          loop: true, rewind: true, wait: i * 0.15,
        });
      });
      new zim.Label({
        text: "Loading…", size: 22, font: FONT, color: C.sub,
        align: "center", valign: "center",
      }).addTo(stage).loc(W / 2, H / 2 + 36);

      stage.update();
    }

    function showError(msg) {
      stage.removeAllChildren();
      drawBackground();
      drawHeader({ showExit: true });
      new zim.Label({ text: msg, size: 20, font: FONT, color: "#cc0000", lineWidth: 700, align: "center", valign: "center" }).addTo(stage).center(stage);
      stage.update();
    }

    async function loadRound() {
      showLoading();
      try {
        const data = await fetchMeaningBridgeRound(currentMode, PAIR_COUNTS[roundIndex]);
        puzzle       = data.puzzle;
        matches      = {};
        selectedLeft = selectedRight = flashWrong = lastMatchLeft = null;
        freshRound   = true;
        renderGame();
      } catch {
        showError("Could not load puzzle — make sure the server is running.");
      }
    }

    // ── CLICK LOGIC ────────────────────────────────────────────────────
    let promptTimeout = null;

    function showPrompt(msg, cardY, cardH) {
      const old = stage.getChildByName("prompt_toast");
      if (old) stage.removeChild(old);
      if (promptTimeout) clearTimeout(promptTimeout);

      const toastW = 220, toastH = 40;
      // Position to the LEFT of the right panel, vertically centered on the clicked card
      const tx = RIGHT_X - toastW - 16;
      const ty = cardY + cardH / 2 - toastH / 2;

      const toast = new zim.Container().addTo(stage);
      toast.name = "prompt_toast";
      toast.mouseChildren = false;

      // Shadow
      new zim.Rectangle({ width: toastW, height: toastH, color: rgba("#1d2b66", 0.15), corner: 20 }).addTo(toast).loc(1, 3);
      // Body
      new zim.Rectangle({ width: toastW, height: toastH, color: "#1d2b66", corner: 20 }).addTo(toast);
      // Small right-pointing arrow tip
      const tip = new zim.Shape().addTo(toast);
      tip.f("#1d2b66").mt(toastW, toastH / 2 - 7).lt(toastW + 10, toastH / 2).lt(toastW, toastH / 2 + 7).cp();

      new zim.Label({ text: msg, size: 13, font: FONT, color: "#ffffff", align: "center", valign: "center", lineWidth: toastW - 16 }).addTo(toast).loc(toastW / 2, toastH / 2);
      toast.loc(tx, ty);
      stage.update();

      promptTimeout = setTimeout(() => {
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

      flashWrong = null; lastMatchLeft = null;
      if (side === "left") {
        if (selectedLeft?.id === item.id) {
          selectedLeft  = null;   // tap same word → deselect
        } else {
          selectedLeft  = item;   // switch to new word
          selectedRight = null;   // reset right whenever left changes
        }
      } else {
        selectedRight = selectedRight?.id === item.id ? null : item;
      }

      if (selectedLeft && selectedRight) {
        renderGame();
        setTimeout(checkPair, 300);
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
        totalScore   += puzzle.scoreRules.correct;
        selectedLeft = selectedRight = null;

        if (Object.keys(matches).length === puzzle.leftItems.length) {
          renderGame();
          setTimeout(showRoundComplete, 700);
          return;
        }
      } else {
        totalScore    = Math.max(0, totalScore - puzzle.scoreRules.wrongAttemptPenalty);
        flashWrong    = { leftId: selectedLeft.id, rightId: selectedRight.id };
        selectedRight = null;   // keep left selected — user can keep guessing from the right
        renderGame();
        setTimeout(() => { flashWrong = null; renderGame(); }, 650);
        return;
      }
      renderGame();
    }

    // ── ROUND COMPLETE ────────────────────────────────────────────────
    function showRoundComplete() {
      stage.removeAllChildren();
      drawBackground();
      drawHeader({ showExit: true });

      // Modal card
      const mW = 520, mH = 280;
      const mX = (W - mW) / 2, mY = HEADER_H + (H - HEADER_H - mH) / 2;

      new zim.Rectangle({ width: mW, height: mH, color: rgba(C.ink, 0.05), corner: 28 }).addTo(stage).loc(mX + 2, mY + 4);
      new zim.Rectangle({ width: mW, height: mH, color: C.white, borderColor: rgba(C.leaf, 0.4), borderWidth: 2, corner: 28 }).addTo(stage).loc(mX, mY);
      // Top accent
      new zim.Rectangle({ width: mW, height: 6, color: C.leaf, corner: [28, 28, 0, 0] }).addTo(stage).loc(mX, mY);

      const cx = mX + mW / 2;
      new zim.Label({ text: "🎉  Well done!", size: 40, font: FONT, color: C.ink, align: "center", valign: "center", bold: true }).addTo(stage).loc(cx, mY + 70);
      new zim.Label({ text: `Round ${roundIndex + 1} complete`, size: 22, font: FONT, color: C.sub, align: "center", valign: "center" }).addTo(stage).loc(cx, mY + 138);

      // Score pill
      const sp = new zim.Container().addTo(stage).loc(cx - 70, mY + 165);
      sp.mouseChildren = false;
      new zim.Rectangle({ width: 140, height: 32, color: rgba(C.sunshine, 0.18), borderColor: rgba(C.sunshine, 0.6), borderWidth: 1.5, corner: 16 }).addTo(sp);
      new zim.Label({ text: `⭐ ${totalScore} pts`, size: 17, font: FONT, color: "#a07800", align: "center", valign: "center", bold: true }).addTo(sp).loc(70, 16);

      const isLast = roundIndex === PAIR_COUNTS.length - 1;
      const btn = new zim.Button({
        width: 220, height: 48,
        label: isLast ? "See Final Score →" : "Next Round →",
        backgroundColor: C.tangerine, rollBackgroundColor: "#e88030",
        color: C.white, corner: 24,
      }).addTo(stage).loc(cx - 110, mY + mH - 60);
      btn.label.size = 20; btn.label.font = FONT;
      btn.on("click", () => isLast ? showFinalScore() : (roundIndex++, loadRound()));

      stage.update();
    }

    // ── FINAL SCORE ───────────────────────────────────────────────────
    function showFinalScore() {
      stage.removeAllChildren();
      drawBackground();
      drawHeader({ showExit: true });

      // Update session best
      const isNewBest  = totalScore >= sessionBest;
      if (isNewBest) sessionBest = totalScore;
      const LOW_SCORE  = 30;
      const isLowScore = totalScore < LOW_SCORE;

      // ── Sad faces (low score) or Falling flowers (good score) ────
      if (isLowScore) {
        const sadFaces = ["😢", "😔", "😞", "😿", "😭"];
        for (let i = 0; i < 14; i++) {
          const face = new zim.Label({
            text: sadFaces[i % sadFaces.length],
            size: 26 + Math.random() * 22,
            align: "center", valign: "center",
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
          { petal: C.bubblegum, center: C.sunshine  },
          { petal: C.tangerine, center: C.bubblegum },
          { petal: C.grape,     center: C.sunshine  },
          { petal: C.ocean,     center: C.white     },
          { petal: C.leaf,      center: C.sunshine  },
          { petal: C.sunshine,  center: C.tangerine },
        ];
        for (let i = 0; i < 20; i++) {
          const col  = flowerPalette[i % flowerPalette.length];
          const size = 12 + Math.random() * 16;
          const px   = Math.random() * W;
          const f    = new zim.Container().addTo(stage);
          const dist = size * 0.48;
          for (let p = 0; p < 5; p++) {
            const rad = ((p / 5) * 360 - 90) * Math.PI / 180;
            new zim.Circle(size * 0.36, col.petal).addTo(f)
              .loc(Math.cos(rad) * dist, Math.sin(rad) * dist);
          }
          new zim.Circle(size * 0.26, col.center).addTo(f).loc(0, 0);
          f.alpha = 0.9;
          f.loc(px, HEADER_H - size - Math.random() * 100);
          f.animate({
            props: {
              y:        H + size + 20,
              x:        px + (Math.random() - 0.5) * 80,
              rotation: (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 180),
            },
            time: 2.2 + Math.random() * 2,
            wait: Math.random() * 3,
            ease: "linear",
            loop: true,
          });
        }
      }

      // Modal card
      const mW         = 560, mH = 320;
      const mX         = (W - mW) / 2, mY = HEADER_H + (H - HEADER_H - mH) / 2;
      const modalBorder = isLowScore ? rgba(C.ocean, 0.45) : rgba(C.sunshine, 0.5);
      const modalAccent = isLowScore ? C.ocean : C.sunshine;
      new zim.Rectangle({ width: mW, height: mH, color: rgba(C.ink, 0.05), corner: 28 }).addTo(stage).loc(mX + 2, mY + 4);
      new zim.Rectangle({ width: mW, height: mH, color: C.white, borderColor: modalBorder, borderWidth: 2, corner: 28 }).addTo(stage).loc(mX, mY);
      new zim.Rectangle({ width: mW, height: 6, color: modalAccent, corner: [28, 28, 0, 0] }).addTo(stage).loc(mX, mY);

      const cx = mX + mW / 2;

      // Title — varies by outcome
      const titleText = isLowScore  ? "Don't give up! 😔"
                      : isNewBest   ? "🥇 New Best!"
                      :               "You finished! ⭐";
      new zim.Label({
        text: titleText,
        size: 42, font: FONT, color: C.ink,
        align: "center", valign: "center", bold: true,
      }).addTo(stage).loc(cx, mY + 68);

      new zim.Label({
        text: `Final Score: ${totalScore}`,
        size: 34, font: FONT, color: C.tangerine,
        align: "center", valign: "center", bold: true,
      }).addTo(stage).loc(cx, mY + 142);

      // Trophy row — show when not at the top (second+ play with a lower score)
      if (!isNewBest && sessionBest > totalScore) {
        const tw = 310, th = 36;
        const tr = new zim.Container().addTo(stage);
        tr.mouseChildren = false;
        new zim.Rectangle({
          width: tw, height: th,
          color: rgba(C.sunshine, 0.14),
          borderColor: rgba(C.sunshine, 0.55),
          borderWidth: 1.5, corner: th / 2,
        }).addTo(tr);
        new zim.Label({
          text: `🏆 Top: ${sessionBest} pts — Can you beat it?`,
          size: 15, font: FONT, color: "#7a5800",
          align: "center", valign: "center", bold: true,
        }).addTo(tr).loc(tw / 2, th / 2);
        tr.loc(cx - tw / 2, mY + 190);
      } else {
        new zim.Label({
          text: "Pick a mode above to play again!",
          size: 18, font: FONT, color: C.sub,
          align: "center", valign: "center",
        }).addTo(stage).loc(cx, mY + 196);
      }

      // Play Again button
      const btn = new zim.Button({
        width: 210, height: 48,
        label: "Play Again",
        backgroundColor: C.grape, rollBackgroundColor: "#7a50e0",
        color: C.white, corner: 24,
      }).addTo(stage).loc(cx - 105, mY + mH - 58);
      btn.label.size = 20; btn.label.font = FONT;
      btn.on("click", () => { roundIndex = 0; totalScore = 0; loadRound(); });

      stage.update();
    }

    // ── Kick off ──────────────────────────────────────────────────────
    loadRound();
  },
});
