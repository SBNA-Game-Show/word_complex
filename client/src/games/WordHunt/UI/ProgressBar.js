import ZimLabel from "../ZimComponents/ZimLabelNew";
import ZimContainer from "../ZimComponents/ZimContainerNew";
import Timer from "../utils/Timer";

class ProgressBar {
  constructor(game, challengeText, foundCount = 0) {
    this.game = game;
    this.challengeText = challengeText;
    this.foundCount = foundCount;

    this.foundLabel = null;
    this.timerLabel = null;
    this.maxTime = this.game.maxTime;

    this.timer = new Timer(game, game.maxTime);

    this.usedTime = null;
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

  setFound(count) {
    this.foundLabel.setText(`Found: ${count}`);
  }

  setTime(minutes, seconds) {
    this.timerLabel.setText(
      `Time Left: ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
    );
  }

  showTimesUp() {
    this.timerLabel.setText("Time's Up!");
  }
}

export default ProgressBar;
