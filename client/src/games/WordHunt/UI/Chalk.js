class Chalk {
  constructor(game) {
    this.game = game;
    this.zim = game.zim;
    this.chalk = null;
    this.tickerFunction = null;
  }

  create() {
    this.chalk = new this.zim.Rectangle({
      width: 16,
      height: 25,
      color: "white",
      corner: 4,
    });

    // Ignore interaction streams completely so it doesn't block text clicking
    this.chalk.mouseEnabled = false;
    this.chalk.mouseChildren = false;

    return this.chalk;
  }

  show() {
    this.create().addTo(this.game.stage);

    // 🛠️ THE BULLETPROOF CURSOR HIDE: Force it on the root document level!
    // This stops ZIM text layers from temporarily showing the hand pointer icon.
    document.body.style.cursor = "none";
    if (this.game.stage.canvas) {
      this.game.stage.canvas.style.cursor = "none";
    }

    this.tickerFunction = () => {
      // Keep the chalk pinned directly to the raw cursor point coordinates
      this.chalk.x = this.game.stage.mouseX;
      this.chalk.y = this.game.stage.mouseY;
    };

    this.zim.Ticker.add(this.tickerFunction);
    return this.chalk;
  }

  remove() {
    if (this.tickerFunction) {
      this.zim.Ticker.remove(this.tickerFunction);
    }
    if (this.chalk) {
      this.chalk.removeFrom(this.game.stage);
    }

    // 🛠️ RESTORE defaults safely on exit
    document.body.style.cursor = "default";
    if (this.game.stage.canvas) {
      this.game.stage.canvas.style.cursor = "default";
    }
  }
}

export default Chalk;
