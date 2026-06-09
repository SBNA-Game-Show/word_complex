import ZimLabel from "../../../zimcomponents/ZimLabel";
import Blackboard from "../UI/Blackboard";
import Chalk from "../UI/Chalk";

class FindVerbGame {
  constructor(game) {
    this.game = game;

    this.verbs = game.wordTypes.verbs;
    this.nouns = game.wordTypes.nouns;
    this.adjectives = game.wordTypes.adjectives;

    this.score = 0;
    this.foundWords = [];

    this.data = this.getData();
  }

  displayPassage() {
    this.game.stage.canvas.style.cursor = "none";

    //-----------------------------------
    // BOARD
    //-----------------------------------

    const blackboard = new Blackboard(
      this.game,
      1350,
      760
    ).create();

    blackboard.center(this.game.stage);
    blackboard.addTo(this.game.stage);

    //-----------------------------------
    // TITLE
    //-----------------------------------

    const heading = new ZimLabel(
      this.game,
      "Search For All Verbs From The Passage"
    ).createLabel();

    heading.scale = 0.75;
    heading.color = "white";

    heading.pos(40, 20);
    heading.addTo(blackboard);

    //-----------------------------------
    // SCORE
    //-----------------------------------

    const progressLabel = new ZimLabel(
      this.game,
      `Found 0 / ${this.verbs.length} Verbs`
    ).createLabel();

    progressLabel.scale = 0.65;
    progressLabel.color = "#00ff88";

    progressLabel.pos(
      blackboard.width - 330,
      20
    );

    progressLabel.addTo(blackboard);

    //-----------------------------------
    // MESSAGE BAR
    //-----------------------------------

    const messageBar = new this.game.zim.Rectangle({
      width: blackboard.width - 80,
      height: 55,
      color: "#274527",
      corner: 8,
    });

    messageBar.pos(40, 70);
    messageBar.addTo(blackboard);

    const messageLabel = new this.game.zim.Label({
      text: "Find all 15 verbs",
      size: 28,
      color: "#FFD700",
    });

    messageLabel.pos(60, 84);
    messageLabel.addTo(blackboard);

    //-----------------------------------
    // FOUND VERBS BOX
    //-----------------------------------

    const foundBox = new this.game.zim.Rectangle({
      width: blackboard.width - 80,
      height: 160,
      color: "#274527",
      corner: 8,
    });

    foundBox.pos(
      40,
      blackboard.height - 190
    );

    foundBox.addTo(blackboard);

    const foundTitle = new this.game.zim.Label({
      text: "Found Verbs",
      size: 30,
      color: "#00ff88",
    });

    foundTitle.pos(
      60,
      blackboard.height - 180
    );

    foundTitle.addTo(blackboard);

    const foundWordsLabel = new this.game.zim.Label({
      text: "",
      size: 26,
      color: "white",
      align: "left",
    });

    foundWordsLabel.pos(
      60,
      blackboard.height - 130
    );

    foundWordsLabel.addTo(blackboard);

    //-----------------------------------
    // STORY
    //-----------------------------------

    const margin = 60;

    let x = margin;
    let y = 160;

    const lineHeight = 42;

    const maxWidth =
      blackboard.width - 80;

    //-----------------------------------
    // FOUND WORDS FORMAT
    //-----------------------------------

    const formatFoundWords = () => {
      let rows = [];

      for (
        let i = 0;
        i < this.foundWords.length;
        i += 4
      ) {
        rows.push(
          this.foundWords
            .slice(i, i + 4)
            .join(", ")
        );
      }

      return rows.join("\n");
    };

    //-----------------------------------
    // WORDS
    //-----------------------------------

    this.data.forEach((word) => {
      const label = new this.game.zim.Label({
        text: word,
        size: 32,
        color: "white",
      });

      if (
        x + label.width >
        maxWidth
      ) {
        x = margin;
        y += lineHeight;
      }

      label.pos(x, y);

      label.addTo(blackboard);

      x += label.width + 14;

      //-----------------------------------
      // CLICK
      //-----------------------------------

      label.tap(() => {
        const cleanWord =
          word
            .toLowerCase()
            .replace(/[^\w']/g, "");

        //-----------------------------------
        // CORRECT VERB
        //-----------------------------------

        if (
          this.verbs.includes(cleanWord)
        ) {
          if (
            this.foundWords.includes(cleanWord)
          ) {
            messageLabel.text =
              `${cleanWord} already found`;

            this.game.stage.update();
            return;
          }

          this.foundWords.push(
            cleanWord
          );

          this.score++;

          label.color = "#00ff88";

          progressLabel.text =
            `Found ${this.score}/${this.verbs.length} Verbs`;

          messageLabel.text =
            `Great! "${cleanWord}" is a verb`;

          foundWordsLabel.text =
            formatFoundWords();

          this.checkWin(
            messageLabel
          );
        }

        //-----------------------------------
        // NOUN
        //-----------------------------------

        else if (
          this.nouns.includes(cleanWord)
        ) {
          label.color = "red";

          messageLabel.text =
            `Oops! "${cleanWord}" is a noun`;
        }

        //-----------------------------------
        // ADJECTIVE
        //-----------------------------------

        else if (
          this.adjectives.includes(cleanWord)
        ) {
          label.color = "orange";

          messageLabel.text =
            `Oops! "${cleanWord}" is an adjective`;
        }

        //-----------------------------------
        // OTHER
        //-----------------------------------

        else {
          label.color = "#ff6666";

          messageLabel.text =
            `"${cleanWord}" is not a verb`;
        }

        this.game.stage.update();
      });
    });

    //-----------------------------------
    // CHALK
    //-----------------------------------

    new Chalk(this.game).show();

    this.game.stage.update();

    return blackboard;
  }

  //-----------------------------------
  // WIN
  //-----------------------------------

  checkWin(messageLabel) {
    if (
      this.foundWords.length ===
      this.verbs.length
    ) {
      messageLabel.text =
        "🎉 Congratulations! You found all 15 verbs!";

      setTimeout(() => {
        alert(
          "🎉 Congratulations! You found all 15 verbs!"
        );
      }, 300);
    }
  }

  //-----------------------------------
  // DATA
  //-----------------------------------

  getData() {
    return (
      this.game.storyData.story.match(/\S+/g) || []
    );
  }
}

export default FindVerbGame;