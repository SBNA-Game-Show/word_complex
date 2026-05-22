export default class ZIMButton {
  constructor(zim, label = "Button", width = 160, height = 50, color = "#000") {
    if (!zim) {
      console.error("ZIM instance missing in ZIMButton constructor!");
      return;
    }

    this.component = new zim.Container(width, height);

    // 1. Create the background and set its registration point to its center
    const bg = new zim.Rectangle(width, height, color, "#333", 2, 10);
    bg.centerReg(this.component);

    // 2. Create the label text
    const txt = new zim.Label({
      text: label,
      size: 18,
      color: "white",
      font: "Arial",
      align: "center", // Force horizontal text alignment alignment
      valign: "center", // Force vertical font-baseline alignment
    });

    // 3. Center the label's registration point inside the container
    txt.centerReg(this.component);

    this.component.cursor = "pointer";

    // --- Interactive Hover Animations ---
    this.component.on("mouseover", () => {
      bg.alpha = 0.8;
      this.component.stage?.update();
    });

    this.component.on("mouseout", () => {
      bg.alpha = 1;
      this.component.stage?.update();
    });

    // --- Fixed Scale Animations ---
    // By using centerReg on the kids, scaling the parent container (0.95)
    // now shrinks it perfectly toward the true visual center instead of skewed from the top-left corner!
    this.component.on("mousedown", () => {
      this.component.scale = 0.95;
      this.component.stage?.update();
    });

    this.component.on("pressup", () => {
      this.component.scale = 1;
      this.component.stage?.update();
    });
  }
}
