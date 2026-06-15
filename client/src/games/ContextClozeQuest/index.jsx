import { createZimGame } from "../createZimGame";
import { emit } from "../../scenes/sceneBus";
import { getFillInBlanks } from "../../services/FillInTheBlankFrontendService";

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

      new zim.Rectangle(W, H, "#ffffff").addTo(stage);
      new zim.Rectangle(W, 170, "#4f46d9").addTo(stage).loc(0, 0);

      new zim.Label({
        text: "📚 Context Cloze Quest",
        size: 44,
        font: zimFont,
        color: "#ffffff",
        align: "center",
        valign: "center",
        bold: true,
      }).addTo(stage).loc(W / 2, 80);

      new zim.Label({
        text: "Choose one or more word types before you play",
        size: 24,
        font: zimFont,
        color: "#ffffff",
        align: "center",
        valign: "center",
      }).addTo(stage).loc(W / 2, 130);

      new zim.Label({
        text: "Word Type:",
        size: 28,
        font: zimFont,
        color: "#333333",
        bold: true,
      }).addTo(stage).loc(160, 270);

      ["noun", "verb", "adjective"].forEach((type, index) => {
        const isSelected = selectedWordTypes.includes(type);
        const btnWidth = type === "adjective" ? 210 : 150;

        const btn = new zim.Container().addTo(stage).loc(360 + index * 205, 255);

        new zim.Rectangle({
          width: btnWidth,
          height: 50,
          color: isSelected ? "#4f46d9" : "#ffffff",
          borderColor: "#4f46d9",
          borderWidth: 2,
          corner: 12,
        }).addTo(btn);

        new zim.Label({
          text: type.toUpperCase(),
          size: type === "adjective" ? 26 : 32,
          font: zimFont,
          color: isSelected ? "#ffffff" : "#333333",
          align: "center",
          valign: "center",
          bold: true,
        }).addTo(btn).loc(btnWidth / 2, 25);

        btn.cursor = "pointer";

        btn.on("click", () => {
          if (selectedWordTypes.includes(type)) {
            if (selectedWordTypes.length > 1) {
              selectedWordTypes = selectedWordTypes.filter(
                (wordType) => wordType !== type
              );
            }
          } else {
            selectedWordTypes = [...selectedWordTypes, type];
          }

          showMenu();
        });
      });

      new zim.Label({
        text: "Difficulty:",
        size: 28,
        font: zimFont,
        color: "#333333",
        bold: true,
      }).addTo(stage).loc(160, 370);

      ["easy", "medium", "hard"].forEach((level, index) => {
        const btn = new zim.Button({
          width: 150,
          height: 50,
          label: level.toUpperCase(),
          backgroundColor: selectedDifficulty === level ? "#4f46d9" : "#ffffff",
          rollBackgroundColor: "#ddd9ff",
          color: selectedDifficulty === level ? "#ffffff" : "#333333",
          corner: 12,
        });

        btn.label.size = level === "medium" ? 28 : 34;
        btn.addTo(stage).loc(360 + index * 205, 355);

        btn.on("click", () => {
          selectedDifficulty = level;
          showMenu();
        });
      });

      const playButton = new zim.Button({
        width: 260,
        height: 60,
        label: "▶ Play Game",
        backgroundColor: "#18b853",
        rollBackgroundColor: "#12a448",
        corner: 18,
      });

      playButton.label.size = 24;
      playButton.addTo(stage).loc(W / 2 - 130, 520);

      playButton.on("click", () => {
        startGame();
      });

      stage.update();
    }

    function startGame() {
      stage.removeAllChildren();

    new zim.Rectangle(W, H, "#ffffff").addTo(stage);

    // purple header
    new zim.Rectangle(W, 140, "#4f46d9").addTo(stage).loc(0, 0);

    // reading area
    new zim.Rectangle(W, 340, "#f7f9fc").addTo(stage).loc(0, 140);

    // paragraph card
    new zim.Rectangle({width: 1020, height: 280, color: "#ffffff", corner: 18,})
      .addTo(stage)
      .loc(40, 150);

    // word bank area
    new zim.Rectangle(W, 170, "#ffffff").addTo(stage).loc(0, 430);

    // button area
    new zim.Rectangle(W, 130, "#f7f9fc").addTo(stage).loc(0, 620);

    new zim.Label({
      text: "Context Cloze Quest",
      size: 42,
      font: zimFont,
      color: "#000000",
      align: "center",
      valign: "center",
      bold: true,
    })
      .addTo(stage)
      .loc(W / 2, 60);
    
   new zim.Rectangle({
    width: 130,
    height: 45,
    color: "#7c7bea",
    corner: 22,
  })
  .addTo(stage)
  .loc(W / 2 - 65, 85);

    const scoreLabel = new zim.Label({
      text: "Score: 0",
      size: 22,
      font: zimFont,
      color: "#ffffff",
      align: "center",
      valign: "center",
      bold: true,
    })
      .addTo(stage)
      .loc(W / 2, 108);

    const paragraphY = 230;
    const blanks = [];
    const wordButtons = [];

    function makeText(text, x, y) {
      return new zim.Label({
        text,
        size: 22,
        font: zimFont,
        color: "#333333",
        align: "left",
        valign: "center",
      }).addTo(stage).loc(x, y);
    }

    function makeBlank(x, y, index) {
      const blank = new zim.Container().addTo(stage).loc(x, y);
      blank.index = index;

      new zim.Rectangle({
        width: 95,
        height: 28,
        color: "#fff5f5",
        borderColor: "#8f7cff",
        borderWidth: 3,
        corner: 8,
        dashed: [8, 5],
      }).addTo(blank);

      new zim.Label({
        text: "______",
        size: 20,
        font: zimFont,
        color: "#999999",
        align: "center",
        valign: "center",
        bold: true,
      }).addTo(blank).loc(47.5, 14);

      blanks.push(blank);
      return blank;
    }

    let words = ["girl", "garden", "milk", "animals", "day"];
    let correctAnswers = ["girl", "garden", "milk"];

    new zim.Label({
      text: "AVAILABLE WORDS",
      size: 22,
      font: zimFont,
      color: "#3b32b8",
      align: "center",
      valign: "center",
      bold: true,
    })
      .addTo(stage)
      .loc(W / 2, 450);

    const wordTypeMap = {
      noun: "NOUN",
      verb: "VERB",
      adjective: "ADJ",
    };

    getFillInBlanks({
      difficulty: selectedDifficulty,
      wordTypes: selectedWordTypes.map((type) => wordTypeMap[type]),
    }).then((result) => {
      const gameData = result.data;

      words = gameData.wordBank;
      correctAnswers = gameData.answers;
      function drawParagraphWithInlineBlanks(paragraph) {
        const parts = paragraph.split("_____");

        let x = 90;
        let y = 165;
        const maxX = 1030;
        const lineHeight = 34;
        let blankIndex = 0;

        parts.forEach((part, partIndex) => {
          const wordsInPart = part.split(" ");

          wordsInPart.forEach((word) => {
            if (!word) return;

            const wordWidth = word.length * 12.5;

            if (x + wordWidth > maxX) {
              x = 90;
              y += lineHeight;
            }

            makeText(word, x, y);
            x += wordWidth + 12;
          });

          if (partIndex < parts.length - 1) {
            if (x + 140 > maxX) {
              x = 90;
              y += lineHeight;
            }

            makeBlank(x, y - 18, blankIndex);
            x += 105;
            blankIndex++;
          }
        });
      }
      drawParagraphWithInlineBlanks(gameData.paragraph);

    const wordsPerRow = 6;
    const spacingX = 160;
    const spacingY = 43;
    const startX = 70;
    const startY = 470;

    words.forEach((word, i) => {
      const row = Math.floor(i / wordsPerRow);
      const col = i % wordsPerRow;

      const buttonWidth = 145;

      const currentX = startX + col * spacingX;
      const currentY = startY + row * spacingY;
      const wordButton = new zim.Button({
        width: buttonWidth,
        height: 40,
        label: word,
        backgroundColor: "#6c5ce7",
        rollBackgroundColor: "#5b4ee6",
        downBackgroundColor: "#4c40d8",
        corner: 10,
      });
        wordButton.label.size = 24;
        wordButton.addTo(stage);
        wordButton.loc(currentX, currentY);
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

            const insideX = centerX > blank.x && centerX < blank.x + 95;
            const insideY = centerY > blank.y && centerY < blank.y + 28;

            if (insideX && insideY) {
              matchedBlank = blank;
            }
          });

        if (matchedBlank) {
          if (matchedBlank.filledWord) {
            const existingButton = wordButtons.find(
              (button) => button.word === matchedBlank.filledWord
            );

            if (existingButton) {
              existingButton.blankIndex = undefined;

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
           wordButton.animate({
            props: {
              x: matchedBlank.x,
              y: matchedBlank.y,
              scaleX: 95 / wordButton.width,
              scaleY: 28 / wordButton.height,
            },
            time: 0.2,
          });
          if (wordButton.blankIndex !== undefined) {
           blanks[wordButton.blankIndex].filledWord = undefined;
        }
          wordButton.blankIndex = matchedBlank.index;
          matchedBlank.filledWord = wordButton.word;
        } else {
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
      height: 70,
      color: "#ffffff",
    })
      .addTo(stage)
      .loc(0, 724);

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
      .loc(W / 2, 758);
        const menuButton = new zim.Button({
          width: 180,
          height: 52,
          label: "← Menu",
          backgroundColor: "#ffffff",
          rollBackgroundColor: "#f3f4f6",
          color: "#4f46d9",
          corner: 12,
        });

        menuButton.label.size = 22;
        menuButton.addTo(stage).loc(40, 40);
        menuButton.on("click", () => {
          showMenu();
        });
        const resetButton = new zim.Button({
          width: 220,
          height: 52,
          label: "↻ Reset Game",
          backgroundColor: "#ff2f2f",
          rollBackgroundColor: "#e62828",
          corner: 12,
        });
          resetButton.label.size = 22;

        resetButton.addTo(stage).loc(300, 640);
        resetButton.on("click", () => {
          wordButtons.forEach((button) => {
            button.blankIndex = undefined;
            button.animate({
              props: {
                x: button.homeX,
                y: button.homeY,
                scaleX: 1,
                scaleY: 1,
              },
              time: 0.25,
            });
          });
          blanks.forEach((blank) => {
            blank.filledWord = undefined;
          });


        scoreLabel.text = "Score: 0";
        feedbackBar.color = "#ffffff";
        feedbackLabel.text = "";
        stage.update();
      });

        const checkButton = new zim.Button({
          width: 260,
          height: 52,
          label: "✓ Submit Answer",
          backgroundColor: "#18b853",
          rollBackgroundColor: "#12a448",
          corner: 12,
        });
        checkButton.label.size = 22;

        checkButton.addTo(stage).loc(550, 640);
        checkButton.on("click", () => {
          let score = 0;

        blanks.forEach((blank) => {
          if (blank.filledWord === correctAnswers[blank.index]) {
            score++;
          }
        });

          scoreLabel.text = `Score: ${score}`;
          if (score === correctAnswers.length) {
            feedbackBar.color = "#d7f3dc";
            feedbackLabel.text = "🎉 Excellent! You got it right!";
            feedbackLabel.color = "#0b5c24";
            emit("complete");
          } else {
            feedbackBar.color = "#ffe1e1";
            feedbackLabel.text = "❌ Not quite. Try again!";
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