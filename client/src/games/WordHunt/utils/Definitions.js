class Definitions {
  constructor(game) {
    this.game = game;
    this.nounDefEng = [
      "Naming word used to identify a person, a place, a physical thing, or an idea",

      "If you can look at it, visit it, or hold it in your hand",

      "If a word describes something you can actually draw a picture of",

      "Provide answers to questions Who? or What? in any story or sentence",

      "Look around you—every single item you can collect, put in an inventory, or place on a map is a noun",

      "If you can naturally put the words “a”, “an”, or “the” right in front of a word",

      "Every character you meet, enemy you fight, and location you visit in a game",

      "If you can have one or many of something (like one sword or three potions)",

      "Building block of language that represents a real object like a cat, a place like a town, or a feeling like joy",
    ];
    this.VerbDefEng = [
      "A verb is an action word that tells you what a character, animal, or object is doing",

      "If you can physically act it out, mimic it, or perform it right now",

      "Think of verbs as the action buttons on your controller—words like jump, run, attack, and interact",

      "Engine of a sentence; without one, a character cannot move, think, or exist",

      "Verbs are special words that change form to show when something happened, whether it is in the past, present, or future",

      "Verbs don't just describe physical movement; they also name things happening in your mind, like think, hope, forget, and love",

      "Some verbs don't show movement at all—words like am, is, are, and was are verbs that simply declare that something exists",

      "If you can naturally put a pronoun like “I”, “you”, or “we” right before a word to make a mini-sentence (like I fly, you guess)",

      "If a word describes a process, a transition, or a change happening over time (like grow, melt, or glow)",

      "Is a word that expresses action, an occurrence, or a state of being in a language",
    ];
    this.adjDefEng = [
      "An adjective is a describing word that gives you more information about a noun (a person, place, or thing)",

      "Think of adjectives as skin or armor customization options—they change how a noun looks, feels, or behaves (like a shiny sword or a poisonous potion)",

      "If a word describes how something looks, sounds, tastes, feels, or smells, it is an adjective",

      "Adjectives help you pinpoint exactly which item you are talking about, answering questions like Which box? (The heavy box) or What kind of dragon? (The fire dragon)",

      "Adjectives add color, size, shape, and personality to the words, turning a basic wizard into a grumpy, ancient wizard",

      "Words that tell you how many or how much of a noun you have—like three arrows, few enemies, or maximum health—are adjectives",

      "Adjectives are special because they let you compare things in a game to see which is better, faster, or the strongest",

      "You can usually spot an adjective hiding directly in front of a noun (like a dark dungeon) or sitting right after a state-of-being verb (like The dungeon is dark)",

      "If a word describes an emotion, a condition, or a state that you could easily show with a face or an icon (like happy, broken, frozen, or empty)",

      "An adjective is a modifier that paints a clearer mental picture of any person, place, or object in a sentence",
    ];
  }

  getRandomDefinition(array) {
    if (!Array.isArray(array) || array.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
  }
}

export default Definitions;
