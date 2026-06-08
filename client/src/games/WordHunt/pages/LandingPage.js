import ZimLabel from "../../../zimcomponents/ZimLabel";
import ZimContainer from "../../../zimcomponents/ZimContainer";
import ZimButton from "../../../zimcomponents/ZimButton";
class LandingPage {
  constructor(game) {
    this.game = game;
    this.zim = game.zim;
    this.text = "Let's Test Your Parts of Speech";

    this.container = null;
    this.button = null;
  }

  createLandingPage() {
    this.container = new ZimContainer(this.game).createContainer();

    const zimLabel = new ZimLabel(this.game, this.text).createLabel();

    this.button = new ZimButton(this.game, 200, 60, "Let's Go").createButton();

    zimLabel.centerReg(this.container);

    this.button.centerReg(this.container);
    this.button.y = zimLabel.y + 80;

    zimLabel.addTo(this.container);
    this.button.addTo(this.container);

    this.container.center(this.game.stage);
    this.container.addTo(this.game.stage);

    this.game.stage.update();

    return this;
  }

  hide() {
    this.container.removeFrom();
  }
}

export default LandingPage;
