class ZimLabel {
  constructor(game, text, fontSize = 32, color = "white") {
    this.game = game;
    this.zim = game.zim;

    this.text = text;
    this.fontSize = fontSize;
    this.color = color;

    this.label = null;
    this.tapHandler = null;
  }

  createLabel() {
    this.label = new this.zim.Label({
      text: this.text,
      size: this.fontSize,
      color: this.color,
    });

    return this;
  }

  addTo(parent) {
    this.label.addTo(parent);
    return this;
  }

  pos(x, y) {
    this.label.pos(x, y);
    return this;
  }

  setColor(color) {
    this.label.color = color;
    this.game.stage.update();
    return this;
  }

  setText(text) {
    this.label.text = text;
    this.game.stage.update();
    return this;
  }

  tap(callback) {
    this.tapHandler = callback;

    this.label.tap(() => {
      if (this.tapHandler) this.tapHandler(this);
    });

    return this;
  }
}

export default ZimLabel;
