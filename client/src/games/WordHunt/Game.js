import LandingPage from "./pages/LandingPage";
import FindNounsGame from "./pages/FindNounsGame";
import FindVerbGame from "./pages/FindVerbGame";

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

    this.currentMode = "noun";
    this.modeContainer = null;
  }

  start() {
    this.landingPage =
      new LandingPage(this)
        .createLandingPage();

    this.landingPage.button.on(
      "click",
      () => {
        this.showModeSelection();
      }
    );

    this.stage.update();
  }

  //----------------------------------
  // MODE SELECTION SCREEN
  //----------------------------------

  showModeSelection() {

    this.landingPage.hide();

    this.modeContainer =
      new this.zim.Container(
        this.width,
        this.height
      );

    this.modeContainer.addTo(
      this.stage
    );

    const title =
      new this.zim.Label({
        text: "Choose Hunt Type",
        size: 40,
        color: "#333",
      });

    title.center(
      this.modeContainer
    ).mov(0, -150);

    //----------------------------------
    // NOUN BUTTON
    //----------------------------------

    const nounButton =
      new this.zim.Button({
        width: 450,
        height: 70,
        label: "Find Nouns",
      });

    nounButton.center(
      this.modeContainer
    ).mov(0, -40);

    //----------------------------------
    // VERB BUTTON
    //----------------------------------

    const verbButton =
      new this.zim.Button({
        width: 450,
        height: 70,
        label: "Find Verbs",
      });

    verbButton.center(
      this.modeContainer
    ).mov(0, 60);

    //----------------------------------
    // ADJECTIVE BUTTON
    //----------------------------------

    const adjectiveButton =
      new this.zim.Button({
        width: 450,
        height: 70,
        label: "Find Adjectives",
      });

    adjectiveButton.center(
      this.modeContainer
    ).mov(0, 160);

    //----------------------------------
    // EVENTS
    //----------------------------------

    nounButton.tap(() => {

      this.currentMode = "noun";

      this.startGame();

    });

    verbButton.tap(() => {

      this.currentMode = "verb";

      this.startGame();

    });

    adjectiveButton.tap(() => {

      alert(
        "Adjective Hunt Coming Soon"
      );

    });

    this.stage.update();
  }

  //----------------------------------
  // START GAME
  //----------------------------------

  startGame() {

    if (this.modeContainer) {

      this.modeContainer.removeFrom();

    }

    //----------------------------------
    // NOUN GAME
    //----------------------------------

    if (
      this.currentMode === "noun"
    ) {

      this.findNounsGame =
        new FindNounsGame(this);

      this.findNounsGame
        .displayPassage();

    }

    //----------------------------------
    // VERB GAME
    //----------------------------------

    if (
      this.currentMode === "verb"
    ) {

      this.findVerbGame =
        new FindVerbGame(this);

      this.findVerbGame
        .displayPassage();

    }

    this.stage.update();
  }
}

export default Game;