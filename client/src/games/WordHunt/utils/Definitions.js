class Definitions {
  constructor(game) {
    this.game = game;

    this.nounDefEng = [
      "A naming word for a person, place, thing, or idea.",
      "Anything you can see, visit, hold, or touch.",
      "Any object or concept you can draw a picture of.",
      "Words that answer the questions: Who? or What?",
      "Every item you can put in a game inventory.",
      "Any word you can put 'a', 'an', or 'the' before.",
      "Every character, enemy, and location in a game.",
      "Anything you can count (like 1 sword or 3 potions).",
      "The building blocks for objects, places, and feelings.",
    ];

    this.VerbDefEng = [
      "An action word showing what something is doing.",
      "Any action you can physically act out or mimic.",
      "The action buttons: jump, run, attack, interact.",
      "The engine that makes a character move or exist.",
      "Words that change form for past, present, or future.",
      "Mental actions happening in your mind, like 'think'.",
      "State-of-being links like 'is', 'am', 'are', and 'was'.",
      "Any word you can put 'I', 'you', or 'we' right before.",
      "Processes or changes over time, like 'grow' or 'melt'.",
      "A word showing action, occurrence, or state of being.",
    ];

    this.adjDefEng = [
      "A describing word that gives info about a noun.",
      "Visual skins or armor options that alter an item.",
      "Words for how things look, sound, taste, or feel.",
      "Answers questions like 'Which box?' or 'What kind?'.",
      "Adds details like color, size, shape, and personality.",
      "Words showing quantity, like 'three', 'few', or 'max'.",
      "Words used to compare features (e.g., faster, strongest).",
      "Words sitting right before a noun or after 'is'.",
      "Emotions or conditions like 'happy', 'broken', 'frozen'.",
      "A modifier that paints a clear picture of an object.",
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
