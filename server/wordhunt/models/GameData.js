class GameData {
  constructor(bestTime, coins, totalScore, hintsUsed, foundWords) {
    if (bestTime == null) {
      throw new Error("Best time is required");
    }

    this.bestTime = bestTime;
    this.coins = coins;
    if (totalScore == null) {
      throw new Error("Total Score is required");
    }
    this.totalScore = totalScore;
    this.hintsUsed = hintsUsed;
    this.foundWords = foundWords;
  }
}

module.exports = GameData;
