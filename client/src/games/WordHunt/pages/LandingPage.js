import ZimLabel from "../../../zimcomponents/ZimLabel";
import ZimContainer from "../../../zimcomponents/ZimContainer";
import ZimButton from "../../../zimcomponents/ZimButton";

class LandingPage {
  constructor(game) {
    this.game = game;
    this.zim = game.zim;

    this.container = null;
    this.button = null;
  }

  createLandingPage() {
    console.log("Landing page");

    this.container = new this.zim.Container(850, 500);

    //---------------------------------
    // PANEL
    //---------------------------------

    const panel = new this.zim.Rectangle(
      850,
      500,
      "rgba(255, 224, 196, 0.4)",
      "#FFE0C4BF",
      8,
      30,
    );

    panel.sha("rgba(0,0,0,.15)", 0, 10, 20);
    panel.center(this.container);
    //---------------------------------
    // DECORATIONS
    //---------------------------------

    const ribbon1 = new this.zim.Label({
      text: "🎀",
      size: 35,
    });

    ribbon1.addTo(this.container);
    ribbon1.pos(70, 60);

    const ribbon2 = new this.zim.Label({
      text: "🦋",
      size: 35,
    });

    ribbon2.addTo(this.container);
    ribbon2.pos(720, 60);

    const star1 = new this.zim.Label({
      text: "⭐",
      size: 30,
    });

    star1.addTo(this.container);
    star1.pos(90, 400);

    const star2 = new this.zim.Label({
      text: "✨",
      size: 30,
    });

    star2.addTo(this.container);
    star2.pos(700, 400);

    const flower = new this.zim.Label({
      text: "🌸",
      size: 35,
    });

    flower.addTo(this.container);
    flower.pos(390, 280);
    //---------------------------------
    // TITLE
    //---------------------------------

    const title = new this.zim.Label({
      text: "Grammar: Treasure Hunt",
      size: 54,
      color: "#6A0DAD",
      bold: true,
      font: "Fredoka",
    });

    title.center(this.container);
    title.y = 100;

    //---------------------------------
    // SUBTITLE
    //---------------------------------

    const subtitle = new this.zim.Label({
      text: "Discover nouns, verbs, and adjectives hidden in passages. \nScore points, improve your grammar, and top the leaderboard!",
      size: 24,
      color: "#444",
      bold: true,
      align: "center",
      lineHeight: 38,
      font: "Fredoka",
    });

    subtitle.center(this.container);
    subtitle.y = 180;

    //---------------------------------
    // STAR ICON
    //---------------------------------

    const star = new this.zim.Label({
      text: "⭐",
      size: 60,
    });

    star.center(this.container);
    star.y = 30;

    //---------------------------------
    // START BUTTON
    //---------------------------------

    this.button = new this.zim.Button({
      width: 340,
      height: 90,
      label: "Start Adventure",
      backgroundColor: "#9D6EFF",
      rollBackgroundColor: "#7B2CBF",
      corner: 30,
    });

    this.button.center(this.container);
    this.button.y = 360;
    this.button.label.font = "Fredoka";
    this.button.label.size = 32;
    this.button.label.bold = true;

    //---------------------------------
    // ADD TO STAGE
    //---------------------------------

    this.container.center(this.game.stage);

    this.container.addTo(this.game.stage);

    this.game.stage.update();

    return this;
  }

  hide() {
    if (this.container) {
      this.container.removeFrom();
    }
  }
}

export default LandingPage;
