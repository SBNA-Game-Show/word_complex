import Helper from "./Helper";
class GameManager {
  constructor(game) {
    this.game = game;
    this.helper = new Helper();
  }

  /**
   * Counts total words in passage
   * (used for timer scaling / difficulty)
   */
  setFirstAttemptTime() {
    const data = this.game?.storyData?.story;
    if (!data) return 0;

    const wordLength = this.helper.getPassageLength(data);

    console.log("Passage Length: ", wordLength);

    if (wordLength > 110) {
      this.game.firstAttemptTime = 5;
    }
    if (wordLength < 110) {
      this.game.firstAttemptTime = 1;
    }
  }

  /**
   * Normalize word for comparison
   */
  normalize(word) {
    return String(word)
      .toLowerCase()
      .replace(/[\u200B-\u200D\uFEFF]/g, "") // invisible chars
      .replace(/[^\p{L}\p{N}']/gu, "") // unicode-safe cleanup
      .trim();
  }
}

export default GameManager;
