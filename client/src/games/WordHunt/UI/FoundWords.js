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

    // scroll state
    this.scrollY = 0;
    this.maxHeight = this.height;

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
    // WORD LABEL
    // -----------------------------------
    this.label = new this.game.zim.Label({
      text: "",
      size: 24,
      color: "white",
      align: "left",
      lineWidth: this.width - 140,
    });

    this.label.pos(20, 50);
    this.label.addTo(this.container);

    // ✅ SAFE INITIAL RENDER (AFTER LABEL EXISTS)
    this.update();
  }

  // -----------------------------------
  // ADD WORD
  // -----------------------------------
  addWord(word) {
    if (!word || this.words.includes(word)) return;

    this.words.push(word);
    this.update();
  }

  // -----------------------------------
  // UPDATE DISPLAY
  // -----------------------------------
  update() {
    if (!this.label) return;

    this.label.text = this.words.join(", ");
    this.game.stage.update();

    this.handleAutoScroll();
  }

  // -----------------------------------
  // AUTO SCROLL
  // -----------------------------------
  handleAutoScroll() {
    const contentHeight = this.label.getBounds()?.height || 0;

    if (contentHeight > this.maxHeight - 60) {
      this.scrollY = -(contentHeight - (this.maxHeight - 60));

      this.label.animate({
        props: {
          y: 50 + this.scrollY,
        },
        time: 0.3,
        ease: "quadOut",
      });
    }
  }

  // -----------------------------------
  // RESET
  // -----------------------------------
  reset() {
    this.words = [];
    this.label.text = "";
    this.scrollY = 0;
    this.label.y = 50;
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
