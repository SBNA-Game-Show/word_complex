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

    this.maxScore = 0;
    this.minScore = 0;

    this.nounCount = 0;
    this.verbCount = 0;
    this.adjectiveCount = 0;
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
    } else if (gameType === this.game.adjGameKey) {
      // 🛠️ FIXED: Changed from adjectiveGameKey to match Game.js property adjGameKey
      targetCount = this.adjectiveCount;
    }

    // 2. Pull variables directly from central Game config
    const baseScore = this.game.BASE_SCORE ?? 1;
    const wordTiming = this.game.WORD_TIMING ?? 2 / 60;

    // 3. Compute Dynamic Score Ceiling & Time Allocations
    this.maxScore = baseScore * targetCount;
    console.log("MAX SCORE: ", this.maxScore);

    this.game.gameTime = targetCount * wordTiming;
    console.log("Game Time: ", this.game.gameTime.toFixed(2));
    console.log("Target Count: ", targetCount);

    // 4. Dynamic Scaling for Hints & Penalties (Multiples of 10)
    const tenWordBlocks = Math.floor(targetCount / 10);

    const baseHints = this.game.BASE_HINTS ?? 1;
    const basePenalty = this.game.BASE_PENALTY ?? 0.25;

    if (tenWordBlocks > 0) {
      this.game.allowedHints = baseHints + tenWordBlocks;
      this.game.hintPenalty = basePenalty + tenWordBlocks * 0.25;
    } else {
      this.game.allowedHints = baseHints;
      this.game.hintPenalty = basePenalty;
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

  defineNoun() {
    return this.definitions.getRandomDefinition(this.definitions.nounDefEng);
  }

  defineVerb() {
    return this.definitions.getRandomDefinition(this.definitions.VerbDefEng);
  }

  defineAdjective() {
    return this.definitions.getRandomDefinition(this.definitions.adjDefEng);
  }

  normalize(word) {
    return String(word)
      .normalize("NFC") // Standardize Unicode
      .replace(/[\s\u200B-\u200D]/g, "") // Remove all spaces and hidden joiners
      .replace(/[।,;.:!?]/g, "") // Remove punctuation like Danda (|)
      .toLowerCase(); // Lowercase (if using Roman transliteration
  }

  setScore(gameType, foundCount, hintsUsed) {
    this.wordTypes = this.game.wordTypes;
    this.nounCount = this.wordTypes.nouns.length;
    console.log("NOUN COUNT: ", this.nounCount);
    this.verbCount = this.wordTypes.verbs.length;
    this.adjectiveCount = this.wordTypes.adjectives.length;

    // We pass down gameType to helper if you expand game scoring modes later
    if (gameType === this.game.nounGameKey) {
      return this.helper.calculateScore(foundCount, this.nounCount, hintsUsed);
    }
    return null;
  }
  setGameTotal(gameType,timeElapsed,score){}
}

export default GameManager;
