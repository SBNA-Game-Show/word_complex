import {
  retrieveEnglishVersion,
  retrieveSanskritVersion,
  writeStoryInformation,
  writeGameInformation,
  getPlayerInfo,
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
      // console.log("RESPONSE:", response);

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
      story: this.data.passage
        .replace(/-/g, " ") // remove hyphens and replace with space
        .replace(/\n/g, " ") // remove new lines
        .replace(/\s+/g, " ") // collapse multiple spaces
        .trim(), // remove leading/trailing spaces
    };

    this.game.passageArray = this.data.passageArray;
    this.game.tokenizedArray = this.data.tokenizedPassage;
    // console.log("Tokenized Array : ", this.tokenizedArray);
    this.game.wordTypes = this.splitPOSByTypeEnglish();
    // console.log("Word Types:", this.game.wordTypes);
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
    // console.log("STORY DATA: ", this.game.storyData);

    this.game.passageArray = this.data.passageArray;
    this.game.tokenizedArray = this.data.tokenizedPassage;
    // console.log("Tokenized Passage: ", this.game.tokenizedArray);
    this.game.wordTypes = this.splitPOSByTypeSanskrit();
    // console.log("Word Types:", this.game.wordTypes);
    this.nounCount = this.game.wordTypes.nouns.length;
    this.verbCount = this.game.wordTypes.verbs.length;
    this.adjCount = this.game.wordTypes.adjectives.length;
    this.nounHint = this.manager.calculateHints(this.nounCount);
    this.verbHint = this.manager.calculateHints(this.verbCount);
    this.adjHint = this.manager.calculateHints(this.adjCount);
  }

  splitPOSByTypeSanskrit() {
    const nounSet = new Set();
    const verbSet = new Set();
    const adjSet = new Set();

    this.game.tokenizedArray.forEach((item) => {
      const normalizedWord = this.manager.normalize(item.text);
      // console.log("Normalized Word: ", normalizedWord);

      // console.log("ITEM 0 IN TOKENZIED ARRAY:", item.text);
      if (item.upos === "NOUN") {
        nounSet.add(normalizedWord);
      }
      if (item.upos === "VERB") {
        verbSet.add(normalizedWord);
      }

      if (item.upos === "ADJ") {
        adjSet.add(normalizedWord);
      }
    });

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
    } catch (error) {
      throw new Error(error.message);
    }
  }
  /**
   * Function verifies if the language is sanskrit and then performs the post
   * operation to the data base only if the played version is sanskrit
   * @returns boolean
   */

  async writeStoryInfoOnlySA() {
    try {
      if (this.manager.verifyLanguage() && this.manager.verifyPlayer()) {
        const response = await this.writeStoryInfo();

        return response;
      }
    } catch (error) {
      throw new Error(error.message);
    }
  }
  /**
   * Function post operation to the data base irrespective of any language,
   * which overwrites the previous
   * @returns boolean
   */

  async writeStoryInfo() {
    try {
      const storyInfo = new StoryInfo(
        this.game.currentGameId,
        this.game.currentStoryId,
        this.nounCount ?? 0,
        this.nounHint ?? 0,
        this.verbCount ?? 0,
        this.verbHint ?? 0,
        this.adjCount ?? 0,
        this.adjHint ?? 0,
      );
      const result = await writeStoryInformation(storyInfo);

      return result;
    } catch (e) {
      throw new Error(e.message);
    }
  }
  /**
   * Function that call the services to write game info
   * checking for guest and language is done in game manager
   * @param {*} gameInfo
   * @returns
   */
  async writeGameInfo(gameInfo) {
    try {
      const response = await writeGameInformation(gameInfo);

      await this.retrievePlayerInfo();
      return response;
    } catch (e) {
      throw new Error(e.message);
    }
  }
  /**
   * Retrieves the logged in player information for the current story id and game id
   * @returns
   */

  async retrievePlayerInfo() {
    try {
      const response = await getPlayerInfo(
        this.game.currentGameId,
        this.game.currentStoryId,
        this.game.player,
      );

      if (!response.success) {
        throw new Error(response.message);
      }

      this.game.playerInfo = response.message;

      console.log("Player Info:", this.game.playerInfo);

      return response;
    } catch (e) {
      throw new Error(e.message);
    }
  }
}

export default GameServiceManager;
