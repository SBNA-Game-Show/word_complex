import ControlPanel from "../UI/Panel";
import GameManager from "./GameManager";

/**
 * Helper class to hold helper methods to be resued
 */
class Helper {
  constructor(game) {
    this.game = game;
    this.config = null;
  }

  /**
   *
   * Given a passage this method returns the number of words in the given passage
   * - checks if the given passage is a string for english
   * - checks if the given passage for an array for sanskrit passage
   *
   */

  getPassageLength(data) {
    if (!data) {
      return;
    }
    let wordLength = 0;

    // STRING STORY
    if (typeof data === "string") {
      wordLength = data.trim().split(/\s+/).length;
    }

    // ARRAY STORY (sentences or words)
    else if (Array.isArray(data)) {
      const words = data
        .flatMap((sentence) =>
          typeof sentence === "string"
            ? sentence.split(/\s+/)
            : Array.isArray(sentence)
              ? sentence
              : [],
        )
        .filter(Boolean);

      wordLength = words.length;
    }
    return wordLength;
  }

  calculateScore(foundCount, totalCount, hintsUsed) {
    // 1. Core performance accuracy ratio (0.0 to 1.0)
    const accuracy = totalCount > 0 ? foundCount / totalCount : 0;

    // 2. Compute deduction based on how many times hint engine was opened
    const penaltyDeduction = hintsUsed * this.game.hintPenalty;
    console.log("CONFIG HINT PENALTY: ", this.game.hintPenalty);

    // 3. Normalize score baseline to 100 points maximum
    let finalScore = (accuracy - penaltyDeduction) * 100;

    // Safety check: Bound score so it never falls into negative points
    return Math.floor(0, Math.round(finalScore));
  }
}

export default Helper;
