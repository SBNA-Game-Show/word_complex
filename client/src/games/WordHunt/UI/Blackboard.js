class Blackboard {
  constructor(game, width = 800, height = 400) {
    this.game = game;
    this.zim = game.zim;
    this.width = width;
    this.height = height;
  }

  create() {
    const board = new this.zim.Container(this.width, this.height);

    const background = new this.zim.Rectangle({
      width: this.width,
      height: this.height,
      color: "#1E3A1E",
      borderColor: "#5C4033",
      borderWidth: 20,
      corner: 10,
    });

    background.addTo(board);

    return board;
  }
}

export default Blackboard;
