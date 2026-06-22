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

  // splitPOSByTypeSanskrit() {
  //   const nouns = [];
  //   const verbs = [];
  //   const adjectives = [];

  //   // console.log("tokenizedArray =", this.tokenizedArray);

  //   this.game.tokenizedArray.forEach((sentence, i) => {
  //     // console.log("sentence", i, sentence);

  //     sentence.forEach((token) => {
  //       // console.log("text:", token.text, "upos:", token.upos);

  //       if (token.upos === "NOUN")
  //         nouns.push(this.manager.normalize(token.text));
  //       if (token.upos === "VERB")
  //         verbs.push(this.manager.normalize(token.text));
  //       if (token.upos === "ADJ")
  //         adjectives.push(this.manager.normalize(token.text));
  //     });
  //   });

  //   console.log("NOUNS", nouns);
  //   // console.log("VERBS", verbs);
  //   // console.log("ADJECTIVES", adjectives);

  //   return { nouns, verbs, adjectives };
  // }
  splitPOSByTypeSanskrit() {
    const nouns = [];
    const verbs = [];
    const adjectives = [];

    this.game.tokenizedArray.forEach((sentence, i) => {
      sentence.forEach((token) => {
        // 1. Normalize the word first
        const cleanedText = this.manager.normalize(token.text);

        // 2. ONLY push if the word is not empty or whitespace
        if (cleanedText && cleanedText.trim() !== "") {
          if (token.upos === "NOUN") nouns.push(cleanedText);
          if (token.upos === "VERB") verbs.push(cleanedText);
          if (token.upos === "ADJ") adjectives.push(cleanedText);
        }
      });
    });

    // 3. Remove all duplicates using a Set right before returning
    const uniqueNouns = [...new Set(nouns)];
    const uniqueVerbs = [...new Set(verbs)];
    const uniqueAdjectives = [...new Set(adjectives)];

    console.log("CLEAN UNIQUE NOUNS:", uniqueNouns);

    return {
      nouns: uniqueNouns,
      verbs: uniqueVerbs,
      adjectives: uniqueAdjectives,
    };
  }
}

export default GameServiceManager;
