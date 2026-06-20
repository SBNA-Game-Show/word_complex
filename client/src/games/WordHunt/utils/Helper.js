/**
 * Helper class to hold helper methods to be resued
 */
class Helper {
    constructor() { }
    
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


}

export default Helper;
