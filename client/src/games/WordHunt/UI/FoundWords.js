// import ZimLabel from "../ZimComponents/ZimLabelNew";
// import ZimContainer from "../ZimComponents/ZimContainerNew";

// class FoundContainer {
//   constructor(game, title = "Found Nouns") {
//     this.game = game;
//     this.titleText = title;

//     this.words = [];

//     this.width = this.game.width - 80;
//     this.height = 180;

//     this.spacingX = 14;
//     this.spacingY = 10;
//     this.lineHeight = 35;

//     // References for our layout components
//     this.scrollWindow = null;
//     this.textContainer = null;
//   }

//   // -----------------------------------
//   // ADD WORD
//   // -----------------------------------
//   addWord(word) {
//     if (!word || this.words.includes(word)) return;

//     this.words.push(word);
//     this.update();
//     this.scrollToBottom();
//   }

//   // -----------------------------------
//   // UPDATE DISPLAY
//   // -----------------------------------
//   update() {
//     console.log("FoundContainer Update called. Words:", this.words);

//     // 1. Keep track of current positions if the window already exists
//     let oldX = 40;
//     let oldY = 500;
//     let hasParent = false;
//     let parentNode = null;

//     if (this.scrollWindow) {
//       oldX = this.scrollWindow.x;
//       oldY = this.scrollWindow.y;
//       parentNode = this.scrollWindow.parent;
//       hasParent = !!parentNode;
//       this.scrollWindow.removeFrom();
//     }

//     const windowWidth = this.width;
//     const windowHeight = this.height;

//     // 2. Build layout pad with a large vertical scroll allowance
//     this.textContainer = new ZimContainer(
//       this.game,
//       windowWidth,
//       2000,
//     ).createContainer();

//     // Leave space at the top of the internal scroll area for our Header Title
//     let currentX = 20;
//     let currentY = 55;
//     const scrollbarBuffer = 40;
//     const maxWidth = windowWidth - scrollbarBuffer;

//     // Add Title straight inside the scroll container frame so it matches layout scaling
//     const titleLabel = new this.game.zim.Label({
//       text: this.titleText,
//       size: 30,
//       color: "#00ff88",
//     });
//     titleLabel.pos(20, 15);
//     titleLabel.addTo(this.textContainer);

//     // 3. Populate and align layout items sequentially
//     this.words.forEach((word, index) => {
//       const isLastWord = index === this.words.length - 1;
//       const displayText = isLastWord ? word : `${word},`;

//       const labelComponent = new ZimLabel(this.game, displayText, 24, "white");
//       const label = labelComponent.createLabel();

//       label.addTo(this.textContainer);

//       const w = label.width || label.label?.width || 60;

//       if (currentX + w > maxWidth && currentX > 20) {
//         currentX = 20;
//         currentY += this.lineHeight;
//       }

//       label.pos(currentX, currentY);
//       currentX += w + this.spacingX;
//     });

//     const calculatedHeight = currentY + this.lineHeight + 20;

//     // Set explicit ZIM boundaries on our pad wrapper
//     this.textContainer.setBounds(0, 0, windowWidth, calculatedHeight);
//     this.textContainer.width = windowWidth;
//     this.textContainer.height = calculatedHeight;

//     // 4. Instantiate the Window wrapping the text pad directly
//     this.scrollWindow = new this.game.zim.Window({
//       width: windowWidth,
//       height: windowHeight,
//       content: this.textContainer,
//       backgroundColor: "#274527", // Apply background styling directly onto window context!
//       borderColor: "transparent",
//       corner: 8,
//       padding: 0,
//       scrollBarDrag: true,
//       scrollBarColor: "#00ff88",
//       scrollBarFade: false,
//     });

//     // Restore positions seamlessly on layout shifts
//     this.scrollWindow.pos(oldX, oldY);
//     if (hasParent && parentNode) {
//       this.scrollWindow.addTo(parentNode);
//     }

//     this.game.stage.update();
//     return this.scrollWindow;
//   }

//   // -----------------------------------
//   // AUTO SCROLL
//   // -----------------------------------
//   scrollToBottom() {
//     if (!this.scrollWindow || !this.textContainer) return;

//     const maxScroll = Math.max(
//       0,
//       this.textContainer.height - this.scrollWindow.height,
//     );

//     if (maxScroll > 0) {
//       this.scrollWindow.animate({
//         props: { scrollY: -maxScroll },
//         time: 0.2,
//         ease: "quadOut",
//       });
//     }
//     this.game.stage.update();
//   }

