export default class ZimInput {
  constructor(
    zim,
    parent,
    {
      width = 200,
      placeholder = "Enter your Name",
      height = 40,
      fontSize = 16,
      color = "#02111B",
      x = 0,
      y = 0,
      corner = 12,
    } = {},
  ) {
    this.zim = zim;
    this.parent = parent;

    this.input = new zim.TextInput(
      width,
      height,
      placeholder,
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
      null,
      corner,
    );

    this.input.size = fontSize;
    this.input.color = color;
    this.input.margin = 10;

    this.input.loc(x, y, parent);
  }

  getValue() {
    return this.input.text;
  }

  get component() {
    return this.input;
  }
}
