class ZimLabel {
  constructor(game, text) {
    this.game = game;
    this.zim = game.zim;
    this.text = text;
    this.label = null;
  }

  createLabel() {
    this.label = new this.zim.Label({
      text: this.text,
      size: 40,
      color: "#333",
    });

    return this.label;
  }
}

export default ZimLabel;
