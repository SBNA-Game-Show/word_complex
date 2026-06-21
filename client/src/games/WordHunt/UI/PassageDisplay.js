import ZimLabel from "../ZimComponents/ZimLabelNew";
import ZimContainer from "../ZimComponents/ZimContainerNew";
import GameManger from "../utils/GameManager";

class PassageDisplay {
  constructor(game) {
    this.game = game;
    this.zim = game.zim;
    this.width = this.game.width;
    this.height = this.game.height;
    this.manager = new GameManger(this.game);

    this.rawData = game.storyData?.story || null;
    this.passage = this.parseData();

    // TRACKING ARRAY: Stores references to word labels for color styling updates
    this.wordLabels = [];
  }

  parseData() {
    if (!this.rawData) return [];

    if (typeof this.rawData === "string") {
      return this.rawData.match(/[^.!?]+[.!?]+/g)?.map((s) => s.trim()) || [];
    }

    if (Array.isArray(this.rawData)) {
      return this.rawData;
    }

    return [];
  }

  displayPassage(onWordClick) {
    console.log("Display Passage");
    const margin = 60;
    const lineHeight = 45;
    const spacing = 14;

    const windowWidth = this.width - 120;
    const windowHeight = 380;

    // 1. Give the text container a fixed, strict width right away
    const textContainer = new ZimContainer(
      this.game,
      windowWidth,
      2000,
    ).createContainer();

    let x = margin;
    let y = 20;

    // Account for the scrollbar thickness on the right side by reducing width slightly
    const scrollbarBuffer = 30;
    const maxWidth = windowWidth - margin * 2 - scrollbarBuffer;

    // Reset tracking array on every layout render pass to prevent stale cache entries
    this.wordLabels = [];

    // this.passage.forEach((sentence) => {
    //   const words = sentence.split(/\s+/);
    //   x = margin;

    //   words.forEach((word) => {
    //     if (!word) return;

    //     const cleanWord = this.manager.normalize(word);
    //     const label = new ZimLabel(this.game, word, 20, "white").createLabel();

    //     label.addTo(textContainer);

    //     // SAVE REFERENCE: Pair the label instance with its clean lowercase/normalized text
    //     this.wordLabels.push({
    //       text: cleanWord,
    //       instance: label,
    //     });

    //     const w =
    //       label.width || label.label?.width || label.getBounds?.()?.width || 60;

    //     if (x + w > maxWidth) {
    //       x = margin;
    //       y += lineHeight;
    //     }

    //     label.pos(x, y);

    //     label.tap(() => {
    //       if (onWordClick) {
    //         onWordClick(cleanWord, label);
    //       }
    //     });

    //     x += w + spacing;
    //   });

    //   y += lineHeight;
    // });
    // Create a unified Set of valid clickable words for O(1) lookups
    const validWordsSet = new Set([
      ...(this.game.wordTypes?.nouns || []),
      ...(this.game.wordTypes?.verbs || []),
      ...(this.game.wordTypes?.adjectives || []),
    ]);

    this.passage.forEach((sentence) => {
      const words = sentence.split(/\s+/);
      x = margin;

      words.forEach((word) => {
        if (!word) return;

        const cleanWord = this.manager.normalize(word);
        const label = new ZimLabel(this.game, word, 20, "white").createLabel();

        label.addTo(textContainer);

        // SAVE REFERENCE: Pair the label instance with its clean text
        this.wordLabels.push({
          text: cleanWord,
          instance: label,
        });

        const w =
          label.width || label.label?.width || label.getBounds?.()?.width || 60;

        if (x + w > maxWidth) {
          x = margin;
          y += lineHeight;
        }

        label.pos(x, y);

        // --- EXCLUSIVE CLICK PERMISSION FILTER ---
        if (validWordsSet.has(cleanWord)) {
          // Explicitly show users this word can be clicked
          label.cursor = "pointer";

          label.tap(() => {
            if (onWordClick) {
              onWordClick(cleanWord, label);
            }
          });
        } else {
          // Unimportant words (determiners, prepositions, etc.) are unclickable
          label.mouseEnabled = false;
          label.cursor = "default";
        }

        x += w + spacing;
      });

      y += lineHeight;
    });
    const calculatedHeight = y + 60;

    // 2. FORCING ZIM boundary alignment to match windowWidth exactly.
    textContainer.setBounds(0, 0, windowWidth, calculatedHeight);
    textContainer.width = windowWidth;
    textContainer.height = calculatedHeight;

    // Create the ZIM Window
    const scrollWindow = new this.zim.Window({
      width: windowWidth,
      height: windowHeight,
      content: textContainer,
      interactive: true,
      bgColor: "transparent",
      borderColor: "transparent",
      padding: 0,

      // STRICT VERTICAL SCROLL SETTINGS
      scrollX: false,
      scrollY: true,
      scrollBarDrag: true,
      scrollBarColor: "#00ff88",
      scrollBarActiveColor: "white",
      indicatorFade: false,
    });

    return scrollWindow;
  }
}

export default PassageDisplay;
