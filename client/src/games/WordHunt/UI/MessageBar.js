import ZimLabel from "../../../zimcomponents/ZimLabel";
import ZimContainer from "../../../zimcomponents/ZimContainer";

class MessageBar {
  constructor(game) {
    this.game = game;

    this.isActive = false;

    this.container = null;
    this.label = null;
    this.timeout = null;
  }

  show(text, color = "black", duration = 1200) {
    this.game.isInputLocked = true;
    if (this.container) {
      this.container.removeFrom();
      clearTimeout(this.timeout);
    }

    this.container = new ZimContainer(this.game, 420, 120).createContainer();

    // 1. ADD FIRST
    this.container.addTo(this.game.stage);

    // 2. THEN CENTER
    this.container.pos(
      this.game.width / 2 - 250,
      this.game.height / 2 - 100,
      CENTER,
      CENTER,
    );

    this.container.alpha = 0.95;

    const bg = new this.game.zim.Rectangle({
      width: 420,
      height: 120,
      color: "#FFF8F0",
      corner: 16,
      borderColor: "#E9D8A6",
      borderWidth: 2,
    });

    bg.addTo(this.container);

    this.label = new ZimLabel(this.game, text, 26, color).createLabel();
    this.label.addTo(this.container);
    // vertical stack system (future-proof)
    this.label.pos(
      this.container.width / 2 - 550,
      this.container.height / 2 - 300,
    );

    this.game.stage.update();

    this.timeout = setTimeout(() => {
      if (this.container) {
        this.container.removeFrom();
        this.container = null;
        this.game.isInputLocked = false;
        this.game.stage.update();
      }
    }, duration);

    return this.container;
  }
  showWinningMessage() {
    
  }
}

export default MessageBar;
