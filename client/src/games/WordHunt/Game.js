import LandingPage from "./pages/LandingPage";
import FindNounsGame from "./pages/FindNounsGame";
import FindVerbGame from "./pages/FindVerbGame";
import FindAdjectiveGame from "./pages/FindAdjectiveGame";
import MessageBar from "./UI/MessageBar";
import GameManger from "./utils/GameManager";

import GameServiceManager from "./utils/GameServiceManager";
import { getSelectedStoryId } from "../../storyPicker/activeStory";

/*
 * E2E TEST PLUMBING:
 * The bridge reads the existing Game object for Playwright. It does not own or
 * modify Word Hunt gameplay, scoring, hints, timer, queue, or API behavior.
 */
import {
  installWordHuntE2EBridge,
  publishWordHuntE2EState,
} from "./e2eTestBridge";

class Game {
  constructor(setup) {
    this.frame = setup.frame;
    this.stage = setup.stage;
    this.width = setup.W;
    this.height = setup.H;
    this.zim = setup.zim;
    this.serviceManager = new GameServiceManager(this);

    this.authUser = setup.authUser;

    this.data = null;
    this.passageArray = null;
    this.tokenizedArray = null;
    this.storyData = null;
    this.wordTypes = null;

    this.landingPage = null;

    this.findNounsGame = null;
    this.findVerbGame = null;
    this.findAdjectiveGame = null;

    this.messageBar = new MessageBar(this);

    // game Keys
    this.nounGameKey = "Noun";
    this.verbGameKey = "Verb";
    this.adjGameKey = "Adjective";

    // game logic variables
    // Story is whatever the player chose on the picker this session.
    this.currentStoryId = getSelectedStoryId();
    this.currentGameId = null;
    this.gameTime = 0;
    this.isInputLocked = false;

    // BASE SETTINGS
    this.WORD_TIMING = 5 / 60; // five seconds per word to find
    this.BASE_SCORE = 10;
    this.BASE_PENALTY = 0.25;
    this.BASE_HINTS = 1;
    this.BASE_COIN = 2; // FOR EACH 20 points 2 coins
    this.BASE_COIN_SCORE = 20;
    this.languages = ["EN", "SA"];
    this.LANGUAGE = this.languages[0];

    //score
    this.TOTAL_SCORE = 0;
    this.EARNED_COINS = 0;

    this.gameQueue = [];
    this.currentGameIndex = 0;

    // Player
    this.playerId = this.authUser.id;
    this.player = this.authUser.name;
    this.playerCoins = 0;
    this.totalScore = 0;
    this.maxScore = 0;
    this.allowedHints = 0;
    this.hintPenalty = 0;
    // this.playerInfo = [
    //   // {
    //   //   storyId: "04e9ae48-5570-4cd0-8968-a2179353164b",
    //   //   games: {
    //   //     Noun: {
    //   //       bestTime: "0.13",
    //   //       coins: 0,
    //   //       totalScore: 0,
    //   //     },
    //   //     Verb: {
    //   //       bestTime: "0.25",
    //   //       coins: 0,
    //   //       totalScore: 0,
    //   //     },
    //   //     Adjective: {
    //   //       bestTime: "0.10",
    //   //       coins: 0,
    //   //       totalScore: 0,
    //   //     },
    //   //   },
    //   // },
    // ];
    this.playerInfo = {};
    this.hasGameStarted = false;
    this.isStartingGame = false;

    /*
     * E2E TEST PLUMBING:
     * Install only a gated read-only getState() hook. No production callback,
     * button, timer, score, or queue value is replaced.
     */
    installWordHuntE2EBridge(this);
  }

  //----------------------------------
  // START GAME
  //----------------------------------

  async start() {
    // console.log("Player Info: ", this.player);
    await this.serviceManager.extractGameId();
    this.hasGameStarted = false; // Reset explicitly on menu returns
    if (this.landingPage) {
      this.landingPage.hide();
      this.landingPage = null;
    }
    this.landingPage = new LandingPage(this).createLandingPage();

    /*
     * E2E TEST STATE:
     * The production landing page now exists. Publish a fresh snapshot without
     * changing the page or dispatching any interaction.
     */
    publishWordHuntE2EState(this);

    // 🛠️ FIXED: Removed early API calls from here.
    // They now run dynamically down below when the user taps "Start Adventure".

    this.landingPage.button.tap(async () => {
      this.landingPage.button.mouseEnabled = false;

      // Show a quick visual state clue that it's loading data
      this.landingPage.button.text = "Loading...";
      this.stage.update();

      /*
       * E2E TEST STATE:
       * Observe the existing disabled Start Adventure button as the loading state.
       * The bridge does not introduce or control the loading flag.
       */
      publishWordHuntE2EState(this);

      try {
        // 🛠️ FIXED: Flow control intercepts language configuration on click execution
        if (this.LANGUAGE === "SA") {
          // console.log("Loading Sanskrit pipeline data assets...");
          await this.serviceManager.getPassageByIdSanskrit();
        } else {
          // console.log("Loading English pipeline data assets...");
          await this.serviceManager.getPassageByIdEnglish();
        }
        // writing if the story information only if the language is SA
        await this.serviceManager.writeStoryInfoOnlySA();
        //Writes the story info irrespective of any language
        //NOTE: Before switching Database reset is a must to avoid Conflicts
        // await this.serviceManager.writeStoryInfo();
        await this.serviceManager.retrievePlayerInfo();

        this.landingPage.hide();
        this.initGame();

        /*
         * E2E TEST STATE:
         * initGame() has built the production queue and started its normal countdown.
         */
        publishWordHuntE2EState(this);

        // this.startNounGame();
      } catch (error) {
        console.error("Failed loading backend content: ", error);
        this.landingPage.button.mouseEnabled = true;
        this.landingPage.button.text = "Start Adventure";
        this.stage.update();

        /*
         * E2E TEST STATE:
         * The existing failure path restored the landing button. Publish that current
         * production state; do not suppress or reinterpret the error.
         */
        publishWordHuntE2EState(this);
      }
    });

    this.stage.update();
  }

