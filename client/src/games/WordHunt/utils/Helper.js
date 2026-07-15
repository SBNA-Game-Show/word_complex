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

    // console.log(
    //   `[Score Calc] Active Hints: ${hintsUsed} | Calculated Word Value: ${thisWordValue.toFixed(2)}`,
    // );

    return thisWordValue;
  }

  calculateGameTotal(foundCount, wordsToFind, timeElapsed, score, hintsUsed) {
    // 1. If no words were found, score is automatically zero
    if (foundCount === 0) {
      return 0;
    }

    // 2. Partial completion: Player found some words but not all before time ran out
    if (foundCount > 0 && foundCount < wordsToFind) {
      return score;
    }

    // 🛠️ UNIT FIX: Convert both total clock and elapsed parameters to SECONDS
    // This stops decimal minute scaling mismatches permanently!
    const totalTimeInSeconds = this.game.gameTime * 60;

    // If timeElapsed is coming in as minutes, convert it.
    // If it's already in seconds, remove the "* 60" multiplier below:
    const elapsedSeconds = timeElapsed < 1 ? timeElapsed * 60 : timeElapsed;

    // 3. Perfect completion: Player found ALL words within the allowed game time!
    if (foundCount === wordsToFind && elapsedSeconds <= totalTimeInSeconds) {
      const quarterTime = totalTimeInSeconds / 4;
      const halfTime = totalTimeInSeconds / 2;
      const threeQuarterTime = quarterTime * 3;

      // Quarter of the time or less
      if (elapsedSeconds <= quarterTime) {
        if (hintsUsed <= 0) {
          const result = score * 10;
          // console.log(
          //   `[Game Total] Elite Run (0 Hints)! Multiplier x10. Final: ${result}`,
          // );
          return result;
        }
        if (hintsUsed > 0) {
          const result = score * 8;
          // console.log(
          //   `[Game Total] Elite Run (With Hints)! Multiplier x8. Final: ${result}`,
          // );
          return result;
        }
      }

      // Half of the time or less
      if (elapsedSeconds <= halfTime) {
        if (hintsUsed <= 0) {
          const result = score * 5;
          // console.log(
          //   `[Game Total] Speed Run (0 Hints)! Multiplier x5. Final: ${result}`,
          // );
          return result;
        }
        if (hintsUsed > 0) {
          const result = score * 4;
          // console.log(
          //   `[Game Total] Speed Run (With Hints)! Multiplier x4. Final: ${result}`,
          // );
          return result;
        }
      }

      // 75% of the time or less
      if (elapsedSeconds <= threeQuarterTime) {
        if (hintsUsed <= 1) {
          const result = score * 3;
          // console.log(
          //   `[Game Total] Great Run (<=1 Hint)! Multiplier x3. Final: ${result}`,
          // );
          return result;
        }
        if (hintsUsed > 1) {
          const result = score * 2;
          // console.log(
          //   `[Game Total] Great Run (>1 Hint)! Multiplier x2. Final: ${result}`,
          // );
          return result;
        }
      }

      // Standard Run (Took more than 75% of the clock)
      if (hintsUsed === 1) {
        return score * 1.5;
      }

      return score;
    }

    // Fallback security check
    return score;
  }
}

export default Helper;
