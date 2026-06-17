import LandingPage from "./pages/LandingPage";
import FindNounsGame from "./pages/FindNounsGame";
import FindVerbGame from "./pages/FindVerbGame";
import FindAdjectiveGame from "./pages/FindAdjectiveGame";

import retrieveEnglishVersion from "../../services/wordHuntService";

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
    this.landingPage = new LandingPage(this).createLandingPage();

    this.getPassageById();

    this.landingPage.button.tap(() => {
      console.log("Button Tapped");
      this.landingPage.hide();

      this.startNounGame();
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
  //-------------------------
  // API CALL to get Game Data

  async getPassageById() {
    try {
      const storyId = "04e9ae48-5570-4cd0-8968-a2179353164b";

      console.log("Calling API with id: ", storyId);

      const response = await retrieveEnglishVersion(storyId);

      console.log("RESPONSE:", response);

      this.storyData = response;
    } catch (error) {
      console.error("Failed to load story:", error);
    }
  }
}

export default Game;
