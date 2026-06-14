import { createZimGame } from "../createZimGame";
import { emit } from "../../scenes/sceneBus";

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
  height: 720,
  color: "#f4f3ec",
  outerColor: "#ffffff",

  setup({ stage, W, H, zim }) {
    const zimFont = "Fredoka";

    new zim.Rectangle(W, H, "#ffffff").addTo(stage);

    // purple header
    new zim.Rectangle(W, 170, "#4f46d9").addTo(stage).loc(0, 0);

    // reading area
    new zim.Rectangle(W, 260, "#f7f9fc").addTo(stage).loc(0, 170);

    // word bank area
    new zim.Rectangle(W, 130, "#ffffff").addTo(stage).loc(0, 430);

    // button area
    new zim.Rectangle(W, 90, "#f7f9fc").addTo(stage).loc(0, 560);

    new zim.Label({
      text: "📚 Context Cloze Quest",
      size: 42,
      font: zimFont,
      color: "#000000",
      align: "center",
      valign: "center",
      bold: true,
    })
      .addTo(stage)
      .loc(W / 2, 85);
    
   new zim.Rectangle({
    width: 130,
    height: 45,
    color: "#7c7bea",
    corner: 22,
  })
  .addTo(stage)
  .loc(W / 2 - 65, 105);

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
      .loc(W / 2, 125);

    const paragraphY = 230;
    const blanks = [];
    const wordButtons = [];

    function makeText(text, x, y) {
      return new zim.Label({
        text,
        size: 24,
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
        width: 130,
        height: 48,
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
      }).addTo(blank).loc(65, 24);

      blanks.push(blank);
      return blank;
    }

    makeText("The little", 190, paragraphY);
    makeBlank(330, paragraphY - 24, 0);
    makeText("woke up early in the morning.", 480, paragraphY);

    makeText("She watered the plants in the", 190, paragraphY + 80);
    makeBlank(540, paragraphY + 56, 1);
    makeText(".", 690, paragraphY + 80);

    makeText("Later, she enjoyed a bowl of warm", 190, paragraphY + 160);
    makeBlank(590, paragraphY + 136, 2);
    makeText(".", 740, paragraphY + 160);

    const words = ["girl", "garden", "milk", "animals", "day"];
    const correctAnswers = ["girl", "garden", "milk"];

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
      .loc(W / 2, 470);

    const buttonWidths = words.map((w) => Math.max(110, w.length * 22));
    const totalWidth = buttonWidths.reduce((sum, width) => sum + width, 0);
    const spacing = 25;
    const totalSpacing = spacing * (words.length - 1);
    const rowWidth = totalWidth + totalSpacing;

    let currentX = (W - rowWidth) / 2;

    words.forEach((word, i) => {
    const buttonWidth = Math.max(110, word.length * 22);
    const wordButton = new zim.Button({
      width: buttonWidth,
      height: 45,
      label: word,
      backgroundColor: "#6c5ce7",
      rollBackgroundColor: "#5b4ee6",
      downBackgroundColor: "#4c40d8",
      corner: 10,
    });

      wordButton.addTo(stage);
      wordButton.loc(currentX, 500);
      wordButton.homeX = currentX;
      wordButton.homeY = 500;
      wordButtons.push(wordButton);
      currentX += buttonWidth + spacing;

      wordButton.word = word;
      wordButton.drag();
      wordButton.on("pressup", () => {
        let matchedBlank = null;

        blanks.forEach((blank) => {
          const centerX = wordButton.x + 60;
          const centerY = wordButton.y + 25;

          const insideX = centerX > blank.x && centerX < blank.x + 130;
          const insideY = centerY > blank.y && centerY < blank.y + 48;

          if (insideX && insideY) {
            matchedBlank = blank;
          }
        });

      if (matchedBlank) {
        wordButton.animate({
          props: {
            x: matchedBlank.x + 5,
            y: matchedBlank.y - 1,
          },
          time: 0.2,
        });

        wordButton.blankIndex = matchedBlank.index;
      } else {
        wordButton.blankIndex = undefined;

        wordButton.animate({
          props: {
            x: wordButton.homeX,
            y: wordButton.homeY,
          },
          time: 0.25,
        });
      }
        stage.update();
      });
    });
    const feedbackBar = new zim.Rectangle({
      width: W,
      height: 70,
      color: "#ffffff",
    })
      .addTo(stage)
      .loc(0, 664);

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
      .loc(W / 2, 698);
        const resetButton = new zim.Button({
          width: 220,
          height: 52,
          label: "↻ Reset Game",
          backgroundColor: "#ff2f2f",
          rollBackgroundColor: "#e62828",
          corner: 12,
        });
          resetButton.label.size = 22;

        resetButton.addTo(stage).loc(300, 580);
        resetButton.on("click", () => {
          wordButtons.forEach((button) => {
            button.blankIndex = undefined;
            button.animate({
              props: {
                x: button.homeX,
                y: button.homeY,
              },
              time: 0.25,
            });
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

        checkButton.addTo(stage).loc(550, 580);
        checkButton.on("click", () => {
          let score = 0;

          stage.loop((obj) => {
            if (obj.word && obj.blankIndex !== undefined) {
              if (obj.word === correctAnswers[obj.blankIndex]) {
                score++;
              }
            }
          });

          scoreLabel.text = `Score: ${score}`;
          if (score === 3) {
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
  },
});