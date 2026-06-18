import LandingPage from "./pages/LandingPage";
import FindNounsGame from "./pages/FindNounsGame";
import FindVerbGame from "./pages/FindVerbGame";
import FindAdjectiveGame from "./pages/FindAdjectiveGame";

import retrieveEnglishVersion from "../../services/wordHuntService";

class Game {
  constructor(setup) {
    this.frame = setup.frame;
    this.stage = setup.stage;
    this.width = setup.W;
    this.height = setup.H;
    this.zim = setup.zim;

    this.data = null;
    this.passageArray = null;
    this.tokenizedArray = null;
    this.storyData = null;
    this.wordTypes = null;

    this.landingPage = null;

    this.findNounsGame = null;
    this.findVerbGame = null;
    this.findAdjectiveGame = null;

    // game logic variables
    this.initialMaxTime = 1;
    this.maxTime = 1; // time in minutes
    this.isInputLocked = false;
    this.isTimerRunning = false;
  }

  //----------------------------------
  // START GAME
  //----------------------------------

  async start() {
    this.landingPage = new LandingPage(this).createLandingPage();
    this.data = await this.getPassageById();
    this.processData();

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
  // API CALL TO GET GAME DATA AND DATA PROCESSING
  //-------------------------

  async getPassageById() {
    try {
      const storyId = "04e9ae48-5570-4cd0-8968-a2179353164b";

      const response = await retrieveEnglishVersion(storyId);

      console.log("RESPONSE:", response);

      return response;
    } catch (error) {
      console.error("Failed to load story:", error);
    }
  }

  processData() {
    if (!this.data) {
      console.log("Backend Not Connected");
      return;
    }
    this.storyData = {
      story: this.data.passage,
    };

    this.passageArray = this.data.passageArray;
    this.tokenizedArray = this.data.tokenizedPassage;
    // console.log("Tokenized Array : ", this.tokenizedArray);
    this.wordTypes = this.splitPOSByType();
    console.log("Word Types:", this.wordTypes);
  }

  splitPOSByType() {
    const nouns = [];
    const verbs = [];
    const adjectives = [];

    this.tokenizedArray.forEach((item) => {
      // console.log("ITEM 0 IN TOKENZIED ARRAY:", item.text);
      if (item.pos === "NOUN") {
        nouns.push(item.text);
      }
      if (item.pos === "VERB") {
        verbs.push(item.text);
      }

      if (item.pos === "ADJ") {
        adjectives.push(item.text);
      }
    });

    return {
      nouns,
      verbs,
      adjectives,
    };
  }

}

export default Game;
