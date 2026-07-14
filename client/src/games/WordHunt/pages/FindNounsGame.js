import ZimLabel from "../ZimComponents/ZimLabelNew";
import Blackboard from "../UI/Blackboard";
import BackButton from "../ZimComponents/BackButton";
import Chalk from "../UI/Chalk";
import ProgressBar from "../UI/ProgressBar";
import MessageBar from "../UI/MessageBar";
import Timer from "../utils/Timer";
import PassageDisplay from "../UI/PassageDisplay";
import ControlPanel from "../UI/Panel";

import { emit } from "../../../scenes/sceneBus";
import PlayerInformation from "../UI/PlayerInfo";
import GameManger from "../utils/GameManager";
import FoundContainer from "../UI/FoundWords";

class FindNounsGame {
  constructor(game) {
    this.game = game;
    this.manager = new GameManger(game);

    this.nouns = game.wordTypes.nouns;
    this.verbs = game.wordTypes.verbs;
    this.adjectives = game.wordTypes.adjectives;
    this.challenge = `Find All ${this.nouns.length} Nouns`;
    this.timer = new Timer(game);

    this.score = 0;
    this.foundWords = [];

    this.blackboard = null;
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
    this.hintsUsed = 0;

    this.gameOver = false;

    this.timeUpKey = "Oops ! Times UP";
  }

  displayPassage() {
    //-----------------------------------
    // Initializing RunTime Parameters
    //-----------------------------------
    this.manager.setGameTime(this.game.nounGameKey);
    console.log("Nouns From Game: ", this.nouns);
    this.game.hasGameStarted = true;
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
    // HEADER
    //-----------------------------------
    // PROGRESS BAR
    this.progressBar = new ProgressBar(this.game, this.challenge);
    const progressBarContainer = this.progressBar.create();
    progressBarContainer.pos(this.blackboard.width - 300, 40);
    progressBarContainer.addTo(this.blackboard);
    // PLAYER INFORMATION SCORE, COINS
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
      this.gameOver = true;
      this.timer.stop();
      this.game.hasGameStarted = false;
      this.game.stage.removeAllChildren();
      this.game.startVerbGame();
      this.foundWordsCont.reset();
      this.game.isInputLocked = false;
    };
    // Exiting to Home page
    this.messageBar.onExit = () => {
      this.gameOver = true;
      this.timer.stop();
      this.game.hasGameStarted = false;
      this.foundWordsCont.reset();
      this.game.stage.removeAllChildren();
      this.game.isInputLocked = false;
      this.game.start();
    };
    // Restarting same game when time is up
    this.messageBar.onRestart = () => {
      // console.log("Restart triggered");
      this.gameOver = false;
      this.timer.stop();

      this.foundWordsCont.reset();
      this.foundWords = [];
      this.score = 0;
      this.game.hasGameStarted = false;
      this.game.TOTAL_SCORE = 0;

      this.game.isInputLocked = false;

      this.game.stage.removeAllChildren();
      this.displayPassage();
    };

    //-----------------------------------
    // Control Panel Configuration
    //-----------------------------------
    this.controlPanel = new ControlPanel(this.game);
    const controlPanelCont = this.controlPanel.create();
    controlPanelCont.pos(this.blackboard.width - 1225, 20);
    controlPanelCont.addTo(this.blackboard);

    this.controlPanel.onBackClicked = () => {
      this.gameOver = true;
      this.timer.stop();
      this.game.hasGameStarted = false;
      this.game.stage.removeAllChildren();
      this.game.start();
    };

    this.controlPanel.onNextClicked = () => {
      this.gameOver = true;
      this.game.hasGameStarted = false;
      this.timer.stop();
      this.game.stage.removeAllChildren();
      this.game.startVerbGame();
    };

    // 1. Highlight nouns as green when clicked
    this.controlPanel.hintClicked = () => {
      // console.log("Hint Clicked - Highlighting Nouns");
      if (this.passageDisplay && this.passageDisplay.wordLabels) {
        this.passageDisplay.wordLabels.forEach((wordObj) => {
          if (this.nouns.includes(wordObj.text)) {
            // Only paint un-found words blue (leave found words green)
            if (!this.foundWords.includes(wordObj.text)) {
              wordObj.instance.setColor("green");
            }
          }
        });
        this.game.stage.update();
      }
    };

    // 2. Removing
    this.controlPanel.onHintExpired = () => {
      // console.log("Hint Expired - Removing Highlights");
      if (this.passageDisplay && this.passageDisplay.wordLabels) {
        this.passageDisplay.wordLabels.forEach((wordObj) => {
          if (this.nouns.includes(wordObj.text)) {
            // Revert back to white only if the word hasn't been found yet
            if (!this.foundWords.includes(wordObj.text)) {
              wordObj.instance.setColor("white");
            }
          }
        });
        this.game.stage.update();
      }
    };
    //-----------------------------------
    // FOUND VERBS BOX
    //-----------------------------------

    this.foundWordsCont = new FoundContainer(this.game, this.game.nounGameKey);
    const foundWordsContainer = this.foundWordsCont.update();

    this.foundWordsCont.pos(40, 500);
    this.foundWordsCont.addTo(this.blackboard);

    //-----------------------------------
    // Timer to start the game
    //-----------------------------------

