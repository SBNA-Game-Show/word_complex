class ZimLabel {
  constructor(game, text, fontSize = 32, color = white, cursor = "pointer") {
    this.game = game;
    this.zim = game.zim;
    this.text = text;
    this.label = null;
    this.fontSize = fontSize;
    this.color = color;
    this.cursor = cursor;
  }

  createLabel() {
    this.label = new this.zim.Label({
      text: this.text,
      size: this.fontSize,
      color: this.color,
      cursor: this.cursor,
    });

    return this.label;
  }
}

export default ZimLabel;
