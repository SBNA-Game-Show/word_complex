import {
  retrieveEnglishVersion,
  retrieveSanskritVersion,
  writeStoryInformation,
  writeGameInformation,
} from "../../../services/wordHuntService";
import GameManager from "./GameManager";

import { getStorySets } from "../../../services/admin/StorySetService";
import { StoryInfo } from "../DTO/StoryInfo";
/**
 * The following class will be responsible for connecting with services to make api calls to retrieve data from database
 */
class GameServiceManager {
  constructor(game) {
    this.game = game;
    this.manager = new GameManager(game);
    this.storyId = null;
    this.data = null;

    // Story Data
    this.nounCount = null;
    this.nounHint = null;

    this.verbCount = null;
    this.verbHint = null;

    this.adjCount = null;
    this.adjHint = null;
  }

  // English Version

  async getPassageByIdEnglish() {
    try {
      this.storyId = this.game.currentStoryId;
      const response = await retrieveEnglishVersion(this.storyId);
      console.log("RESPONSE:", response);

      this.data = response;
      this.processDataEnglish();
      await this.extractGameId();

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
    console.log("Word Types:", this.game.wordTypes);
    this.nounCount = this.game.wordTypes.nouns.length;
    this.verbCount = this.game.wordTypes.verbs.length;
    this.adjCount = this.game.wordTypes.adjectives.length;
    this.nounHint = this.manager.calculateHints(this.nounCount);
    this.verbHint = this.manager.calculateHints(this.verbCount);
    this.adjHint = this.manager.calculateHints(this.adjCount);
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
    console.log("STORY DATA: ", this.game.storyData);

    this.game.passageArray = this.data.passageArray;
    this.game.tokenizedArray = this.data.tokenizedPassage;
    this.game.wordTypes = this.splitPOSByTypeSanskrit();
    console.log("Word Types:", this.game.wordTypes);
  }

  splitPOSByTypeSanskrit() {
    // Use Sets internally to automatically avoid duplicate words
    const nounSet = new Set();
    const verbSet = new Set();
    const adjSet = new Set();

    // console.log("tokenizedArray =", this.game.tokenizedArray);

    this.game.tokenizedArray.forEach((sentence) => {
      // Ensure the sentence structure is valid before looping
      if (!Array.isArray(sentence)) return;

      sentence.forEach((token) => {
        if (!token || !token.text) return;

        // 🛠️ FIXED: Pass raw text into the normalizer function
        const normalizedWord = this.manager.normalize(token.text);

        // Skip the word if normalization renders it empty (e.g., pure punctuation like "।")
        if (!normalizedWord) return;

        // 🛠️ FIXED: Read the '.upos' property directly from the 'token' object, NOT the string
        if (token.upos === "NOUN") {
          nounSet.add(normalizedWord);
        } else if (token.upos === "VERB") {
          verbSet.add(normalizedWord);
        } else if (token.upos === "ADJ") {
          adjSet.add(normalizedWord);
        }
      });
    });

    // Convert sets back to arrays for the final expected return structure
    return {
      nouns: Array.from(nounSet),
      verbs: Array.from(verbSet),
      adjectives: Array.from(adjSet),
    };
  }

  async extractGameId() {
    try {
      const response = await getStorySets();

      if (!response || !Array.isArray(response.data)) {
        throw new Error("Invalid response from getStorySets()");
      }

      const activeStorySet = response.data.find(
        (storySet) => storySet.isActive,
      );

      if (!activeStorySet) {
        throw new Error("No active game found");
      }

      this.game.currentGameId = activeStorySet._id;

      // console.log("Active Game:", activeStorySet);
      // console.log("Game Id:", this.game.currentGameId);

      const write_response = await this.writeStoryInfo();

      return write_response;
    } catch (error) {
      console.error("Failed to extract game id:", error);
      throw error;
    }
  }

  async writeStoryInfo() {
    try {
      if (this.nounCount <= 0 || this.verbCount <= 0 || this.adjCount <= 0) {
        throw new Error("Noun Count or Verb count or Adjective count is Null");
      }
      if (this.nounHint < 1 || this.verbHint < 1 || this.adjHint < 1) {
        throw new Error("Noun Hint or Verb Hint or Adjective Hint is Null");
      }

      const storyInfo = new StoryInfo(
        this.game.currentGameId,
        this.game.currentStoryId,
        this.nounCount,
        this.nounHint,
        this.verbCount,
        this.verbHint,
        this.adjCount,
        this.adjHint,
      );

      const response = await writeStoryInformation(storyInfo);
      return response;
    } catch (e) {
      throw error(e.message);
    }
  }

  async writeGameInfo(gameInfo) {
    try {
      const response = await writeGameInformation(gameInfo);
      return response;
    } catch (e) {
      throw error(e.message);
    }
  }
}

export default GameServiceManager;
