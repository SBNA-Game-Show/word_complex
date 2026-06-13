class SuccessDialog {

  constructor(game) {
    this.game = game;
    this.zim = game.zim;
  }

  show(title, message, callback) {

    console.log("SUCCESS DIALOG OPENED");

    //---------------------------------
    // OVERLAY
    //---------------------------------

    const overlay =
      new this.zim.Container(
        this.game.width,
        this.game.height
      );

    overlay.addTo(this.game.stage);
    overlay.top();

    //---------------------------------
    // FADE
    //---------------------------------

    const fade =
      new this.zim.Rectangle(
        this.game.width,
        this.game.height,
        "rgba(0,0,0,.35)"
      );

    fade.addTo(overlay);
    fade.mouseEnabled = false;

    //---------------------------------
    // PANEL
    //---------------------------------

    const panel =
      new this.zim.Rectangle(
        700,
        400,
        "#FFF8F0",
        "#E9D8A6",
        5,
        25
      );

    panel.addTo(overlay);
    panel.center(overlay);

    //---------------------------------
    // EMOJI
    //---------------------------------

    const emoji =
      new this.zim.Label({
        text: "🎉",
        size: 70
      });

    emoji.addTo(overlay);
    emoji.center(panel);
    emoji.mov(0, -120);

    //---------------------------------
    // TITLE
    //---------------------------------

    const titleLabel =
      new this.zim.Label({
        text: title,
        size: 42,
        color: "#7B2CBF",
        bold: true
      });

    titleLabel.addTo(overlay);
    titleLabel.center(panel);
    titleLabel.mov(0, -40);

    //---------------------------------
    // MESSAGE
    //---------------------------------

    const messageLabel =
      new this.zim.Label({
        text: message,
        size: 24,
        color: "#555"
      });

    messageLabel.addTo(overlay);
    messageLabel.center(panel);
    messageLabel.mov(0, 30);

    //---------------------------------
    // CONTINUE BUTTON CONTAINER
    //---------------------------------

    const continueBtn = new this.zim.Container(300, 70);

        continueBtn.addTo(panel);

        continueBtn.x = 50;
        continueBtn.y = 280;

        new this.zim.Rectangle(
        300,
        70,
        "#9D6EFF",
        null,
        null,
        25
        ).addTo(continueBtn);

        new this.zim.Label({
        text: "Continue to Verbs",
        size: 26,
        color: "white"
        }).center(continueBtn);

        continueBtn.tap(() => {
        console.log("CONTINUE BUTTON TAP");
        });

    //---------------------------------
    // EXIT BUTTON CONTAINER
    //---------------------------------

    const exitBtn =
      new this.zim.Container(
        180,
        70
      );

    exitBtn.addTo(overlay);
    exitBtn.center(panel);
    exitBtn.mov(180, 120);

    const exitBg =
      new this.zim.Rectangle(
        180,
        70,
        "#FF8A80",
        null,
        null,
        25
      );

    exitBg.addTo(exitBtn);

    new this.zim.Label({
      text: "Exit Game",
      size: 26,
      color: "white"
    }).center(exitBtn);

    //---------------------------------
    // DEBUG EVENTS
    //---------------------------------

    overlay.tap(() => {
      console.log("OVERLAY TAP");
    });

    panel.tap(() => {
      console.log("PANEL TAP");
    });

    //---------------------------------
    // CONTINUE CLICK
    //---------------------------------

    continueBtn.tap(() => {

      console.log("CONTINUE BUTTON TAP");

      overlay.removeFrom();

      if (typeof callback === "function") {
        callback();
      }

      this.game.stage.update();
    });

    //---------------------------------
    // EXIT CLICK
    //---------------------------------

    exitBtn.tap(() => {

      console.log("EXIT BUTTON TAP");

      overlay.removeFrom();

      window.location.reload();
    });

    //---------------------------------
    // UPDATE
    //---------------------------------

    this.game.stage.update();
  }
}

export default SuccessDialog;