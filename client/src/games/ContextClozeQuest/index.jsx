import { createZimGame } from "../createZimGame";
import { emit } from "../../scenes/sceneBus";
import { getFillInBlanks } from "../../services/FillInTheBlankFrontendService";
import { createHintPolicy } from "../shared/hintPolicy";
import { createHintButton } from "../shared/hintButton";
import { getSelectedStoryId } from "../../storyPicker/activeStory";
import { submitContextClozeQuestScore } from "../../services/contextClozeQuestScoreApi";

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
  color: "#a989d6",
  outerColor: "#eadff7",

  setup({ stage, W, H, zim, authUser }) {
    const zimFont = "Fredoka";
    const sanskritFont = "Nirmala UI";

    let disposed = false;
    let gameRunId = 0;
    let timerInterval = null;
    let selectedWordTypes = ["noun"];
    let selectedDifficulty = "easy";
    let selectedLanguage = "english";

    const getContentFont = () =>
      selectedLanguage === "sanskrit" ? sanskritFont : zimFont;

    function clearGameTimer() {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    }

    function showMenu() {
      gameRunId += 1;
      clearGameTimer();
      if (disposed) return;
      stage.removeAllChildren();

      new zim.Rectangle(W, H, "#a989d6").addTo(stage);
      new zim.Circle(230, "#c2ace3").addTo(stage).loc(-60, -65);
      new zim.Circle(205, "#b99cdb").addTo(stage).loc(W - 105, -45);
      new zim.Circle(155, "#c5afe1").addTo(stage).loc(45, H - 65);
      new zim.Circle(145, "#c5afe1").addTo(stage).loc(W - 75, H - 70);

      [
        [95, 72], [205, 115], [885, 75], [1010, 185],
        [74, 405], [1020, 445], [930, 690],
      ].forEach(([x, y]) => {
        new zim.Label({ text: "✦", size: 18, font: zimFont, color: "#f6efff" })
          .addTo(stage).loc(x, y);
      });

      new zim.Rectangle({ width: 1010, height: 720, color: "#4d1b72", corner: 42 })
        .addTo(stage).loc(45, 25);
      new zim.Rectangle({ width: 996, height: 706, color: "#7b36ad", corner: 38 })
        .addTo(stage).loc(52, 32);
      new zim.Rectangle({
        width: 964,
        height: 674,
        color: "#eadff7",
        borderColor: "#d5bdea",
        borderWidth: 2,
        corner: 32,
      }).addTo(stage).loc(68, 48);

      const addTitleWord = (text, x, color) => {
        new zim.Label({
          text,
          size: 54,
          font: zimFont,
          color: "#5a2188",
          bold: true,
          align: "center",
          valign: "center",
        }).addTo(stage).loc(x + 2, 104);
        new zim.Label({
          text,
          size: 54,
          font: zimFont,
          color,
          bold: true,
          align: "center",
          valign: "center",
        }).addTo(stage).loc(x, 100);
      };

      new zim.Label({ text: "✦", size: 30, font: zimFont, color: "#f4b928" })
        .addTo(stage).loc(170, 98);
      addTitleWord("Context", 350, "#ffffff");
      addTitleWord("Cloze", 570, "#f7bd2b");
      addTitleWord("Quest", 770, "#ffffff");
      new zim.Label({ text: "✦", size: 30, font: zimFont, color: "#f4b928" })
        .addTo(stage).loc(925, 98);

      new zim.Label({
        text: "Pick your language, word type and difficulty, then start your adventure!",
        size: 18,
        font: zimFont,
        color: "#5b2c85",
        align: "center",
        valign: "center",
      }).addTo(stage).loc(W / 2, 151);

      const makeSectionPill = (text, width, x, y) => {
        new zim.Rectangle({ width, height: 32, color: "#7d3fa7", corner: 16 })
          .addTo(stage).loc(x, y);
        new zim.Label({
          text,
          size: 17,
          font: zimFont,
          color: "#ffffff",
          bold: true,
          align: "center",
          valign: "center",
        }).addTo(stage).loc(x + width / 2, y + 16);
      };

      makeSectionPill("◉ Language", 145, 115, 174);

      const makeLanguageButton = (language, label, x) => {
        const isSelected = selectedLanguage === language;
        const buttonLabel = new zim.Label({
          text: `${isSelected ? "✓ " : ""}${label}`,
          size: language === "sanskrit" ? 19 : 18,
          font: language === "sanskrit" ? sanskritFont : zimFont,
          color: "#ffffff",
          bold: true,
          align: "center",
          valign: "center",
        });
        const button = new zim.Button({
          width: 180,
          height: 40,
          label: buttonLabel,
          backgroundColor: isSelected ? "#6d28d9" : "#a36bc0",
          rollBackgroundColor: "#7c3aed",
          downBackgroundColor: "#5b21b6",
          corner: 20,
        }).addTo(stage).loc(x, 170);

        button.on("click", () => {
          selectedLanguage = language;
          showMenu();
        });
      };

      makeLanguageButton("english", "English", 300);
      makeLanguageButton("sanskrit", "संस्कृतम्", 500);

      makeSectionPill("☰ Word Type", 145, 115, 222);
      new zim.Label({
        text: "Choose one or more",
        size: 16,
        font: zimFont,
        color: "#6b3c8f",
        align: "left",
        valign: "center",
      }).addTo(stage).loc(280, 238);

      const wordTypeConfig = [
        { type: "noun", icon: "🏠", badge: "", label: "Noun", x: 115 },
        { type: "verb", icon: "⚡", badge: "", label: "Verb", x: 415 },
        { type: "adjective", icon: "🎨", badge: "", label: "Adjective", x: 715 },
      ];

      wordTypeConfig.forEach(({ type, icon, badge, label, x }) => {
        const isSelected = selectedWordTypes.includes(type);
        const btn = new zim.Container(270, 90).addTo(stage).loc(x, 260);

        new zim.Rectangle({ width: 270, height: 90, color: "#4d1b72", corner: 24 })
          .addTo(btn).loc(3, 6);
        new zim.Rectangle({
          width: 270,
          height: 90,
          color: isSelected ? "#6d28d9" : "#a864bf",
          borderColor: "#5a217e",
          borderWidth: 2,
          corner: 24,
        }).addTo(btn);

        new zim.Circle(35, isSelected ? "#8b46e8" : "#b87acc")
          .addTo(btn).loc(52, 45);
        new zim.Label({ text: icon, size: 42, align: "center", valign: "center" })
          .addTo(btn).loc(52, 45);
        new zim.Label({
          text: label,
          size: 26,
          font: zimFont,
          color: "#ffffff",
          bold: true,
          align: "center",
          valign: "center",
        }).addTo(btn).loc(165, 47);

        if (badge) {
          new zim.Label({ text: badge, size: 24, align: "center", valign: "center" })
            .addTo(btn).loc(240, 45);
        }

        if (isSelected) {
          new zim.Circle(18, "#25b8e6").addTo(btn).loc(240, 18);
          new zim.Label({
            text: "✓",
            size: 18,
            font: zimFont,
            color: "#ffffff",
            bold: true,
            align: "center",
            valign: "center",
          }).addTo(btn).loc(240, 18);
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

      new zim.Rectangle({ width: 405, height: 2, color: "#cfb5e3" })
        .addTo(stage).loc(115, 372);
      new zim.Label({ text: "✦", size: 22, font: zimFont, color: "#9860bd" })
        .addTo(stage).loc(W / 2, 373);
      new zim.Rectangle({ width: 405, height: 2, color: "#cfb5e3" })
        .addTo(stage).loc(580, 372);

      makeSectionPill("⚔ Difficulty", 145, 115, 387);

      const difficultyConfig = [
        {
          level: "easy", mascot: "🐛", label: "Easy", desc: "Perfect start",
          labelColor: "#2d9a32", iconColor: "#61d34c", x: 115,
        },
        {
          level: "medium", mascot: "🐱", label: "Medium", desc: "Getting tricky",
          labelColor: "#e57b00", iconColor: "#ff941f", x: 415,
        },
        {
          level: "hard", mascot: "🐉", label: "Hard", desc: "True challenge",
          labelColor: "#d32d2d", iconColor: "#ef3d4e", x: 715,
        },
      ];

      difficultyConfig.forEach(({ level, mascot, label, desc, labelColor, iconColor, x }) => {
        const isSelected = selectedDifficulty === level;
        const btn = new zim.Container(270, 105).addTo(stage).loc(x, 423);

        new zim.Rectangle({ width: 270, height: 105, color: "#b78ac9", corner: 22 })
          .addTo(btn).loc(2, 5);
        new zim.Rectangle({
          width: 270,
          height: 105,
          color: "#f1e7f8",
          borderColor: isSelected ? "#55c938" : "#b88bce",
          borderWidth: isSelected ? 3 : 2,
          corner: 22,
        }).addTo(btn);

        new zim.Circle(39, iconColor).addTo(btn).loc(55, 52);
        new zim.Label({ text: mascot, size: 46, align: "center", valign: "center" })
          .addTo(btn).loc(55, 52);
        new zim.Label({
          text: label,
          size: 24,
          font: zimFont,
          color: labelColor,
          bold: true,
          align: "left",
          valign: "center",
        }).addTo(btn).loc(115, 40);
        new zim.Label({
          text: desc,
          size: 15,
          font: zimFont,
          color: "#6b4a8a",
          align: "left",
          valign: "center",
        }).addTo(btn).loc(115, 71);

        btn.cursor = "pointer";
        btn.on("click", () => {
          selectedDifficulty = level;
          showMenu();
        });
      });

      new zim.Rectangle({ width: 376, height: 66, color: "#4a176f", corner: 33 })
        .addTo(stage).loc(W / 2 - 188, 565);

      const playButton = new zim.Button({
        width: 370,
        height: 60,
        label: "▶   Let's Play!",
        backgroundColor: "#7c3aed",
        rollBackgroundColor: "#6d28d9",
        downBackgroundColor: "#5b21b6",
        color: "#ffffff",
        corner: 30,
      });
      playButton.label.size = 30;
      playButton.label.font = zimFont;
      playButton.addTo(stage).loc(W / 2 - 185, 565);
      playButton.on("click", () => startGame());

      new zim.Rectangle({ width: 235, height: 10, color: "#9f6af1", corner: 5 })
        .addTo(stage).loc(W / 2 - 118, 572);

      new zim.Label({
        text: "💡 Tip: You can pick more than one word type!",
        size: 17,
        font: zimFont,
        color: "#64358c",
        align: "center",
        valign: "center",
      }).addTo(stage).loc(W / 2, 654);

      stage.update();
    }

    function startGame() {
      if (disposed) return;
      const runId = ++gameRunId;
      clearGameTimer();
      stage.removeAllChildren();

      const gamePalette = {
        background: "#a989d6",
        header: "#5a2188",
        surface: "#eadff7",
        panel: "#f8f2fc",
        panelBorder: "#d5bdea",
        band: "#e2d0f0",
        controls: "#d7bee9",
        primary: "#7c3aed",
        primaryRoll: "#6d28d9",
        primaryDown: "#5b21b6",
        secondary: "#a36bc0",
        ink: "#3f2854",
        muted: "#806491",
        gold: "#f4b928",
      };

      new zim.Rectangle(W, H, gamePalette.background).addTo(stage);

      new zim.Rectangle(W, 140, gamePalette.header).addTo(stage).loc(0, 0);

      new zim.Label({
        text: "Context Cloze Quest",
        size: 42,
        font: zimFont,
        color: "#ffffff",
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(stage)
        .loc(W / 2, 60);

      const scoreBackground = new zim.Rectangle({
        width: 300,
        height: 45,
        color: gamePalette.secondary,
        corner: 22,
      })
        .addTo(stage)
        .loc(W / 2 - 150, 85);

      const scoreLabel = new zim.Label({
        text: "Answer Score: 0/0 = 0",
        size: 22,
        font: zimFont,
        color: "#ffffff",
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(stage)
        .loc(W / 2, 108);

      const blanks = [];
      const wordButtons = [];

      // --- HINT SYSTEM ---
      const maxHintsPerRound = 2;
      const hintPolicy = createHintPolicy({ maxPerRound: maxHintsPerRound, penalty: 25 });
      const hintedKeys = new Set();
      let hintButton = null;
      let checkButton = null;
      // -------------------

      const timeLimits = {
        easy: 60,
        medium: 90,
        hard: 120,
      };

      const timerScorePerSecond = 2;

      let remainingTime = timeLimits[selectedDifficulty];
      let roundSubmitted = false;

      function lockSubmittedRound() {
        roundSubmitted = true;
        wordButtons.forEach((button) => {
          button.mouseEnabled = false;
          button.cursor = "default";
        });
        if (hintButton) hintButton.mouseEnabled = false;
        if (checkButton) checkButton.mouseEnabled = false;
      }

      function startTimer() {
        clearGameTimer();

        timerInterval = setInterval(() => {
          if (disposed || runId !== gameRunId) {
            clearGameTimer();
            return;
          }

          remainingTime--;

          timerLabel.text = `⏱ ${remainingTime}s`;
          timerScoreLabel.text = `Perfect Bonus: ${remainingTime * timerScorePerSecond}`;

          if (remainingTime <= 0) {
            clearGameTimer();

            feedbackBar.color = "#ffe1e1";
            feedbackLabel.text = "⏰ Time is up!";
            feedbackLabel.color = "#a61b1b";

            emit("wrong");
          }

          stage.update();
        }, 1000);
      }

      new zim.Rectangle({
        width: 195,
        height: 70,
        color: gamePalette.secondary,
        corner: 32,
      })
        .addTo(stage)
        .loc(850, 35);

      const timerLabel = new zim.Label({
        text: `⏱ ${remainingTime}s`,
        size: 28,
        font: zimFont,
        color: "#ffffff",
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(stage)
        .loc(947, 51);

      const timerScoreLabel = new zim.Label({
        text: `Perfect Bonus: ${remainingTime * timerScorePerSecond}`,
        size: 18,
        font: zimFont,
        color: "#ffffff",
        align: "center",
        valign: "center",
        bold: true,
      })
        .addTo(stage)
        .loc(947, 85);

      const passageWindowWidth = 980;
      let passageWindowHeight = 250;
      const passagePadding = 20;
      const scrollbarBuffer = 30;
      const passageContent = new zim.Container(passageWindowWidth, 2000);

      function makeText(text) {
        return new zim.Label({
          text,
          size: 22,
          font: getContentFont(),
          color: gamePalette.ink,
          align: "left",
          valign: "center",
        }).addTo(passageContent);
      }

      function makeBlank(x, y, index) {
        const blank = new zim.Container().addTo(passageContent).loc(x, y);
        blank.index = index;

        new zim.Rectangle({
          width: 95,
          height: 28,
          color: gamePalette.panel,
          borderColor: gamePalette.primary,
          borderWidth: 3,
          corner: 8,
          dashed: [8, 5],
        }).addTo(blank);

        new zim.Label({
          text: "______",
          size: 20,
          font: zimFont,
          color: gamePalette.muted,
          align: "center",
          valign: "center",
          bold: true,
        }).addTo(blank).loc(47.5, 14);

        blanks.push(blank);
        return blank;
      }

      let words = ["girl", "garden", "milk", "animals", "day"];
      let correctAnswers = ["girl", "garden", "milk"];

      const wordTypeMap = {
        noun: "NOUN",
        verb: "VERB",
        adjective: "ADJ",
      };

      getFillInBlanks({
        language: selectedLanguage,
        difficulty: selectedDifficulty,
        wordTypes: selectedWordTypes.map((type) => wordTypeMap[type]),
      }).then((result) => {
        if (disposed || runId !== gameRunId) return;

        const gameData = result.data;

        words = gameData.wordBank;
        correctAnswers = gameData.answers;

        const wordsPerRow = 6;
        const wordBankRows = Math.max(1, Math.ceil(words.length / wordsPerRow));
        const wordBankHeightByRows = {
          1: 110,
          2: 155,
          3: 190,
        };
        const wordBankHeight =
          wordBankHeightByRows[wordBankRows] || 190 + (wordBankRows - 3) * 43;
        const wordBankBottom = 668;
        const controlsDividerHeight = 12;
        const controlsY = wordBankBottom + controlsDividerHeight;
        const controlsHeight = 72;
        const controlsButtonY = controlsY + 10;
        const feedbackY = controlsY + controlsHeight;
        const wordBankY = wordBankBottom - wordBankHeight;
        const passageCardY = 150;
        const wordBankTopGap = 14;
        const passageCardHeight = wordBankY - passageCardY - wordBankTopGap;
        passageWindowHeight = passageCardHeight - 30;

        new zim.Rectangle(W, wordBankY - 140, gamePalette.surface)
          .addTo(stage)
          .loc(0, 140);

        new zim.Rectangle({
          width: 1020,
          height: passageCardHeight,
          color: gamePalette.panel,
          borderColor: gamePalette.panelBorder,
          borderWidth: 2,
          corner: 18,
        })
          .addTo(stage)
          .loc(40, passageCardY);

        new zim.Rectangle(W, wordBankHeight, gamePalette.band)
          .addTo(stage)
          .loc(0, wordBankY);

        new zim.Rectangle(W, controlsDividerHeight, "#b88bde")
          .addTo(stage)
          .loc(0, wordBankBottom);

        new zim.Rectangle(W, controlsHeight, gamePalette.controls)
          .addTo(stage)
          .loc(0, controlsY);

        new zim.Rectangle({ width: 220, height: 32, color: gamePalette.header, corner: 16 })
          .addTo(stage)
          .loc(W / 2 - 110, wordBankY + 8);

        new zim.Label({
          text: "AVAILABLE WORDS",
          size: 22,
          font: zimFont,
          color: "#ffffff",
          align: "center",
          valign: "center",
          bold: true,
        })
          .addTo(stage)
          .loc(W / 2, wordBankY + 25);

        function drawParagraphWithInlineBlanks(paragraph) {
          const parts = paragraph.split("_____");

          let x = passagePadding;
          let y = 22;
          const maxX = passageWindowWidth - passagePadding - scrollbarBuffer;
          const lineHeight = 34;
          let blankIndex = 0;

          parts.forEach((part, partIndex) => {
            const wordsInPart = part.split(" ");

            wordsInPart.forEach((word) => {
              if (!word) return;

              const label = makeText(word);

              const wordWidth =
                label.width ||
                label.getBounds?.()?.width ||
                60;

              if (x + wordWidth > maxX) {
                x = passagePadding;
                y += lineHeight;
              }

              label.loc(x, y);
              x += wordWidth + 12;
            });

            if (partIndex < parts.length - 1) {
              if (x + 105 > maxX) {
                x = passagePadding;
                y += lineHeight;
              }

              makeBlank(x, y - 18, blankIndex);
              x += 105;
              blankIndex++;
            }
          });

          return y + lineHeight;
        }
        const passageContentHeight = Math.max(
          passageWindowHeight,
          drawParagraphWithInlineBlanks(gameData.paragraph),
        );

        passageContent.setBounds(
          0,
          0,
          passageWindowWidth,
          passageContentHeight,
        );
        passageContent.width = passageWindowWidth;
        passageContent.height = passageContentHeight;

        new zim.Window({
          width: passageWindowWidth,
          height: passageWindowHeight,
          content: passageContent,
          backgroundColor: "transparent",
          borderColor: "transparent",
          padding: 0,
          scrollBarDrag: true,
          scrollBarColor: gamePalette.primary,
          scrollBarFade: false,
        })
          .addTo(stage)
          .loc(60, 165);

        const spacingX = 160;
        const spacingY = 43;
        const startX = 70;
        const startY = wordBankY + 50;

        words.forEach((word, i) => {
          const row = Math.floor(i / wordsPerRow);
          const col = i % wordsPerRow;

          const buttonWidth = 145;

          const currentX = startX + col * spacingX;
          const currentY = startY + row * spacingY;
          const wordButton = new zim.Button({
            width: buttonWidth,
            height: 40,
            label: new zim.Label({
              text: word,
              size: selectedLanguage === "sanskrit" ? 20 : 24,
              font: getContentFont(),
              color: "#ffffff",
              align: "center",
              valign: "center",
            }),
            backgroundColor: gamePalette.primary,
            rollBackgroundColor: gamePalette.primaryRoll,
            downBackgroundColor: gamePalette.primaryDown,
            corner: 10,
          });
          wordButton.addTo(stage);
          wordButton.loc(currentX, currentY);
          wordButton.homeX = currentX;
          wordButton.homeY = currentY;
          wordButtons.push(wordButton);

          wordButton.word = word;
          wordButton.on("mousedown", () => {
            if (roundSubmitted) return;

            const buttonGlobal = wordButton.localToGlobal(0, 0);
            wordButton.addTo(stage);
            const buttonStagePoint = stage.globalToLocal(
              buttonGlobal.x,
              buttonGlobal.y,
            );
            wordButton.loc(buttonStagePoint.x, buttonStagePoint.y);
            stage.update();
          });
          wordButton.drag();
          wordButton.on("pressup", () => {
            if (roundSubmitted) return;

            let matchedBlank = null;
            const previousBlankIndex = wordButton.blankIndex;

            blanks.forEach((blank) => {
              const buttonCenter = wordButton.localToGlobal(
                wordButton.width / 2,
                wordButton.height / 2,
              );
              const blankTopLeft = blank.localToGlobal(0, 0);

              const insideX =
                buttonCenter.x > blankTopLeft.x &&
                buttonCenter.x < blankTopLeft.x + 95;
              const insideY =
                buttonCenter.y > blankTopLeft.y &&
                buttonCenter.y < blankTopLeft.y + 28;

              if (insideX && insideY) {
                matchedBlank = blank;
              }
            });

            if (matchedBlank) {
              if (
                matchedBlank.filledWord &&
                matchedBlank.index !== previousBlankIndex
              ) {
                const existingButton = wordButtons.find(
                  (button) => button.word === matchedBlank.filledWord
                );

                if (existingButton) {
                  existingButton.blankIndex = undefined;
                  const existingGlobal = existingButton.localToGlobal(0, 0);
                  existingButton.addTo(stage);
                  const existingStagePoint = stage.globalToLocal(
                    existingGlobal.x,
                    existingGlobal.y,
                  );
                  existingButton.loc(existingStagePoint.x, existingStagePoint.y);

                  existingButton.animate({
                    props: {
                      x: existingButton.homeX,
                      y: existingButton.homeY,
                      scaleX: 1,
                      scaleY: 1,
                    },
                    time: 0.25,
                  });
                }
              }

              const buttonGlobal = wordButton.localToGlobal(0, 0);
              wordButton.addTo(passageContent);
              const buttonContentPoint = passageContent.globalToLocal(
                buttonGlobal.x,
                buttonGlobal.y,
              );
              wordButton.loc(buttonContentPoint.x, buttonContentPoint.y);

              wordButton.animate({
                props: {
                  x: matchedBlank.x,
                  y: matchedBlank.y,
                  scaleX: 95 / wordButton.width,
                  scaleY: 28 / wordButton.height,
                },
                time: 0.2,
              });
              if (
                previousBlankIndex !== undefined &&
                previousBlankIndex !== matchedBlank.index
              ) {
                blanks[previousBlankIndex].filledWord = undefined;
              }
              wordButton.blankIndex = matchedBlank.index;
              matchedBlank.filledWord = wordButton.word;
            } else {
              const buttonGlobal = wordButton.localToGlobal(0, 0);
              wordButton.addTo(stage);
              const buttonStagePoint = stage.globalToLocal(
                buttonGlobal.x,
                buttonGlobal.y,
              );
              wordButton.loc(buttonStagePoint.x, buttonStagePoint.y);
              if (previousBlankIndex !== undefined) {
                blanks[previousBlankIndex].filledWord = undefined;
              }
              wordButton.blankIndex = undefined;

              wordButton.animate({
                props: {
                  x: wordButton.homeX,
                  y: wordButton.homeY,
                  scaleX: 1,
                  scaleY: 1,
                },
                time: 0.25,
              });
            }
            stage.update();
          });
        });
        stage.update();

        const feedbackBar = new zim.Rectangle({
          width: W,
          height: 48,
          color: gamePalette.surface,
        })
          .addTo(stage)
          .loc(0, feedbackY);

        const feedbackLabel = new zim.Label({
          text: "",
          size: 22,
          font: zimFont,
          color: "#0b5c24",
          align: "center",
          valign: "center",
          bold: true,
        })
          .addTo(stage)
          .loc(W / 2, feedbackY + 24);

        // --- HINT: applyHint function ---
        function applyHint() {
          if (roundSubmitted || !hintPolicy.canUse()) return;

          // Find the first blank not yet correctly filled and not already hinted
          let target = -1;
          for (let i = 0; i < correctAnswers.length; i++) {
            const solved = wordButtons.some(
              (b) => b.blankIndex === i && b.word === correctAnswers[i]
            );
            if (!solved && !hintedKeys.has(i)) {
              target = i;
              break;
            }
          }
          if (target === -1) return; // nothing useful to say, don't spend a hint

          const word = correctAnswers[target];
          hintedKeys.add(target);
          hintPolicy.use();
          hintButton.refresh();
          emit("hint", { text: `Blank ${target + 1} starts with "${word[0].toUpperCase()}".` });
        }
        // --------------------------------

        startTimer();

        const menuButton = new zim.Button({
          width: 180,
          height: 52,
          label: "← Menu",
          backgroundColor: gamePalette.panel,
          rollBackgroundColor: gamePalette.surface,
          color: gamePalette.header,
          corner: 12,
        });

        menuButton.label.size = 22;
        menuButton.addTo(stage).loc(40, 40);
        menuButton.on("click", () => {
          clearGameTimer();
          showMenu();
        });

        const resetButton = new zim.Button({
          width: 200,
          height: 52,
          label: "↻ Reset Game",
          backgroundColor: gamePalette.secondary,
          rollBackgroundColor: "#8f50ae",
          corner: 25,
        });
        resetButton.label.size = 22;
        resetButton.addTo(stage).loc(270, controlsButtonY);
        resetButton.on("click", () => {
          clearGameTimer();
          startGame();
        });

        // --- HINT: hint button placed between Reset and Check ---
        hintButton = createHintButton({
          stage,
          zim,
          x: 490,
          y: controlsButtonY,
          policy: hintPolicy,
          onUse: applyHint,
          palette: { bg: gamePalette.gold, color: gamePalette.ink },
        });
        // --------------------------------------------------------

        checkButton = new zim.Button({
          width: 240, height: 50,
          label: "✓ Submit Answer",
          backgroundColor: gamePalette.primary,
          rollBackgroundColor: gamePalette.primaryRoll,
          corner: 25,
        });
        checkButton.label.size = 22;
        checkButton.addTo(stage).loc(640, controlsButtonY);
        checkButton.on("click", () => {
          if (roundSubmitted) return;

          let correctCount = 0;
          let filledCount = 0;
          const totalQuestions = correctAnswers.length;

          blanks.forEach((blank) => {
            if (blank.filledWord) filledCount++;
            if (blank.filledWord === correctAnswers[blank.index]) correctCount++;
          });

          const answerScore = correctCount * 100;
          const isPerfectScore = correctCount === totalQuestions;
          const timeBonus = isPerfectScore
            ? Math.max(0, remainingTime) * timerScorePerSecond
            : 0;
          const hintsUsed = maxHintsPerRound - hintPolicy.remaining();
          const hintPenalty = hintsUsed * hintPolicy.penalty;
          const finalScore = Math.max(0, answerScore + timeBonus - hintPenalty);
          const perfectBonusText = isPerfectScore ? ` (Perfect Bonus: +${timeBonus})` : "";
          const missedPerfectBonusText = isPerfectScore ? "" : " (Perfect Bonus: 0)";
          const hintScoreText = hintPenalty > 0 ? ` (Hints: -${hintPenalty})` : "";
          scoreLabel.text = `Answer Score: ${correctCount}/${totalQuestions} = ${answerScore}`;

          if (filledCount < totalQuestions) {
            feedbackBar.color = "#fff3cd";
            feedbackLabel.text = "⚠️ Fill in all blanks before submitting!";
            feedbackLabel.color = "#856404";
          } else if (correctCount === totalQuestions) {
            feedbackBar.color = "#d7f3dc";
            feedbackLabel.text = `🎉 Excellent! Final Score: ${finalScore}${perfectBonusText}${hintScoreText}`;
            clearGameTimer();
            lockSubmittedRound();
            feedbackLabel.color = "#0b5c24";
            emit("complete");
          } else {
            clearGameTimer();
            lockSubmittedRound();
            feedbackBar.color = "#ffe1e1";
            feedbackLabel.text = `❌ You got ${correctCount}/${totalQuestions}. Final Score: ${finalScore}${missedPerfectBonusText}${hintScoreText}`;
            feedbackLabel.color = "#a61b1b";
            emit("wrong");
          }

          // Guests are excluded from the leaderboard (anonymous users still
          // have a UID, so the id check alone doesn't stop them).
          if (filledCount === totalQuestions && authUser?.id && !authUser.isGuest) {
            const elapsedSeconds =
              timeLimits[selectedDifficulty] - Math.max(0, remainingTime);

            const scoreData = {
              uuid: authUser.id,
              displayName: authUser.name || "Player",
              score: finalScore,
              bestTime: elapsedSeconds * 1000,
              storyId: getSelectedStoryId(),
              difficulty: selectedDifficulty,
            };

            submitContextClozeQuestScore(scoreData)
              .then((result) => {
                console.log("Context Cloze Quest score result:", result);
              })
              .catch((error) => {
                console.error("Could not save Context Cloze Quest score:", error);
              });
          }
          stage.update();
        });

        stage.update();
      });
    }

    showMenu();

    return () => {
      disposed = true;
      gameRunId += 1;
      clearGameTimer();
      stage.removeAllChildren();
      stage.update();
    };
  },
});
