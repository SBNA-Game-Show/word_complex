class Chalk {
  constructor(game) {
    this.game = game;
    this.zim = game.zim;
    this.chalk = null;
  }

  create() {
    this.chalk = new this.zim.Rectangle({
      width: 16,
      height: 25,
      color: "white",
      corner: 4,
    });

    // Ignore mouse/touch events
    this.chalk.mouseEnabled = false;

    return this.chalk;
  }

  show() {
    this.create().addTo(this.game.stage);

    this.zim.Ticker.add(() => {
      this.chalk.x = this.game.stage.mouseX - this.chalk.width / 2;

      this.chalk.y = this.game.stage.mouseY - this.chalk.height / 2;
    });

    return this.chalk;
  }
}

export default Chalk;