    this.timer.minutes = this.game.gameTime;

    this.timer.start(
      ({ minutes, seconds }) => {
        if (this.gameOver || !this.game.hasGameStarted) {
          return;
        }
        this.progressBar.setTime(minutes, seconds);
      },

      async () => {
        // console.log("TIMEOUT CALLBACK");
        // console.log("gameOver =", this.gameOver);
        // console.log("found =", this.foundWords.length);
        if (this.gameOver || !this.game.hasGameStarted) {
          return;
        }
        this.gameOver = true;
        const elapsedMs = this.timer.getElapsedTime();
        const minutes = Math.floor(elapsedMs / 60000);
        const seconds = Math.floor((elapsedMs % 60000) / 1000);
        const completionTime = `${minutes}:${String(seconds).padStart(2, "0")}`;
        this.game.isInputLocked = true;
        this.progressBar.showTimesUp();
        this.game.TOTAL_SCORE += this.score;
        this.playerInformation.update(this.score);

        this.messageBar.showTimeOverMessage(this.timeUpKey);
        if (this.foundWords.length >= 2) {
          const res = await this.manager.writeGameInformation(
            completionTime,
            this.hintsUsed,
            this.foundWords.length,
            this.game.nounGameKey,
          );
          // console.log(res);
        }
        emit("hint", { text: this.timeUpKey });

        this.game.stage.update();
      },
    );

    //-----------------------------------
    // DISPLAYING PASSAGE AND HANDLING GAME LOGIC
    //-----------------------------------

    // 2. Generate container and handle click callbacks
    if (this.passageDisplay) {
      this.passageDisplay.destroy();
    }
    this.passageDisplay = new PassageDisplay(this.game, this.blackboard);

    const passageDisplayCont = this.passageDisplay.displayPassage(
      (cleanWord, label) => {
        if (this.game.isInputLocked) return;
        // console.log("CLICKED TARGET WORD:", cleanWord);

        // CORRECT NOUN MATCH
        if (this.nouns.includes(cleanWord)) {
          if (this.foundWords.includes(cleanWord)) {
            this.game.stage.update();
            return;
          }

          label.mouseEnabled = false;
          label.cursor = "default"; // Revert cursor back once found

          this.foundWords.push(cleanWord);
          // this.score++;
          this.hintsUsed = this.controlPanel.hintCounter;
          const pointsEarned = this.manager.setScore(
            this.game.nounGameKey,
            this.foundWords.length,
            this.hintsUsed,
          );
          this.score += pointsEarned;
          // console.log("New Score: ", this.score);
          this.playerInformation.update(this.score);
          this.progressBar.setFound(this.foundWords.length);

          label.setColor("#00ff88");
          // foundWordsLabel.text = this.foundWords.join(", ");
          this.foundWordsCont.addWord(cleanWord);

          emit("correct");
          this.checkWin();
        }
        // INCORRECT VERB MATCH
        else if (this.verbs.includes(cleanWord)) {
          label.setColor("red");
          const definition = this.manager.defineVerb();
          emit("hint", {
            text: `Oops! "${cleanWord}" is a VERB. ${definition}`,
          });
        }
        // INCORRECT ADJECTIVE MATCH
        else if (this.adjectives.includes(cleanWord)) {
          label.setColor("orange");
          const definition = this.manager.defineAdjective();
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
  async checkWin() {
    // console.log("NOUN CHECKWIN", this.foundWords.length, this.nouns.length);
    if (this.foundWords.length === this.nouns.length) {
      this.gameOver = true;
      this.timer.stop();

      const elapsedMs = this.timer.getElapsedTime();

      const minutes = Math.floor(elapsedMs / 60000);
      const seconds = Math.floor((elapsedMs % 60000) / 1000);

      // console.log(`TIME USED: ${minutes}:${seconds}`);
      const acquiredTotalScore = this.manager.setGameTotal(
        this.foundWords.length,
        elapsedMs,
        this.score,
      );
      this.game.TOTAL_SCORE += acquiredTotalScore;
      // console.log("New Game Total: ", acquiredTotalScore);

      const earnedCoins = this.manager.assignCoins(acquiredTotalScore);
      // console.log("COINS ASSIGNED: ", earnedCoins);
      this.game.EARNED_COINS += earnedCoins;
      // console.log("GAME Earned POints: ", this.game.EARNED_COINS);
      this.playerInformation.update(this.score);

      this.game.isInputLocked = true;

      const completionTime = `${minutes}:${String(seconds).padStart(2, "0")}`;

      this.messageBar.showWinningMessage(this.game.nounGameKey, completionTime);
      const res = await this.manager.writeGameInformation(
        completionTime,
        this.hintsUsed,
        this.foundWords.length,
        this.game.nounGameKey,
      );
      // console.log(res);
      this.game.hasGameStarted = false;
      emit("complete");
    }
  }

  //-----------------------------------
  // Button Functionality
  //-----------------------------------

  restartButtonTapped() {
    if (!this.restartButton) return;

    this.restartButton.tap(() => {
      // console.log("Restart Button Tapped");

      this.gameOver = false;
      this.foundWords = [];
      this.score = 0;

      this.timer.stop();
      this.game.isInputLocked = false;

      this.game.stage.removeAllChildren();
      this.displayPassage();
    });
  }
}

export default FindNounsGame;
