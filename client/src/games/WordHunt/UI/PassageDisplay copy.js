// import ZimLabel from "../../../zimcomponents/ZimLabel";
// import ZimContainer from "../../../zimcomponents/ZimContainer";
// import GameManger from "../utils/GameManager";

// class PassageDisplay {
//   constructor(game) {
//     this.game = game;
//     this.zim = game.zim;
//     this.manager = new GameManger();

//     this.rawData = game.storyData?.story || null;
//     this.passage = this.parseData();
//   }

//   parseData() {
//     if (!this.rawData) return [];

//     if (typeof this.rawData === "string") {
//       return this.rawData.match(/[^.!?]+[.!?]+/g)?.map((s) => s.trim()) || [];
//     }

//     if (Array.isArray(this.rawData)) {
//       return this.rawData;
//     }

//     return [];
//   }

//   displayPassage(onWordClick) {
//     // Create standalone container
//     const container = new ZimContainer(
//       this.game,
//       this.game.width,
//       this.game.height,
//     ).createContainer();

//     const margin = 60;
//     const lineHeight = 45;
//     const spacing = 14;

//     let x = margin;
//     let y = 160;

//     const maxWidth = this.game.width - 120;

//     this.passage.forEach((sentence) => {
//       const words = sentence.split(/\s+/);
//       x = margin;

//       words.forEach((word) => {
//         if (!word) return;

//         const cleanWord = this.manager.normalize(word);

//         const label = new ZimLabel(this.game, word, 24, "white").createLabel();

//         // FIXED: Use ZIM's native chainable method instead of container.addChild()
//         // This ensures the custom component unwraps correctly into the container.
//         label.addTo(container);

//         // Fallback checks to find the correct width property
//         const w =
//           label.width || label.label?.width || label.getBounds?.()?.width || 60;

//         if (x + w > maxWidth) {
//           x = margin;
//           y += lineHeight;
//         }

//         label.pos(x, y);

//         label.tap(() => {
//           if (onWordClick) {
//             onWordClick(cleanWord, label);
//           }
//         });

//         x += w + spacing;
//       });

//       y += lineHeight;
//     });

//     return container;
//   }
// }

// export default PassageDisplay;
