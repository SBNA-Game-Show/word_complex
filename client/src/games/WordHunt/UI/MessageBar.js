import ZimLabel from "../../../zimcomponents/ZimLabel";
import ZimContainer from "../../../zimcomponents/ZimContainer";

class MessageBar {
  constructor(game) {
    this.game = game;

    this.container = null;
    this.label = null;
    this.timeout = null;
  }

  show(text, color = "white", duration = 1200) {
    // remove previous popup if exists
    if (this.container) {
      this.container.removeFrom();
      clearTimeout(this.timeout);
    }

    // overlay container
    this.container = new ZimContainer(this.game, 420, 120).createContainer();

    this.container.center(this.game.stage);
    this.container.alpha = 0.95;

    // background box
    const bg = new this.game.zim.Rectangle({
      width: 420,
      height: 120,
      color: "#1E3A1E",
      corner: 16,
      borderColor: "#E9D8A6",
      borderWidth: 3,
    });

    bg.addTo(this.container);

    // message text
    this.label = new ZimLabel(this.game, text, 26, color).createLabel();

    this.label.pos(30, 40);
    this.label.addTo(this.container);

    this.container.addTo(this.game.stage);

    this.game.stage.update();

    // auto remove
    this.timeout = setTimeout(() => {
      if (this.container) {
        this.container.removeFrom();
        this.container = null;
        this.game.stage.update();
      }
    }, duration);

    return this.container;
  }
}

export default MessageBar;
