import ZimLabel from "../../../zimcomponents/ZimLabel";
import Blackboard from "../UI/Blackboard";
import BackButton from "../../../zimcomponents/BackButton";
import Chalk from "../UI/Chalk";
import ProgressBar from "../UI/ProgressBar";
import MessageBar from "../UI/MessageBar";
import Timer from "../utils/Timer";
import PassageDisplay from "../UI/PassageDisplay";

import { emit } from "../../../scenes/sceneBus";
import PlayerInformation from "../UI/PlayerInfo";
import GameManger from "../utils/GameManager";

class FindNounsGame {
  constructor(game) {
    this.game = game;
    this.manager = new GameManger(this.game);

    this.nouns = game.wordTypes.nouns;
    this.verbs = game.wordTypes.verbs;
    this.adjectives = game.wordTypes.adjectives;
    this.challenge = `Find All ${this.nouns.length} Nouns`;
    this.timer = new Timer(game, this.game.initialMaxTime);
    this.gameKey = "Nouns";
    this.timeUpKey = "Oops ! Times UP";

    this.score = 0;
    this.foundWords = [];

    this.progressBar = null;
    this.messageBar = null;
    this.playerInformation = null;
    this.passageDisplay = null;

    this.continueButton = null;
    this.exitButton = null;
    this.restartButton = null;

    this.player = this.game.player;

    this.gameOver = false;
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
    this.progressBar = new ProgressBar(this.game, this.challenge);

    const progressBarContainer = this.progressBar.create();

    progressBarContainer.pos(this.blackboard.width - 300, 40);

    progressBarContainer.addTo(this.blackboard);

    this.playerInformation = new PlayerInformation(this.game);
    const playerInfoCont = this.playerInformation.create();

    // FIXED POSITION (top-right HUD)
    playerInfoCont.pos(this.blackboard.width - 880, 20);

    // IMPORTANT: add to stage, NOT blackboard
    playerInfoCont.addTo(this.game.stage);

    //-----------------------------------
    // MESSAGE BAR
    //-----------------------------------

    this.messageBar = new MessageBar(this.game);
    // Continue Button Functionality
    this.messageBar.onContinue = () => {
      this.game.stage.removeAllChildren();
      this.game.startVerbGame();
    };
    // Exiting to Home page
    this.messageBar.onExit = () => {
      this.game.stage.removeAllChildren();
      this.game.start();
    };
    // Restarting same game when time is up
    this.messageBar.onRestart = () => {
      console.log("Restart triggered");

      this.gameOver = false;
      this.foundWords = [];
      this.score = 0;

      this.timer.stop();
      this.game.inputLocked = false;

      this.game.stage.removeAllChildren();
      this.displayPassage();
    };
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
    // Chalk
    //-----------------------------------

    const chalk = new Chalk(this.game);
    chalk.show();

    //-----------------------------------
    // Timer to start the game
    //-----------------------------------

    this.timer.start(
      ({ minutes, seconds }) => {
        if (this.gameOver) {
          return;
        }
        this.progressBar.setTime(minutes, seconds);
      },

      () => {
        if (this.gameOver) {
          return;
        }
        this.progressBar.showTimesUp();

        this.game.inputLocked = true;

        this.messageBar.showTimeOverMessage(this.timeUpKey);
      },
    );

    // 2. Generate container and handle click callbacks
    this.passageDisplay = new PassageDisplay(this.game, this.blackboard);

    const passageDisplayCont = this.passageDisplay.displayPassage(
      (cleanWord, label) => {
        if (this.game.inputLocked) return;
        console.log("CLICKED:", cleanWord);
        //CORRECT NOUN
        if (this.nouns.includes(cleanWord)) {
          if (this.foundWords.includes(cleanWord)) {
            this.game.stage.update();
            return;
          }

          label.mouseEnabled = false;

          this.foundWords.push(cleanWord);
          this.score++;
          console.log("Found Words:", this.foundWords);
          this.progressBar.setFound(this.foundWords.length);

          label.setColor("#00ff88");

          foundWordsLabel.text = this.foundWords.join(", ");

          emit("correct");

          this.checkWin();
        }
        // VERB
        else if (this.verbs.includes(cleanWord)) {
          label.setColor("red");
          this.messageBar.show(`Oops! "${cleanWord}" is a VERB`, 10000);
          emit("wrong");
        }

        // ADJECTIVE
        else if (this.adjectives.includes(cleanWord)) {
          label.setColor("orange");
          this.messageBar.show(`Oops! "${cleanWord}" is a Adjective`, 10000);
          emit("wrong");
        }
        // OTHER
        else {
          label.setColor("#ff6666");
          emit("wrong");
        }
        this.game.stage.update();
      },
    );

    passageDisplayCont.pos(50, 100);
    passageDisplayCont.addTo(this.blackboard);

    // this.data.forEach((sentence) => {
    //   const words = sentence.split(/\s+/);

    //   x = margin;

    //   words.forEach((word) => {
    //     const cleanWord = this.manager.normalize(word);

    //     const label = new ZimLabel(this.game, word, 24, "white");
    //     label.createLabel();

    //     // wrap line
    //     if (x + label.label.width > maxWidth) {
    //       x = margin;
    //       y += lineHeight;
    //     }

    //     label.pos(x, y).addTo(this.blackboard);

    //     x += label.label.width + 14;

    //     label.tap(() => {
    //       if (this.game.inputLocked) return;

    //       console.log("CLICKED:", cleanWord);

    //       // CORRECT NOUN
    //       if (this.nouns.includes(cleanWord)) {
    //         if (this.foundWords.includes(cleanWord)) {
    //           this.game.stage.update();
    //           return;
    //         }

    //         label.mouseEnabled = false;

    //         this.foundWords.push(cleanWord);
    //         this.score++;
    //         this.playerInformation.update(this.score);

    //         this.progressBar.setFound(this.foundWords.length);

    //         label.setColor("#00ff88");

    //         foundWordsLabel.text = this.foundWords.join(", ");

    //         emit("correct");

    //         this.checkWin();
    //       }

    //       // VERB
    //       else if (this.verbs.includes(cleanWord)) {
    //         label.color = "red";
    //         this.messageBar.show(`Oops! "${cleanWord}" is a VERB`, 10000);
    //         emit("wrong");
    //       }

    //       // ADJECTIVE
    //       else if (this.adjectives.includes(cleanWord)) {
    //         label.color = "orange";
    //         this.messageBar.show(`Oops! "${cleanWord}" is a Adjective`, 10000);
    //         emit("wrong");
    //       }

    //       // OTHER
    //       else {
    //         label.color = "#ff6666";
    //         emit("wrong");
    //       }

    //       this.game.stage.update();
    //     });
    //   });

    //   y += lineHeight;
    // });

    this.game.stage.update();
    return this.blackboard;
  }

  //-----------------------------------
  // WIN
  //-----------------------------------
  checkWin() {
    if (this.foundWords.length === this.nouns.length) {
      this.gameOver = true;
      this.timer.stop();
      this.game.totalScore += this.score;

      console.log("Game Total Score", this.game.totalScore);

      const elapsedMs = this.timer.getElapsedTime();

      const minutes = Math.floor(elapsedMs / 60000);
      const seconds = Math.floor((elapsedMs % 60000) / 1000);

      console.log(`TIME USED: ${minutes}:${seconds}`);

      // this.game.inputLocked = true;

      const completionTime = `${minutes}:${String(seconds).padStart(2, "0")}`;
      this.game.bestTimeByStoryId = completionTime;

      this.messageBar.showWinningMessage(this.gameKey, completionTime);
    }
  }
  //-----------------------------------
  // Button Functionality
  //-----------------------------------

  restartButtonTapped() {
    if (!this.restartButton) return;

    this.restartButton.tap(() => {
      console.log("Restart Button Tapped");

      this.gameOver = false;
      this.foundWords = [];
      this.score = 0;

      this.timer.stop();
      this.game.inputLocked = false;

      this.game.stage.removeAllChildren();
      this.displayPassage();
    });
  }
}

export default FindNounsGame;
