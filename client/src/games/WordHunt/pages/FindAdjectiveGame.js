import ZimLabel from "../../../zimcomponents/ZimLabel";
import Blackboard from "../UI/Blackboard";
import Chalk from "../UI/Chalk";

import { emit } from "../../../scenes/sceneBus";

class FindAdjectiveGame {
  constructor(game) {
    this.game = game;

    this.adjectives =
      game.wordTypes.adjectives;

    this.nouns =
      game.wordTypes.nouns;

    this.verbs =
      game.wordTypes.verbs;

    this.score = 0;

    this.foundWords = [];

    this.data = this.getData();

    this.blackboard = null;
  }

  //-----------------------------------
  // DISPLAY PASSAGE
  //-----------------------------------

  displayPassage() {

    this.game.stage.canvas.style.cursor =
      "none";

    //-----------------------------------
    // BOARD
    //-----------------------------------

    this.blackboard =
      new Blackboard(
        this.game,
        1350,
        760
      ).create();

    this.blackboard.center(
      this.game.stage
    );

    this.blackboard.addTo(
      this.game.stage
    );

    //-----------------------------------
    // TITLE
    //-----------------------------------

    const heading =
      new ZimLabel(
        this.game,
        "Search For All Adjectives From The Passage"
      ).createLabel();

    heading.scale = 0.75;
    heading.color = "white";

    heading.pos(40, 20);

    heading.addTo(
      this.blackboard
    );

    //-----------------------------------
    // SCORE
    //-----------------------------------

    const progressLabel =
      new ZimLabel(
        this.game,
        `Found 0/${this.adjectives.length} Adjectives`
      ).createLabel();

    progressLabel.scale = 0.65;

    progressLabel.color =
      "#00ff88";

    progressLabel.pos(
      this.blackboard.width - 360,
      20
    );

    progressLabel.addTo(
      this.blackboard
    );

    //-----------------------------------
    // MESSAGE BAR
    //-----------------------------------

    const messageBar =
      new this.game.zim.Rectangle({
        width:
          this.blackboard.width - 80,
        height: 55,
        color: "#274527",
        corner: 8,
      });

    messageBar.pos(40, 70);

    messageBar.addTo(
      this.blackboard
    );

    const messageLabel =
      new this.game.zim.Label({
        text: "Find all adjectives",
        size: 28,
        color: "#FFD700",
      });

    messageLabel.pos(60, 84);

    messageLabel.addTo(
      this.blackboard
    );

    //-----------------------------------
    // FOUND WORDS BOX
    //-----------------------------------

    const foundBox =
      new this.game.zim.Rectangle({
        width:
          this.blackboard.width - 80,
        height: 160,
        color: "#274527",
        corner: 8,
      });

    foundBox.pos(
      40,
      this.blackboard.height - 190
    );

    foundBox.addTo(
      this.blackboard
    );

    const foundTitle =
      new this.game.zim.Label({
        text: "Found Adjectives",
        size: 30,
        color: "#00ff88",
      });

    foundTitle.pos(
      60,
      this.blackboard.height - 180
    );

    foundTitle.addTo(
      this.blackboard
    );

    const foundWordsLabel =
      new this.game.zim.Label({
        text: "",
        size: 26,
        color: "white",
        align: "left",
      });

    foundWordsLabel.pos(
      60,
      this.blackboard.height - 130
    );

    foundWordsLabel.addTo(
      this.blackboard
    );

    //-----------------------------------
    // STORY
    //-----------------------------------

    const margin = 60;

    let x = margin;
    let y = 160;

    const lineHeight = 42;

    const maxWidth =
      this.blackboard.width - 80;

    //-----------------------------------
    // FOUND WORDS FORMAT
    //-----------------------------------

    const formatFoundWords = () => {

      let rows = [];

      for (
        let i = 0;
        i < this.foundWords.length;
        i += 4
      ) {

        rows.push(
          this.foundWords
            .slice(i, i + 4)
            .join(", ")
        );

      }

      return rows.join("\n");
    };

    //-----------------------------------
    // WORDS
    //-----------------------------------

    this.data.forEach((word) => {

      const label =
        new this.game.zim.Label({
          text: word,
          size: 32,
          color: "white",
        });

      if (
        x + label.width >
        maxWidth
      ) {

        x = margin;

        y += lineHeight;
      }

      label.pos(x, y);

      label.addTo(
        this.blackboard
      );

      x += label.width + 14;

      //-----------------------------------
      // CLICK
      //-----------------------------------

      label.tap(() => {

        const cleanWord =
          word
            .toLowerCase()
            .replace(/[^\w']/g, "");

        //-----------------------------------
        // CORRECT ADJECTIVE
        //-----------------------------------

        if (
          this.adjectives.includes(
            cleanWord
          )
        ) {

          if (
            this.foundWords.includes(
              cleanWord
            )
          ) {

            messageLabel.text =
              `${cleanWord} already found`;

            this.game.stage.update();

            return;
          }

          label.mouseEnabled = false;

          this.foundWords.push(
            cleanWord
          );

          this.score++;

          label.color = "orange";

          progressLabel.text =
            `Found ${this.score}/${this.adjectives.length} Adjectives`;

          messageLabel.text =
            `Great! "${cleanWord}" is an adjective`;

          foundWordsLabel.text =
            formatFoundWords();

          emit("correct");

          this.checkWin(
            messageLabel
          );
        }

        //-----------------------------------
        // NOUN
        //-----------------------------------

        else if (
          this.nouns.includes(
            cleanWord
          )
        ) {

          label.color = "red";

          messageLabel.text =
            `Oops! "${cleanWord}" is a noun`;

          emit("wrong");
        }

        //-----------------------------------
        // VERB
        //-----------------------------------

        else if (
          this.verbs.includes(
            cleanWord
          )
        ) {

          label.color = "#00ff88";

          messageLabel.text =
            `Oops! "${cleanWord}" is a verb`;

          emit("wrong");
        }

        //-----------------------------------
        // OTHER
        //-----------------------------------

        else {

          label.color = "#ff6666";

          messageLabel.text =
            `"${cleanWord}" is not an adjective`;

          emit("wrong");
        }

        this.game.stage.update();
      });
    });

    //-----------------------------------
    // CHALK
    //-----------------------------------

    new Chalk(
      this.game
    ).show();

    this.game.stage.update();

    return this.blackboard;
  }

  //-----------------------------------
  // WIN
  //-----------------------------------

  checkWin(messageLabel) {

    if (
      this.foundWords.length ===
      this.adjectives.length
    ) {

      messageLabel.text =
        "🎉 Congratulations!";

      const modal =
        document.createElement("div");

      modal.innerHTML = `
        <div style="
          position:fixed;
          top:0;
          left:0;
          width:100%;
          height:100%;
          background:rgba(0,0,0,0.4);
          display:flex;
          justify-content:center;
          align-items:center;
          z-index:99999;
        ">
          <div style="
            background:#FFF8F0;
            padding:35px;
            border-radius:20px;
            border:4px solid #E9D8A6;
            text-align:center;
            min-width:450px;
            box-shadow:0 8px 20px rgba(0,0,0,.25);
          ">

            <h1 style="
              color:#7B2CBF;
              margin-bottom:10px;
              font-size:42px;
            ">
              🏆 Amazing Work!
            </h1>

            <p style="
              font-size:24px;
              margin-bottom:25px;
              color:#444;
            ">
              You completed the entire
              Word Hunt Challenge!
            </p>

            <p style="
              font-size:18px;
              margin-bottom:30px;
              color:#666;
            ">
              Nouns ✔ Verbs ✔ Adjectives ✔
            </p>

            <button
              id="playAgainBtn"
              style="
                background:#9D6EFF;
                color:white;
                border:none;
                padding:14px 26px;
                border-radius:12px;
                cursor:pointer;
                margin-right:12px;
                font-size:18px;
              "
            >
              Play Again
            </button>

            <button
              id="finishBtn"
              style="
                background:#00C853;
                color:white;
                border:none;
                padding:14px 26px;
                border-radius:12px;
                cursor:pointer;
                font-size:18px;
              "
            >
              Finish
            </button>

          </div>
        </div>
      `;

      document.body.appendChild(
        modal
      );

      //-----------------------------------
      // PLAY AGAIN
      //-----------------------------------

      document.getElementById(
        "playAgainBtn"
      ).onclick = () => {

        modal.remove();

        this.game.stage.removeAllChildren();

        this.game.start();

        this.game.stage.update();
      };

      //-----------------------------------
      // FINISH
      //-----------------------------------

      document.getElementById(
        "finishBtn"
      ).onclick = () => {

        modal.remove();

        this.game.stage.removeAllChildren();

        this.game.start();

        this.game.stage.update();
      };
    }
  }

  //-----------------------------------
  // DATA
  //-----------------------------------

  getData() {

    return (
      this.game.storyData.story.match(
        /\S+/g
      ) || []
    );
  }
}

export default FindAdjectiveGame;
