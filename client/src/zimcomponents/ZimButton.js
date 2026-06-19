import ZimLabel from "./ZimLabel";

class ZimButton {
  constructor(game, width, height, text, fontSize = 18) {
    this.game = game;
    this.zim = game.zim;

    this.text = text;
    this.width = width;
    this.height = height;
    this.fontSize = fontSize;

    this.container = null;
    this.label = null;
    this.bg = null;
  }

  createButton() {
    this.container = new this.zim.Container(this.width, this.height);

    // BACKGROUND
    this.bg = new this.zim.Rectangle({
      width: this.width,
      height: this.height,
      color: "#7B2CBF",
      corner: 10,
    });

    this.bg.addTo(this.container);

    // LABEL (FULL CONTROL)
    this.label = new ZimLabel(
      this.game,
      this.text,
      this.fontSize,
      "white",
    ).createLabel();

    this.label.addTo(this.container);

    // center label inside button
    this.label.pos(
      (this.width - this.label.label.width) / 2,
      (this.height - this.label.label.height) / 2,
    );

    return this.container;
  }
}

export default ZimButton;
