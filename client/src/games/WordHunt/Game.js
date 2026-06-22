import LandingPage from "./pages/LandingPage";
import FindNounsGame from "./pages/FindNounsGame";
import FindVerbGame from "./pages/FindVerbGame";
import FindAdjectiveGame from "./pages/FindAdjectiveGame";
import MessageBar from "./UI/MessageBar";
import GameManger from "./utils/GameManager";

import GameServiceManager from "./utils/GameServiceManager";

class Game {
  constructor(setup) {
    this.frame = setup.frame;
    this.stage = setup.stage;
    this.width = setup.W;
    this.height = setup.H;
    this.zim = setup.zim;
    this.manager = new GameManger(this);
    this.serviceManager = new GameServiceManager(this);

    this.data = null;
    this.passageArray = null;
    this.tokenizedArray = null;
    this.storyData = null;
    this.wordTypes = null;

    this.landingPage = null;

    this.findNounsGame = null;
    this.findVerbGame = null;
    this.findAdjectiveGame = null;

    this.messageBar = null;

    // game Keys
    this.nounGameKey = "Noun";
    this.verbGameKey = "Verb";
    this.adjGameKey = "Adjective";

    // game logic variables
    this.currentStoryId = "04e9ae48-5570-4cd0-8968-a2179353164b";
    this.gameTime = 0;
    this.isInputLocked = false;
    this.activeConfig = null

    // Player
    this.player = "Jack";
    this.playerCoins = 0;
    this.totalScore = 0;
    this.playerInfo = [
      // {
      //   storyId: "04e9ae48-5570-4cd0-8968-a2179353164b",
      //   games: {
      //     Noun: {
      //       bestTime: "0.20",
      //       coins: 0,
      //       totalScore: 0,
      //     },
      //     Verb: {
      //       bestTime: "0.00",
      //       coins: 0,
      //       totalScore: 0,
      //     },
      //     Adjective: {
      //       bestTime: "0.00",
      //       coins: 0,
      //       totalScore: 0,
      //     },
      //   },
      // },
    ];
  }

  //----------------------------------
  // START GAME
  //----------------------------------

  async start() {
    this.landingPage = new LandingPage(this).createLandingPage();

    await this.serviceManager.getPassageByIdEnglish();
    // await this.serviceManager.getPassageByIdSanskrit()

    this.messageBar = new MessageBar(this);

    this.landingPage.button.tap(() => {
      // console.log("Button Tapped");
      this.landingPage.hide();
      this.messageBar.countdownTimer(() => {
        // ✅ ONLY START GAME AFTER COUNTDOWN FINISHES
        this.startNounGame();
      });
    });

    this.stage.update();
  }

  //----------------------------------
  // NOUN GAME
  //----------------------------------

  startNounGame() {
    this.findNounsGame = new FindNounsGame(this);

    this.findNounsGame.displayPassage();

    this.stage.update();
  }

  //----------------------------------
  // VERB GAME
  //----------------------------------

  startVerbGame() {
    this.findVerbGame = new FindVerbGame(this);

    this.findVerbGame.displayPassage();

    this.stage.update();
  }

  //----------------------------------
  // ADJECTIVE GAME
  //----------------------------------

  startAdjectiveGame() {
    this.findAdjectiveGame = new FindAdjectiveGame(this);

    this.findAdjectiveGame.displayPassage();

    this.stage.update();
  }
}

export default Game;
