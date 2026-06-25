import Timer from "../utils/Timer";

class BackButton {
  constructor(game, blackboard) {
    this.game = game;
    this.timer = new Timer(game);
    this.blackboard = blackboard;

    // This will be set by your game scene (e.g., button.backButtonTapped = () => { ... })
    this.backButtonTapped = null;
  }

  create() {
    const backBtn = new this.game.zim.Button({
      width: 90,
      height: 35,
      backgroundColor: "rgba(255, 224, 196, 0.8)",
      label: new this.game.zim.Label({
        text: "← Back",
        size: 16,
        color: "black",
        font: "Fredoka",
      }),
    });

    backBtn.pos(20, 20);
    backBtn.addTo(this.blackboard);

    // 🛠️ FIXED: Add the .tap listener to the visual button object itself
    backBtn.tap(() => {
      // Safely execute your custom callback if it has been assigned
      if (typeof this.backButtonTapped === "function") {
        this.backButtonTapped();
      }
    });

    return backBtn;
  }
}

export default BackButton;
