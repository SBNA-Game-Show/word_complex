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
    // 1. Calculate how much a single word is worth after hint deductions
    // Example: If hintPenalty is 0.05, 1 hint used means pointsPerWord = 100 - (1 * 5) = 95
    const penaltyPerWord = hintsUsed * (this.game.hintPenalty * 100);
    const pointsPerWord = Math.max(0, 100 - penaltyPerWord);

    // 2. Multiply the degraded word value by the number of words found
    const finalScore = foundCount * pointsPerWord;

    console.log(
      `[Score Calc] Words Found: ${foundCount} | Value Per Word: ${pointsPerWord} | Total Score: ${finalScore}`,
    );

    return Math.round(finalScore);
  }
}

export default Helper;
