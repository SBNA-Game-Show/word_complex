class ZimContainer {
  constructor(game, width, height) {
    this.game = game;
    this.zim = game.zim;
    this.width = this.game.width || width;
    this.height = this.game.height || height;
  }

  createContainer() {
    return new this.zim.Container(this.width, this.height);
  }
}

export default ZimContainer;
