import { createZimGame } from "../createZimGame";
import { emit } from "../../scenes/sceneBus";
import { getFillInBlanks } from "../../services/FillInTheBlankFrontendService";
import { createHintPolicy } from "../shared/hintPolicy";
import { createHintButton } from "../shared/hintButton";

export const meta = {
  id: "context-cloze-quest",
  cardNumber: "03",
  cardArt: "art-night",
  title: "Context Cloze Quest",
  description: "Choose the best missing words from the context.",
};

export default createZimGame({
  id: "zim-context-cloze-quest",
  width: 1100,
  height: 800,
  color: "#f4f3ec",
  outerColor: "#ffffff",

  setup({ stage, W, H, zim }) {
    const zimFont = "Fredoka";
    let selectedWordTypes = ["noun"];
    let selectedDifficulty = "easy";

    function showMenu() {
      stage.removeAllChildren();

      // ── Dreamy purple sky background ──────────────────────────────────────
      new zim.Rectangle(W, H, "#b8a0d8").addTo(stage);

      // Sky gradient blobs — soft clouds / depth
      new zim.Circle(300, "#c9b8e8").addTo(stage).loc(-80, -100);
      new zim.Circle(250, "#c9b8e8").addTo(stage).loc(W - 100, -80);
      new zim.Circle(180, "#d4c8ee").addTo(stage).loc(W / 2 - 90, -60);
      new zim.Circle(120, "#c0aad8").addTo(stage).loc(80,  H - 60);
      new zim.Circle(100, "#c0aad8").addTo(stage).loc(W - 60, H - 80);

      // ── Main scroll card — thick dark purple border ───────────────────────
      // Outermost dark border
      new zim.Rectangle({ width: 860, height: 620, color: "#5a2d82", corner: 36 })
        .addTo(stage).loc(W / 2 - 430, 30);
      // Mid border layer (bumped corners effect)
      new zim.Rectangle({ width: 848, height: 608, color: "#7a45a8", corner: 34 })
        .addTo(stage).loc(W / 2 - 424, 36);
      // Inner card body
      new zim.Rectangle({ width: 828, height: 588, color: "#ddd0f0", corner: 30 })
        .addTo(stage).loc(W / 2 - 414, 46);

      // ── Title: "Context" white, "Cloze" gold, "Quest" white ──────────────
      // Shadow pass first
      new zim.Label({ text: "Context", size: 46, font: zimFont, color: "#7a45a8", bold: true })
        .addTo(stage).loc(222, 83);
      new zim.Label({ text: "Cloze", size: 46, font: zimFont, color: "#c89a00", bold: true })
        .addTo(stage).loc(452, 83);
      new zim.Label({ text: "Quest", size: 46, font: zimFont, color: "#7a45a8", bold: true })
        .addTo(stage).loc(622, 83);

      // Actual colored title
      new zim.Label({ text: "Context", size: 46, font: zimFont, color: "#ffffff", bold: true })
        .addTo(stage).loc(220, 80);
      new zim.Label({ text: "Cloze", size: 46, font: zimFont, color: "#f4c45a", bold: true })
        .addTo(stage).loc(450, 80);
      new zim.Label({ text: "Quest", size: 46, font: zimFont, color: "#ffffff", bold: true })
        .addTo(stage).loc(620, 80);

      // Subtitle
      new zim.Label({
        text: "Pick your word type and difficulty, then start your adventure!",
        size: 18,
        font: zimFont,
        color: "#5a3880",
        align: "center",
        valign: "center",
      }).addTo(stage).loc(W / 2, 145);

      // ── Word Type section label pill ──────────────────────────────────────
      new zim.Rectangle({ width: 155, height: 30, color: "#b89ad4", corner: 15 })
        .addTo(stage).loc(135, 172);
      new zim.Label({
        text: "☰ Word Type",
        size: 16,
        font: zimFont,
        color: "#ffffff",
        bold: true,
        align: "center",
        valign: "center",
      }).addTo(stage).loc(213, 187);

      new zim.Label({
        text: "Choose on or more",
        size: 15,
        font: zimFont,
        color: "#7a5a9a",
        align: "left",
        valign: "center",
      }).addTo(stage).loc(300, 187);

      // ── Word Type buttons — pill shape, purple filled ─────────────────────
      const wordTypeConfig = [
        { type: "noun",      icon: "🏠", badge: "🍎", label: "Noun",      x: 135 },
        { type: "verb",      icon: "⚡", badge: "🦊", label: "Verb",      x: 420 },
        { type: "adjective", icon: "🎨", badge: "⭐", label: "Adjective", x: 705 },
      ];

      wordTypeConfig.forEach(({ type, icon, badge, label, x }) => {
        const isSelected = selectedWordTypes.includes(type);
        const btnW = label === "Adjective" ? 240 : 210;
        const btn = new zim.Container().addTo(stage).loc(x, 205);

        // Shadow
        new zim.Rectangle({ width: btnW, height: 58, color: "#4a1a6e", corner: 29 })
          .addTo(btn).loc(2, 4);
        // Pill bg
        new zim.Rectangle({
          width: btnW, height: 58,
          color: isSelected ? "#7c3aed" : "#9b6bbf",
          corner: 29,
        }).addTo(btn);

        // Icon on left
        new zim.Label({ text: icon, size: 24, align: "center", valign: "center" })
          .addTo(btn).loc(28, 29);

        // Label text
        new zim.Label({
          text: label, size: 24, font: zimFont,
          color: "#ffffff", bold: true,
          align: "center", valign: "center",
        }).addTo(btn).loc(btnW / 2 + 8, 29);

        // Badge on right (apple / fox / star)
        new zim.Label({ text: badge, size: 20, align: "center", valign: "center" })
          .addTo(btn).loc(btnW - 34, 20);

        // Blue checkmark if selected
        if (isSelected) {
          new zim.Circle(14, "#3b82f6").addTo(btn).loc(btnW - 22, 10);
          new zim.Label({
            text: "✓", size: 13, font: zimFont, color: "#ffffff", bold: true,
            align: "center", valign: "center",
          }).addTo(btn).loc(btnW - 22, 10);
        }

        btn.cursor = "pointer";
        btn.on("click", () => {
          if (selectedWordTypes.includes(type)) {
            if (selectedWordTypes.length > 1) {
              selectedWordTypes = selectedWordTypes.filter((w) => w !== type);
            }
          } else {
            selectedWordTypes = [...selectedWordTypes, type];
          }
          showMenu();
        });
      });

      // ── Difficulty section label pill ─────────────────────────────────────
      new zim.Rectangle({ width: 130, height: 30, color: "#b89ad4", corner: 15 })
        .addTo(stage).loc(135, 288);
      new zim.Label({
        text: "✕ Difficulty",
        size: 16, font: zimFont, color: "#ffffff", bold: true,
        align: "center", valign: "center",
      }).addTo(stage).loc(200, 303);

      // ── Difficulty items — NO card bg, just icon + mascot + text floating ─
      const difficultyConfig = [
        {
          level: "easy",
          crystalEmoji: "🟢", mascot: "🐛",
          label: "Easy",      desc: "Perfect start",
          labelColor: "#2d8a2d", x: 160,
        },
        {
          level: "medium",
          crystalEmoji: "🟠", mascot: "🐱",
          label: "Medium",    desc: "Getting tricky",
          labelColor: "#c07000", x: 430,
        },
        {
          level: "hard",
          crystalEmoji: "🔴", mascot: "🐉",
          label: "Hard",      desc: "True challenge",
          labelColor: "#c02020", x: 700,
        },
      ];

      difficultyConfig.forEach(({ level, crystalEmoji, mascot, label, desc, labelColor, x }) => {
        const isSelected = selectedDifficulty === level;
        const btn = new zim.Container().addTo(stage).loc(x, 325);

        // Subtle selected highlight bg
        if (isSelected) {
          new zim.Rectangle({
            width: 260, height: 115,
            color: "#c8aee8",
            borderColor: "#9b6bbf",
            borderWidth: 2,
            corner: 20,
          }).addTo(btn).loc(-10, -8);
        }

        // Crystal / gem icon (large)
        new zim.Label({ text: crystalEmoji, size: 44, align: "center", valign: "center" })
          .addTo(btn).loc(30, 30);

        // Mascot next to crystal
        new zim.Label({ text: mascot, size: 40, align: "center", valign: "center" })
          .addTo(btn).loc(95, 50);

        // Label and desc to the right
        new zim.Label({
          text: label, size: 22, font: zimFont,
          color: labelColor, bold: true,
          align: "left", valign: "center",
        }).addTo(btn).loc(150, 28);

        new zim.Label({
          text: desc, size: 14, font: zimFont,
          color: "#6b4a8a",
          align: "left", valign: "center",
        }).addTo(btn).loc(150, 58);

        btn.cursor = "pointer";
        btn.on("click", () => {
          selectedDifficulty = level;
          showMenu();
        });
      });

      // ── Let's Play button — oval pill, purple with shine ──────────────────
      // Outer dark shadow pill
      new zim.Rectangle({ width: 266, height: 62, color: "#4a1a6e", corner: 31 })
        .addTo(stage).loc(W / 2 - 135, 472);

      const playButton = new zim.Button({
        width: 260,
        height: 56,
        label: "▶  Let's Play!",
        backgroundColor: "#7c3aed",
        rollBackgroundColor: "#6d28d9",
        downBackgroundColor: "#5b21b6",
        color: "#ffffff",
        corner: 28,
      });
      playButton.label.size = 26;
      playButton.label.font = zimFont;
      playButton.addTo(stage).loc(W / 2 - 130, 472);
      playButton.on("click", () => startGame());

      // Shine strip on top of button (decorative only)
      new zim.Rectangle({ width: 180, height: 14, color: "#a87af0", corner: 7 })
        .addTo(stage).loc(W / 2 - 90, 478);

      // ── Footer tip ────────────────────────────────────────────────────────
      new zim.Label({
        text: "💡 Tip: You can pick more than one word type!",
        size: 16, font: zimFont, color: "#6b4a8a",
        align: "center", valign: "center",
      }).addTo(stage).loc(W / 2, 548);

      // ── "Hooray! Fun ahead!" — multicolor tagline below card ──────────────
      // Each word a different color like the reference
      new zim.Label({ text: "Hooray!", size: 34, font: zimFont, color: "#f4c45a", bold: true })
        .addTo(stage).loc(310, 700);
      new zim.Label({ text: "Fun", size: 34, font: zimFont, color: "#60d8f0", bold: true })
        .addTo(stage).loc(500, 700);
      new zim.Label({ text: "ahead!", size: 34, font: zimFont, color: "#f4c45a", bold: true })
        .addTo(stage).loc(570, 700);

      // Small star emoji after tagline
      new zim.Label({ text: "✨", size: 28 }).addTo(stage).loc(730, 698);

      stage.update();
    }

    function startGame() {
      stage.removeAllChildren();

      // ── Same dreamy purple sky background as menu ─────────────────────────
      new zim.Rectangle(W, H, "#b8a0d8").addTo(stage);
      new zim.Circle(300, "#c9b8e8").addTo(stage).loc(-80, -100);
      new zim.Circle(250, "#c9b8e8").addTo(stage).loc(W - 100, -80);
      new zim.Circle(180, "#d4c8ee").addTo(stage).loc(W / 2 - 90, -60);
      new zim.Circle(120, "#c0aad8").addTo(stage).loc(80, H - 60);
      new zim.Circle(100, "#c0aad8").addTo(stage).loc(W - 60, H - 80);

      // ── Main scroll card — same 3-layer border as menu ───────────────────
      new zim.Rectangle({ width: 1060, height: 750, color: "#5a2d82", corner: 36 })
        .addTo(stage).loc(W / 2 - 530, 18);
      new zim.Rectangle({ width: 1048, height: 738, color: "#7a45a8", corner: 34 })
        .addTo(stage).loc(W / 2 - 524, 24);
      new zim.Rectangle({ width: 1028, height: 718, color: "#ddd0f0", corner: 30 })
        .addTo(stage).loc(W / 2 - 514, 34);

      // ── Purple header bar inside card ─────────────────────────────────────
      new zim.Rectangle({ width: 1028, height: 115, color: "#5a2d82", corner: [30, 30, 0, 0] })
        .addTo(stage).loc(W / 2 - 514, 34);

      // ── Gold title — same style as menu ──────────────────────────────────
      // Shadow
      new zim.Label({ text: "Context Cloze Quest", size: 38, font: zimFont, color: "#4a1a6e", bold: true, align: "center", valign: "center" })
        .addTo(stage).loc(W / 2 + 2, 77);
      // Gold
      new zim.Label({ text: "Context Cloze Quest", size: 38, font: zimFont, color: "#f4c45a", bold: true, align: "center", valign: "center" })
        .addTo(stage).loc(W / 2, 75);

      // ── Score pill ────────────────────────────────────────────────────────
      new zim.Rectangle({ width: 280, height: 38, color: "#7c3aed", corner: 19 })
        .addTo(stage).loc(W / 2 - 140, 100);
      const scoreLabel = new zim.Label({
        text: "Answer Score: 0/0 = 0",
        size: 19, font: zimFont, color: "#ffffff",
        bold: true, align: "center", valign: "center",
      }).addTo(stage).loc(W / 2, 119);

      // ── Timer pill (top right) ────────────────────────────────────────────
      new zim.Rectangle({ width: 158, height: 52, color: "#4a1a6e", corner: 26 })
        .addTo(stage).loc(W / 2 + 360, 42);
      new zim.Rectangle({ width: 152, height: 48, color: "#7c3aed", corner: 24 })
        .addTo(stage).loc(W / 2 + 363, 44);

      const timeLimits = { easy: 60, medium: 90, hard: 120 };
      const difficultyMultipliers = { easy: 1, medium: 1.5, hard: 2 };
      let remainingTime = timeLimits[selectedDifficulty];
      let timerInterval;

      const timerLabel = new zim.Label({
        text: `⏱ ${remainingTime}s`,
        size: 20, font: zimFont, color: "#f4c45a",
        bold: true, align: "center", valign: "center",
      }).addTo(stage).loc(W / 2 + 439, 57);

      const timerScoreLabel = new zim.Label({
        text: `Timer Score: ${remainingTime * 5}`,
        size: 13, font: zimFont, color: "#d8ccff",
        align: "center", valign: "center",
      }).addTo(stage).loc(W / 2 + 439, 78);

      function startTimer() {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
          remainingTime--;
          timerLabel.text = `⏱ ${remainingTime}s`;
          timerScoreLabel.text = `Timer Score: ${remainingTime * 5}`;
          if (remainingTime <= 0) {
            clearInterval(timerInterval);
            feedbackBar.color = "#ffe1e1";
            feedbackLabel.text = "⏰ Time is up!";
            feedbackLabel.color = "#a61b1b";
            emit("wrong");
          }
          stage.update();
        }, 1000);
      }

      // ── Menu button (top left inside card) ───────────────────────────────
      const menuButton = new zim.Button({
        width: 150, height: 44,
        label: "← Menu",
        backgroundColor: "#ffffff",
        rollBackgroundColor: "#ede9ff",
        color: "#5a2d82",
        corner: 22,
      });
      menuButton.label.size = 19;
      menuButton.label.font = zimFont;
      menuButton.addTo(stage).loc(W / 2 - 500, 52);
      menuButton.on("click", () => { clearInterval(timerInterval); showMenu(); });

      // ── Paragraph card ────────────────────────────────────────────────────
      new zim.Rectangle({ width: 990, height: 270, color: "#ffffff", corner: 20 })
        .addTo(stage).loc(W / 2 - 495, 155);
      // Subtle inner top border strip
      new zim.Rectangle({ width: 990, height: 6, color: "#c9a8e8", corner: [20, 20, 0, 0] })
        .addTo(stage).loc(W / 2 - 495, 155);

      const blanks = [];
      const wordButtons = [];

      // --- HINT SYSTEM ---
      const hintPolicy = createHintPolicy({ maxPerRound: 2, penalty: 25 });
      const hintedKeys = new Set();
      let hintButton = null;
      // -------------------

      function makeText(text, x, y) {
        return new zim.Label({
          text, size: 20, font: zimFont,
          color: "#3d1f8a", align: "left", valign: "center",
        }).addTo(stage).loc(x, y);
      }

      function makeBlank(x, y, index) {
        const blank = new zim.Container().addTo(stage).loc(x, y);
        blank.index = index;
        new zim.Rectangle({
          width: 95, height: 28,
          color: "#ede9ff",
          borderColor: "#7c3aed",
          borderWidth: 3, corner: 8,
          dashed: [8, 5],
        }).addTo(blank);
        new zim.Label({
          text: "______", size: 18, font: zimFont,
          color: "#9b6bbf", align: "center", valign: "center", bold: true,
        }).addTo(blank).loc(47.5, 14);
        blanks.push(blank);
        return blank;
      }

      let words = ["girl", "garden", "milk", "animals", "day"];
      let correctAnswers = ["girl", "garden", "milk"];

      // ── Available Words label ─────────────────────────────────────────────
      new zim.Rectangle({ width: 220, height: 32, color: "#7c3aed", corner: 16 })
        .addTo(stage).loc(W / 2 - 110, 432);
      new zim.Label({
        text: "✦ AVAILABLE WORDS ✦",
        size: 17, font: zimFont, color: "#ffffff",
        bold: true, align: "center", valign: "center",
      }).addTo(stage).loc(W / 2, 448);

      const wordTypeMap = { noun: "NOUN", verb: "VERB", adjective: "ADJ" };

      getFillInBlanks({
        difficulty: selectedDifficulty,
        wordTypes: selectedWordTypes.map((type) => wordTypeMap[type]),
      }).then((result) => {
        const gameData = result.data;
        words = gameData.wordBank;
        correctAnswers = gameData.answers;

        function drawParagraphWithInlineBlanks(paragraph) {
          const parts = paragraph.split("_____");
          let x = 75;
          let y = 178;
          const maxX = 1010;
          const lineHeight = 32;
          let blankIndex = 0;

          parts.forEach((part, partIndex) => {
            part.split(" ").forEach((word) => {
              if (!word) return;
              const wordWidth = word.length * 13;
              if (x + wordWidth > maxX) { x = 75; y += lineHeight; }
              makeText(word, x, y);
              x += wordWidth + 10;
            });
            if (partIndex < parts.length - 1) {
              if (x + 140 > maxX) { x = 75; y += lineHeight; }
              makeBlank(x, y - 16, blankIndex);
              x += 105;
              blankIndex++;
            }
          });
        }
        drawParagraphWithInlineBlanks(gameData.paragraph);

        // ── Word buttons ──────────────────────────────────────────────────
        const wordsPerRow = 6;
        const spacingX = 162;
        const startX = 75;
        const startY = 472;

        words.forEach((word, i) => {
          const col = i % wordsPerRow;
          const row = Math.floor(i / wordsPerRow);
          const currentX = startX + col * spacingX;
          const currentY = startY + row * 46;

          // Shadow
          new zim.Rectangle({ width: 148, height: 40, color: "#4a1a6e", corner: 20 })
            .addTo(stage).loc(currentX + 2, currentY + 3);

          const wordButton = new zim.Button({
            width: 148, height: 40,
            label: word,
            backgroundColor: "#7c3aed",
            rollBackgroundColor: "#6d28d9",
            downBackgroundColor: "#5b21b6",
            corner: 20,
          });
          wordButton.label.size = 20;
          wordButton.label.font = zimFont;
          wordButton.addTo(stage).loc(currentX, currentY);
          wordButton.homeX = currentX;
          wordButton.homeY = currentY;
          wordButtons.push(wordButton);

          wordButton.word = word;
          wordButton.drag();
          wordButton.on("pressup", () => {
            let matchedBlank = null;
            blanks.forEach((blank) => {
              const centerX = wordButton.x + 60;
              const centerY = wordButton.y + 25;
              if (centerX > blank.x && centerX < blank.x + 95 &&
                  centerY > blank.y && centerY < blank.y + 28) {
                matchedBlank = blank;
              }
            });
            if (matchedBlank) {
              if (matchedBlank.filledWord) {
                const existing = wordButtons.find((b) => b.word === matchedBlank.filledWord);
                if (existing) {
                  existing.blankIndex = undefined;
                  existing.animate({ props: { x: existing.homeX, y: existing.homeY, scaleX: 1, scaleY: 1 }, time: 0.25 });
                }
              }
              wordButton.animate({ props: { x: matchedBlank.x, y: matchedBlank.y, scaleX: 95 / wordButton.width, scaleY: 28 / wordButton.height }, time: 0.2 });
              if (wordButton.blankIndex !== undefined) blanks[wordButton.blankIndex].filledWord = undefined;
              wordButton.blankIndex = matchedBlank.index;
              matchedBlank.filledWord = wordButton.word;
            } else {
              wordButton.blankIndex = undefined;
              wordButton.animate({ props: { x: wordButton.homeX, y: wordButton.homeY, scaleX: 1, scaleY: 1 }, time: 0.25 });
            }
            stage.update();
          });
        });
        stage.update();

        // ── Feedback bar ──────────────────────────────────────────────────
        const feedbackBar = new zim.Rectangle({ width: 1028, height: 52, color: "#ddd0f0", corner: [0, 0, 30, 30] })
          .addTo(stage).loc(W / 2 - 514, 716);
        const feedbackLabel = new zim.Label({
          text: "", size: 20, font: zimFont,
          color: "#3d1f8a", bold: true,
          align: "center", valign: "center",
        }).addTo(stage).loc(W / 2, 742);

        // --- HINT: applyHint function ---
        function applyHint() {
          if (!hintPolicy.canUse()) return;
          let target = -1;
          for (let i = 0; i < correctAnswers.length; i++) {
            const solved = wordButtons.some((b) => b.blankIndex === i && b.word === correctAnswers[i]);
            if (!solved && !hintedKeys.has(i)) { target = i; break; }
          }
          if (target === -1) return;
          const word = correctAnswers[target];
          hintedKeys.add(target);
          hintPolicy.use();
          hintButton.refresh();
          emit("hint", { text: `Blank ${target + 1} starts with "${word[0].toUpperCase()}".` });
        }
        // --------------------------------

        startTimer();

        // ── Bottom button row ─────────────────────────────────────────────
        // Reset — red pill with shadow
        new zim.Rectangle({ width: 192, height: 52, color: "#7a0000", corner: 26 })
          .addTo(stage).loc(W / 2 - 390, 655);
        const resetButton = new zim.Button({
          width: 190, height: 50,
          label: "↻ Reset Game",
          backgroundColor: "#e53935",
          rollBackgroundColor: "#c62828",
          corner: 25,
        });
        resetButton.label.size = 19;
        resetButton.label.font = zimFont;
        resetButton.addTo(stage).loc(W / 2 - 389, 653);
        resetButton.on("click", () => { clearInterval(timerInterval); startGame(); });

        // Hint button
        hintButton = createHintButton({
          stage, zim,
          x: W / 2 - 66,
          y: 653,
          policy: hintPolicy,
          onUse: applyHint,
          palette: { bg: "#f4c45a", color: "#3d1f8a" },
        });

        // Submit — green pill with shadow
        new zim.Rectangle({ width: 242, height: 52, color: "#0a5e20", corner: 26 })
          .addTo(stage).loc(W / 2 + 148, 655);
        const checkButton = new zim.Button({
          width: 240, height: 50,
          label: "✓ Submit Answer",
          backgroundColor: "#18b853",
          rollBackgroundColor: "#12a448",
          corner: 25,
        });
        checkButton.label.size = 19;
        checkButton.label.font = zimFont;
        checkButton.addTo(stage).loc(W / 2 + 149, 653);
        checkButton.on("click", () => {
          let correctCount = 0;
          let filledCount = 0;
          const totalQuestions = correctAnswers.length;

          blanks.forEach((blank) => {
            if (blank.filledWord) filledCount++;
            if (blank.filledWord === correctAnswers[blank.index]) correctCount++;
          });

          const answerScore = correctCount * 100;
          const difficultyScore = answerScore * difficultyMultipliers[selectedDifficulty];
          const timeBonus = remainingTime * 5;
          const finalScore = Math.round(difficultyScore + timeBonus);
          scoreLabel.text = `Answer Score: ${correctCount}/${totalQuestions} = ${answerScore}`;

          if (filledCount < totalQuestions) {
            feedbackBar.color = "#fff3cd";
            feedbackLabel.text = "⚠️ Fill in all blanks before submitting!";
            feedbackLabel.color = "#856404";
          } else if (correctCount === totalQuestions) {
            feedbackBar.color = "#d7f3dc";
            feedbackLabel.text = `🎉 Excellent! Final Score: ${finalScore}`;
            clearInterval(timerInterval);
            feedbackLabel.color = "#0b5c24";
            emit("complete");
          } else {
            clearInterval(timerInterval);
            feedbackBar.color = "#ffe1e1";
            feedbackLabel.text = `❌ You got ${correctCount}/${totalQuestions}. Final Score: ${finalScore}`;
            feedbackLabel.color = "#a61b1b";
            emit("wrong");
          }
          stage.update();
        });

        stage.update();
      });
    }

    showMenu();
  },
});
