// src/app/GlobalComponents/MainScene.js
import ZIMButton from "@/app/GlobalComponents/button";

export default class MainScene {
  constructor(zim, stage) {
    this.zim = zim;
    this.stage = stage;

    // Track visual elements globally on the class instance so we can reposition them on resize if needed
    this.ball = null;
    this.customButton = null;
    this.triangle = null;

    this.createWorld();
  }

  createWorld() {
    const zim = this.zim;
    const stage = this.stage;

    // 1. Add your interactive Circle
    this.ball = new zim.Circle(100, "purple");
    this.ball.center(stage);
    this.ball.drag();

    //adding a triangle
    // this.triangle = new Triangle(200, null, null, "green").center(stage);

    // 2. Instantiate and add your custom button wrapper
    this.customButton = new ZIMButton(zim, "Submit", 200, 60, "#222");
    this.customButton.component.loc(100, 100, stage);

    stage.addChild(this.customButton.component);

    // 3. Render everything onto the viewport
    stage.update();
  }

  // This handles the layout scaling cleanly without wiping your canvas data
  handleResize() {
    if (!this.stage) return;

    // ZIM's FIT scaling scales your assets proportionally.
    // This forces the renderer to refresh the scale metrics instantly without flickering.
    this.stage.update();
  }

  destroy() {
    if (this.stage) {
      this.stage.removeAllEventListeners(); // Stops running tickers from throwing errors
      this.stage.removeAllChildren();
      this.stage.update();
    }
  }
}
