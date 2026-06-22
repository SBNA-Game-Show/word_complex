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
    const baseWordValue = this.game.BASE_SCORE ?? 1; // 1.00
    const basePenalty = this.game.BASE_PENALTY ?? 0.25; // 0.25

    // 1. Calculate the raw deduction (0.25 per hint)
    const totalDeduction = hintsUsed * basePenalty;

    // 2. Subtract from base score, capped at a floor value of 0.25
    const lowestScoreFloor = 0.25;
    const thisWordValue = Math.max(
      lowestScoreFloor,
      baseWordValue - totalDeduction,
    );

    console.log(
      `[Score Calc] Active Hints: ${hintsUsed} | Calculated Word Value: ${thisWordValue.toFixed(2)}`,
    );

    return thisWordValue;
  }
}

export default Helper;
