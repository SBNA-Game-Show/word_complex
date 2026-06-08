import LandingPage from "./pages/LandingPage";
import FindNounsGame from "./pages/FindNounsGame";
import Blackboard from "./UI/Blackboard";
import Chalk from "./UI/Chalk";

class Game {
  constructor(setup) {
    this.stage = setup.stage;
    this.width = setup.W;
    this.height = setup.H;
    this.zim = setup.zim;

    this.landingPage = null;
    this.findNounsGame = null;
  }

  start() {
    this.landingPage = new LandingPage(this).createLandingPage();

    this.landingPage.button.on("click", () => {
      this.showFindNounsGame();
    });

    this.stage.update();
  }

  showFindNounsGame() {
    this.landingPage.hide();

    this.findNounsGame = new FindNounsGame(this);
    this.findNounsGame.displayPassage();

    this.stage.update();
  }
}

export default Game;
