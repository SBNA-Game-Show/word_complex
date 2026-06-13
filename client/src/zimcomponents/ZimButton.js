class ZimButton {
  constructor(game, width, height, text) {
    this.game = game;
    this.zim = game.zim;
    this.text = text;
    this.width = width;
    this.height = height;
  }

  createButton() {
    return new this.zim.Button(this.width, this.height, this.text);
  }
}

export default ZimButton;
