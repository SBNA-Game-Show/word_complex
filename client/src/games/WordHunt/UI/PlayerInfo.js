import ZimLabel from "../../../zimcomponents/ZimLabel";
import ZimContainer from "../../../zimcomponents/ZimContainer";

class PlayerInformation {
  constructor(game) {
    this.game = game;
    this.player = this.game.player;
    this.statLabels = [];
  }

  create() {
    const containerWidth = 460;
    const containerHeight = 80;

    const container = new ZimContainer(
      this.game,
      containerWidth,
      containerHeight,
    ).createContainer();

    container.addTo(this.game.stage);

    // -----------------------------
    // BACKGROUND
    // -----------------------------
    const bg = new this.game.zim.Rectangle({
      width: containerWidth,
      height: containerHeight,
      color: "#1E3A1E",
      corner: 14,
      alpha: 0.85,
    });

    bg.addTo(container);

    // -----------------------------
    // HUD DATA
    // -----------------------------
    const stats = [
      { key: "Player", value: this.player || "Guest" },
      { key: "Score", value: this.game.totalScore || 0 },
      { key: "Coins", value: this.game.playerCoins || 0 },
      { key: "Total", value: this.game.totalScore || 0 },
    ];

    const colWidth = containerWidth / stats.length;

    stats.forEach((item, index) => {
      const label = new ZimLabel(
        this.game,
        `${item.key}\n${item.value}`,
        18,
        "white",
      ).createLabel();

      label.addTo(container);

      // Center label inside its column
      const x = index * colWidth + (colWidth - label.label.width) / 2;

      const y = (containerHeight - label.label.height) / 2;

      label.pos(x, y);

      this.statLabels.push({
        ref: label,
        key: item.key,
      });
    });

    this.container = container;

    this.game.stage.update();

    return container;
  }

  update(currentScore) {
    this.statLabels.forEach((s) => {
      let value;

      switch (s.key) {
        case "Player":
          value = this.game.player;
          break;

        case "Score":
          value = currentScore;
          break;

        case "Coins":
          value = this.game.playerCoins;
          break;

        case "Total":
          value = this.game.totalScore;
          break;
      }

      s.ref.setText(`${s.key}\n${value}`);
    });

    this.game.stage.update();
  }
}

export default PlayerInformation;
