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
    // CENTER: HINT BUTTON
    //-----------------------------------
    this.maxHints = this.game.allowedHints;
    this.remainingHints = this.maxHints - this.hintCounter;

    this.hintButton = new ZimButton(
      this.game,
      100,
      38,
      `Hint: ${this.remainingHints}`,
      14,
    ).createButton();

    this.hintButton.pos(125, 31);
    this.hintButton.addTo(panel);

    this.hintButton.tap(() => {
      if (this.isProcessingClick) return;

      // No hints remaining
      if (this.isClosed && this.hintCounter >= this.maxHints) {
        this.hintButton.updateText("No Hints");

        this.game.stage.update();

        setTimeout(() => {
          this.remainingHints = this.maxHints - this.hintCounter;

          this.hintButton.updateText(`Hint: ${this.remainingHints}`);

          this.game.stage.update();
        }, 1000);

        emit("hint", {
          text: "Oops!.... Used up All Hints",
        });

        return;
      }

      this.isProcessingClick = true;

      // Cancel previous timer if active
      if (this.hintAutoCloseTimer) {
        clearTimeout(this.hintAutoCloseTimer);
        this.hintAutoCloseTimer = null;

        if (!this.isClosed && this.onHintExpired) {
          this.onHintExpired();
        }
      }

      // Toggle state
      this.isClosed = !this.isClosed;

      if (!this.isClosed) {
        //-----------------------------------
        // OPEN HINT
        //-----------------------------------

        this.hintButton.updateText("Hide");

        if (this.hintClicked) {
          this.hintClicked();

          this.hintCounter++;

          this.remainingHints = this.maxHints - this.hintCounter;

          console.log("Hint Counter:", this.hintCounter);
        }

        // Auto close after 2 seconds
        this.hintAutoCloseTimer = setTimeout(() => {
          this.isClosed = true;

          this.hintButton.updateText(`Hint: ${this.remainingHints}`);

          if (this.onHintExpired) {
            this.onHintExpired();
          }

          this.game.stage.update();

          console.log("Hint expired and closed automatically.");

          this.hintAutoCloseTimer = null;
        }, 2000);
      } else {
        //-----------------------------------
        // MANUAL CLOSE
        //-----------------------------------

        this.hintButton.updateText(`Hint: ${this.remainingHints}`);

        if (this.onHintExpired) {
          this.onHintExpired();
        }

        console.log("Hint Hidden.");
      }

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
