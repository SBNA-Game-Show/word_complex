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
    this.basePenalty = 0.025;
    this.maxScore = 0;
    this.minScore = 0;

    this.nounCount = 0;
    this.verbCount = 0;
    this.adjectiveCount = 0;

    // GAME TIMINGS
    this.WORD_TIMING = 2 / 60;
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
    this.maxScore = this.BASE_SCORE * targetCount * 100;
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
      this.game.hintPenalty = this.basePenalty + tenWordBlocks * 0.25;
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
   * Set initial game time based on passage length
   */
  // setInitialTime(data) {
  //   const wordLength = this.helper.getPassageLength(data);

  //   // console.log("Passage Length:", wordLength);

  //   this.wordTypes = this.game.wordTypes;

  //   this.nounCount = this.wordTypes.nouns.length;
  //   this.verbCount = this.wordTypes.verbs.length;
  //   this.adjectiveCount = this.wordTypes.adjectives.length;

  //   this.totalWordsToFind =
  //     this.nounCount + this.verbCount + this.adjectiveCount;

  //   switch (true) {
  //     case wordLength <= 50:
  //       this.game.gameTime = this.PASSAGE_LESS_50.time; // 30 sec
  //       this.game.activeConfig = this.PASSAGE_LESS_50;
  //       break;

  //     case wordLength > 50 && wordLength <= 100:
  //       this.game.gameTime = this.PASSAGE_50_100.time;
  //       this.game.activeConfig = this.PASSAGE_50_100;
  //       break;

  //     case wordLength > 100 && wordLength <= 150:
  //       this.game.gameTime = this.PASSAGE_100_150.time;
  //       this.game.activeConfig = this.PASSAGE_100_150;
  //       break;

  //     case wordLength > 150 && wordLength <= 300:
  //       this.game.gameTime = this.PASSAGE_150_300.time;
  //       this.game.activeConfig = this.PASSAGE_150_300;
  //       break;

  //     case wordLength > 300 && wordLength <= 500:
  //       this.game.gameTime = this.PASSAGE_300_500.time;
  //       this.game.activeConfig = this.PASSAGE_300_500;
  //       break;
  //     case wordLength > 500 && wordLength <= 700:
  //       this.game.gameTime = this.PASSAGE_500_700.time;
  //       this.game.activeConfig = this.PASSAGE_500_700;
  //       break;

  //     case wordLength > 700 && wordLength <= 1000:
  //       this.game.gameTime = this.PASSAGE_700_1000.time;
  //       this.game.activeConfig = this.PASSAGE_700_1000;
  //       break;
  //     case wordLength > 1000:
  //       this.game.gameTime = this.PASSAGE_GREATER_1000.time;
  //       this.game.activeConfig = this.PASSAGE_GREATER_1000;
  //       break;

  //     default:
  //       this.game.gameTime = 1;
  //   }

  //   return this.game.gameTime;
  // }

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
