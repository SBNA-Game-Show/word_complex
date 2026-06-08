import ZimLabel from "../../../zimcomponents/ZimLabel";
import Blackboard from "../UI/Blackboard";
import Chalk from "../UI/Chalk";

import { retrieveEnglishVersion } from "../../../services/wordHuntService";

class FindNounsGame {
  constructor(game) {
    this.game = game;
    this.data = this.getData();
    this.score = 0;
    this.apiData = this.loadData()

    this.blackboard = null;
  }

  displayPassage() {
    this.game.stage.canvas.style.cursor = "none";

    this.createBlackboard();
    this.createHeading();
    this.createWords();
    this.createChalk();

    this.game.stage.update();

    return this.blackboard;
  }

  createBlackboard() {
    this.blackboard = new Blackboard(
      this.game,
      this.game.width * 0.9,
      this.game.height * 0.8,
    ).create();

    this.blackboard.center(this.game.stage);
    this.blackboard.addTo(this.game.stage);
  }

  createHeading() {
    const heading = new ZimLabel(
      this.game,
      "Search For All Nouns From the Passage",
      32,
    ).createLabel();

    heading.color = "white";
    heading.pos(200, 100);

    heading.addTo(this.blackboard);
  }

  createWords() {
    const margin = 100;
    let x = margin;
    let y = 200;

    const lineHeight = 60;
    const maxWidth = this.blackboard.width - margin;

    this.data.forEach((word) => {
      const label = this.createWordLabel(word);

      if (x + label.width > maxWidth) {
        x = margin;
        y += lineHeight;
      }

      label.pos(x, y);
      label.addTo(this.blackboard);

      x += label.width + 10;
    });
  }

  createWordLabel(word) {
    const label = new ZimLabel(this.game, word, 24).createLabel();

    label.color = "white";

    label.tap(() => {
      this.handleWordClick(label, word);
    });

    return label;
  }

  handleWordClick(label, word) {
    console.log("Clicked:", word);

    this.score++;

    const underline = new this.game.zim.Line({
      length: label.width,
      thickness: 2,
      color: "white",
    });

    underline.pos(label.x + 65, label.y + label.height + 80);

    if (label.parent) {
      underline.addTo(label.parent);
    }

    this.game.stage.update();
  }

  createChalk() {
    this.chalk = new Chalk(this.game);
    this.chalk.show();
  }

  getData() {
    const passage =
      "When the rabbit left his home, a weasel moved in and refused to move out again. A great dispute arose over this. When the cat heard this, she offered to pacify the dispute. She asked the opponents to come closer to her, because she could not hear well. When this happened, she grabbed one of the disputants with each paw to devour them. Thus she pacified the quarrel.";

    return passage.match(/\S+/g) || [];
  }

  async loadData() {
    try {
      const data = await retrieveEnglishVersion();

      if (data) {
        console.log("API Data:", data);

        // Optionally update your game data
        this.data = data;
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  }
}

export default FindNounsGame;
