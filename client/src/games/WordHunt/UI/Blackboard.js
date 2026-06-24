class Blackboard {
  constructor(game, width = 800, height = 400) {
    this.game = game;
    this.zim = game.zim;
    this.width = width;
    this.height = height;

    this.board = null;
  }

  create() {
    this.board = new this.zim.Container(this.width, this.height);
    const background = new this.zim.Rectangle({
      width: this.width,
      height: this.height,
      color: "#1E3A1E", // green
      borderColor: "rgba(255, 224, 196, 0.4)",
      borderWidth: 10,
      corner: 10,
    });

    background.addTo(this.board);

    return this.board;
  }
}

export default Blackboard;
