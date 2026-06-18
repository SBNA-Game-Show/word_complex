import ZimLabel from "../../../zimcomponents/ZimLabel";
import Blackboard from "../UI/Blackboard";
import BackButton from "../../../zimcomponents/BackButton";
import Chalk from "../UI/Chalk";
import ProgressBar from "../UI/ProgressBar";
import MessageBar from "../UI/MessageBar";
import Timer from "../utils/Timer";

import { emit } from "../../../scenes/sceneBus";

class FindNounsGame {
  constructor(game) {
    this.game = game;
    this.nouns = game.wordTypes.nouns;
    this.verbs = game.wordTypes.verbs;
    this.adjectives = game.wordTypes.adjectives;
    this.challenge = `Find All ${this.nouns.length} Nouns`;
    this.timer = new Timer(game, this.game.initialMaxTime);
    this.gameKey = "Nouns";

    this.score = 0;
    this.foundWords = [];

    this.data = this.getData();

    this.progressBar = null;
    this.messageBar = null;
  }

  displayPassage() {
    //-----------------------------------
    // BOARD
    //-----------------------------------

    this.blackboard = new Blackboard(
      this.game,
      this.game.width - 20,
      this.game.height - 20,
    ).create();

    this.blackboard.center(this.game.stage);
    this.blackboard.addTo(this.game.stage);

    // Add Back Button
    new BackButton(this.game, this.blackboard).create();

    //-----------------------------------
    // SCORE
    //-----------------------------------

    /**
     * New Progress Bar to be used
     */

    this.progressBar = new ProgressBar(this.game, this.challenge);

    const progressBarContainer = this.progressBar.create();

    progressBarContainer.pos(this.blackboard.width - 300, 40);

    progressBarContainer.addTo(this.blackboard);

    //-----------------------------------
    // MESSAGE BAR
    //-----------------------------------

    this.messageBar = new MessageBar(this.game);
    //-----------------------------------
    // FOUND VERBS BOX
    //-----------------------------------

    const foundBox = new this.game.zim.Rectangle({
      width: this.blackboard.width - 80,
      height: 160,
      color: "#274527",
      corner: 8,
    });

    foundBox.pos(40, this.blackboard.height - 190);

    foundBox.addTo(this.blackboard);

    const foundTitle = new this.game.zim.Label({
      text: "Found Nouns",
      size: 30,
      color: "#00ff88",
    });

    foundTitle.pos(60, this.blackboard.height - 180);

    foundTitle.addTo(this.blackboard);

    const foundWordsLabel = new this.game.zim.Label({
      text: "",
      size: 24,
      color: "white",
      align: "left",
      lineWidth: this.blackboard.width - 140,
    });

    foundWordsLabel.pos(60, this.blackboard.height - 130);

    foundWordsLabel.addTo(this.blackboard);

    //-----------------------------------
    // STORY
    //-----------------------------------

    const margin = 60;

    let x = margin;
    let y = 160;

    const lineHeight = 42;

    const maxWidth = this.blackboard.width - 80;

    //-----------------------------------
    // WORDS
    //-----------------------------------

    const chalk = new Chalk(this.game);
    chalk.show();

    this.timer.start(
      ({ minutes, seconds }) => {
        this.progressBar.setTime(minutes, seconds);
      },

      // () => {
      //   this.progressBar.showTimesUp();

      //   this.game.inputLocked = true;

      //   this.messageBar.show("Time's Up!", "red", 5000);
      // },
    );

    this.data.forEach((word) => {
      const label = new ZimLabel(this.game, word, 24, "white");

      label.createLabel();

      if (x + 100 > maxWidth) {
        x = margin;
        y += lineHeight;
      }

      label.pos(x, y).addTo(this.blackboard);

      // IMPORTANT: measure AFTER adding
      const width = label.label.width;

      x += width + 14;

      //-----------------------------------
      // CLICK
      //-----------------------------------

      label.tap(() => {
        if (this.game.inputLocked) {
          return;
        }
        const cleanWord = word.toLowerCase().replace(/[^\w']/g, "");
        console.log("CLICKED:", cleanWord);

        //-----------------------------------
        // CORRECT VERB
        //-----------------------------------

        if (this.nouns.includes(cleanWord)) {
          if (this.foundWords.includes(cleanWord)) {
            // messageLabel.text = `${cleanWord} already found`;

            this.game.stage.update();
            return;
          }

          // Prevent this label from firing again
          label.mouseEnabled = false;

          this.foundWords.push(cleanWord);
          console.log("FOUND =", this.foundWords);

          this.score++;
          this.progressBar.setFound(this.foundWords.length);
          console.log("SCORE =", this.score);
          label.setColor("#00ff88");

          // this.messageBar.show(`Great! "${cleanWord}" is a Noun`, 10000);

          foundWordsLabel.text = this.foundWords.join(", ");

          emit("correct");

          this.checkWin();
        }

        //-----------------------------------
        // NOUN
        //-----------------------------------
        else if (this.verbs.includes(cleanWord)) {
          label.color = "red";

          this.messageBar.show(`Great! "${cleanWord}" is a VERB`, 10000);

          emit("wrong");
        }

        //-----------------------------------
        // ADJECTIVE
        //-----------------------------------
        else if (this.adjectives.includes(cleanWord)) {
          label.color = "orange";

          this.messageBar.show(`Oops! "${cleanWord}" is a Adjective`, 10000);

          emit("wrong");
        }

        //-----------------------------------
        // OTHER
        //-----------------------------------
        else {
          label.color = "#ff6666";

          messageLabel.text = `"${cleanWord}" is not a noun`;

          emit("wrong");
        }

        this.game.stage.update();
      });
    });

    this.game.stage.update();
    return this.blackboard;
  }

  //-----------------------------------
  // WIN
  //-----------------------------------
  checkWin() {
    if (this.foundWords.length === this.nouns.length) {
      this.timer.stop();

      const elapsedMs = this.timer.getElapsedTime();

      const minutes = Math.floor(elapsedMs / 60000);
      const seconds = Math.floor((elapsedMs % 60000) / 1000);

      console.log(`TIME USED: ${minutes}:${seconds}`);

      this.game.inputLocked = true;

      this.messageBar.showWinningMessage(
        this.gameKey,
        `${minutes}:${String(seconds).padStart(2, "0")}`,
      );
    }
  }

  //-----------------------------------
  // DATA
  //-----------------------------------

  getData() {
    return this.game.storyData.story.match(/\S+/g) || [];
  }
}

export default FindNounsGame;
