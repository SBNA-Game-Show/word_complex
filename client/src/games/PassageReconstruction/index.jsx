import { createZimGame } from "../createZimGame";
import { getPassageReconstructionGame } from "../../services/passageReconstructionService";
import { submitPassageReconstructionScore } from "../../services/passageReconstructionScoreApi";
import { getSelectedStoryId } from "../../storyPicker/activeStory";
import { emit } from "../../scenes/sceneBus";
import { createHintPolicy } from "../shared/hintPolicy";
import { createHintButton } from "../shared/hintButton";
import { createCountdown } from "../shared/countdownPolicy";

const zimFont = "Fredoka";
const sanskritFont = "Nirmala UI";

// Meadow / storybook-sky palette (matches passage-reconstruction.png):
//   sky blues, soft meadow greens, sandy "path stone" cream, lantern gold.
const palette = {
  skyTop: "#bfe3f5",
  skyMid: "#dcf0f7",
  meadow: "#cfe7b0",
  stone: "#f1e3bd",
  stoneEdge: "#d8c48f",
  stoneShadow: "rgba(120,100,60,0.16)",
  ink: "#1f4a5c",
  inkSoft: "#3d5a74",
  gold: "#f4c45a",
  goldDeep: "#caa24a",
  cloud: "#ffffff",
  cloudEdge: "#9cc9ec",
  cloudShadow: "#cfe6f8",
};

