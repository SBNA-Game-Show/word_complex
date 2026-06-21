import ZimButton from "../ZimComponents/ZimButtonNew";
import ZimLabel from "../ZimComponents/ZimLabelNew";
import ZimContainer from "../ZimComponents/ZimContainerNew";
import BackButton from "../../../zimcomponents/BackButton";

class ControlPanel {
  constructor(game) {
    this.game = game;
    this.zim = game.zim;

    this.eyeEmojiWrapper = null;
    this.blinkTimer = 0;
    this.isClosed = true;
    this.nextButton = null;
    this.onNextClicked = null;
    this.hintClicked = null;

    this.hintCounter = 0;
    this.isProcessingClick = false;

    // Track the active 10-second close timer instance
    this.hintAutoCloseTimer = null;
  }

  create() {
    console.log("Control panel Created");
    const panelWidth = 350;
    const panelHeight = 100;
    const panel = new ZimContainer(
      this.game,
      panelWidth,
      panelHeight,
    ).createContainer();

    //-----------------------------------
    // PANEL BACKGROUND
    //-----------------------------------
    const bg = new this.zim.Rectangle({
      width: panelWidth,
      height: panelHeight,
      color: "#1E3A1E",
      corner: 15,
    });
    bg.addTo(panel);

    //-----------------------------------
    // CENTER: INTERACTIVE EYE EMOJI (WITH AUTO-CLOSE)
    //-----------------------------------
    this.eyeEmojiWrapper = new ZimLabel(this.game, "😑", 36).createLabel();
    this.eyeEmojiWrapper.addTo(panel);

    const emojiDisplay = this.eyeEmojiWrapper.label;
    emojiDisplay.reg(emojiDisplay.width / 2, emojiDisplay.height / 2);
    emojiDisplay.pos(150, 30);

    this.eyeEmojiWrapper.tap(() => {
      if (this.isProcessingClick) return;
      this.isProcessingClick = true;

      // Always clear any active countdown timer when manually interacting
      if (this.hintAutoCloseTimer) {
        clearTimeout(this.hintAutoCloseTimer);
        this.hintAutoCloseTimer = null;
      }

      this.isClosed = !this.isClosed;
      const targetLabel = this.eyeEmojiWrapper.label;

      if (!this.isClosed) {
        // --- OPEN STATE ---
        targetLabel.text = "👁️";

        if (this.hintClicked) {
          this.hintClicked();
          this.hintCounter += 1;
          console.log("Hint Counter: ", this.hintCounter);
        }

        // START 10-SECOND COUNTDOWN ENGINE
        this.hintAutoCloseTimer = setTimeout(() => {
          this.isClosed = true;
          targetLabel.text = "😑"; // Automatically flip back to closed frame

          // Re-balance bounds tracking configurations on timeout execution
          targetLabel.reg(targetLabel.width / 2, targetLabel.height / 2);
          targetLabel.pos(150, 30);
          this.game.stage.update();

          console.log("Hint expired and closed automatically.");
          this.hintAutoCloseTimer = null;
        }, 10000); // 10000ms = 10 seconds
      } else {
        // --- MANUAL CLOSE STATE ---
        targetLabel.text = "😑";
        console.log("Hint Hidden.");
      }

      // Re-align bounds origin settings for immediate clicks
      targetLabel.reg(targetLabel.width / 2, targetLabel.height / 2);
      targetLabel.pos(150, 30);
      this.game.stage.update();

      setTimeout(() => {
        this.isProcessingClick = false;
      }, 50);
    });

    //-----------------------------------
    // SIDE BUTTONS BAR
    //-----------------------------------
    const backBtn = new BackButton(this.game, panel);
    const backBtnInstance = backBtn.create();

    if (backBtnInstance && typeof backBtnInstance.pos === "function") {
      backBtnInstance.pos(20, 31);
    }

    this.nextButton = new ZimButton(
      this.game,
      90,
      38,
      "Next →",
      14,
    ).createButton();

    this.nextButton.pos(240, 31);
    this.nextButton.addTo(panel);
    this.nextButton.tap(() => {
      if (this.onNextClicked) {
        this.onNextClicked();
      }
    });

    panel.nextButton = this.nextButton;

    return panel;
  }
}

export default ControlPanel;
