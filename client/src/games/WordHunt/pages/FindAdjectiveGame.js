import ZimLabel from "../../../zimcomponents/ZimLabel";
import Blackboard from "../UI/Blackboard";
import Chalk from "../UI/Chalk";
import { emit } from "../../../scenes/sceneBus";
import GameManager from "../utils/GameManager";
import Timer from "../utils/Timer";
import MessageBar from "../UI/MessageBar";
import ProgressBar from "../UI/ProgressBar";
import PlayerInformation from "../UI/PlayerInfo";
import ControlPanel from "../UI/Panel";
import FoundContainer from "../UI/FoundWords";
import PassageDisplay from "../UI/PassageDisplay";

class FindAdjectiveGame {
  constructor(game) {
    this.game = game;
    this.manager = new GameManager(game);

    this.adjectives = game.wordTypes.adjectives;
    this.nouns = game.wordTypes.nouns;
    this.verbs = game.wordTypes.verbs;
    this.challenge = `Find All ${this.adjectives.length} Adjectives`;
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
    this.hintUsed = 0;

    this.gameOver = false;

    this.timeUpKey = "Oops ! Times UP";
  }

  //-----------------------------------
  // DISPLAY PASSAGE
  //-----------------------------------

  displayPassage() {
    console.log("Adjectives: ", this.adjectives);

    this.manager.setGameTime(this.game.adjGameKey);
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
    // Restarting the Noun Game
    this.messageBar.onContinue = () => {
      this.gameOver = true;
      this.timer.stop();
      this.game.hasGameStarted = false;
      this.game.stage.removeAllChildren();
      this.game.startNounGame();
      this.foundWordsCont.reset();
    };
    //MOVING TO LANDING  PAGE
    this.messageBar.onExit = () => {
      this.gameOver = true;
      this.timer.stop();
      this.foundWordsCont.reset();
      this.game.hasGameStarted = false;
      this.game.stage.removeAllChildren();
      this.game.start();
    };

    // Restart the same game
    this.messageBar.onRestart = () => {
      console.log("Restart Trigerred");
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
      this.timer.stop();
      this.game.hasGameStarted = false;
      this.game.stage.removeAllChildren();
      this.game.start();
      emit("hint", { text: "More Coming Soon" });
    };

    // Highlighting Adjectives green when hint is clicked

    this.controlPanel.hintClicked = () => {
      if (this.passageDisplay && this.passageDisplay.wordLabels) {
        this.passageDisplay.wordLabels.forEach((wordObj) => {
          if (this.adjectives.includes(wordObj.text)) {
            if (!this.foundWords.includes(wordObj.text)) {
              wordObj.instance.setColor("green");
              this.game.isInputLocked = true;
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
          if (this.adjectives.includes(wordObj.text)) {
            wordObj.instance.setColor("white");
          }
        });
        this.game.stage.update();
      }
    };

    //-----------------------------------
    // FOUND WORDS BOX
    //-----------------------------------

    this.foundWordsCont = new FoundContainer(this.game, this.game.adjGameKey);
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
            this.game.adjGameKey,
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
    if (this.passageDisplay) {
      this.passageDisplay.destroy();
    }
    this.passageDisplay = new PassageDisplay(this.game, this.blackboard);
    const passageDisplayCont = this.passageDisplay.displayPassage(
      (cleanWord, label) => {
        if (this.game.isInputLocked) {
          return;
        }
        // Game Logic
        //-----------------------------------
        // CORRECT ADJECTIVE
        //-----------------------------------
        if (this.adjectives.includes(cleanWord)) {
          if (this.foundWords.includes(cleanWord)) {
            this.game.stage.update();
            return;
          }

          label.mouseEnabled = false;
          label.cursor = "default";

          this.foundWords.push(cleanWord);
          this.hintUsed = this.controlPanel.hintCounter;
          const pointsEarned = this.manager.setScore(
            this.game.adjGameKey,
            this.foundWords.length,
            this.hintUsed,
          );

          this.score += pointsEarned;
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
            test: `Oops! "${cleanWord}" is a Noun. ${definition}`,
          });
        }
        //-----------------------------------
        // VERB
        //-----------------------------------
        else if (this.verbs.includes(cleanWord)) {
          label.setcolor("orange");

          const definition = this.manager.defineVerb();

          emit("hint", {
            text: `Oops! "${cleanWord}" is a VERB. ${definition}`,
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
    if (this.foundWords.length === this.adjectives.length) {
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

      this.game.inputLocked = true;

      const completionTime = `${minutes}:${String(seconds).padStart(2, "0")}`;

      this.messageBar.showWinningMessage(this.game.nounGameKey, completionTime);
      const res = await this.manager.writeGameInformation(
        completionTime,
        this.hintsUsed,
        this.foundWords.length,
        this.game.adjGameKey,
      );
      this.game.hasGameStarted = false;
      emit("complete");
    }
  }
}

export default FindAdjectiveGame;