export default createZimGame({
  id: "zim-sentence-game",
  width: 1100,
  height: 720,
  color: "#cfe9f7",
  outerColor: "#0e2233",
  setup({ frame, stage, W, H, zim, authUser }) {
    let disposed = false;
    let rounds = [];
    let roundIndex = 0;
    let score = 0;
    let attemptsLeft = 3;
    let checks = 0;
    let correctChecks = 0;
    let currentLanguage = "english";
    let isStarting = false;
    let feedbackActive = false; // blocks checkAnswer while a feedback popup is showing
    // A wrong "Check" costs points (floored at 0, like the hint penalty) on top of
    // burning an attempt, so the final score reflects accuracy.
    const WRONG_PENALTY = 20;
    // Whole-game 90s countdown. The pure policy tracks remaining seconds + pause;
    // the ZIM interval below drives it and a HUD label shows it. When it expires the
    // whole game ends with a results screen (see endByTimeout / showResults).
    const GAME_SECONDS = 90;
    const countdown = createCountdown({ seconds: GAME_SECONDS });
    let hintsUsedTotal = 0; // whole-game hint count, for the leaderboard run
    let timerInterval = null; // ZIM intervalObject (one for the whole game)
    let timerLabel = null; // live HUD label, re-pointed on every makeStatus()
    let gameOver = false; // set once the game ends (timeout or finish); blocks input
    // Hint system: 2 hints per round, each costs 25 points. The policy is shared,
    // game-agnostic logic; the button is a shared in-canvas trigger; the buddy
    // delivers the hint text via sceneBus (see applyHint).
    const hintPolicy = createHintPolicy({ maxPerRound: 2, penalty: 25 });
    let hintButton = null;
    const hintedSlots = new Set(); // slots already pointed out this round, so a
    // second hint moves on to a different phrase instead of repeating itself
    const tiles = [];
    const zones = [];

    // --- Dynamic cloud / slot sizing -------------------------------------
    // Clouds size themselves to their phrase: the label wraps at TILE_WRAP and
    // the cloud grows (mainly taller) around it. Slots are made uniform per
    // round, sized to the round's largest cloud. See measureCloud / computeLayout.
    const TILE_FONT = 20; // phrase font size (bold)
    const TILE_WRAP = 156; // px width at which a phrase wraps to a new line
    // A cloud's drawn silhouette is only full-width across its MIDDLE band (the
    // top/bottom taper into the wispy lobes). So the cloud is sized as a multiple
    // of the wrapped text block — wider, and especially TALLER for multi-line
    // phrases — so every line sits inside that wide middle and never hits a lobe.
    const CLOUD_W_RATIO = 1.6; // cloud width  ÷ text width
    const CLOUD_H_RATIO = 2.4; // cloud height ÷ text height (lobes eat ~half the height)
    const CLOUD_W_EXTRA = 8;
    const CLOUD_H_EXTRA = 10;
    const CLOUD_MIN_W = 205; // even short phrases get a full, round cloud (not slim)
    const CLOUD_MAX_W = 252; // capped so 4 clouds always fit the canvas width
    const CLOUD_MIN_H = 124;
    const CLOUD_MAX_H = 178; // capped so 2 scatter rows still fit below the slots
    const TEXT_VALIGN = 0.55; // text sits at the cloud body's true centre (lower than 0.5)
    const SLOT_PAD_W = 16; // slot is this much wider than the largest cloud
    const SLOT_PAD_H = 8; // slot is this much taller than the largest cloud
    const SLOT_INSET = 10; // clouds are capped to (slotWidth - SLOT_INSET)
    const ZONE_Y = 80; // top of the numbered slot row
    // Scatter layout cached per round so tiles keep their spots across the
    // re-renders that Reset and wrong-answer dismissal trigger.
    let layoutCache = { round: -1, layout: null };

    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const contentFont = () => currentLanguage === "sanskrit" ? sanskritFont : zimFont;

    function addLabel(text, size, color, x, y, align = "left", container = stage) {
      const label = new zim.Label(text, size, zimFont, color);
      label.textAlign = align;
      label.addTo(container);
      label.loc(x, y);
      return label;
    }

    // "90" -> "1:30". Seconds are zero-padded; minutes are not.
    function formatTime(totalSeconds) {
      const safe = Math.max(0, totalSeconds);
      const minutes = Math.floor(safe / 60);
      const seconds = safe % 60;
      return `${minutes}:${String(seconds).padStart(2, "0")}`;
    }

    // Refresh the HUD timer label from the countdown. Runs every tick; guards for
    // the label being absent (e.g. on the results screen, which has no HUD).
    function updateTimerLabel() {
      if (disposed) return;
      if (!timerLabel) return;
      timerLabel.text = `Time ${formatTime(countdown.remaining())}`;
      // Warm gold normally, coral in the final 15s for urgency.
      timerLabel.color = countdown.remaining() <= 15 ? "#d2553f" : palette.inkSoft;
      stage.update();
    }

    // One ZIM interval drives the whole-game clock. It lives on the Frame's Ticker,
    // so it survives stage.removeAllChildren() and keeps counting across rounds.
    function startTimer() {
      if (disposed) return;
      if (timerInterval) timerInterval.clear();
      // immediate:false so the first tick happens after 1s, not synchronously at
      // creation (which would decrement before showSentencePreview pauses the clock).
      timerInterval = zim.interval({
        time: 1,
        immediate: false,
        call: () => {
          if (disposed) {
            if (timerInterval) {
              timerInterval.clear();
              timerInterval = null;
            }
            return;
          }
          countdown.tick();
          updateTimerLabel();
          if (countdown.expired()) endByTimeout();
        },
      });
    }

    function resetSessionState() {
      if (timerInterval) {
        timerInterval.clear();
        timerInterval = null;
      }
      rounds = [];
      roundIndex = 0;
      score = 0;
      attemptsLeft = 3;
      checks = 0;
      correctChecks = 0;
      isStarting = false;
      feedbackActive = false;
      gameOver = false;
      timerLabel = null;
      hintButton = null;
      hintedSlots.clear();
      tiles.length = 0;
      zones.length = 0;
      layoutCache = { round: -1, layout: null };
      countdown.reset();
      hintPolicy.reset();
      hintsUsedTotal = 0;
    }

    function makeLanguageButton({ language, label, detail, x }) {
      const isSanskrit = language === "sanskrit";
      const buttonLabel = new zim.Label({
        text: label,
        size: isSanskrit ? 25 : 24,
        font: isSanskrit ? sanskritFont : zimFont,
        color: "#ffffff",
        align: "center",
        valign: "center",
        bold: true,
      });
      const button = new zim.Button({
        width: 210,
        height: 62,
        label: buttonLabel,
        backgroundColor: isSanskrit ? "#5a9a4f" : palette.goldDeep,
        rollBackgroundColor: isSanskrit ? "#6aae5d" : palette.gold,
        downBackgroundColor: isSanskrit ? "#4d8a44" : "#b58c33",
        color: "#ffffff",
        corner: 24,
      }).addTo(stage).loc(x, 395);

      button.tap(() => loadAndStart(language));

      new zim.Label({
        text: detail,
        size: isSanskrit ? 18 : 17,
        font: isSanskrit ? sanskritFont : zimFont,
        color: palette.inkSoft,
        align: "center",
        valign: "top",
        lineWidth: 230,
      }).addTo(stage).loc(x + 105, 474);
    }

    function showLanguagePicker() {
      if (disposed) return;
      resetSessionState();
      stage.removeAllChildren();
      makeBackground();

      const panelW = 700;
      const panelH = 360;
      const panelX = (W - panelW) / 2;
      const panelY = 170;
      new zim.Rectangle(panelW, panelH, "rgba(255,255,255,.84)", palette.goldDeep, 4, 28)
        .addTo(stage).loc(panelX, panelY);

      new zim.Label({
        text: "Passage Reconstruction",
        size: 42,
        font: zimFont,
        color: palette.ink,
        align: "center",
        valign: "top",
        bold: true,
      }).addTo(stage).loc(W / 2, 218);

      new zim.Label({
        text: "Choose a language",
        size: 26,
        font: zimFont,
        color: palette.inkSoft,
        align: "center",
        valign: "top",
      }).addTo(stage).loc(W / 2, 286);

      makeLanguageButton({
        language: "english",
        label: "English",
        detail: "Rebuild the story sentence in English.",
        x: W / 2 - 245,
      });
      makeLanguageButton({
        language: "sanskrit",
        label: "संस्कृतम्",
        detail: "देवनागरी वाक्यं पुनर्निर्माणं कुरु।",
        x: W / 2 + 35,
      });

      stage.update();
    }

    // Time ran out: end the game on the spot with the timed-out results screen.
    function endByTimeout() {
      if (disposed) return;
      if (gameOver) return;
      showResults({ timedOut: true });
    }

    function makeBackground() {
      // Vertical storybook sky → meadow gradient so the canvas blends into the
      // illustrated background behind it.
      const sky = new zim.GradientColor(
        [palette.skyTop, palette.skyMid, palette.meadow],
        [0, 0.62, 1],
        0, 0, 0, H
      );
      new zim.Rectangle(W, H, sky).addTo(stage);

      // Soft meadow ground band with a gentle rolling top edge.
      const ground = new zim.Shape().addTo(stage);
      ground.f(palette.meadow)
        .mt(0, H - 96)
        .bt(W * 0.25, H - 124, W * 0.55, H - 78, W, H - 110)
        .lt(W, H).lt(0, H).cp();
      ground.alpha = 0.55;

      // A few drifting clouds for depth (decorative, behind the play area).
      makeSkyCloud(150, 150, 150, 0.55);
      makeSkyCloud(W - 230, 120, 190, 0.45);
      makeSkyCloud(W / 2 + 40, 96, 120, 0.35);
    }

    // Lightweight decorative cloud puff for the sky (no interaction).
    function makeSkyCloud(x, y, width, alpha) {
      const cloud = makeCloudShape(palette.cloud, palette.cloud, 0, width).addTo(stage).loc(x, y);
      cloud.alpha = alpha;
      return cloud;
    }

    function makeStatus(message) {
      const hud = new zim.Container().addTo(stage);
      const round = new zim.Label(`Round ${roundIndex + 1}/${rounds.length}`, 18, zimFont, palette.inkSoft).addTo(hud).loc(0, 0);
      const scoreLabel = new zim.Label(`Score ${score}`, 18, zimFont, palette.inkSoft).addTo(hud).loc(round.width + 16, 0);
      const attemptsLabel = new zim.Label(`Attempts ${attemptsLeft}`, 18, zimFont, palette.inkSoft)
        .addTo(hud).loc(round.width + scoreLabel.width + 32, 0);
      // Live countdown segment. Re-pointing `timerLabel` here (the same trick used
      // for hintButton) keeps the reference valid after stage.removeAllChildren().
      timerLabel = new zim.Label(`Time ${formatTime(countdown.remaining())}`, 18, zimFont, palette.inkSoft)
        .addTo(hud).loc(round.width + scoreLabel.width + attemptsLabel.width + 48, 0);
      timerLabel.color = countdown.remaining() <= 15 ? "#d2553f" : palette.inkSoft;
      hud.setBounds(0, 0, round.width + scoreLabel.width + attemptsLabel.width + timerLabel.width + 48, 24);

      // Soft rounded "card" behind the HUD so it reads against the sky.
      const pad = 16;
      new zim.Rectangle(hud.width + pad * 2, 34, "rgba(255,255,255,0.66)", palette.cloudEdge, 1.5, 17)
        .addTo(stage).loc((W - hud.width) / 2 - pad, 28);
      hud.top();
      hud.loc((W - hud.width) / 2, 34);

      new zim.Label({
        text: message,
        size: 18,
        font: zimFont,
        color: palette.ink,
        align: "center",
        valign: "center"
      }).addTo(stage).loc(W / 2, 651);
    }

    function makeBottomControls() {
      const controls = new zim.Container().addTo(stage);
      const checkLabel = new zim.Label("Check", 18, zimFont, "#ffffff");
      checkLabel.fontOptions = "bold";
      const checkButton = new zim.Button({
        width: 132,
        height: 42,
        label: checkLabel,
        backgroundColor: palette.goldDeep,
        rollBackgroundColor: palette.gold,
        downBackgroundColor: "#b58c33",
        color: "#ffffff",
        corner: 21
      }).addTo(controls).loc(0, 0);
      checkButton.on("click", checkAnswer);
      const resetLabel = new zim.Label("Reset", 18, zimFont, palette.ink);
      resetLabel.fontOptions = "bold";
      const resetButton = new zim.Button({
        width: 132,
        height: 42,
        label: resetLabel,
        backgroundColor: "#ffffff",
        rollBackgroundColor: "#eaf6ff",
        downBackgroundColor: "#d6ecfb",
        color: palette.ink,
        borderColor: palette.cloudEdge,
        borderWidth: 2,
        corner: 21
      }).addTo(controls).loc(148, 0);
      resetButton.on("click", () => renderRound());
      // Total group width: Check (132) + gap (16) + Reset (132) + gap (16) + Hint (132) = 428
      controls.setBounds(0, 0, 280, 42);
      controls.loc((W - 428) / 2, 674);

      // Shared in-canvas Hint button, placed just right of Reset. Rebuilt on every
      // renderRound() like the other controls; the module-scoped `hintButton`
      // always points at the live instance so applyHint's refresh() is never stale.
      hintButton = createHintButton({
        stage,
        zim,
        x: (W - 428) / 2 + 296,
        y: 674,
        policy: hintPolicy,
        onUse: applyHint,
        palette: { bg: palette.gold, rollBg: "#ffd97a", downBg: palette.goldDeep, color: palette.ink },
      });
    }

    function makeTile(text, x, y, w, h) {
      const tile = new zim.Container().loc(x, y).addTo(stage);
      tile.homeX = x;
      tile.homeY = y;
      tile.chunk = text;
      tile.zoneIndex = null;
      tile.widthValue = w;
      tile.heightValue = h;
      tile.setBounds(0, 0, w, h);
      tile.mouseChildren = false;

      const shadow = makeCloudShape(palette.cloudShadow, palette.cloudShadow, 0, w, h).addTo(tile).loc(0, 9);
      shadow.alpha = 0.9;
      makeCloudShape(palette.cloud, palette.cloudEdge, 3, w, h).addTo(tile);

      const label = new zim.Label({
        text,
        size: TILE_FONT,
        font: contentFont(),
        color: palette.ink,
        align: "center",
        valign: "center",
        bold: true,
        lineWidth: TILE_WRAP
      });
      label.addTo(tile).loc(w / 2, h * TEXT_VALIGN);
      tile.cursor = "pointer";
      tile.drag();
      tile.on("mousedown", () => tile.top());
      tile.on("pressup", () => snapTile(tile));
      tiles.push(tile);
    }

    function makeZone(index, x, y, w, h) {
      const zone = new zim.Container().loc(x, y).addTo(stage);
      zone.tile = null;
      zone.widthValue = w;
      zone.heightValue = h;

      // Sandy "story stone" slot that echoes the path/stones in the background.
      new zim.Rectangle(w, 12, palette.stoneShadow, palette.stoneShadow, 0, 14)
        .addTo(zone).loc(0, h - 6);

      const tablet = new zim.Rectangle(w, h, "rgba(241,227,189,0.62)", palette.stoneEdge, 2, 14)
        .addTo(zone);
      tablet.setBounds(0, 0, w, h);

      // Dashed inner guide so empty slots read as "drop here".
      const guide = new zim.Shape().addTo(zone);
      guide.s(palette.stoneEdge).ss(2).sd([7, 6]).rr(12, 12, w - 24, h - 24, 10);

      new zim.Label({
        text: String(index + 1),
        size: 42,
        font: zimFont,
        color: palette.goldDeep,
        align: "center",
        valign: "center",
        bold: true
      }).addTo(zone).loc(w / 2, h / 2);
      zones.push(zone);
    }

    // Cloud puff drawn in a 180×118 box, then scaled to the requested width and
    // height. Height defaults to the natural ratio so decorative sky clouds (which
    // pass width only) keep their original proportions.
    function makeCloudShape(fill, stroke, strokeWidth, width = 180, height = (width * 118) / 180) {
      const cloud = new zim.Shape();
      cloud.f(fill).s(stroke).ss(strokeWidth)
        .mt(31, 70)
        .bt(15, 70, 8, 58, 14, 46)
        .bt(20, 34, 34, 32, 44, 34)
        .bt(55, 22, 82, 21, 95, 31)
        .bt(116, 28, 132, 37, 137, 51)
        .bt(154, 52, 168, 62, 166, 78)
        .bt(164, 95, 146, 101, 131, 96)
        .bt(121, 110, 98, 111, 86, 100)
        .bt(74, 112, 51, 110, 43, 96)
        .bt(30, 101, 14, 93, 15, 79)
        .bt(16, 73, 22, 70, 31, 70)
        .cp();
      cloud.scaleX = width / 180;
      cloud.scaleY = height / 118;
      cloud.setBounds(0, 0, width, height);
      return cloud;
    }

    // Measure a phrase and return the cloud dimensions that wrap around it. The
    // probe Label measures the wrapped text without being added to the stage.
    function measureCloud(text) {
      const probe = new zim.Label({
        text,
        size: TILE_FONT,
        font: contentFont(),
        bold: true,
        lineWidth: TILE_WRAP
      });
      return {
        w: clamp(probe.width * CLOUD_W_RATIO + CLOUD_W_EXTRA, CLOUD_MIN_W, CLOUD_MAX_W),
        h: clamp(probe.height * CLOUD_H_RATIO + CLOUD_H_EXTRA, CLOUD_MIN_H, CLOUD_MAX_H)
      };
    }

    // Per-round layout: uniform slot size (fits the round's biggest cloud), the
    // centred slot-row x positions, and a scattered, non-overlapping set of tile
    // positions in the bottom play area. Pure geometry — cached by getLayout.
    function computeLayout(current) {
      const n = current.answer.length;
      const tileSizes = current.chunks.map((chunk) => measureCloud(chunk));

      // Uniform slot size from the largest cloud this round.
      const maxCloudW = Math.max(...tileSizes.map((s) => s.w));
      const maxCloudH = Math.max(...tileSizes.map((s) => s.h));
      const margin = 20;
      const gap = 12;
      // Shrink slots if 4-across + gaps would overflow the canvas width.
      const fitW = (W - 2 * margin - (n - 1) * gap) / n;
      const zoneW = Math.min(maxCloudW + SLOT_PAD_W, fitW);
      const zoneH = maxCloudH + SLOT_PAD_H;
      const cloudCapW = zoneW - SLOT_INSET; // no cloud may exceed its slot

      // Centred slot row.
      const rowW = n * zoneW + (n - 1) * gap;
      const startX = (W - rowW) / 2;
      const zoneX = current.answer.map((_, i) => startX + i * (zoneW + gap));

      // Scatter the tiles over a jittered grid in the bottom play area. Each tile
      // is confined to its own cell (so no two clouds overlap); a random offset
      // inside the cell + the varied cloud sizes give the scattered look.
      const areaTop = ZONE_Y + zoneH + 18;
      const areaBottom = 645; // just above the instruction text / controls
      const areaMargin = 50;
      const areaX0 = areaMargin;
      const areaW = W - 2 * areaMargin;
      const areaH = areaBottom - areaTop;
      const cols = Math.ceil(Math.sqrt(n));
      const rows = Math.ceil(n / cols);
      const cellW = areaW / cols;
      const cellH = areaH / rows;

      // Randomise which cell each tile lands in for variety between rounds.
      const cells = current.answer.map((_, i) => i);
      for (let i = cells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cells[i], cells[j]] = [cells[j], cells[i]];
      }

      const tiles = tileSizes.map((size, i) => {
        const w = Math.min(size.w, cloudCapW);
        const h = size.h;
        const cell = cells[i];
        const col = cell % cols;
        const row = Math.floor(cell / cols);
        const slackX = Math.max(0, (cellW - w) / 2);
        const slackY = Math.max(0, (cellH - h) / 2);
        const jitterX = (Math.random() * 2 - 1) * slackX * 0.85;
        const jitterY = (Math.random() * 2 - 1) * slackY * 0.85;
        return {
          w,
          h,
          x: areaX0 + col * cellW + (cellW - w) / 2 + jitterX,
          y: areaTop + row * cellH + (cellH - h) / 2 + jitterY
        };
      });

      return { zoneW, zoneH, zoneY: ZONE_Y, zoneX, tiles };
    }

    // Cache the layout per round so the scattered positions stay put across the
    // re-renders triggered by Reset and wrong-answer dismissal.
    function getLayout(current) {
      if (layoutCache.round === roundIndex && layoutCache.layout) return layoutCache.layout;
      layoutCache = { round: roundIndex, layout: computeLayout(current) };
      return layoutCache.layout;
    }

    function snapTile(tile) {
      let matchedZone = null;
      zones.forEach((zone) => {
        const centerX = tile.x + tile.widthValue / 2;
        const centerY = tile.y + tile.heightValue / 2;
        const insideX = centerX > zone.x && centerX < zone.x + zone.widthValue;
        const insideY = centerY > zone.y && centerY < zone.y + zone.heightValue;
        if (insideX && insideY) matchedZone = zone;
      });

      if (matchedZone) {
        if (matchedZone.tile && matchedZone.tile !== tile) {
          matchedZone.tile.zoneIndex = null;
          matchedZone.tile.animate({ props: { x: matchedZone.tile.homeX, y: matchedZone.tile.homeY }, time: 0.25 });
        }
        if (tile.zoneIndex !== null) zones[tile.zoneIndex].tile = null;
        matchedZone.tile = tile;
        tile.zoneIndex = zones.indexOf(matchedZone);
        tile.animate({
          props: {
            x: matchedZone.x + (matchedZone.widthValue - tile.widthValue) / 2,
            y: matchedZone.y + (matchedZone.heightValue - tile.heightValue) / 2
          },
          time: 0.2
        });
      } else {
        if (tile.zoneIndex !== null) zones[tile.zoneIndex].tile = null;
        tile.zoneIndex = null;
        tile.animate({ props: { x: tile.homeX, y: tile.homeY }, time: 0.25 });
      }
      stage.update();
    }

    // A hint doesn't touch the board — it just works out the next piece the player
    // still needs and has the helper character "say" where it goes (via sceneBus).
    // The player drags it themselves. This is the ONLY game-specific piece of the
    // hint system; the policy and button are shared, reusable code.
    function applyHint() {
      if (gameOver || feedbackActive) return; // same guard as checkAnswer
      if (!hintPolicy.canUse()) return;

      const answer = rounds[roundIndex].answer;

      // Next slot to point at: one that needs a real (non-empty) phrase, doesn't
      // have it yet, and hasn't already been pointed out this round — so pressing
      // hint again moves on to a different phrase. Fall back to the first
      // still-wrong slot if every wrong slot has already been hinted.
      let target = -1;
      let fallback = -1;
      for (let i = 0; i < zones.length; i++) {
        if (!answer[i]) continue; // empty answer slot — nothing useful to point at
        if ((zones[i].tile?.chunk ?? null) === answer[i]) continue; // already correct
        if (fallback === -1) fallback = i;
        if (!hintedSlots.has(i)) {
          target = i;
          break;
        }
      }
      if (target === -1) target = fallback;
      if (target === -1) return; // nothing helpful left to say — don't spend a hint

      // Spend the hint, apply the penalty, and let the buddy tell the player where
      // this phrase belongs.
      hintedSlots.add(target);
      hintPolicy.use();
      hintsUsedTotal += 1;
      score = Math.max(0, score - hintPolicy.penalty);
      if (hintButton) hintButton.refresh();
      emit("hint", { text: `"${answer[target]}" goes in slot ${target + 1}.` });
    }

    // Shows the full sentence for ~1.5s with a progress bar, then calls renderRound.
    // Mirrors the landing-screen behaviour from the proof of concept.
    function showSentencePreview() {
      // Refill hints for the new round. Done here (not in renderRound) so the Reset
      // button — which calls renderRound — keeps hints already spent this round.
      hintPolicy.reset();
      hintedSlots.clear();
      // Freeze the clock while the player memorises the sentence — it resumes when
      // the round board appears (renderRound). Play and feedback popups keep ticking.
      countdown.pause();
      stage.removeAllChildren();

      // Sky → meadow background matching the scene art
      makeBackground();

      // HUD so the player can see which round they're on
      makeStatus("Memorise the sentence — then arrange the clouds!");

      // Central panel
      const panelW = 740;
      const panelH = 180;
      const panelX = (W - panelW) / 2;
      const panelY = H / 2 - panelH / 2 - 50;

      new zim.Rectangle(panelW, panelH, "rgba(255,255,255,0.92)", "#ffffff", 4, 28)
        .addTo(stage).loc(panelX, panelY);

      // Eyebrow label
      new zim.Label({
        text: "REMEMBER THIS SENTENCE",
        size: 14,
        font: zimFont,
        color: palette.inkSoft,
        align: "center",
        valign: "center"
      }).addTo(stage).loc(W / 2, panelY + 32);

      // The sentence — large and clear
      new zim.Label({
        text: rounds[roundIndex].sentence,
        size: currentLanguage === "sanskrit" ? 28 : 30,
        font: contentFont(),
        color: palette.ink,
        align: "center",
        valign: "center",
        bold: true,
        lineWidth: panelW - 80
      }).addTo(stage).loc(W / 2, panelY + 108);

      // Progress bar track
      const barW = 520;
      const barH = 12;
      const barX = (W - barW) / 2;
      const barY = panelY + panelH + 44;

      new zim.Rectangle(barW, barH, "#e7e2d0", "#e7e2d0", 0, barH / 2)
        .addTo(stage).loc(barX, barY);

      // Fill bar — starts scaled to near-zero, animates to full width over 1.5s
      const barFill = new zim.Rectangle(barW, barH, palette.gold, palette.gold, 0, barH / 2)
        .addTo(stage).loc(barX, barY);
      barFill.scaleX = 0.001;

      stage.update();

      barFill.animate({
        props: { scaleX: 1 },
        time: 1.5,
        ease: "linear",
        call: () => {
          if (!disposed) renderRound();
        }
      });
    }

    function renderRound(message = "Drag each phrase into the numbered story slots.") {
      if (disposed) return;
      // If the clock ran out (e.g. while a wrong-answer popup's auto-dismiss tween
      // was still pending), the results screen is already up — don't rebuild over it.
      if (gameOver) return;
      feedbackActive = false;
      // Active play — make sure the clock is running (it was paused for the preview;
      // Reset and wrong-popup dismissal also route here and should keep it running).
      countdown.resume();
      stage.removeAllChildren();
      tiles.length = 0;
      zones.length = 0;
      makeBackground();
      makeStatus(message);

      const current = rounds[roundIndex];
      const layout = getLayout(current);
      current.answer.forEach((_, index) =>
        makeZone(index, layout.zoneX[index], layout.zoneY, layout.zoneW, layout.zoneH));
      current.chunks.forEach((chunk, index) => {
        const t = layout.tiles[index];
        makeTile(chunk, t.x, t.y, t.w, t.h);
      });
      makeBottomControls();
      stage.update();
    }

    function checkAnswer() {
      if (gameOver || feedbackActive) return;

      const placed = zones.map((zone) => zone.tile?.chunk || "");
      const isComplete = placed.every(Boolean);
      checks += 1;

      if (!isComplete) {
        renderRound("Fill all four slots before checking.");
        return;
      }

      const isCorrect = placed.every((chunk, index) => chunk === rounds[roundIndex].answer[index]);
      if (isCorrect) {
        feedbackActive = true;
        score += 100;
        correctChecks += 1;
        showCorrect();
      } else {
        feedbackActive = true;
        score = Math.max(0, score - WRONG_PENALTY);
        attemptsLeft -= 1;
        if (attemptsLeft <= 0) showRoundOver();
        else showWrong();
      }
    }

    function showWrong() {
      emit("wrong");
      const panelW = 520;
      const panelH = 170;
      const panelX = (W - panelW) / 2;
      const panelY = 275;

      const pane = new zim.Rectangle(panelW, panelH, "#fff8f6", "#e8836a", 3, 22)
        .loc(panelX, panelY).addTo(stage);

      const popup = new zim.Container().addTo(stage);

      // "Not quite!" heading
      new zim.Label({
        text: "Not quite!",
        size: 32,
        font: zimFont,
        color: "#7a2316",
        align: "center",
        valign: "center"
      }).addTo(popup).loc(0, 18);

      // Hint line (also tells the player a wrong check cost points)
      new zim.Label({
        text: `Check the order — who acts, then what they do. (-${WRONG_PENALTY})`,
        size: 19,
        font: zimFont,
        color: "#a0513e",
        align: "center",
        valign: "center"
      }).addTo(popup).loc(0, 60);

      // OK button — white bg, dark text, coral border for clear visibility
      const okLabel = new zim.Label("OK", 20, zimFont, "#5a1a0e");
      okLabel.fontOptions = "bold";
      const ok = new zim.Button({
        width: 120,
        height: 42,
        label: okLabel,
        backgroundColor: "#ffffff",
        rollBackgroundColor: "#fde8e3",
        downBackgroundColor: "#f5d0c8",
        borderColor: "#e8836a",
        borderWidth: 2,
        corner: 20
      }).addTo(popup).loc(-60, 94);

      // Countdown bar — drains left-to-right over 2s
      const barW = panelW - 48;
      const bar = new zim.Rectangle(barW, 6, "#e8836a", "#e8836a", 0, 3)
        .addTo(popup).loc(-(barW / 2), 148);

      popup.setBounds(-(panelW / 2), 0, panelW, panelH);
      popup.loc(W / 2, panelY);
      pane.bot();
      stage.update();

      let dismissed = false;
      function dismiss() {
        if (disposed) return;
        if (dismissed) return;
        dismissed = true;
        bar.stopAnimate(true);
        renderRound("Drag each phrase into the numbered story slots.");
      }

      ok.on("click", dismiss);

      bar.animate({
        props: { scaleX: 0.001 },
        time: 2,
        ease: "linear",
        call: dismiss
      });
    }

    function showCorrect() {
      emit("correct");
      const pane = new zim.Rectangle(570, 160, "#eef7df", "#7fae5a", 5, 24).loc(265, 356).addTo(stage);
      const success = new zim.Container().addTo(stage);
      new zim.Label({
        text: "Wonderful ordering!",
        size: 34,
        font: zimFont,
        color: "#2f6f45",
        align: "center",
        valign: "center"
      }).addTo(success).loc(0, 17);
      new zim.Label({
        text: "You rebuilt the sentence like a careful reader.",
        size: 22,
        font: zimFont,
        color: "#456b3f",
        align: "center",
        valign: "center"
      }).addTo(success).loc(0, 55);
      const nextLabel = roundIndex === rounds.length - 1 ? "Finish" : "Next Round";
      const nextButtonLabel = new zim.Label(nextLabel, 18, zimFont, "#ffffff");
      nextButtonLabel.fontOptions = "bold";
      const next = new zim.Button({
        width: 150,
        height: 44,
        label: nextButtonLabel,
        backgroundColor: "#5a9a4f",
        rollBackgroundColor: "#6aae5d",
        downBackgroundColor: "#4d8a44",
        color: "#ffffff",
        corner: 20
      }).addTo(success).loc(-75, 74);
      next.on("click", () => {
        if (disposed) return;
        if (roundIndex === rounds.length - 1) {
          showComplete();
        } else {
          roundIndex += 1;
          attemptsLeft = 3;
          showSentencePreview();
        }
      });
      success.setBounds(-260, 0, 520, 118);
      success.loc(W / 2, 390);
      pane.bot();
      stage.update();
    }

    function showRoundOver() {
      emit("roundOver");
      addLabel("No attempts left. The story magic resets this round.", 23, "#8a3a2d", W / 2, 360, "center");
      const retryLabel = new zim.Label("Try Again", 18, zimFont, "#ffffff");
      retryLabel.fontOptions = "bold";
      const retry = new zim.Button({
        width: 150,
        height: 52,
        label: retryLabel,
        backgroundColor: palette.goldDeep,
        rollBackgroundColor: palette.gold,
        downBackgroundColor: "#b58c33",
        color: "#ffffff",
        corner: 20
      }).loc(475, 398).addTo(stage);
      retry.on("click", () => {
        if (disposed) return;
        attemptsLeft = 3;
        showSentencePreview();
      });
      stage.update();
    }

    // Natural finish — the player solved every round. Thin wrapper so existing
    // callers read clearly; the timeout path calls showResults directly.
    function showComplete() {
      showResults({ timedOut: false });
    }

    // The single end-of-game screen, used both when the clock runs out (timedOut)
    // and when every round is solved. Stops the timer, blocks further input, and
    // reports the final score plus how many rounds were right vs. missed.
    function showResults({ timedOut }) {
      if (disposed) return;
      gameOver = true;
      if (timerInterval) {
        timerInterval.clear();
        timerInterval = null;
      }
      feedbackActive = true;
      emit(timedOut ? "timeUp" : "complete");

      // Time bonus: +5 pts per second left on the clock, only when the quest
      // was finished (on a timeout remaining is 0 anyway, but be explicit).
      // Max possible score = 3x100 rounds + 90x5 bonus = 750.
      const timeBonus = timedOut ? 0 : countdown.remaining() * 5;
      score += timeBonus;

      // Push the finished run to the PR leaderboard (same pattern as Context
      // Cloze Quest). Timed-out runs count too — they just carry the full 90s,
      // so they lose time tiebreaks. The server only keeps it if it beats the
      // player's stored best (score -> time -> hints).
      // Guests never touch the leaderboard: anonymous Firebase users have a
      // real UID, so checking id alone is not enough — isGuest is the gate.
      if (authUser?.id && !authUser.isGuest) {
        const elapsedMs =
          (GAME_SECONDS - Math.max(0, countdown.remaining())) * 1000;

        submitPassageReconstructionScore({
          uuid: authUser.id,
          displayName: authUser.name || "Player",
          score,
          time: elapsedMs,
          hintsUsed: hintsUsedTotal,
          storyId: getSelectedStoryId(),
        })
          .then((result) => {
            console.log("Passage Reconstruction score result:", result);
          })
          .catch((error) => {
            console.error("Could not save Passage Reconstruction score:", error);
          });
      }

      const roundsRight = correctChecks;
      const roundsWrong = rounds.length - correctChecks; // unreached rounds count as missed
      const accuracy = checks ? Math.round((correctChecks / checks) * 100) : 100;

      stage.removeAllChildren(); // wipes any board/popup that was on screen at timeout
      makeBackground();
      new zim.Rectangle(680, 360, "rgba(255,255,255,.82)", palette.goldDeep, 5, 28).loc(210, 168).addTo(stage);
      const makecenteredLabel = (text, size, color, y) =>
        new zim.Label({ text, size, font: zimFont, color, align: "center", valign: "top" })
          .addTo(stage).loc(W / 2, y);
      makecenteredLabel(timedOut ? "Time's Up!" : "Quest Complete", 48, palette.ink, 210);
      makecenteredLabel(
        timeBonus > 0
          ? `Final score: ${score} (+${timeBonus} time bonus)`
          : `Final score: ${score}`,
        32, "#3a5240", 282,
      );
      makecenteredLabel(`Rounds right: ${roundsRight}/${rounds.length}`, 28, "#3a7a4a", 332);
      makecenteredLabel(`Rounds missed: ${roundsWrong}/${rounds.length}`, 28, "#a05038", 372);
      makecenteredLabel(`Accuracy: ${accuracy}%`, 22, palette.inkSoft, 414);
      const againLabel = new zim.Label("Play Again", 18, zimFont, "#ffffff");
      againLabel.fontOptions = "bold";
      const again = new zim.Button({
        width: 190,
        height: 52,
        label: againLabel,
        backgroundColor: palette.goldDeep,
        rollBackgroundColor: palette.gold,
        downBackgroundColor: "#b58c33",
        color: "#ffffff",
        corner: 20
      }).loc(455, 456).addTo(stage);
      again.tap(() => {
        if (disposed) return;
        showLanguagePicker();
      });
      stage.update();
    }

    async function loadAndStart(language = "english") {
      if (disposed) return;
      if (isStarting) return;
      currentLanguage = language;
      resetSessionState();
      isStarting = true;
      stage.removeAllChildren();
      new zim.Label(
        `Loading ${language === "sanskrit" ? "Sanskrit" : "English"} story...`,
        28,
        language === "sanskrit" ? sanskritFont : zimFont,
        "#073b49"
      ).addTo(stage).center(stage);
      stage.update();

      const response = await getPassageReconstructionGame(language);

      if (disposed) return;

      if (!response || !response.data || !response.data.rounds) {
        isStarting = false;
        stage.removeAllChildren();
        new zim.Label("Failed to load story. Please refresh.", 22, zimFont, "#8a3a2d")
          .addTo(stage).center(stage);
        stage.update();
        return;
      }

      rounds = response.data.rounds;
      layoutCache = { round: -1, layout: null }; // fresh data — drop any cached scatter
      startTimer(); // whole-game clock; paused immediately by showSentencePreview
      showSentencePreview();
    }

    showLanguagePicker();

    return () => {
      disposed = true;
      if (timerInterval) {
        timerInterval.clear();
        timerInterval = null;
      }
      timerLabel = null;
      stage.removeAllChildren();
      stage.update();
    };
  }
});

export const meta = {
  id: "sentence-builder",
  cardNumber: "01",
  cardArt: "art-meadow",
  title: "Passage Reconstruction",
  description: "Snap word clouds together to rebuild the passage.",
};
