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
    this.isClosed = false;
  }

  create() {
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
      color: "#1F2937",
      corner: 15,
    });
    bg.addTo(panel);

    //-----------------------------------
    // CENTER: BLINKING EYE EMOJI (Moved Up)
    //-----------------------------------
    this.eyeEmojiWrapper = new ZimLabel(this.game, "👁️", 36).createLabel();
    this.eyeEmojiWrapper.addTo(panel);

    const emojiDisplay = this.eyeEmojiWrapper.label;
    emojiDisplay.reg(emojiDisplay.width / 2, emojiDisplay.height / 2);

    // OPTIMIZED POSITION: Centered at x: 175, and shifted up to y: 32 now that HINT is gone
    emojiDisplay.pos(150, 20);

    this.eyeEmojiWrapper.tap(() => {
      console.log("Hint Emoji clicked!");
    });

    //-----------------------------------
    // SIDE BUTTONS BAR (Cleanly Balanced Underneath)
    //-----------------------------------
    // Left side: Back Button
    const backBtn = new BackButton(this.game, panel);
    const backBtnInstance = backBtn.create();

    if (backBtnInstance && typeof backBtnInstance.pos === "function") {
      // Kept at y: 52 to sit nicely beneath the higher eye placement
      backBtnInstance.pos(20, 20);
    }

    // Right side: Next Button
    const nextButton = new ZimButton(
      this.game,
      90,
      38,
      "Next →",
      14,
    ).createButton();

    // Aligned to y: 52 to perfectly match the Back Button horizontal baseline
    nextButton.pos(240, 20);
    nextButton.addTo(panel);

    panel.nextButton = nextButton;

    return panel;
  }

  /**
   * MAIN ANIMATION UPDATE TICKER
   */
  update() {
    if (!this.eyeEmojiWrapper || !this.eyeEmojiWrapper.label) return;

    this.blinkTimer++;

    if (this.isClosed) {
      if (this.blinkTimer >= 10) {
        this.eyeEmojiWrapper.label.text = "👁️";
        this.isClosed = false;
        this.blinkTimer = 0;
        this.game.stage.update();
      }
    } else {
      if (this.blinkTimer >= 120) {
        this.eyeEmojiWrapper.label.text = "😑";
        this.isClosed = true;
        this.blinkTimer = 0;
        this.game.stage.update();
      }
    }
  }
}

export default ControlPanel;
