import ZimLabel from "../../../zimcomponents/ZimLabel";
import ZimContainer from "../../../zimcomponents/ZimContainer";

class ProgressBar {
  constructor(game, challengeText, foundCount = 0) {
    this.game = game;
    this.challengeText = challengeText;
    this.foundCount = foundCount;

    this.foundLabel = null;
    this.timerLabel = null;
    this.maxTime = this.game.maxTime;

    this.startTime = Date.now();

    this.isTimerActive = false
  }

  create() {
    const mainContainer = new ZimContainer(
      this.game,
      320,
      120,
    ).createContainer();

    const challengeLabel = new ZimLabel(
      this.game,
      `Challenge: ${this.challengeText}`,
      20,
      "white",
    ).createLabel();

    challengeLabel.addTo(mainContainer);

    // FOUND LABEL
    this.foundLabel = new ZimLabel(this.game, "", 20, "#00ff88").createLabel();
    this.foundLabel.pos(0, 35);
    this.foundLabel.addTo(mainContainer);
    //TIME ALLOCATED

    // TIMER LABEL
    this.timerLabel = new ZimLabel(
      this.game,
      `Time: 00:00.000`,
      20,
      "#FFD700",
    ).createLabel();

    this.timerLabel.pos(0, 70);
    this.timerLabel.addTo(mainContainer);

    return mainContainer;
  }

  startTimer() {
    if (this.timerRunning) return;

    this.timerRunning = true;
    this.startTime = Date.now();

    const maxTimeMs = this.maxTime * 60 * 1000;

    this.tickHandler = () => {
      const elapsed = Date.now() - this.startTime;

      if (elapsed >= maxTimeMs) {
        this.stopTimer();
        return;
      }

      const remainingMs = maxTimeMs - elapsed;

      const minutes = Math.floor(remainingMs / 60000);
      const seconds = Math.floor((remainingMs % 60000) / 1000);

      this.timerLabel.setText(
        `Time Left: ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
      );
    };

    this.game.zim.Ticker.add(this.tickHandler);
  }

  stopTimer() {
    if (!this.timerRunning) return;

    this.timerRunning = false;

    if (this.tickHandler) {
      this.game.zim.Ticker.remove(this.tickHandler);
      this.tickHandler = null;
    }

    this.timerLabel.setText("Time's Up!");

    this.game.stage.update();
  }

  updateFound(count) {
    if (!this.foundLabel) return;

    this.foundCount = count;
    this.foundLabel.setText(`Found: ${count}`);
  }

  updateFound(count) {
    if (this.foundLabel) {
      this.foundLabel = `Found: ${count}`;
    }
  }
}

export default ProgressBar;
