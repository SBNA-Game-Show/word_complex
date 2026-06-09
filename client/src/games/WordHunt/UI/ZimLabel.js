class ZimLabel {
  constructor(game, text, size = 40, color = "#333") {
    this.game = game;
    this.zim = game.zim;
    this.text = text;
    this.size = size;
    this.color = color;
    this.label = null;
  }

  createLabel() {
    this.label = new this.zim.Label({
      text: this.text,
      size: this.size,
      color: this.color,
    });

    return this.label;
  }
}

export default ZimLabel;