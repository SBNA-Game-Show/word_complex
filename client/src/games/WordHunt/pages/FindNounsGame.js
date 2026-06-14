import ZimLabel from "../../../zimcomponents/ZimLabel";
import Blackboard from "../UI/Blackboard";
import Chalk from "../UI/Chalk";

import { emit } from "../../../scenes/sceneBus";

class FindNounsGame {
  constructor(game) {
    this.game = game;

    this.nouns = game.wordTypes.nouns;
    this.verbs = game.wordTypes.verbs;
    this.adjectives = game.wordTypes.adjectives;

    this.score = 0;
    this.foundWords = [];

    this.data = this.getData();
  }

  displayPassage() {
    this.game.stage.canvas.style.cursor = "none";

    //-----------------------------------
    // BOARD
    //-----------------------------------

    this.blackboard = new Blackboard(
      this.game,
      1350,
      760
    ).create();

    this.blackboard.center(this.game.stage);
    this.blackboard.addTo(this.game.stage);

    //-----------------------------------
    // TITLE
    //-----------------------------------

    const heading = new ZimLabel(
      this.game,
      "Search For All Nouns From The Passage"
    ).createLabel();

    heading.scale = 0.75;
    heading.color = "white";

    heading.pos(40, 20);
    heading.addTo(this.blackboard);

    //-----------------------------------
    // SCORE
    //-----------------------------------

    const progressLabel = new ZimLabel(
      this.game,
      `Found 0 / ${this.nouns.length} Verbs`
    ).createLabel();

    progressLabel.scale = 0.65;
    progressLabel.color = "#00ff88";

    progressLabel.pos(
      this.blackboard.width - 330,
      20
    );

    progressLabel.addTo(this.blackboard);

    //-----------------------------------
    // MESSAGE BAR
    //-----------------------------------

    const messageBar = new this.game.zim.Rectangle({
      width: this.blackboard.width - 80,
      height: 55,
      color: "#274527",
      corner: 8,
    });

    messageBar.pos(40, 70);
    messageBar.addTo(this.blackboard);

    const messageLabel = new this.game.zim.Label({
      text: `Find all ${this.nouns.length} nouns`,
      size: 28,
      color: "#FFD700",
    });

    messageLabel.pos(60, 84);
    messageLabel.addTo(this.blackboard);

    //-----------------------------------
    // FOUND VERBS BOX
    //-----------------------------------

    const foundBox = new this.game.zim.Rectangle({
      width: this.blackboard.width - 80,
      height: 160,
      color: "#274527",
      corner: 8,
    });

    foundBox.pos(
      40,
      this.blackboard.height - 190
    );

    foundBox.addTo(this.blackboard);

    const foundTitle = new this.game.zim.Label({
      text: "Found Nouns",
      size: 30,
      color: "#00ff88",
    });

    foundTitle.pos(
      60,
      this.blackboard.height - 180
    );

    foundTitle.addTo(this.blackboard);

    const foundWordsLabel = new this.game.zim.Label({
      text: "",
      size: 24,
      color: "white",
      align: "left",
      lineWidth: this.blackboard.width - 140,
    });

    foundWordsLabel.pos(
      60,
      this.blackboard.height - 130
    );

    foundWordsLabel.addTo(this.blackboard);

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
    // WORDS
    //-----------------------------------

    this.data.forEach((word) => {
      const label = new this.game.zim.Label({
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

      label.addTo(this.blackboard);

      x += label.width + 14;

      //-----------------------------------
      // CLICK
      //-----------------------------------

      label.tap(() => {
        const cleanWord =
          word
            .toLowerCase()
            .replace(/[^\w']/g, "");
          console.log("CLICKED:", cleanWord);
        //-----------------------------------
        // CORRECT VERB
        //-----------------------------------

        if (
          this.nouns.includes(cleanWord)
        ) {

          if (
            this.foundWords.includes(cleanWord)
          ) {
            messageLabel.text =
              `${cleanWord} already found`;

            this.game.stage.update();
            return;
          }

          // Prevent this label from firing again
          label.mouseEnabled = false;

          this.foundWords.push(
            cleanWord
          );
          console.log("FOUND =", this.foundWords);

          this.score++;
          console.log("SCORE =", this.score);
          label.color = "#00ff88";

          progressLabel.text =
            `Found ${this.score}/${this.nouns.length} Nouns`;

          messageLabel.text =
            `Great! "${cleanWord}" is a noun`;

          foundWordsLabel.text =
            this.foundWords.join(", ");

          emit("correct");

          this.checkWin(
            messageLabel
          );
        }

        //-----------------------------------
        // NOUN
        //-----------------------------------

        else if (
          this.verbs.includes(cleanWord)
        ) {
          label.color = "red";

          messageLabel.text =
            `Oops! "${cleanWord}" is a verb`;

          emit("wrong");
        }

        //-----------------------------------
        // ADJECTIVE
        //-----------------------------------

        else if (
          this.adjectives.includes(cleanWord)
        ) {
          label.color = "orange";

          messageLabel.text =
            `Oops! "${cleanWord}" is an adjective`;

          emit("wrong");
        }

        //-----------------------------------
        // OTHER
        //-----------------------------------

        else {
          label.color = "#ff6666";

          messageLabel.text =
            `"${cleanWord}" is not a noun`;

          emit("wrong");
        }

        this.game.stage.update();
      });
    });

    //-----------------------------------
    // CHALK
    //-----------------------------------

    new Chalk(this.game).show();

    this.game.stage.update();

    return this.blackboard;
  }

  //-----------------------------------
  // WIN
  //-----------------------------------

  checkWin() {

    if (
      this.foundWords.length ===
      this.nouns.length
    ) {

      const modal = document.createElement("div");

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
            padding:30px;
            border-radius:20px;
            border:4px solid #E9D8A6;
            text-align:center;
            min-width:400px;
            box-shadow:0 8px 20px rgba(0,0,0,.25);
          ">

            <h1 style="
              color:#7B2CBF;
              margin-bottom:10px;
              font-size:42px;
            ">
              🎉 Great Job!
            </h1>

            <p style="
              font-size:24px;
              margin-bottom:25px;
            ">
              You found all Nouns!
            </p>

            <button
              id="continueBtn"
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
              Continue to Verbs
            </button>

            <button
              id="exitBtn"
              style="
                background:#FF8A80;
                color:white;
                border:none;
                padding:14px 26px;
                border-radius:12px;
                cursor:pointer;
                font-size:18px;
              "
            >
              Exit Game
            </button>

          </div>
        </div>
      `;

      document.body.appendChild(modal);

      //-----------------------------------
      // CONTINUE
      //-----------------------------------

      document.getElementById("continueBtn").onclick = () => {

        modal.remove();

        this.blackboard.removeFrom();

        this.game.startVerbGame();

        this.game.stage.update();
      };

      //-----------------------------------
      // EXIT
      //-----------------------------------

      document.getElementById("exitBtn").onclick = () => {

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
      this.game.storyData.story.match(/\S+/g) || []
    );
  }
}

export default FindNounsGame;
