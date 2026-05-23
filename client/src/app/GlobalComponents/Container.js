export default class ZimContainer {
  constructor(
    zim,
    stage,
    width = 450,
    height = 450,
    backgroundColor = "red",
    xPosition = 250,
    yPosition = 250,
    cols = 3,
    rows = 3,
    cellPadding = 2,
    corner = 15,
  ) {
    this.zim = zim;
    this.stage = stage;

    this.width = width;
    this.height = height;

    this.cols = cols;
    this.rowsCount = rows; // renamed to avoid conflict
    this.cellPadding = cellPadding;

    this.xPosition = xPosition;
    this.yPosition = yPosition;

    // =========================
    // GRID SIZE CALCULATION
    // =========================
    this.cellWidth = width / cols;
    this.cellHeight = height / rows;

    // =========================
    // CONTAINER
    // =========================
    this.container = new zim.Container(width, height, corner);

    // =========================
    // BACKGROUND
    // =========================
    this.background = new zim.Rectangle(width, height, backgroundColor);

    this.background.addTo(this.container);

    // =========================
    // TRACKING
    // =========================
    this.children = [];

    this.addTo(xPosition, yPosition);
  }

  // =========================
  // GRID ADD FUNCTION
  // =========================
  add(component, row = 0, col = 0) {
    const item = component.component || component;

    const x = col * this.cellWidth + this.cellPadding;

    const y = row * this.cellHeight + this.cellPadding;

    item.loc(x, y, this.container);

    this.children.push({ item, row, col });

    this.stage.update();
  }

  // =========================
  // AUTO ROW ADD (OPTIONAL)
  // =========================
  addRow(components = [], rowIndex = 0) {
    components.forEach((component, colIndex) => {
      this.add(component, rowIndex, colIndex);
    });
  }

  // =========================
  // POSITION CONTAINER
  // =========================
  addTo(x = this.xPosition, y = this.yPosition) {
    this.container.loc(x, y, this.stage);
    this.stage.update();
  }

  // =========================
  // GET COMPONENT
  // =========================
  get component() {
    return this.container;
  }
}
