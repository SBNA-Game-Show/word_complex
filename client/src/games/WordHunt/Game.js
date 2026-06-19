import LandingPage from "./pages/LandingPage";
import FindNounsGame from "./pages/FindNounsGame";
import FindVerbGame from "./pages/FindVerbGame";
import FindAdjectiveGame from "./pages/FindAdjectiveGame";
import MessageBar from "./UI/MessageBar";
import GameManger from "./utils/GameManager";

import {
  retrieveEnglishVersion,
  retrieveSanskritVersion,
} from "../../services/wordHuntService";

class Game {
  constructor(setup) {
    this.frame = setup.frame;
    this.stage = setup.stage;
    this.width = setup.W;
    this.height = setup.H;
    this.zim = setup.zim;
    this.manager = new GameManger(this);

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

    // game logic variables
    this.currentStoryId = "04e9ae48-5570-4cd0-8968-a2179353164b";
    this.firstAttemptTime = 0;
    this.maxTime = 1; // time in minutes
    this.isInputLocked = false;

    // Player
    this.player = "Jack";
    this.playerCoins = 0;
    this.totalScore = 0;

    //player&Game specific
    this.bestTimeByStoryId = null; //  comes from the game collection to be tracked by story id
  }

  //----------------------------------
  // START GAME
  //----------------------------------

  async start() {
    this.landingPage = new LandingPage(this).createLandingPage();
    this.data = await this.getPassageByIdEnglish(this.currentStoryId); //
    this.processDataEnglish();
    // this.data = await this.getPassageByIdSanskrit(this.currentStoryId);
    // this.processDataSanskrit();

    this.messageBar = new MessageBar(this);
    this.manager.setFirstAttemptTime();

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
  //-------------------------
  // API CALL TO GET GAME DATA AND DATA PROCESSING
  //-------------------------
  // English Version
  async getPassageByIdEnglish(storyId) {
    try {
      const response = await retrieveEnglishVersion(storyId);

      console.log("RESPONSE:", response);

      return response;
    } catch (error) {
      console.error("Failed to load story:", error);
    }
  }

  processDataEnglish() {
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
    this.wordTypes = this.splitPOSByTypeEnglish();
    console.log("Word Types:", this.wordTypes);
  }

  splitPOSByTypeEnglish() {
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

  async getPassageByIdSanskrit(storyId) {
    try {
      const response = await retrieveSanskritVersion(storyId);

      console.log("RESPONSE:", response);

      return response;
    } catch (error) {
      console.error("Failed to load story:", error);
    }
  }

  processDataSanskrit() {
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
    this.wordTypes = this.splitPOSByTypeSanskrit();
    console.log("Word Types:", this.wordTypes);
  }

  splitPOSByTypeSanskrit() {
    const nouns = [];
    const verbs = [];
    const adjectives = [];

    // console.log("tokenizedArray =", this.tokenizedArray);

    this.tokenizedArray.forEach((sentence, i) => {
      // console.log("sentence", i, sentence);

      sentence.forEach((token) => {
        // console.log("text:", token.text, "upos:", token.upos);

        if (token.upos === "NOUN")
          nouns.push(this.manager.normalize(token.text));
        if (token.upos === "VERB")
          verbs.push(this.manager.normalize(token.text));
        if (token.upos === "ADJ")
          adjectives.push(this.manager.normalize(token.text));
      });
    });

    // console.log("NOUNS", nouns);
    // console.log("VERBS", verbs);
    // console.log("ADJECTIVES", adjectives);

    return { nouns, verbs, adjectives };
  }
}

export default Game;
