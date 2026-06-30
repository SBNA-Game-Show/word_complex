import ZimLabel from "../ZimComponents/ZimLabelNew";
import ZimContainer from "../ZimComponents/ZimContainerNew";

class PlayerInformation {
  constructor(game) {
    this.game = game;
    this.player = this.game.player;
    this.statLabels = [];
    this.containerWidth = 460;
    this.containerHeight = 80;
  }

  create() {
    const container = new ZimContainer(
      this.game,
      this.containerWidth,
      this.containerHeight,
    ).createContainer();

    container.addTo(this.game.stage);

    // -----------------------------
    // BACKGROUND
    // -----------------------------
    const bg = new this.game.zim.Rectangle({
      width: this.containerWidth,
      height: this.containerHeight,
      color: "#1E3A1E",
      corner: 14,
    });

    bg.addTo(container);

    // -----------------------------
    // HUD DATA
    // -----------------------------
    const stats = [
      { key: "Player", value: this.player || "Guest" },
      { key: "Score", value: 0 },
      { key: "Coins", value: this.game.EARNED_COINS || 0 },
      { key: "Total", value: this.game.TOTAL_SCORE || 0 },
    ];

    const colWidth = this.containerWidth / stats.length;

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
      const y = (this.containerHeight - label.label.height) / 2;

      label.pos(x, y);

      this.statLabels.push({
        ref: label,
        key: item.key,
        index: index,
      });
    });

    this.container = container;
    this.game.stage.update();

    return container;
  }

  update(currentScore) {
    const colWidth = this.containerWidth / this.statLabels.length;

    this.statLabels.forEach((s) => {
      let value = 0;

      // 🛠️ FIX: Fixed the case statement syntax errors
      switch (s.key) {
        case "Player":
          value = this.game.player || "Guest";
          break;

        case "Score":
          // Handle safe fallback tracking values if currentScore is null or omitted
          const scoreNum =
            currentScore !== undefined && currentScore !== null
              ? currentScore
              : 0;
          value = typeof scoreNum === "number" ? scoreNum : scoreNum;
          break;

        case "Coins":
          value = this.game.EARNED_COINS || 0;
          break;

        case "Total":
          const totalVal = this.game.TOTAL_SCORE || 0;
          value = typeof totalVal === "number" ? totalVal : totalVal;
          break;

        default:
          value = 0;
      }

      // Update the structural text value safely
      s.ref.setText(`${s.key}\n${value}`);

      // Re-calculate the layout boundaries for alignment
      const nextX = s.index * colWidth + (colWidth - s.ref.label.width) / 2;
      const nextY = (this.containerHeight - s.ref.label.height) / 2;
      s.ref.pos(nextX, nextY);
    });

    this.game.stage.update();
  }
}

export default PlayerInformation;
