import ZimLabel from "../../../zimcomponents/ZimLabel";
import ZimContainer from "../../../zimcomponents/ZimContainer";

class ProgressBar {
  constructor(game, challengeText, foundCount = 0) {
    this.game = game;
    this.challengeText = challengeText;
    this.foundCount = foundCount;

    this.foundLabel = null;
    this.timerLabel = null;

    this.startTime = Date.now();
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
    this.foundLabel = new ZimLabel(
      this.game,
      `Found: ${this.foundCount}`,
      20,
      "#00ff88",
    ).createLabel();

    this.foundLabel.pos(0, 35);
    this.foundLabel.addTo(mainContainer);

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
    this.game.zim.Ticker.add(() => {
      const elapsed = Date.now() - this.startTime;

      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      const ms = elapsed % 1000;

      const formatted =
        `${String(minutes).padStart(2, "0")}:` +
        `${String(seconds).padStart(2, "0")}.` +
        `${String(ms).padStart(3, "0")}`;

      if (this.timerLabel) {
        this.timerLabel.text = `Time: ${formatted}`;
      }
    });
  }

  updateFound(count) {
    if (this.foundLabel) {
      this.foundLabel.text = `Found: ${count}`;
    }
  }
}

export default ProgressBar;
