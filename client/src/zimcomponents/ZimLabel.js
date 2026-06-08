class ZimLabel {
  constructor(game, text, fontSize=32) {
    this.game = game;
    this.zim = game.zim;
    this.text = text;
    this.label = null;
    this.fontSize = fontSize
  }

  createLabel() {
    this.label = new this.zim.Label({
      text: this.text,
      size: this.fontSize,
      color: "#333",
    });

    return this.label;
  }
}

export default ZimLabel;
