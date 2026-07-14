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

  /**
   * 🛠️ HELPER: Isolates target word count directly by gameType
   */
  getTargetWordCount(gameType) {
    this.wordTypes = this.game.wordTypes;
    if (!this.wordTypes) return 0;

    this.nounCount = this.wordTypes.nouns?.length || 0;
    this.verbCount = this.wordTypes.verbs?.length || 0;
    this.adjectiveCount = this.wordTypes.adjectives?.length || 0;

    this.totalWordsToFind =
      this.nounCount + this.verbCount + this.adjectiveCount;

    if (gameType === this.game.nounGameKey) return this.nounCount;
    if (gameType === this.game.verbGameKey) return this.verbCount;
    if (gameType === this.game.adjGameKey) return this.adjectiveCount;

    return 0;
  }

  /**
   * 🛠️ SHARED ENGINE: Calculates hints and penalties dynamically
   * based on target word count block segments (Multiples of 10)
   */
  calculateDynamicHintsAndPenalties(targetCount) {
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

    // console.log(
    //   `[Hint Config Loaded] Allowed: ${this.game.allowedHints} | Penalty: ${this.game.hintPenalty}`,
    // );
  }

  calculateHints(wordCount) {
    const tenWordBlocks = Math.floor(wordCount / 10);
    const baseHints = this.game.BASE_HINTS ?? 1;

    if (tenWordBlocks > 0) {
      return baseHints + tenWordBlocks;
    }
    return baseHints;
  }

  setInitialGameTime(gameType) {
    const targetCount = this.getTargetWordCount(gameType);

    const baseScore = this.game.BASE_SCORE ?? 1;
    const wordTiming = this.game.WORD_TIMING ?? 2 / 60;

    this.maxScore = baseScore * targetCount;
    // console.log("MAX SCORE: ", this.maxScore);

    this.game.gameTime = targetCount * wordTiming;
    // console.log("Game Time: ", this.game.gameTime.toFixed(2));
    // console.log("Target Count: ", targetCount);

    // 🛠️ INTEGRATED: Run hints system logic for initial setup path
    this.calculateDynamicHintsAndPenalties(targetCount);

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

    const totalMinutes = minutes + seconds / 60;
    if (isNaN(totalMinutes)) return null;

    this.game.gameTime = totalMinutes;
    // console.log(
    //   `BestTime ${bestTime} → ${minutes}m ${seconds}s → ${totalMinutes} min`,
    // );

    // 🛠️ INTEGRATED: Run structural hint math block scaling for history paths too!
    const targetCount = this.getTargetWordCount(gameType);
    this.calculateDynamicHintsAndPenalties(targetCount);

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
      .normalize("NFC")
      .replace(/[\s\u200B-\u200D]/g, "")
      .replace(/[।,;.:!?]/g, "")
      .toLowerCase();
  }

  setScore(gameType, foundCount, hintsUsed) {
    this.wordTypes = this.game.wordTypes;
    this.nounCount = this.wordTypes.nouns.length;
    // console.log("NOUN COUNT: ", this.nounCount);
    this.verbCount = this.wordTypes.verbs.length;
    this.adjectiveCount = this.wordTypes.adjectives.length;

    if (gameType === this.game.nounGameKey) {
      return this.helper.calculateScore(foundCount, this.nounCount, hintsUsed);
    }
    if (gameType === this.game.verbGameKey) {
      return this.helper.calculateScore(foundCount, this.verbCount, hintsUsed);
    }
    return null;
  }

  setGameTotal(foundCount, elapsedMs, score) {
    const timeElapsedInMinutes = elapsedMs / 60000;
    const hintsUsed = this.controlPanel.hintCounter;

    return this.helper.calculateGameTotal(
      foundCount,
      this.nounCount,
      timeElapsedInMinutes,
      score,
      hintsUsed,
    );
  }

  assignCoins(score) {
    // console.log("Assign coins method called with score:", score);

    const cutoff = this.game.BASE_COIN_SCORE;
    const tenPointBlocks = Math.floor(score / cutoff);

    if (tenPointBlocks > 0) {
      return tenPointBlocks * 2;
    }

    return 0;
  }
}

export default GameManager;
