import ControlPanel from "../UI/Panel";
import ProgressBar from "../UI/ProgressBar";
import Definitions from "./Definitions";
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
    this.definitions = new Definitions(game);
    this.controlPanel = new ControlPanel(game);
    // GAME TIMINGS
    this.BASE_SCORE = 1;
    this.PASSAGE_LESS_50 = { time: 0.5, maxHints: 1, hintPenalty: 0.25 }; // 30 SECONDS
    this.PASSAGE_50_100 = { time: 1, maxHints: 2, hintPenalty: 0.2 }; // 1 MINUTE
    this.PASSAGE_100_150 = { time: 5, maxHints: 5, hintPenalty: 0.1 }; //5 MINUTE
    this.PASSAGE_150_300 = { time: 10, maxHints: 10, hintPenalty: 0.15 };
    this.PASSAGE_300_500 = { time: 20, maxHints: 15, hintPenalty: 0.025 };
    this.PASSAGE_500_700 = { time: 30, maxHints: 30, hintPenalty: 0.075 };
    this.PASSAGE_700_1000 = { time: 45, maxHints: 40, hintPenalty: 0.095 };
    this.PASSAGE_GREATER_1000 = { time: 60, maxHints: 50, hintPenalty: 0.1 };
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
        this.game.gameTime = this.PASSAGE_LESS_50.time; // 30 sec
        this.game.activeConfig = this.PASSAGE_LESS_50;
        break;

      case wordLength > 50 && wordLength <= 100:
        this.game.gameTime = this.PASSAGE_50_100.time;
        this.game.activeConfig = this.PASSAGE_50_100;
        break;

      case wordLength > 100 && wordLength <= 150:
        this.game.gameTime = this.PASSAGE_100_150.time;
        this.game.activeConfig = this.PASSAGE_100_150;
        break;

      case wordLength > 150 && wordLength <= 300:
        this.game.gameTime = this.PASSAGE_150_300.time;
        this.game.activeConfig = this.PASSAGE_150_300;
        break;

      case wordLength > 300 && wordLength <= 500:
        this.game.gameTime = this.PASSAGE_300_500.time;
        this.game.activeConfig = this.PASSAGE_300_500;
        break;
      case wordLength > 500 && wordLength <= 700:
        this.game.gameTime = this.PASSAGE_500_700.time;
        this.game.activeConfig = this.PASSAGE_500_700;
        break;

      case wordLength > 700 && wordLength <= 1000:
        this.game.gameTime = this.PASSAGE_700_1000.time;
        this.game.activeConfig = this.PASSAGE_700_1000;
        break;
      case wordLength > 1000:
        this.game.gameTime = this.PASSAGE_GREATER_1000.time;
        this.game.activeConfig = this.PASSAGE_GREATER_1000;
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
   * Getting Definitions to display in character
   */

  defineNoun() {
    const definition = this.definitions.getRandomDefinition(
      this.definitions.nounDefEng,
    );

    return definition;
  }
  defineVerb() {
    const definition = this.definitions.getRandomDefinition(
      this.definitions.VerbDefEng,
    );
    return definition;
  }
  defineAdjective() {
    const definition = this.definitions.getRandomDefinition(
      this.definitions.adjDefEng,
    );
    return definition;
  }

  /**
   *SET HINTS BASED ON
   */

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
