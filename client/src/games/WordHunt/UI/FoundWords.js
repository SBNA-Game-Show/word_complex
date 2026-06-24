import ZimLabel from "../ZimComponents/ZimLabelNew";
import ZimContainer from "../ZimComponents/ZimContainerNew";

class FoundContainer {
  constructor(game, title = "Found Nouns") {
    this.game = game;
    this.titleText = title;

    this.words = [
      "शशकः",
      "गृहात्",
      "तृणं",
      "नकुलः",
      "मार्जारी",
      "अवदत्",
      "निवसितुं",
      "निश्चयं",
      "कर्तुं",
      "समाप्तः",
      "तदा",
      "एकः",
      "द्वौ",
      "अतः",
      "समीपं",
      "समीपस्था",
      "अग्रे",
      "खादनार्थं",
      "तया",
      "विना",
      "अहं",
      "श्रोतुं",
      "पिधानं",
      "च",
      "एवं",
      "गृहम्",
      "स्वादुं",
      "एकदिने",
      "नकुलं",
      "शशकस्य",
      "कलहं",
      "वृक्षः",
      "जलम्",
      "पवनः",
      "अग्निः",
      "भूमिः",
      "आकाशः",
      "ज्ञानम्",
      "शिक्षा",
      "धर्मः",
      "कर्म",
      "मित्रम्",
      "शत्रुः",
      "राजा",
      "प्रजा",
      "नगरम्",
    ];

    this.width = this.game.width - 80;
    this.height = 180;

    // Configurable spacing parameters between your individual word labels
    this.spacingX = 14;
    this.spacingY = 10;

    // -----------------------------------
    // ROOT CONTAINER
    // -----------------------------------
    this.container = new ZimContainer(
      this.game,
      this.width,
      this.height,
    ).createContainer();

    this.container.pos(0, 0);

    // -----------------------------------
    // BACKGROUND
    // -----------------------------------
    this.bg = new this.game.zim.Rectangle({
      width: this.width,
      height: this.height,
      color: "#274527",
      corner: 8,
      alpha: 0.98,
    });
    this.bg.addTo(this.container);

    // -----------------------------------
    // TITLE
    // -----------------------------------
    this.title = new this.game.zim.Label({
      text: this.titleText,
      size: 30,
      color: "#00ff88",
    });
    this.title.pos(20, 10);
    this.title.addTo(this.container);

    // -----------------------------------
    // SCROLLABLE WINDOW (THE VIEWPORT)
    // -----------------------------------
    // This provides native scrolling and clips any labels that overflow the box height.
    this.window = new this.game.zim.Window({
      width: this.width - 40,
      height: this.height - 70, // Height minus title space
      interactive: true,
      scrollBarDrag: true,
      scrollBarColor: "#00ff88",
      scrollBarAlpha: 0.5,
      borderColor: "transparent",
      backgroundColor: "transparent",
    });
    this.window.pos(20, 55);
    this.window.addTo(this.container);

    // ZIM.Window has a built-in container property called 'content' where scroll items live
    this.scrollContent = this.window.content;

    // ✅ SAFE INITIAL RENDER
    this.update();
  }

  // -----------------------------------
  // ADD WORD
  // -----------------------------------
  addWord(word) {
    if (!word || this.words.includes(word)) return;

    this.words.push(word);
    this.update();
    this.scrollToBottom();
  }

  // -----------------------------------
  // UPDATE DISPLAY (LOOPING LABELS)
  // -----------------------------------
  update() {
    console.log("Update is called");
    if (!this.scrollContent) return;

    // Clear out old labels before rebuilding the list
    this.scrollContent.removeAllChildren();

    let currentX = 0;
    let currentY = 0;
    const maxRowWidth = this.width - 60; // Row boundary limit leaving room for scrollbar
    let maxLineHeight = 30;

    // Loop through the array and create a new label for every single word
    this.words.forEach((word) => {
      const wordLabel = new this.game.zim.Label({
        text: word,
        size: 24,
        color: "white",
      });

      // If adding this word pushes past the row limit, wrap to the next line
      if (currentX + wordLabel.width > maxRowWidth && currentX > 0) {
        currentX = 0;
        currentY += maxLineHeight + this.spacingY;
      }

      // Position the individual label item
      wordLabel.pos(currentX, currentY);
      wordLabel.addTo(this.scrollContent);

      maxLineHeight = Math.max(maxLineHeight, wordLabel.height);

      // Advance horizontal track point for the next word label
      currentX += wordLabel.width + this.spacingX;
    });

    // Inform the window container of its new total scrollable size
    const totalContentHeight = currentY + maxLineHeight;
    this.scrollContent.setBounds(0, 0, maxRowWidth, totalContentHeight);

    this.game.stage.update();
  }

  // -----------------------------------
  // AUTO SCROLL
  // -----------------------------------
  scrollToBottom() {
    // Calculate how far down the content goes compared to the window height
    const maxScroll = Math.max(
      0,
      this.scrollContent.height - this.window.height,
    );

    // Smoothly slide down to the newest elements using ZIM's native negative scroll mapping
    this.window.animate({
      props: { scrollY: -maxScroll },
      time: 0.3,
      ease: "quadOut",
    });
    this.game.stage.update();
  }

  // -----------------------------------
  // RESET
  // -----------------------------------
  reset() {
    this.words = [];
    this.scrollContent.removeAllChildren();
    this.scrollContent.setBounds(0, 0, this.width - 60, 0);
    this.window.scrollY = 0;
    this.game.stage.update();
  }

  // -----------------------------------
  // POSITION CONTROL
  // -----------------------------------
  pos(x, y) {
    this.container.pos(x, y);
  }

  addTo(parent) {
    this.container.addTo(parent);
  }
}

export default FoundContainer;
