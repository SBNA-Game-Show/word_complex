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

    this.onRestart = null;
    this.onExit = null;
    this.onContinue = null;
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

    exitBtn.tap(() => {
      if (this.onExit) this.onExit();
    });

    this.game.stage.update();

    return this.timeOverContainer;
  }

  countdownTimer(onComplete) {
    this.game.isInputLocked = true;

    const steps = ["READY", "3", "2", "1", "GO"];
    let index = 0;

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
    const flareIntervalId = setInterval(spawnRandomFlareBurst, 150);

    // -----------------------------------------------------------------
    // STEP TEXT RENDERING COMPONENT
    // -----------------------------------------------------------------
    const showNext = () => {
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
      const label = new ZimLabel(this.game, text, 72, "white").createLabel();
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
        setTimeout(showNext, 800);
      } else {
        setTimeout(() => {
          // TERMINATION & CLEANUP
          clearInterval(flareIntervalId); // Kill the background background fireworks engine loop cleanly

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
}

export default MessageBar;
