export class GameInfo {
  constructor(
    gameId,
    storyId,
    playerId,
    playerName,
    bestTime,
    coins,
    totalScore,
    hintsUsed,
    foundWords,
    gameInstance,
  ) {
    this.gameId = gameId;
    this.storyId = storyId;
    this.playerId = playerId;
    this.playerName = playerName;
    this.bestTime = bestTime;
    this.coins = coins;
    this.totalScore = totalScore;
    this.hintsUsed = hintsUsed;
    this.foundWords = foundWords;
    this.gameInstance = gameInstance;
  }
}
