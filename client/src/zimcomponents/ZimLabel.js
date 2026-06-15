class ZimLabel {
  constructor(game, text, fontSize = 32, color = white) {
    this.game = game;
    this.zim = game.zim;
    this.text = text;
    this.label = null;
    this.fontSize = fontSize;
    this.color = color;
  }

  createLabel() {
    this.label = new this.zim.Label({
      text: this.text,
      size: this.fontSize,
      color: this.color,
    });

    return this.label;
  }
}

export default ZimLabel;
