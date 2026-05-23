export default class ZimButton {
  constructor(
    zim,
    parent,
    width = 250,
    height = 80,
    label = "New ZIM BUTTON",
    fontSize = 18,
    backgroundColor = "#4E3D42",
    x = 0,
    y = 0,
    corner = 15,
  ) {
    this.zim = zim;
    this.parent = parent;

    this.button = new zim.Button(
      width,
      height,
      label,
      backgroundColor,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      corner,
    );

    if (this.button.label) {
      this.button.label.size = fontSize;
    }
    if (this.button) {
      this.button.corner = corner;
    }

    this.button.loc(x, y, parent);
  }

  get component() {
    return this.button;
  }
}
