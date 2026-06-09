import ZimLabel from "../../../zimcomponents/ZimLabel";
import Blackboard from "../UI/Blackboard";
import Chalk from "../UI/Chalk";
import ZimContainer from "../../../zimcomponents/ZimContainer";

import { retrieveEnglishVersion } from "../../../services/wordHuntService";

class FindNounsGame {
  constructor(game) {
    this.game = game;
    this.score = 0;

    this.blackboard = null;
    this.foundWordsContainer = null;

    this.passage = null;
    this.apiData = null;
    this.tokenizedArray = null;
    this.foundWords = [];
  }
  /**
   *
   * Main Handling function
   */

  async displayPassage() {
    await this.loadData();

    this.createBlackboard();
    this.createHeading();
    this.createWords();
    this.createChalk();
    this.foundWordsDisplayContainer();

    this.game.stage.update();

    return this.blackboard;
  }
  /**
   * Creating Blackboard
   */

  createBlackboard() {
    this.blackboard = new Blackboard(
      this.game,
      this.game.width * 0.9,
      this.game.height * 0.8,
    ).create();

    this.blackboard.x = 80;
    this.blackboard.y = 20;

    this.blackboard.addTo(this.game.stage);
  }
  /**
   * Creating a heading for the game
   */

  createHeading() {
    const heading = new ZimLabel(
      this.game,
      "Search For All Nouns From the Passage",
      32,
    ).createLabel();

    heading.color = "white";
    heading.pos(300, 50);

    heading.addTo(this.blackboard);
  }

  /**
   * converting the words array to lables
   */

  createWords() {
    const margin = 120;
    let x = margin;
    let y = 150;

    const lineHeight = 60;
    const maxWidth = this.blackboard.width - margin;

    this.passage.forEach((word) => {
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

  /**
   *
   * Creating a single label object
   */
  createWordLabel(word) {
    const label = new ZimLabel(this.game, word, 24).createLabel();

    let clicked = false;

    label.tap(() => {
      if (clicked) return;

      clicked = true;

      this.handleWordClick(label, word);
    });

    return label;
  }

  /**
   * Creating chalk object
   */

  createChalk() {
    this.chalk = new Chalk(this.game);
    this.chalk.show();
  }
  /**
   * creating found words Display container
   */

  foundWordsDisplayContainer() {
    this.foundWordsContainer = new ZimContainer(this.game).createContainer();

    this.foundWordsContainer.pos(110, 650);

    // Heading
    const title = new ZimLabel(this.game, "Found Nouns:", 24).createLabel();

    title.color = "black";
    title.pos(150, 625);

    title.addTo(this.foundWordsContainer);

    this.foundWordsContainer.addTo(this.game.stage);

    this.updateFoundWordsDisplay();
  }
  /**
   * Updating Found words Display
   */
  updateFoundWordsDisplay() {
    if (!this.foundWordsContainer) return;

    // Remove everything except the title
    while (this.foundWordsContainer.numChildren > 1) {
      this.foundWordsContainer.removeChildAt(1);
    }

    let x = 50;
    const y = 650;

    this.foundWords.forEach((word) => {
      const label = new ZimLabel(this.game, word, 24).createLabel();

      label.color = "black";

      label.pos(x, y);

      label.addTo(this.foundWordsContainer);

      x += label.width + 20;
    });

    this.game.stage.update();
  }

  /**
   * Handling the click function when a certain word is clicked
   */

  handleWordClick(label, word) {
    console.log("Clicked:", word);
    const pos = this.getWordPOS(word);

    if (pos === "NOUN") {
      this.score++;
      // console.log("Score:", this.score);
      this.foundWords.push(word);
      console.log(this.foundWords);
      this.updateFoundWordsDisplay();

      const underline = new this.game.zim.Line({
        length: label.width,
        thickness: 2,
        color: "white",
      });

      underline.pos(label.x + 80, label.y + label.height + 20);

      if (label.parent) {
        underline.addTo(label.parent);
      }
    } else {
      console.log(`Wrong! ${word} is a ${pos}`);
    }

    this.game.stage.update();
  }

  /**
   * Calling the service method to fetch data from backend
   */

  async loadData() {
    try {
      const response = await retrieveEnglishVersion();

      this.apiData = response;
      this.passage = response?.data?.passageArray || [];
      this.tokenizedArray = response?.data?.tokenizedPassage || [];
      console.log("Tokenized Array:", this.tokenizedArray);
    } catch (error) {
      console.error(error);
    }
  }

  /**
   *
   * Getting the Parts of speech of the selected word
   */

  getWordPOS(word) {
    const token = this.tokenizedArray.find((item) => item.text === word);

    return token?.pos;
  }
}

export default FindNounsGame;
