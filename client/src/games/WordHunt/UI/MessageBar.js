import ZimLabel from "../ZimComponents/ZimLabelNew";
import ZimContainer from "../ZimComponents/ZimContainerNew";
import ZimButton from "../ZimComponents/ZimButtonNew";

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

    this.onRestart = null;
    this.onExit = null;
    this.onContinue = null;

    this.countdownRunning = false;
    this.countdownTimeouts = [];
    this.countdownFlareIntervalId = null;
  }

    clearActiveMessages() {
    this.countdownRunning = false;
    this.countdownTimeouts.forEach(clearTimeout);
    this.countdownTimeouts = [];
    if (this.countdownFlareIntervalId) {
      clearInterval(this.countdownFlareIntervalId);
      this.countdownFlareIntervalId = null;
    }

    if (this.messageContainer) {
      this.messageContainer.removeFrom();
      this.messageContainer = null;
    }
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  showWinningMessage(text, time, color = "white") {
    this.clearActiveMessages();
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
      color: "#1E3A1E",
      corner: 16,
      borderColor: "rgba(255, 224, 196, 0.8)",
      borderWidth: 5,
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

    continueBtn.tap(() => {
      if (this.onContinue) this.onContinue();
    });

    this.exitButton = new ZimButton(this.game, 140, 40, "Exit", 16);
    const exitBtn = this.exitButton.createButton();
    exitBtn.addTo(this.winningContainer);

    exitBtn.tap(() => {
      if (this.onExit) this.onExit();
    });

    // group centering (important part)
    const spacing = 20;
    const totalWidth = 140 + 140 + spacing;

    const startX = (500 - totalWidth) / 2;

    continueBtn.pos(startX, btnY);
    exitBtn.pos(startX + 140 + spacing, btnY);

    this.game.stage.update();

    return this.winningContainer;
  }
  showTimeOverMessage(text, color = "white") {
    this.clearActiveMessages();
    this.game.isInputLocked = true;

    if (this.timeOverContainer) {
      this.timeOverContainer.removeFrom();
    }

    const containerWidth = 350;
    const containerHeight = 170;

    this.timeOverContainer = new ZimContainer(
      this.game,
      containerWidth,
      containerHeight,
    ).createContainer();

    this.timeOverContainer.addTo(this.game.stage);

    this.timeOverContainer.pos(
      (this.game.width - containerWidth) / 2,
      (this.game.height - containerHeight) / 2,
    );

    //-----------------------------------
    // BACKGROUND
    //-----------------------------------

    const bg = new this.game.zim.Rectangle({
      width: containerWidth,
      height: containerHeight,
      color: "#1E3A1E",
      corner: 16,
      borderColor: "rgba(255, 224, 196, 0.8)",
      borderWidth: 5,
    });

    bg.addTo(this.timeOverContainer);

    //-----------------------------------
    // MESSAGE
    //-----------------------------------

    this.timeOverLabel = new ZimLabel(this.game, text, 18, color).createLabel();

    this.timeOverLabel.addTo(this.timeOverContainer);

    this.timeOverLabel.pos(
      (containerWidth - this.timeOverLabel.label.width) / 2,
      30,
    );

    //-----------------------------------
    // BUTTONS
    //-----------------------------------

    const buttonWidth = 80;
    const buttonHeight = 40;
    const gap = 40;

    const totalWidth = buttonWidth + gap + buttonWidth;

    const startX = (containerWidth - totalWidth) / 2;

    // Restart
    this.restartButton = new ZimButton(
      this.game,
      buttonWidth,
      buttonHeight,
      "Restart",
      16,
    );

    const restartBtn = this.restartButton.createButton();

    restartBtn.addTo(this.timeOverContainer);

    restartBtn.pos(startX, 105);

    restartBtn.tap(() => {
      if (this.onRestart) this.onRestart();
    });

    // Exit
    this.exitButton = new ZimButton(
      this.game,
      buttonWidth,
      buttonHeight,
      "Exit",
      16,
    );

    const exitBtn = this.exitButton.createButton();

    exitBtn.addTo(this.timeOverContainer);

    exitBtn.pos(startX + buttonWidth + gap, 105);

    exitBtn.tap(() => {
      if (this.onExit) this.onExit();
    });

    this.game.stage.update();

    return this.timeOverContainer;
  }

  countdownTimer(onComplete) {
    this.clearActiveMessages();
    this.game.isInputLocked = true;
    this.countdownRunning = true;

    const steps = ["READY", "3", "2", "1", "GO"];
    let index = 0;

    const scheduleCountdownStep = (callback, delay) => {
      const timeoutId = setTimeout(() => {
        this.countdownTimeouts = this.countdownTimeouts.filter(
          (id) => id !== timeoutId,
        );
        callback();
      }, delay);
      this.countdownTimeouts.push(timeoutId);
      return timeoutId;
    };

    // A list of vibrant neon colors for the random fireworks ambient cycle
    const ambientColors = [
      "#FFD700",
      "#00FF88",
      "#00F0FF",
      "#FF007F",
      "#FF7700",
      "#FFF8F0",
    ];

    // -----------------------------------------------------------------
    // CONTINUOUS RANDOM FLARE GENERATOR
    // -----------------------------------------------------------------
    // Spawns a small localized starburst anywhere on the screen
    const spawnRandomFlareBurst = () => {
      const numFlares = this.game.zim.rand(4, 7); // Mini localized bursts

      // Select an absolute random point anywhere within the viewport dimensions
      const centerX = this.game.zim.rand(100, this.game.width - 100);
      const centerY = this.game.zim.rand(100, this.game.height - 100);

      const themeColor = this.game.zim.shuffle(ambientColors)[0];

      for (let i = 0; i < numFlares; i++) {
        const flare = new this.game.zim.Poly({
          radius: this.game.zim.rand(8, 22), // slightly smaller for ambient feel
          sides: 3,
          pointSize: 0.25,
          color: themeColor,
        });

        flare.pos(centerX, centerY);
        flare.reg(0, 0);

        // Add underneath the text container layers
        if (this.messageContainer) {
          this.game.stage.addChildAt(
            flare,
            Math.max(
              0,
              this.game.stage.getChildIndex(this.messageContainer) - 1,
            ),
          );
        } else {
          this.game.stage.addTo(this.game.stage);
        }

        const angle = i * (360 / numFlares) * (Math.PI / 180);
        const distance = this.game.zim.rand(40, 90);

        const targetX = centerX + Math.cos(angle) * distance;
        const targetY = centerY + Math.sin(angle) * distance;

        flare.rotation = i * (360 / numFlares) + 90;
        flare.sca(0);

        flare.animate({
          props: {
            x: targetX,
            y: targetY,
            scale: this.game.zim.rand(1, 1.5),
            alpha: 0,
            rotation: flare.rotation + this.game.zim.rand(-45, 45),
          },
          time: this.game.zim.rand(0.3, 0.5),
          ease: "quadOut",
          call: () => {
            flare.removeFrom();
          },
        });
      }
    };

    // Trigger the loops every 150ms to populate the board with continuous activity
    this.countdownFlareIntervalId = setInterval(spawnRandomFlareBurst, 150);

    // -----------------------------------------------------------------
    // STEP TEXT RENDERING COMPONENT
    // -----------------------------------------------------------------
    const showNext = () => {
      if (!this.countdownRunning) return;

      if (this.messageContainer) {
        this.messageContainer.removeFrom();
        this.messageContainer = null;
      }

      const text = steps[index];

      // Build a naked transparent container just to align the crisp popping text copy
      this.messageContainer = new ZimContainer(this.game).createContainer();
      this.messageContainer.addTo(this.game.stage);
      this.messageContainer.pos(this.game.width / 2, this.game.height / 2);

      // Clean striking label with no shapes boxing it up
      const label = new ZimLabel(this.game, text, 72, "black").createLabel();
      label.addTo(this.messageContainer);
      label.pos(-label.label.width / 2, -label.label.height / 2);

      // Text animation styles
      this.messageContainer.sca(0);
      this.messageContainer.alp(0);

      this.messageContainer.animate({
        props: { scale: 1, alpha: 1 },
        time: 0.2,
        ease: "backOut",
      });

      this.messageContainer.animate({
        props: { alpha: 0, scale: 1.4 }, // Explodes outward when fading
        time: 0.2,
        wait: 0.6,
      });

      this.game.stage.update();
      index++;

      if (index < steps.length) {
        scheduleCountdownStep(showNext, 800);
      } else {
        scheduleCountdownStep(() => {
          if (!this.countdownRunning) return;

          // TERMINATION & CLEANUP
          if (this.countdownFlareIntervalId) {
            clearInterval(this.countdownFlareIntervalId);
            this.countdownFlareIntervalId = null;
          }
          this.countdownRunning = false;

          if (this.messageContainer) {
            this.messageContainer.removeFrom();
            this.messageContainer = null;
          }
          this.game.isInputLocked = false;
          if (onComplete) onComplete();
          this.game.stage.update();
        }, 800);
      }
    };

    showNext();
  }
  reset() {
    this.clearActiveMessages();

    this.countdownRunning = false;

    this.countdownTimeouts.forEach((id) => {
      clearTimeout(id);
    });

    this.countdownTimeouts = [];

    if (this.countdownFlareIntervalId) {
      clearInterval(this.countdownFlareIntervalId);
      this.countdownFlareIntervalId = null;
    }

    if (this.winningContainer) {
      this.winningContainer.removeFrom();
      this.winningContainer = null;
    }

    if (this.timeOverContainer) {
      this.timeOverContainer.removeFrom();
      this.timeOverContainer = null;
    }

    this.continueButton = null;
    this.exitButton = null;
    this.restartButton = null;

    this.onContinue = null;
    this.onExit = null;
    this.onRestart = null;

    this.game.stage.update();
  }
}

export default MessageBar;
