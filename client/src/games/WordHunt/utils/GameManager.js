import ControlPanel from "../UI/Panel";
import ProgressBar from "../UI/ProgressBar";
import Definitions from "./Definitions";
import Helper from "./Helper";
import { GameInfo } from "../DTO/GameInfo";

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
    this.service = this.game.serviceManager;
    this.gameTypesArray = [
      this.game.nounGameKey,
      this.game.verbGameKey,
      this.game.adjGameKey,
    ];

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

  initGame() {
    let gameType = "";
    this.gameTypesArray.forEach((game) => {
      gameType = game;
    });
    this.getTargetWordCount(gameType);
    if (this.nounCount == 0) {
      console.log("Noun Game Has No Play");
    }
  }
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
    console.log("Target Count: ", targetCount);

    // 🛠️ INTEGRATED: Run hints system logic for initial setup path
    this.calculateDynamicHintsAndPenalties(targetCount);

    return this.maxScore;
  }

  /**
   * Load best time from player history
   */
  setGameTimeFromBestHistory(gameType) {
    const playerInfo = this.game.playerInfo;

    if (!playerInfo) {
      return null;
    }

    const gameData = playerInfo?.games?.[gameType];

    if (!gameData || !gameData.bestTime) {
      return null;
    }

    const [minutes, seconds] = gameData.bestTime.split(":").map(Number);

    if (Number.isNaN(minutes) || Number.isNaN(seconds)) {
      return null;
    }

    const totalMinutes = minutes + seconds / 60;

    this.game.gameTime = totalMinutes;

    console.log(
      `${gameType} best time loaded:`,
      gameData.bestTime,
      "=>",
      totalMinutes,
    );

    const targetCount = this.getTargetWordCount(gameType);

    this.calculateDynamicHintsAndPenalties(targetCount);

    return totalMinutes;
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

  async addGameData(bestTime, hintsUsed, foundWords, gameInstance) {
    try {
      if (!this.verifyPlayer()) {
        console.log(
          "Player is Guest. Not Writing Game Information to Database",
        );
        return null;
      }

      const response = await this.writeGameInformation(
        bestTime,
        hintsUsed,
        foundWords,
        gameInstance,
      );

      return response;
    } catch (e) {
      throw new Error(e.message);
    }
  }

  verifyPlayer() {
    return this.game.player !== "Guest";
  }

  async writeGameInformation(bestTime, hintsUsed, foundWords, gameInstance) {
    try {
      const gameInfo = new GameInfo(
        this.game.currentGameId,
        this.game.currentStoryId,
        this.game.playerId,
        this.game.player,
        bestTime,
        this.game.EARNED_COINS,
        this.game.TOTAL_SCORE,
        hintsUsed,
        foundWords,
        gameInstance,
      );

      const response = await this.service.writeGameInfo(gameInfo);
      console.log("Response FROM MAnager: ", response);

      this.game.EARNED_COINS = 0;
      this.game.TOTAL_SCORE = 0;

      return response;
    } catch (e) {
      throw new Error(e.message);
    }
  }
}

export default GameManager;
