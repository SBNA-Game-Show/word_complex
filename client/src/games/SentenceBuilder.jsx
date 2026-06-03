import { createZimGame } from "./createZimGame";

const rounds = [
  {
    sentence: "The brave prince entered the dark forest alone.",
    chunks: ["entered", "alone", "The brave prince", "the dark forest"],
    answer: ["The brave prince", "entered", "the dark forest", "alone"]
  },
  {
    sentence: "A curious owl guarded the silver gate quietly.",
    chunks: ["quietly", "the silver gate", "A curious owl", "guarded"],
    answer: ["A curious owl", "guarded", "the silver gate", "quietly"]
  },
  {
    sentence: "Tiny lanterns glowed beside the castle stairs.",
    chunks: ["beside", "Tiny lanterns", "the castle stairs", "glowed"],
    answer: ["Tiny lanterns", "glowed", "beside", "the castle stairs"]
  }
];

const zimFont = "Fredoka";

export default createZimGame({
  id: "zim-sentence-game",
  width: 1100,
  height: 720,
  color: "#fff3d3",
  outerColor: "#151019",
  setup({ frame, stage, W, H, zim }) {
    let roundIndex = 0;
    let score = 0;
    let attemptsLeft = 3;
    let checks = 0;
    let correctChecks = 0;
    let feedbackActive = false; // blocks checkAnswer while a feedback popup is showing
    const tiles = [];
    const zones = [];
    const slotWidth = 200;
    const slotHeight = 160;
    const cloudWidth = 190;

    function addLabel(text, size, color, x, y, align = "left", container = stage) {
      const label = new zim.Label(text, size, zimFont, color);
      label.textAlign = align;
      label.addTo(container);
      label.loc(x, y);
      return label;
    }

    function makeBackground() {
      new zim.Rectangle(W, H, "#ffffff").addTo(stage);
    }

    function makeStatus(message) {
      const hud = new zim.Container().addTo(stage);
      const round = new zim.Label(`Round ${roundIndex + 1}/${rounds.length}`, 18, zimFont, "#7d8a93").addTo(hud).loc(0, 0);
      const scoreLabel = new zim.Label(`Score ${score}`, 18, zimFont, "#7d8a93").addTo(hud).loc(round.width + 16, 0);
      new zim.Label(`Attempts ${attemptsLeft}`, 18, zimFont, "#7d8a93").addTo(hud).loc(round.width + scoreLabel.width + 32, 0);
      hud.setBounds(0, 0, round.width + scoreLabel.width + hud.getChildAt(2).width + 32, 24);
      hud.loc((W - hud.width) / 2, 34);
      new zim.Label({
        text: message,
        size: 18,
        font: zimFont,
        color: "#0d3d4a",
        align: "center",
        valign: "center"
      }).addTo(stage).loc(W / 2, 651);
    }

    function makeBottomControls() {
      const controls = new zim.Container().addTo(stage);
      const checkLabel = new zim.Label("Check", 18, zimFont, "#073b49");
      checkLabel.fontOptions = "bold";
      const checkButton = new zim.Button({
        width: 132,
        height: 42,
        label: checkLabel,
        backgroundColor: "#ffffff",
        rollBackgroundColor: "#eff8ff",
        color: "#073b49",
        borderColor: "#86c7ff",
        borderWidth: 2,
        corner: 20
      }).addTo(controls).loc(0, 0);
      checkButton.on("click", checkAnswer);
      const resetLabel = new zim.Label("Reset", 18, zimFont, "#073b49");
      resetLabel.fontOptions = "bold";
      const resetButton = new zim.Button({
        width: 132,
        height: 42,
        label: resetLabel,
        backgroundColor: "#ffffff",
        rollBackgroundColor: "#eff8ff",
        color: "#073b49",
        borderColor: "#86c7ff",
        borderWidth: 2,
        corner: 20
      }).addTo(controls).loc(148, 0);
      resetButton.on("click", () => renderRound());
      controls.setBounds(0, 0, 280, 42);
      controls.loc((W - 280) / 2, 674);
    }

    function makeTile(text, x, y) {
      const tileWidth = cloudWidth;
      const tile = new zim.Container().loc(x, y).addTo(stage);
      tile.homeX = x;
      tile.homeY = y;
      tile.chunk = text;
      tile.zoneIndex = null;
      tile.widthValue = tileWidth;
      tile.setBounds(0, 0, tileWidth, 118);
      tile.mouseChildren = false;

      const shadow = makeCloudShape("#d8f0ff", "#d8f0ff", 0, tileWidth).addTo(tile).loc(0, 8);
      shadow.alpha = 0.95;
      makeCloudShape("#ffffff", "#86c7ff", 3, tileWidth).addTo(tile);

      const labelSize = text.length > 15 ? 18 : text.length > 12 ? 19 : 21;
      const label = new zim.Label({
        text,
        size: labelSize,
        font: zimFont,
        color: "#073b49",
        align: "center",
        valign: "center",
        bold: true
      });
      label.addTo(tile).loc(tileWidth / 2, 61);
      tile.cursor = "pointer";
      tile.drag();
      tile.on("mousedown", () => tile.top());
      tile.on("pressup", () => snapTile(tile));
      tiles.push(tile);
    }

    function makeZone(index, x, y) {
      const zone = new zim.Container().loc(x, y).addTo(stage);
      zone.tile = null;
      zone.widthValue = slotWidth;
      zone.heightValue = slotHeight;

      const box = new zim.Shape().addTo(zone);
      box.s("#9aa8b1").ss(2).sd([6, 5]).rr(0, 0, slotWidth, slotHeight, 12);
      box.setBounds(0, 0, slotWidth, slotHeight);

      new zim.Rectangle(slotWidth - 28, 4, "#26343b").addTo(zone).loc(14, 152);
      new zim.Rectangle(slotWidth - 28, 5, "rgba(38,52,59,.14)").addTo(zone).loc(14, 156);

      new zim.Label({
        text: String(index + 1),
        size: 42,
        font: zimFont,
        color: "#7a858d",
        align: "center",
        valign: "center",
        bold: true
      }).addTo(zone).loc(slotWidth / 2, slotHeight / 2);
      zones.push(zone);
    }

    function makeCloudShape(fill, stroke, strokeWidth, width = 180) {
      const cloud = new zim.Shape();
      const scale = width / 180;
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
      cloud.scaleX = scale;
      cloud.setBounds(0, 0, width, 118);
      return cloud;
    }

    function snapTile(tile) {
      let matchedZone = null;
      zones.forEach((zone) => {
        const centerX = tile.x + tile.widthValue / 2;
        const centerY = tile.y + 58;
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
            y: matchedZone.y + 34
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

    // Shows the full sentence for ~1.5s with a progress bar, then calls renderRound.
    // Mirrors the landing-screen behaviour from the proof of concept.
    function showSentencePreview() {
      stage.removeAllChildren();

      // Warm background matching the game palette
      new zim.Rectangle(W, H, "#fff7e6").addTo(stage);

      // HUD so the player can see which round they're on
      makeStatus("Memorise the sentence — then arrange the clouds!");

      // Central panel
      const panelW = 740;
      const panelH = 180;
      const panelX = (W - panelW) / 2;
      const panelY = H / 2 - panelH / 2 - 50;

      new zim.Rectangle(panelW, panelH, "rgba(255,255,255,0.9)", "rgba(255,255,255,0.95)", 3, 28)
        .addTo(stage).loc(panelX, panelY);

      // Eyebrow label
      new zim.Label({
        text: "REMEMBER THIS SENTENCE",
        size: 14,
        font: zimFont,
        color: "#4859a0",
        align: "center",
        valign: "center"
      }).addTo(stage).loc(W / 2, panelY + 32);

      // The sentence — large and clear
      new zim.Label({
        text: rounds[roundIndex].sentence,
        size: 30,
        font: zimFont,
        color: "#1d2b66",
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

      new zim.Rectangle(barW, barH, "#e8ddd0", "#e8ddd0", 0, barH / 2)
        .addTo(stage).loc(barX, barY);

      // Fill bar — starts scaled to near-zero, animates to full width over 1.5s
      const barFill = new zim.Rectangle(barW, barH, "#ff9a3c", "#ff9a3c", 0, barH / 2)
        .addTo(stage).loc(barX, barY);
      barFill.scaleX = 0.001;

      stage.update();

      barFill.animate({
        props: { scaleX: 1 },
        time: 1.5,
        ease: "linear",
        call: () => renderRound()
      });
    }

    function renderRound(message = "Drag each phrase into the numbered story slots.") {
      feedbackActive = false;
      stage.removeAllChildren();
      tiles.length = 0;
      zones.length = 0;
      makeBackground();
      makeStatus(message);

      const current = rounds[roundIndex];
      const zoneStart = 100;
      const tilePositions = [72, 325, 578, 831];
      current.answer.forEach((_, index) => makeZone(index, zoneStart + index * 230, 88));
      current.chunks.forEach((chunk, index) => makeTile(chunk, tilePositions[index], 350));
      makeBottomControls();
      stage.update();
    }

    function checkAnswer() {
      if (feedbackActive) return;

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
        attemptsLeft -= 1;
        if (attemptsLeft <= 0) showRoundOver();
        else showWrong();
      }
    }

    function showWrong() {
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

      // Hint line
      new zim.Label({
        text: "Check the order — who acts, then what they do.",
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
      const pane = new zim.Rectangle(570, 160, "#fff8df", "#76a05d", 5, 24).loc(265, 356).addTo(stage);
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
        color: "#4a3924",
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
        backgroundColor: "#3f7e55",
        rollBackgroundColor: "#4d9465",
        downBackgroundColor: "#36714a",
        color: "#ffffff",
        corner: 20
      }).addTo(success).loc(-75, 74);
      next.on("click", () => {
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
      addLabel("No attempts left. The story magic resets this round.", 23, "#8a3a2d", W / 2, 360, "center");
      const retryLabel = new zim.Label("Try Again", 18, zimFont, "#ffffff");
      retryLabel.fontOptions = "bold";
      const retry = new zim.Button({
        width: 150,
        height: 52,
        label: retryLabel,
        backgroundColor: "#8a5a3d",
        rollBackgroundColor: "#986748",
        color: "#ffffff",
        corner: 20
      }).loc(475, 398).addTo(stage);
      retry.on("click", () => {
        attemptsLeft = 3;
        showSentencePreview();
      });
      stage.update();
    }

    function showComplete() {
      const accuracy = checks ? Math.round((correctChecks / checks) * 100) : 100;
      stage.removeAllChildren();
      makeBackground();
      new zim.Rectangle(680, 360, "rgba(255,255,255,.76)", "#c98c52", 5, 28).loc(210, 166).addTo(stage);
      addLabel("Quest Complete", 48, "#56351f", W / 2, 226, "center");
      addLabel(`Final score: ${score}`, 30, "#3f2a1a", W / 2, 306, "center");
      addLabel(`Accuracy: ${accuracy}%`, 30, "#3f2a1a", W / 2, 354, "center");
      addLabel("You reconstructed all three story sentences.", 24, "#684527", W / 2, 414, "center");
      const againLabel = new zim.Label("Play Again", 18, zimFont, "#ffffff");
      againLabel.fontOptions = "bold";
      const again = new zim.Button({
        width: 190,
        height: 56,
        label: againLabel,
        backgroundColor: "#7f4f37",
        rollBackgroundColor: "#946043",
        color: "#ffffff",
        corner: 20
      }).loc(455, 452).addTo(stage);
      again.on("click", () => {
        roundIndex = 0;
        score = 0;
        attemptsLeft = 3;
        checks = 0;
        correctChecks = 0;
        showSentencePreview();
      });
      stage.update();
    }

    // Start with the sentence preview so the player knows what to rebuild
    showSentencePreview();
  }
});

export const meta = {
  id: "sentence-builder",
  title: "Passage Reconstruction",
  description: "Snap word clouds together to rebuild the passage.",
  status: "ready"
};
