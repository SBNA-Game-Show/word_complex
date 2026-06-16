class BackButton {
  constructor(game, blackboard) {
    this.game = game;
    this.blackboard = blackboard;
  }

  create() {
    const backBtn = new this.game.zim.Button({
        width: 90,
        height: 35,
        label: new this.game.zim.Label({
            text: "← Back",
            size: 16,
            color: "white"
        })
    });

    backBtn.pos(20, 20);
    backBtn.addTo(this.blackboard);

    backBtn.tap(() => {
      this.game.stage.removeAllChildren();

      // Return to main menu/home page
      this.game.start();

      this.game.stage.update();
    });

    return backBtn;
  }
}

export default BackButton;