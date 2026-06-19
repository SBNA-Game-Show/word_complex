class GameManger {
  constructor() {}

  normalize(word) {
    return word
      .toLowerCase()
      .replace(/[\u200B-\u200D\uFEFF]/g, "") // invisible chars
      .replace(/[^\p{L}\p{N}']/gu, "") // keep unicode letters
      .trim();
  }
}

export default GameManger;
