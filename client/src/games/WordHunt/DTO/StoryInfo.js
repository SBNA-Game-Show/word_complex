class StoryInfo {
  constructor(
    gameId,
    storyId,
    nounGameWords,
    nounGameHints,
    verbGameWords,
    verbGameHints,
    adjGameWords,
    adjGameHints,
  ) {
    this.gameId = gameId;
    this.storyId = storyId;
    this.nounGameWords = nounGameWords;
    this.nounGameHints = nounGameHints;
    this.verbGameWords = verbGameWords;
    this.verbGameHints = verbGameHints;
    this.adjGameWords = adjGameWords;
    this.adjGameHints = adjGameHints;
  }
}

module.exports = StoryInfo;
