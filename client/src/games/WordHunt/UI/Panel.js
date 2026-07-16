import ZimButton from "../ZimComponents/ZimButtonNew";
import ZimLabel from "../ZimComponents/ZimLabelNew";
import ZimContainer from "../ZimComponents/ZimContainerNew";
import BackButton from "../ZimComponents/BackButton";
import MessageBar from "./MessageBar";
import { emit } from "../../../scenes/sceneBus";
import Timer from "../utils/Timer";

class ControlPanel {
  constructor(game) {
    this.game = game;
    this.zim = game.zim;
    this.message = new MessageBar(game);
    this.timer = new Timer(game);

    this.eyeEmojiWrapper = null;
    this.blinkTimer = 0;
    this.isClosed = true;
    this.nextButton = null;
    this.onNextClicked = null;
    this.hintClicked = null;
    this.onBackClicked = null;

    // NEW: Callback triggered when the 10-second timer finishes
    this.onHintExpired = null;

    this.maxHints = null;
    this.hintCounter = 0;
    this.isProcessingClick = false;

    // Track the active 10-second close timer instance
    this.hintAutoCloseTimer = null;
  }

  create() {
    // console.log("Control panel Created");
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
    this.eyeEmojiWrapper = new ZimLabel(this.game, "😴", 36).createLabel();
    this.eyeEmojiWrapper.addTo(panel);

    const emojiDisplay = this.eyeEmojiWrapper.label;
    emojiDisplay.reg(emojiDisplay.width / 2, emojiDisplay.height / 2);
    emojiDisplay.pos(150, 30);

    this.eyeEmojiWrapper.tap(() => {
      if (this.isProcessingClick) return;
      this.maxHints = this.game.allowedHints;

      if (this.isClosed && this.hintCounter >= this.maxHints) {
        const targetLabel = this.eyeEmojiWrapper.label;
        targetLabel.text = "😭";
        this.game.stage.update();
        setTimeout(() => {
          targetLabel.text = "😴";
          targetLabel.reg(targetLabel.width / 2, targetLabel.height / 2);
          targetLabel.pos(150, 30);
          this.game.stage.update();
        }, 1000);
        emit("hint", { text: `Oops !.... Used up All Hints` });
        return;
      }
      this.isProcessingClick = true;

      // Clear timer and clean up colors if manually toggled while active
      if (this.hintAutoCloseTimer) {
        clearTimeout(this.hintAutoCloseTimer);
        this.hintAutoCloseTimer = null;

        // Revert colors early if player manually clicks to close the eye
        if (this.isClosed === false && this.onHintExpired) {
          this.onHintExpired();
        }
      }

      this.isClosed = !this.isClosed;
      const targetLabel = this.eyeEmojiWrapper.label;

      if (!this.isClosed) {
        // --- OPEN STATE ---
        targetLabel.text = "🤔";

        if (this.hintClicked) {
          this.hintClicked();
          this.hintCounter += 1;
          console.log("Hint Counter: ", this.hintCounter);
        }

        // START 10-SECOND COUNTDOWN ENGINE
        this.hintAutoCloseTimer = setTimeout(() => {
          this.isClosed = true;
          targetLabel.text = "😴"; // Automatically flip back to closed frame

          // Re-balance bounds tracking configurations on timeout execution
          targetLabel.reg(targetLabel.width / 2, targetLabel.height / 2);
          targetLabel.pos(150, 30);

          // TRIGGER EXPIRED CALLBACK: Tells the game to remove the blue highlights
          if (this.onHintExpired) {
            this.onHintExpired();
          }

          this.game.stage.update();

          console.log("Hint expired and closed automatically.");
          this.hintAutoCloseTimer = null;
        }, 2000); // 2 seconds
      } else {
        // --- MANUAL CLOSE STATE ---
        targetLabel.text = "😴";

        // Trigger expiration cleanup when manually closing
        if (this.onHintExpired) {
          this.onHintExpired();
        }
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

    backBtn.backButtonTapped = () => {
      if (this.onBackClicked) {
        this.onBackClicked();
      }
    };

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
  disableNextButton() {
    if (!this.nextButton) return;

    this.nextButton.mouseEnabled = false;
    this.nextButton.alpha = 0.5;
  }
  enableNextButton() {
    if (!this.nextButton) return;

    this.nextButton.mouseEnabled = true;
    this.nextButton.alpha = 1;
  }
}

export default ControlPanel;
