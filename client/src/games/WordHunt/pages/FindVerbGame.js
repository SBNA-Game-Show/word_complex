import ZimLabel from "../../../zimcomponents/ZimLabel";
import Blackboard from "../UI/Blackboard";
import Chalk from "../UI/Chalk";
import BackButton from "../../../zimcomponents/BackButton";

import { emit } from "../../../scenes/sceneBus";
import Timer from "../utils/Timer";
import GameManager from "../utils/GameManager";
import ProgressBar from "../UI/ProgressBar";
import PlayerInformation from "../UI/PlayerInfo";
import MessageBar from "../UI/MessageBar";
import ControlPanel from "../UI/Panel";
import PassageDisplay from "../UI/PassageDisplay";
import FoundContainer from "../UI/FoundWords";

class FindVerbGame {
  constructor(game) {
    this.game = game;
    this.manager = new GameManager(game);

    this.verbs = game.wordTypes.verbs;
    this.nouns = game.wordTypes.nouns;
    this.adjectives = game.wordTypes.adjectives;
    this.challenge = `Find All ${this.verbs.length} Verbs`;
    this.timer = new Timer(game);

    this.score = 0;
    this.foundWords = [];

    this.progressBar = null;
    this.messageBar = null;
    this.playerInformation = null;
    this.passageDisplay = null;
    this.controlPanel = null;
    this.foundWordsCont = null;

    this.continueButton = null;
    this.exitButton = null;
    this.restartButton = null;

    this.player = this.game.player;
    this.hintUsed = 0;

    this.gameOver = false;

    this.timeUpKey = "Oops ! Times UP";
  }

