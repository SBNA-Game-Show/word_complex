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
    this.helper = new Helper(game);
    this.progressBar = new ProgressBar(game);
    this.definitions = new Definitions(game);
    this.controlPanel = new ControlPanel(game);

    this.wordTypes = null;
    this.totalWordsToFind = 0;
    this.baseHints = 1;
    this.basePenalty = 0.25;
    this.maxScore = 0;
    this.minScore = 0;

    this.nounCount = 0;
    this.verbCount = 0;
    this.adjectiveCount = 0;

    // GAME TIMINGS
    this.WORD_TIMING = 2 / 60;
    this.BASE_SCORE = 1;
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
    this.setInitialGameTime(gameType);
    return this.game.gameTime;
  }
  setInitialGameTime(gameType) {
    this.wordTypes = this.game.wordTypes;
    if (!this.wordTypes) return 0;

    this.nounCount = this.wordTypes.nouns?.length || 0;
    this.verbCount = this.wordTypes.verbs?.length || 0;
    this.adjectiveCount = this.wordTypes.adjectives?.length || 0;

    this.totalWordsToFind =
      this.nounCount + this.verbCount + this.adjectiveCount;

    let targetCount = 0;

    // 1. Isolate target word count based directly on gameType
    if (gameType === this.game.nounGameKey) {
      targetCount = this.nounCount;
    } else if (gameType === this.game.verbGameKey) {
      targetCount = this.verbCount;
    } else if (gameType === this.game.adjectiveGameKey) {
      targetCount = this.adjectiveCount;
    }

    // 2. Compute Dynamic Score Ceiling & Time Allocations
    this.maxScore = this.BASE_SCORE * targetCount;
    console.log("MAX SCORE: ", this.maxScore);
    this.game.gameTime = targetCount * this.WORD_TIMING;
    console.log("Game Time: ", this.game.gameTime.toFixed(2));
    console.log("Targer Count: ", targetCount);

    // 3. Dynamic Scaling for Hints & Penalties (Multiples of 10)
    // Base configuration for targetCount <= 9

    // Calculate how many times 10 fits completely into the targetCount
    // e.g., 12 words = 1 block of ten | 25 words = 2 blocks of ten
    const tenWordBlocks = Math.floor(targetCount / 10);

    if (tenWordBlocks > 0) {
      this.game.allowedHints = this.baseHints + tenWordBlocks;
      this.game.hintPenalty = this.basePenalty + tenWordBlocks * 0.025;
    } else {
      this.game.allowedHints = this.baseHints;
      this.game.hintPenalty = this.basePenalty;
    }

    console.log(
      `[${gameType} Mode] Targets: ${targetCount} | Max Score: ${this.maxScore} | Time Allowed: ${this.game.gameTime.toFixed(2)}m | Allowed Hints: ${this.game.allowedHints} | Penalty: ${this.game.hintPenalty}`,
    );

    return this.maxScore;
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

  setScore(gameType, foundCount, hintsUsed) {
    this.wordTypes = this.game.wordTypes;
    this.nounCount = this.wordTypes.nouns.length;
    this.verbCount = this.wordTypes.verbs.length;
    this.adjectiveCount = this.wordTypes.adjectives.length;

    if (gameType == this.game.nounGameKey) {
      return this.helper.calculateScore(foundCount, this.nounCount, hintsUsed);
    }
    return null;
  }
}

export default GameManager;
