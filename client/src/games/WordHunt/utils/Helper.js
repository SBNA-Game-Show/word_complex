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

  // calculateScore(foundCount, totalCount, hintsUsed) {
  //   // 1. Calculate how much a single word is worth after hint deductions
  //   // Example: If hintPenalty is 0.05, 1 hint used means pointsPerWord = 100 - (1 * 5) = 95
  //   const penaltyPerWord = hintsUsed * (this.game.hintPenalty * 100);
  //   const pointsPerWord = Math.max(0, 100 - penaltyPerWord);

  //   // 2. Multiply the degraded word value by the number of words found
  //   const finalScore = foundCount * pointsPerWord;

  //   console.log(
  //     `[Score Calc] Words Found: ${foundCount} | Value Per Word: ${pointsPerWord} | Total Score: ${finalScore}`,
  //   );

  //   return Math.round(finalScore);
  // }
  // calculateScore(foundCount, totalCount, hintsUsed) {
  //   // Use the actual game base score dynamically (default to 1 if not set)
  //   const baseWordValue = this.game.BASE_SCORE ?? 1;

  //   // Calculate the penalty fraction to deduct per word
  //   const penaltyPerWord = hintsUsed * this.game.hintPenalty;
  //   const pointsPerWord = Math.max(0, baseWordValue - penaltyPerWord);

  //   const finalScore = foundCount * pointsPerWord;

  //   console.log(
  //     `[Score Calc] Words Found: ${foundCount} | Value Per Word: ${pointsPerWord.toFixed(3)} | Total Score: ${finalScore.toFixed(2)}`,
  //   );

  //   return Math.round(finalScore);
  // }
  // calculateScore(foundCount, totalCount, hintsUsed) {
  //   // 1. Establish the base word value directly from the central Game instance
  //   const baseWordValue = this.game.BASE_SCORE ?? 1;

  //   // 2. Fetch the scaled penalty rate managed dynamically by your GameManager
  //   const currentPenaltyRate =
  //     this.game.hintPenalty ?? this.game.BASE_PENALTY ?? 0.25;

  //   // 3. Degrade the points allocated per word based on active hints used
  //   const penaltyPerWord = hintsUsed * currentPenaltyRate;
  //   const pointsPerWord = Math.max(0, baseWordValue - penaltyPerWord);

  //   // 4. Multiply degraded unit value by total correct words found
  //   const finalScore = foundCount * pointsPerWord;

  //   console.log(
  //     `[Score Calc] Mode Total Targets: ${totalCount} | Found: ${foundCount} | Hints Used: ${hintsUsed} | Active Hint Penalty Rate: ${currentPenaltyRate} | Worth Per Word: ${pointsPerWord.toFixed(2)} | Raw Score: ${finalScore.toFixed(2)}`,
  //   );

  //   // Round cleanly to the closest whole integer
  //   return finalScore;
  // }

  calculateScore(foundCount, totalCount, hintsUsed) {
    // 1. Establish the base value of a single word
    const baseWordValue = this.game.BASE_SCORE ?? 1;

    // 2. Fetch the dynamic penalty rate from GameManager
    const currentPenaltyRate =
      this.game.hintPenalty ?? this.game.BASE_PENALTY ?? 0.25;

    // 3. Deduct penalty only if a hint is currently active
    const penaltyForThisWord = hintsUsed * currentPenaltyRate;
    const thisWordValue = Math.max(0, baseWordValue - penaltyForThisWord);

    console.log(
      `[Score Calc] New Word Value: ${thisWordValue.toFixed(2)} (Hints Active: ${hintsUsed})`,
    );

    // Return the decimal value so the game can track exact cumulative scores
    return thisWordValue;
  }
}

export default Helper;