//   reset() {
//     this.words = [];
//     this.update();
//   }

//   pos(x, y) {
//     if (this.scrollWindow) this.scrollWindow.pos(x, y);
//   }

//   addTo(parent) {
//     if (this.scrollWindow) this.scrollWindow.addTo(parent);
//   }
// }

// export default FoundContainer;

import ZimLabel from "../ZimComponents/ZimLabelNew";
import ZimContainer from "../ZimComponents/ZimContainerNew";

class FoundContainer {
  constructor(game, title = "Found Nouns") {
    this.game = game;
    this.titleText = title;

    this.words = [];

    this.width = this.game.width - 80;
    this.height = 180;

    this.spacingX = 14;
    this.spacingY = 10;
    this.lineHeight = 35;

    // Explicit coordinates tracked on the instance
    this.x = 40;
    this.y = 500;

    // References for our layout components
    this.scrollWindow = null;
    this.textContainer = null;
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
  // UPDATE DISPLAY
  // -----------------------------------
  update() {
    console.log("FoundContainer Update called. Words:", this.words);

    let hasParent = false;
    let parentNode = null;

    if (this.scrollWindow) {
      parentNode = this.scrollWindow.parent;
      hasParent = !!parentNode;
      this.scrollWindow.removeFrom();
    }

    const windowWidth = this.width;
    const windowHeight = this.height;

    // 1. Build layout pad with a large vertical scroll allowance
    this.textContainer = new ZimContainer(
      this.game,
      windowWidth,
      2000,
    ).createContainer();

    // Leave space at the top of the internal scroll area for our Header Title
    let currentX = 20;
    let currentY = 55;
    const scrollbarBuffer = 40;
    const maxWidth = windowWidth - scrollbarBuffer;

    // 2. Add Title straight inside the scroll container frame
    const titleLabel = new this.game.zim.Label({
      text: this.titleText,
      size: 22,
      color: "#00ff88",
      font: "Fredoka",
    });
    titleLabel.pos(20, 15);
    titleLabel.addTo(this.textContainer);

    // 3. RESTORED: Populate and align layout items sequentially
    this.words.forEach((word, index) => {
      const isLastWord = index === this.words.length - 1;
      const displayText = isLastWord ? word : `${word},`;

      const labelComponent = new ZimLabel(this.game, displayText, 24, "white");
      const label = labelComponent.createLabel();

      label.addTo(this.textContainer);

      const w = label.width || label.label?.width || 60;

      if (currentX + w > maxWidth && currentX > 20) {
        currentX = 20;
        currentY += this.lineHeight;
      }

      label.pos(currentX, currentY);
      currentX += w + this.spacingX;
    });

    const calculatedHeight = currentY + this.lineHeight + 20;

    // Set explicit ZIM boundaries on our pad wrapper
    this.textContainer.setBounds(0, 0, windowWidth, calculatedHeight);
    this.textContainer.width = windowWidth;
    this.textContainer.height = calculatedHeight;

    // 4. Instantiate the Window wrapping the text pad directly
    this.scrollWindow = new this.game.zim.Window({
      width: windowWidth,
      height: windowHeight,
      content: this.textContainer,
      backgroundColor: "#274527",
      borderColor: "transparent",
      corner: 8,
      padding: 0,
      scrollBarDrag: true,
      scrollBarColor: "#00ff88",
      scrollBarFade: false,
    });

    // Always position based on the absolute class anchor points
    this.scrollWindow.pos(this.x, this.y);

    if (hasParent && parentNode) {
      this.scrollWindow.addTo(parentNode);
    }

    this.game.stage.update();
    return this.scrollWindow;
  }

  // -----------------------------------
  // AUTO SCROLL
  // -----------------------------------
  scrollToBottom() {
    if (!this.scrollWindow || !this.textContainer) return;

    const maxScroll = Math.max(
      0,
      this.textContainer.height - this.scrollWindow.height,
    );

    if (maxScroll > 0) {
      this.scrollWindow.animate({
        props: { scrollY: -maxScroll },
        time: 0.2,
        ease: "quadOut",
      });
    }
    this.game.stage.update();
  }

  reset() {
    this.words = [];
    this.update();
  }

  pos(x, y) {
    this.x = x;
    this.y = y;
    if (this.scrollWindow) {
      this.scrollWindow.pos(x, y);
    }
  }

  addTo(parent) {
    if (this.scrollWindow) this.scrollWindow.addTo(parent);
  }
}

export default FoundContainer;