  destroy() {
    this.hasGameStarted = false;
    this.isInputLocked = true;
    this.messageBar?.clearActiveMessages?.();
    [(this.findNounsGame, this.findVerbGame, this.findAdjectiveGame)].forEach(
      (activeGame) => {
        activeGame?.timer?.stop?.();
        if (activeGame?.controlPanel?.hintAutoCloseTimer) {
          clearTimeout(activeGame.controlPanel.hintAutoCloseTimer);
          activeGame.controlPanel.hintAutoCloseTimer = null;
        }
        activeGame?.messageBar?.clearActiveMessages?.();
        activeGame?.passageDisplay?.destroy?.();
      },
    );

    this.stage.removeAllChildren();
    this.stage.update();
  }
  // Initializing the Games Based on Story Data to Handle No Words to Find

  initGame() {
    if (!this.wordTypes) {
      console.error("Missing word types");
      return;
    }

    this.gameQueue = [];

    if (this.wordTypes.nouns.length > 0) {
      this.gameQueue.push(this.nounGameKey);
    }

    if (this.wordTypes.verbs.length > 0) {
      this.gameQueue.push(this.verbGameKey);
    }

    if (this.wordTypes.adjectives.length > 0) {
      this.gameQueue.push(this.adjGameKey);
    }

    if (this.gameQueue.length === 0) {
      console.log("GAME HAS ENDED - NO WORDS FOUND");
      return;
    }

    this.currentGameIndex = 0;
    this.startCurrentGame();

    /*
     * E2E TEST STATE:
     * Publish the authoritative queue and current index selected by initGame().
     */
    publishWordHuntE2EState(this);
  }
  startCurrentGame() {
    const currentGame = this.gameQueue[this.currentGameIndex];

    // console.log("Starting:", currentGame);

    switch (currentGame) {
      case this.nounGameKey:
        this.startNounGame();
        break;

      case this.verbGameKey:
        this.startVerbGame();
        break;

      case this.adjGameKey:
        this.startAdjectiveGame();
        break;

      default:
        console.log("No game found");
    }

    /*
     * E2E TEST STATE:
     * The existing switch has selected the production noun, verb, or adjective
     * countdown. This is observation only.
     */
    publishWordHuntE2EState(this);
  }

  //----------------------------------
  // NOUN GAME
  //----------------------------------

  startNounGame() {
    if (this.hasGameStarted || this.isStartingGame) return;
    this.isStartingGame = true;
    this.messageBar.countdownTimer(() => {
      this.isStartingGame = false;
      if (this.hasGameStarted) {
        return;
      }
      this.hasGameStarted = true;
      this.findNounsGame = new FindNounsGame(this);

      this.findNounsGame.displayPassage();

      this.stage.update();
    });
  }

  //----------------------------------
  // VERB GAME
  //----------------------------------

  startVerbGame() {
    if (this.hasGameStarted || this.isStartingGame) return;

    this.isStartingGame = true;

    this.messageBar.countdownTimer(() => {
      this.isStartingGame = false;
      if (this.hasGameStarted) {
        return;
      }
      this.hasGameStarted = true;
      this.findVerbGame = new FindVerbGame(this);

      this.findVerbGame.displayPassage();

      this.stage.update();
    });
  }

  //----------------------------------
  // ADJECTIVE GAME
  //----------------------------------

  startAdjectiveGame() {
    if (this.hasGameStarted || this.isStartingGame) return;
    this.isStartingGame = true;
    this.messageBar.countdownTimer(() => {
      this.isStartingGame = false;
      if (this.hasGameStarted) {
        return;
      }
      this.hasGameStarted = true;
      this.findAdjectiveGame = new FindAdjectiveGame(this);

      this.findAdjectiveGame.displayPassage();

      this.stage.update();
    });
  }

  nextGame() {
    this.currentGameIndex++;
    this.hasGameStarted = false;
    this.gameOver = true;
    this.isInputLocked = true;

    this.destroy(); // cleanup timers/listeners

    if (this.currentGameIndex >= this.gameQueue.length) {
      console.log("All Games Completed");
      this.start();
      return;
    }

    this.startCurrentGame();

    /*
     * E2E TEST STATE:
     * Publish the queue position selected by the existing nextGame() progression.
     */
    publishWordHuntE2EState(this);
  }
}

export default Game;
