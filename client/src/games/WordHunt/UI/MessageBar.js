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
    this.timeOverContainer = null;
    this.timeOverLabel = null;

    this.timeout = null;

    this.bestTime = this.game.bestTimeByStoryId;

    this.continueButton = null;
    this.exitButton = null;
    this.restartButton = null;

    this.onRestart = null
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

    this.messageContainer.addTo(this.game.stage);

    this.messageContainer.pos(
      this.game.width / 2 - 210,
      this.game.height / 2 - 60,
    );

    this.messageContainer.alpha = 0.95;

    // background
    const bg = new this.game.zim.Rectangle({
      width: 420,
      height: 120,
      color: "#FFF8F0",
      corner: 16,
      borderColor: "#E9D8A6",
      borderWidth: 2,
    });

    bg.addTo(this.messageContainer);

    // label
    this.label = new ZimLabel(this.game, text, 26, color).createLabel();

    this.label.addTo(this.messageContainer);

    // ✅ proper centering inside container
    this.label.pos(
      (420 - this.label.label.width) / 2,
      (120 - this.label.label.height) / 2,
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

    // tighter container (no wasted space)
    this.winningContainer = new ZimContainer(
      this.game,
      500,
      180,
    ).createContainer();

    this.winningContainer.addTo(this.game.stage);

    this.winningContainer.pos(
      this.game.width / 2 - 250,
      this.game.height / 2 - 90,
    );

    // background matches container
    const bg = new this.game.zim.Rectangle({
      width: 500,
      height: 180,
      color: "#FFF8F0",
      corner: 16,
      borderColor: "#E9D8A6",
      borderWidth: 2,
    });

    bg.addTo(this.winningContainer);

    // MAIN TEXT
    const message = `You have found all ${text} in ${time.toString()}.\n Previous Best Time ${this.bestTime} with same Passage.`;

    this.winningLabel = new ZimLabel(
      this.game,
      message,
      16,
      color,
    ).createLabel();
    this.winningLabel.addTo(this.winningContainer);

    // center text properly inside 500px width
    this.winningLabel.pos((500 - this.winningLabel.label.width) / 2, 25);

    // BUTTON ROW (centered group)
    const btnY = 110;

    this.continueButton = new ZimButton(this.game, 140, 40, "Continue", 16);
    const continueBtn = this.continueButton.createButton();
    continueBtn.addTo(this.winningContainer);

    this.exitButton = new ZimButton(this.game, 140, 40, "Exit", 16);
    const exitBtn = this.exitButton.createButton();
    exitBtn.addTo(this.winningContainer);

    // group centering (important part)
    const spacing = 20;
    const totalWidth = 140 + 140 + spacing;

    const startX = (500 - totalWidth) / 2;

    continueBtn.pos(startX, btnY);
    exitBtn.pos(startX + 140 + spacing, btnY);

    this.game.stage.update();

    return this.winningContainer;
  }
  showTimeOverMessage(text, color = "black") {
    this.game.isInputLocked = true;

    if (this.timeOverContainer) {
      this.timeOverContainer.removeFrom();
    }

    // smaller container (fits content properly)
    this.timeOverContainer = new ZimContainer(
      this.game,
      500,
      170,
    ).createContainer();

    this.timeOverContainer.addTo(this.game.stage);

    this.timeOverContainer.pos(
      this.game.width / 2 - 250,
      this.game.height / 2 - 85,
    );

    // background matches container
    const bg = new this.game.zim.Rectangle({
      width: 500,
      height: 170,
      color: "#FFF8F0",
      corner: 16,
      borderColor: "#E9D8A6",
      borderWidth: 2,
    });

    bg.addTo(this.timeOverContainer);

    // centered message
    this.timeOverLabel = new ZimLabel(this.game, text, 18, color).createLabel();

    this.timeOverLabel.addTo(this.timeOverContainer);

    // center text horizontally
    this.timeOverLabel.pos((500 - this.timeOverLabel.label.width) / 2, 25);

    // buttons row
    this.restartButton = new ZimButton(this.game, 140, 40, "Restart", 16);
    const restartBtn = this.restartButton.createButton();
    restartBtn.addTo(this.timeOverContainer);
    restartBtn.pos(90, 100);

    restartBtn.tap(() => {
      if (this.onRestart) this.onRestart();
    });

    this.exitButton = new ZimButton(this.game, 140, 40, "Exit", 16);
    const exitBtn = this.exitButton.createButton();
    exitBtn.addTo(this.timeOverContainer);
    exitBtn.pos(270, 100);

    this.game.stage.update();

    return this.timeOverContainer;
  }
}

export default MessageBar;
