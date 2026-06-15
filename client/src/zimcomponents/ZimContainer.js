class ZimContainer {
  constructor(game) {
    this.game = game;
    this.zim = game.zim;
    this.width = 200;
    this.height = 200;
  }

  createContainer() {
    return new this.zim.Container(this.width, this.height);
  }
}

export default ZimContainer;
