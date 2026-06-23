import {
  retrieveEnglishVersion,
  retrieveSanskritVersion,
} from "../../../services/wordHuntService";
import GameManager from "./GameManager";
/**
 * The following class will be responsible for connecting with services to make api calls to retrieve data from database
 */
class GameServiceManager {
  constructor(game) {
    this.game = game;
    this.manager = new GameManager(game);
    this.storyId = null;
    this.data = null;
  }

  // English Version

  async getPassageByIdEnglish() {
    try {
      this.storyId = this.game.currentStoryId;
      console.log("Story Id: ", this.storyId);
      const response = await retrieveEnglishVersion(this.storyId);
      console.log("RESPONSE:", response);

      this.data = response;
      this.processDataEnglish();

      return response;
    } catch (error) {
      console.error("Failed to load story:", error);
    }
  }

  processDataEnglish() {
    if (!this.data) {
      console.log("Backend Not Connected");
      return;
    }
    this.game.storyData = {
      story: this.data.passage,
    };

    this.game.passageArray = this.data.passageArray;
    this.game.tokenizedArray = this.data.tokenizedPassage;
    // console.log("Tokenized Array : ", this.tokenizedArray);
    this.game.wordTypes = this.splitPOSByTypeEnglish();
    console.log("Word Types:", this.wordTypes);
  }

  splitPOSByTypeEnglish() {
    const nouns = [];
    const verbs = [];
    const adjectives = [];

    this.game.tokenizedArray.forEach((item) => {
      // console.log("ITEM 0 IN TOKENZIED ARRAY:", item.text);
      if (item.pos === "NOUN") {
        nouns.push(item.text);
      }
      if (item.pos === "VERB") {
        verbs.push(item.text);
      }

      if (item.pos === "ADJ") {
        adjectives.push(item.text);
      }
    });

    return {
      nouns,
      verbs,
      adjectives,
    };
  }
  // Sanskrit Version

  async getPassageByIdSanskrit() {
    try {
      this.storyId = this.game.currentStoryId;
      const response = await retrieveSanskritVersion(this.storyId);

      console.log("RESPONSE:", response);
      this.data = response;
      this.processDataSanskrit();

      return response;
    } catch (error) {
      console.error("Failed to load story:", error);
    }
  }

  processDataSanskrit() {
    if (!this.data) {
      console.log("Backend Not Connected");
      return;
    }
    this.game.storyData = {
      story: this.data.passage,
    };

    this.game.passageArray = this.data.passageArray;
    this.game.tokenizedArray = this.data.tokenizedPassage;
    // console.log("Tokenized Array : ", this.tokenizedArray);
    this.game.wordTypes = this.splitPOSByTypeSanskrit();
    console.log("Word Types:", this.wordTypes);
  }

  splitPOSByTypeSanskrit() {
    const nouns = [];
    const verbs = [];
    const adjectives = [];

    // console.log("tokenizedArray =", this.tokenizedArray);

    this.game.tokenizedArray.forEach((sentence, i) => {
      // console.log("sentence", i, sentence);

      sentence.forEach((token) => {
        // console.log("text:", token.text, "upos:", token.upos);

        if (token.upos === "NOUN")
          nouns.push(this.manager.normalize(token.text));
        if (token.upos === "VERB")
          verbs.push(this.manager.normalize(token.text));
        if (token.upos === "ADJ")
          adjectives.push(this.manager.normalize(token.text));
      });
    });

    console.log("NOUNS", nouns);
    // console.log("VERBS", verbs);
    // console.log("ADJECTIVES", adjectives);

    return { nouns, verbs, adjectives };
  }
  // splitPOSByTypeSanskrit() {
  //   const rawNouns = [];
  //   const rawVerbs = [];
  //   const rawAdjectives = [];

  //   this.game.tokenizedArray.forEach((sentence) => {
  //     sentence.forEach((token) => {
  //       const cleanedText = this.manager.normalize(token.text);
  //       const cleanedLemma = token.lemma
  //         ? this.manager.normalize(token.lemma)
  //         : cleanedText;

  //       // 1. Only process if we have valid strings
  //       if (cleanedText && cleanedText.trim() !== "") {
  //         const wordObject = {
  //           text: cleanedText,
  //           lemma: cleanedLemma,
  //         };

  //         if (token.upos === "NOUN") rawNouns.push(wordObject);
  //         if (token.upos === "VERB") rawVerbs.push(wordObject);
  //         if (token.upos === "ADJ") rawAdjectives.push(wordObject);
  //       }
  //     });
  //   });

  //   // 2. Custom Helper Function to filter out duplicate lemmas
  //   const removeDuplicateLemmas = (arr) => {
  //     const seenLemmas = new Set();
  //     return arr.filter((item) => {
  //       if (seenLemmas.has(item.lemma)) {
  //         return false; // Skip if we've already added this lemma root
  //       }
  //       seenLemmas.add(item.lemma);
  //       return true;
  //     });
  //   };

  //   // 3. Deduplicate all lists
  //   const uniqueNouns = removeDuplicateLemmas(rawNouns);
  //   const uniqueVerbs = removeDuplicateLemmas(rawVerbs);
  //   const uniqueAdjectives = removeDuplicateLemmas(rawAdjectives);

  //   console.log("STRUCTURED UNIQUE NOUNS:", uniqueNouns);

  //   return {
  //     nouns: uniqueNouns,
  //     verbs: uniqueVerbs,
  //     adjectives: uniqueAdjectives,
  //   };
  // }
}

export default GameServiceManager;