  displayPassage() {
    console.log("Verbs", this.verbs);
    //-----------------------------------
    // Initializing RunTime Parameters
    //-----------------------------------
    this.manager.setGameTime(this.game.verbGameKey);

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

    //-----------------------------------
    // SCORE
    //-----------------------------------

    const heading = new ZimLabel(
      this.game,
      "Search For All Verbs From The Passage",
    ).createLabel();

    heading.scale = 0.75;
    heading.color = "white";

    heading.pos(180, 20);
    heading.addTo(this.blackboard);

    //-----------------------------------
    // HEADER
    //-----------------------------------
    // PROGRESS BAR FOR TIME TRACKING
    this.progressBar = new ProgressBar(this.game, this.challenge);
    const progressBarContainer = this.progressBar.create();
    progressBarContainer.pos(this.blackboard.width - 300, 40);
    progressBarContainer.addTo(this.blackboard);
    // PLAYER INFORMATION
    this.playerInformation = new PlayerInformation(this.game);
    const playerInfoCont = this.playerInformation.create();
    playerInfoCont.pos(this.blackboard.width - 880, 20);
    playerInfoCont.addTo(this.game.stage);

    //-----------------------------------
    // MESSAGE BAR
    //-----------------------------------

    this.messageBar = new MessageBar(this.game);
    // MOVING FORWARD TO ADJECTIVE GAME
    this.messageBar.onContinue = () => {
      this.timer.stop();
      this.game.stage.removeAllChildren();
      this.game.startAdjectiveGame();
      this.foundWordsCont.reset();
    };
    //MOVING TO LANDING  PAGE
    this.messageBar.onExit = () => {
      this.timer.stop();
      this.foundWordsCont.reset();
      this.game.stage.removeAllChildren();
      this.game.start();
    };

    this.manager.onRestart = () => {
      this.gameOver = false;
      this.foundWordsCont.reset();
      this.foundWords = [];
      this.score = 0;

      this.timer.stop();
      this.game.inputLocked = false;

      this.game.stage.removeAllChildren();
      this.displayPassage();
    };

    //-----------------------------------
    // Control Panel Configuration
    //-----------------------------------
    this.controlPanel = new ControlPanel(this.game);
    const controlPanelCont = this.controlPanel.create();
    controlPanelCont.pos(this.blackboard.width - 1225, 20);

    this.controlPanel.onNextClicked = () => {
      this.timer.stop();
      this.game.stage.removeAllChildren();
      this.game.startAdjectiveGame();
    };

    // Highlighting verbs green when hint is clicked

    this.controlPanel.hintClicked = () => {
      if (this.passageDisplay && this.passageDisplay.wordLabels) {
        this.passageDisplay.wordLabels.forEach((wordObj) => {
          if (this.verbs.includes(wordObj.text)) {
            if (!this.foundWords.includes(wordObj.text)) {
              wordObj.instance.setColor("green");
            }
          }
        });
        this.game.stage.update();
      }
    };
    // Reverting back to white
    this.controlPanel.onHintExpired = () => {
      if (this.passageDisplay && this.passageDisplay.wordLabels) {
        this.passageDisplay.wordLabels.forEach((wordObj) => {
          if (this.verbs.includes(wordObj.text)) {
            wordObj.instance.setColor("white");
          }
        });
        this.game.stage.update();
      }
    };

    //-----------------------------------
    // FOUND VERBS BOX
    //-----------------------------------

    // const foundBox = new this.game.zim.Rectangle({
    //   width: this.blackboard.width - 80,
    //   height: 160,
    //   color: "#274527",
    //   corner: 8,
    // });

    // foundBox.pos(40, this.blackboard.height - 190);

    // foundBox.addTo(this.blackboard);

    // const foundTitle = new this.game.zim.Label({
    //   text: "Found Verbs",
    //   size: 30,
    //   color: "#00ff88",
    // });

    // foundTitle.pos(60, this.blackboard.height - 180);

    // foundTitle.addTo(this.blackboard);

    // const foundWordsLabel = new this.game.zim.Label({
    //   text: "",
    //   size: 24,
    //   color: "white",
    //   align: "left",
    //   lineWidth: this.blackboard.width - 140,
    // });

    // foundWordsLabel.pos(60, this.blackboard.height - 130);

    // foundWordsLabel.addTo(this.blackboard);

    // //-----------------------------------
    // // STORY
    // //-----------------------------------

    // const margin = 60;

    // let x = margin;
    // let y = 160;

    // const lineHeight = 42;

    // const maxWidth = this.blackboard.width - 80;
    this.foundWordsCont = new FoundContainer(this.game);
    const foundWordsContainer = this.foundWordsCont.update();

    this.foundWordsCont.pos(40, 500);
    this.foundWordsCont.addTo(this.blackboard);

    //-----------------------------------
    // Timer to start the game
    //-----------------------------------
    this.timer.minutes = this.game.gameTime;

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
        this.gameOver = true;
        this.game.inputLocked = true;
        this.progressBar.showTimesUp();
        this.game.TOTAL_SCORE += this.score;
        this.playerInformation.update(this.score);

        this.messageBar.showTimeOverMessage(this.timeUpKey);
        emit("hint", { text: this.timeUpKey });

        this.game.stage.update();
      },
    );

    //-----------------------------------
    // DISPLAYING PASSAGE AND HANDLING GAME LOGIC
    //-----------------------------------
    if (this.passageDisplay) {
      this.passageDisplay.destroy();
    }
    this.passageDisplay = new PassageDisplay(this.game, this.blackboard);
    const passageDisplayCont = this.passageDisplay.displayPassage(
      (cleanWord, label) => {
        if (this.game.inputLocked) {
          return;
        }
        // Game Logic

        if (this.verbs.includes(cleanWord)) {
          if (this.foundWords.includes(cleanWord)) {
            this.game.stage.update();
            return;
          }

          // Prevent this label from firing again
          label.mouseEnabled = false;
          label.cursor = "default";

          this.foundWords.push(cleanWord);
          console.log("FOUND =", this.foundWords);
          this.hintUsed = this.controlPanel.hintCounter;
          const pointsEarned = this.manager.setScore(
            this.game.verbGameKey,
            this.foundWords.length,
            this.hintUsed,
          );

          this.score += pointsEarned;
          console.log("New SCORE =", this.score);

          this.playerInformation.update(this.score);
          this.progressBar.setFound(this.foundWords.length);

          label.setColor("#00ff88");

          this.foundWordsCont.addWord(cleanWord);

          emit("correct");

          this.checkWin();
        }
        //-----------------------------------
        // NOUN
        //-----------------------------------
        else if (this.nouns.includes(cleanWord)) {
          label.setColor("red");
          const definition = this.manager.defineNoun();

          emit("hint", {
            text: `Oops! "${cleanWord}" is a Noun. ${definition}`,
          });
        }
        //-----------------------------------
        // ADJECTIVE
        //-----------------------------------
        else if (this.adjectives.includes(cleanWord)) {
          label.setColor("orange");

          messageLabel.text = `Oops! "${cleanWord}" is an adjective`;

          emit("hint", {
            text: `Oops! "${cleanWord}" is an ADJECTIVE. ${definition}`,
          });
        }

        this.game.stage.update();
      },
    );
    passageDisplayCont.pos(50, 150);
    passageDisplayCont.addTo(this.blackboard);

    this.game.stage.update();

    return this.blackboard;
  }

  //-----------------------------------
  // WIN
  //-----------------------------------

  checkWin() {
    if (this.foundWords.length === this.verbs.length) {
      this.gameOver = true;
      this.timer.stop();
      this.game.inputLocked = true;

      const elapsedMs = this.timer.getElapsedTime();
      const minutes = Math.floor(elapsedMs / 60000);
      const seconds = Math.floor((elapsedMs % 60000) / 1000);

      const acquiredTotalScore = this.manager.setGameTotal(
        this.foundWords.length,
        elapsedMs,
        this.score,
      );
      this.game.TOTAL_SCORE += acquiredTotalScore;

      const earnedCoins = this.manager.assignCoins(acquiredTotalScore);
      this.game.EARNED_COINS += earnedCoins;

      this.playerInformation.update(this.score);
      const completionTime = `${minutes}:${String(seconds).padStart(2, "0")}`;
      console.log("Completion time: ", completionTime);
      console.log("GAME KEY", this.game.verbGameKey);

      this.messageBar.showWinningMessage(this.game.verbGameKey, completionTime);
      emit("complete");
    }
  }
}

export default FindVerbGame;
