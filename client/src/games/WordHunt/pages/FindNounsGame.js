import ZimLabel from "../UI/ZimLabel";
import Blackboard from "../UI/Blackboard";
import Chalk from "../UI/Chalk";

class FindNounsGame {
  constructor(game) {
    this.game = game;
    this.data = this.getData();
    this.score = 0;
  }

  displayPassage() {
    this.game.stage.canvas.style.cursor = "none";
    // Create blackboard
    const blackboard = new Blackboard(
      this.game,
      this.game.width * 0.9,
      this.game.height * 0.8,
    ).create();

    blackboard.center(this.game.stage);
    blackboard.addTo(this.game.stage);

    // Heading
    const heading = new ZimLabel(
      this.game,
      "Search For All Nouns From the Passage",
    ).createLabel();

    heading.color = "white";
    heading.pos(200, 100);
    heading.addTo(blackboard);

    // Word layout inside blackboard
    const margin = 100;
    let x = margin;
    let y = 200;
    const lineHeight = 60;

    const maxWidth = blackboard.width;

    this.data.forEach((word) => {
      const label = new ZimLabel(this.game, word).createLabel();

      label.color = "white"; // chalk effect

      label.tap(() => {
        const underline = new this.game.zim.Line({
          length: label.width,
          thickness: 2,
          color: "white",
        });

        underline.pos(label.x+65, label.y + label.height + 80);

        underline.addTo(label.parent);

        this.game.stage.update();
      });

      if (x + label.width > maxWidth) {
        x = margin;
        y += lineHeight;
      }

      label.pos(x, y);
      label.addTo(blackboard);

      x += label.width + 10;
    });
    const chalk = new Chalk(this.game).show();

    this.game.stage.update();

    return blackboard;
  }

  getData() {
    const passage =
      "When the rabbit left his home, a weasel moved in and refused to move out again. A great dispute arose over this. When the cat heard this, she offered to pacify the dispute. She asked the opponents to come closer to her, because she could not hear well. When this happened, she grabbed one of the disputants with each paw to devour them. Thus she pacified the quarrel.";

    return passage.match(/\S+/g) || [];
  }
}

export default FindNounsGame;
