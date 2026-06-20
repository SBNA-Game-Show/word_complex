import ProgressBar from "../UI/ProgressBar";
import Helper from "./Helper";

/**
 * The following class is responsible for setting game time 
 * -  initialize game time according to the user experience
 */
class GameManager {
  constructor(game) {
    this.game = game;
    this.helper = new Helper();
    this.progressBar = new ProgressBar(game);
  }

  /**
   * MAIN ENTRY
   * decides whether to use history OR passage length
   */
  setGameTime(gameType) {
    const data = this.game?.storyData?.story;
    if (!data) return 0;

    // 1. try history first
    const historyTime = this.setGameTimeFromBestHistory(gameType);
    if (historyTime != null) {
      return historyTime;
    }

    // 2. fallback to passage-based timing
    return this.setInitialTime(data);
  }

  /**
   * Set initial game time based on passage length
   */
  setInitialTime(data) {
    const wordLength = this.helper.getPassageLength(data);

    console.log("Passage Length:", wordLength);

    switch (true) {
      case wordLength <= 50:
        this.game.gameTime = 0.5; // 30 sec
        break;

      case wordLength > 50 && wordLength <= 100:
        this.game.gameTime = 1;
        break;

      case wordLength > 100 && wordLength <= 150:
        this.game.gameTime = 5;
        break;

      case wordLength > 150:
        this.game.gameTime = 10;
        break;

      default:
        this.game.gameTime = 1;
    }

    return this.game.gameTime;
  }

  /**
   * Load best time from player history
   */
  setGameTimeFromBestHistory(gameType) {
    const playerInfo = this.game.playerInfo;

    if (!Array.isArray(playerInfo)) return null;

    const storyData = playerInfo.find(
      (item) => item.storyId === this.game.currentStoryId,
    );

    if (!storyData) return null;

    const bestTime = storyData?.games?.[gameType]?.bestTime;
    if (bestTime == null) return null;

    const timeStr = String(bestTime);
    const [minStr, secStr] = timeStr.split(".");

    const minutes = Number(minStr) || 0;
    const seconds = Number(secStr) || 0;

    // convert FULL TIME → minutes (decimal)
    const totalMinutes = minutes + seconds / 60;

    if (isNaN(totalMinutes)) return null;

    this.game.gameTime = totalMinutes;

    console.log(
      `BestTime ${bestTime} → ${minutes}m ${seconds}s → ${totalMinutes} min`,
    );

    return this.game.gameTime;
  }

  /**
   * Normalize word
   */
  normalize(word) {
    return String(word)
      .toLowerCase()
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/[^\p{L}\p{N}']/gu, "")
      .trim();
  }
}

export default GameManager;
