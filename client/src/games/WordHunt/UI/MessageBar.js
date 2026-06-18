import ZimLabel from "../../../zimcomponents/ZimLabel";
import ZimContainer from "../../../zimcomponents/ZimContainer";
import ZimButton from "../../../zimcomponents/ZimButton";

class MessageBar {
  constructor(game) {
    this.game = game;

    this.isActive = false;

    this.messageContainer = null;
    this.label = null;
    this.winningContainer = null;
    this.winningLabel = null;

    this.timeout = null;

    this.bestTime = this.game.bestTimeByStoryId;

    this.continueButton = null;
    this.exitButton = null;
  }

  show(text, color = "black", duration = 1200) {
    this.game.isInputLocked = true;
    if (this.messageContainer) {
      this.messageContainer.removeFrom();
      clearTimeout(this.timeout);
    }

    this.messageContainer = new ZimContainer(
      this.game,
      420,
      120,
    ).createContainer();

    // 1. ADD FIRST
    this.messageContainer.addTo(this.game.stage);

    // 2. THEN CENTER
    this.messageContainer.pos(
      this.game.width / 2 - 250,
      this.game.height / 2 - 100,
      CENTER,
      CENTER,
    );

    this.messageContainer.alpha = 0.95;

    const bg = new this.game.zim.Rectangle({
      width: 420,
      height: 120,
      color: "#FFF8F0",
      corner: 16,
      borderColor: "#E9D8A6",
      borderWidth: 2,
    });

    bg.addTo(this.messageContainer);

    this.label = new ZimLabel(this.game, text, 26, color).createLabel();
    this.label.addTo(this.messageContainer);
    // vertical stack system (future-proof)
    this.label.pos(
      this.messageContainer.width / 2 - 550,
      this.messageContainer.height / 2 - 300,
    );

    this.game.stage.update();

    this.timeout = setTimeout(() => {
      if (this.messageContainer) {
        this.messageContainer.removeFrom();
        this.messageContainer = null;
        this.game.isInputLocked = false;
        this.game.stage.update();
      }
    }, duration);

    return this.messageContainer;
  }
  showWinningMessage(text, time, color = "black") {
    this.game.isInputLocked = true;

    if (this.winningContainer) {
      this.winningContainer.removeFrom();
    }

    this.winningContainer = new ZimContainer(
      this.game,
      500,
      300,
    ).createContainer();

    // ADD TO STAGE
    this.winningContainer.addTo(this.game.stage);

    // CENTER IT
    this.winningContainer.pos(
      this.game.width / 2 - 250,
      this.game.height / 2 - 150,
    );

    const bg = new this.game.zim.Rectangle({
      width: 500,
      height: 200,
      color: "#FFF8F0",
      corner: 16,
      borderColor: "#E9D8A6",
      borderWidth: 2,
    });

    bg.addTo(this.winningContainer);

    this.winningLabel = new ZimLabel(this.game, "", 18, "black", "pointer", {
      lineWidth: 420, // 👈 THIS FIXES OVERFLOW
      align: "center",
    }).createLabel();
    this.winningLabel.setText(
      `You have found all ${text} in ${time}. Previous Best Time ${this.bestTime} with same Passage.`,
    );

    this.winningLabel.addTo(this.winningContainer);

    this.winningLabel.pos(20, 20);

    this.continueButton = new ZimButton(this.game, 160, 40, "Continue");

    const continueBtn = this.continueButton.createButton();
    continueBtn.addTo(this.winningContainer);
    continueBtn.pos(50, 100);

    this.exitButton = new ZimButton(this.game, 120, 40, "Exit");
    const exitBtn = this.exitButton.createButton();
    exitBtn.addTo(this.winningContainer);
    exitBtn.pos(250, 100);

    this.game.stage.update();

    return this.winningContainer;
  }
}

export default MessageBar;
