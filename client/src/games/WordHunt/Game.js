import LandingPage from "./pages/LandingPage";
import FindNounsGame from "./pages/FindNounsGame";
import FindVerbGame from "./pages/FindVerbGame";
import FindAdjectiveGame from "./pages/FindAdjectiveGame";

class Game {
  constructor(setup) {
    this.stage = setup.stage;
    this.width = setup.W;
    this.height = setup.H;
    this.zim = setup.zim;

    this.storyData = setup.storyData;
    this.wordTypes = setup.wordTypes;

    this.landingPage = null;

    this.findNounsGame = null;
    this.findVerbGame = null;
    this.findAdjectiveGame = null;
  }

  //----------------------------------
  // START GAME
  //----------------------------------

  start() {

    this.landingPage =
      new LandingPage(this)
        .createLandingPage();

    this.landingPage.button.tap(() => {

      this.landingPage.hide();

      this.startNounGame();

    });

    this.stage.update();
  }

  //----------------------------------
  // NOUN GAME
  //----------------------------------

  startNounGame() {

    this.findNounsGame =
      new FindNounsGame(this);

    this.findNounsGame
      .displayPassage();

    this.stage.update();
  }

  //----------------------------------
  // VERB GAME
  //----------------------------------

  startVerbGame() {

    this.findVerbGame =
      new FindVerbGame(this);

    this.findVerbGame
      .displayPassage();

    this.stage.update();
  }

  //----------------------------------
  // ADJECTIVE GAME
  //----------------------------------

  startAdjectiveGame() {

    this.findAdjectiveGame =
      new FindAdjectiveGame(this);

    this.findAdjectiveGame
      .displayPassage();

    this.stage.update();
  }
}

export default Game;