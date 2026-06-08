import { createZimGame } from "../createZimGame";

const storyData = {
  story:
    "When the rabbit left his home, a weasel moved in and refused to move out again. A great dispute arose over this. When the cat heard this, she offered to pacify the dispute. She asked the opponents to come closer to her, because she could not hear well. When this happened, she grabbed one of the disputants with each paw to devour them. Thus she pacified the quarrel."
};

const wordTypes = {
  nouns: [
    "rabbit",
    "home",
    "weasel",
    "dispute",
    "cat",
    "opponents",
    "paw",
    "disputants",
    "quarrel"
  ],

  verbs: [
    "left",
    "moved",
    "refused",
    "move",
    "arose",
    "heard",
    "offered",
    "pacify",
    "asked",
    "come",
    "hear",
    "happened",
    "grabbed",
    "devour",
    "pacified"
  ],

  adjectives: [
    "great",
    "closer",
    "each"
  ]
};

export default createZimGame({
  id: "word-hunt",

  width: 1280,
  height: 720,

  color: "#ECE8C8",
  outerColor: "#556B3D",

  setup({ stage, W, H, zim }) {

    let score = 0;
    let foundNouns = [];

    //----------------------------------
    // LANDING SCREEN
    //----------------------------------

    function showLanding() {

      stage.removeAllChildren();

      const title = new zim.Label({
        text: "What Will You Hunt?",
        size: 40,
        color: "#333"
      });

      title.center(stage);

      const startButton = new zim.Button({
        label: "Let's Go!"
      });

      startButton.center(stage)
        .mov(0, 100);

      startButton.tap(() => {
        showGameMenu();
      });

      stage.update();
    }

    //----------------------------------
    // GAME MENU
    //----------------------------------

    function showGameMenu() {

      stage.removeAllChildren();

      const title = new zim.Label({
        text: "Choose Hunt Type",
        size: 40
      });

      title.center(stage)
        .mov(0, -150);

      const nounButton = new zim.Button({
        width: 650,
        height: 70,
        label: new zim.Label({
          text: "Hunt for Nouns / Verbs / Adjectives",
          size: 22,
          color: "white"
        })
      });

      nounButton.center(stage)
        .mov(0, -20);

      nounButton.tap(() => {
        showGameScreen();
      });

      const randomButton = new zim.Button({
        label: "Random Hunt",
        width: 500
      });

      randomButton.center(stage)
        .mov(0, 100);

      randomButton.tap(() => {
        showPopup("Random Mode Coming Soon");
      });

      stage.update();
    }

    //----------------------------------
    // GAME SCREEN
    //----------------------------------

    function showGameScreen() {

      stage.removeAllChildren();

      score = 0;
      foundNouns = [];

      //----------------------------------
      // TOP BAR
      //----------------------------------

      new zim.Rectangle(
        W,
        70,
        "#556B3D"
      ).addTo(stage);

      new zim.Label({
        text: "Mode: Finding Nouns",
        size: 24,
        color: "white"
      })
      .pos(20, 20);

      //----------------------------------
      // SCORE
      //----------------------------------

      const scoreLabel = new zim.Label({
        text: "Score: 0",
        size: 22
      });

      scoreLabel.pos(
        20,
        90
      );

      //----------------------------------
      // HINT BUTTON
      //----------------------------------

      const hintButton = new zim.Button({
        label: "💡",
        width: 80
      });

      hintButton.pos(
        140,
        80
      );

      //----------------------------------
      // STORY BOX
      //----------------------------------

      new zim.Rectangle(
        950,
        330,
        "#CFD1A8"
      )
      .pos(
        170,
        150
      )
      .addTo(stage);

      //----------------------------------
      // STORY CONTAINER
      //----------------------------------

      const storyContainer =
        new zim.Container(
          900,
          280
        );

      storyContainer.pos(
        190,
        170
      );

      storyContainer.addTo(stage);

      //----------------------------------
      // FOUND WORDS BOX
      //----------------------------------

      new zim.Rectangle(
        950,
        130,
        "#F4CF54"
      )
      .pos(
        170,
        520
      )
      .addTo(stage);

      new zim.Label({
        text: "Found Nouns",
        size: 24
      })
      .pos(
        600,
        535
      );

      //----------------------------------
      // FOUND NOUN CONTAINER
      //----------------------------------

      const nounContainer =
        new zim.Container(
          850,
          70
        );

      nounContainer.pos(
        220,
        580
      );

      nounContainer.addTo(stage);

      //----------------------------------
      // STORY WORDS
      //----------------------------------

      const words =
        storyData.story.split(" ");

      let xPos = 0;
      let yPos = 0;

      words.forEach(word => {

        const cleanWord =
          word.toLowerCase()
          .replace(/[^\w']/g, "");

        const label =
          new zim.Label({
            text: word,
            size: 20,
            color: "#222"
          });

        label.addTo(storyContainer);

        if (
          xPos + label.width > 850
        ) {
          xPos = 0;
          yPos += 45;
        }

        label.pos(
          xPos,
          yPos
        );

        xPos += label.width + 12;

        label.tap(() => {

          //----------------------------------
          // CORRECT NOUN
          //----------------------------------

          if (
            wordTypes.nouns.includes(cleanWord)
          ) {

            if (
              !foundNouns.includes(cleanWord)
            ) {

              foundNouns.push(cleanWord);

              label.color = "#1CCAD8";

              score++;

              scoreLabel.text =
                "Score: " + score;

              addFoundWord(cleanWord);

              stage.update();

              checkWin();
            }

            return;
          }

          //----------------------------------
          // VERB
          //----------------------------------

          if (
            wordTypes.verbs.includes(cleanWord)
          ) {

            label.color = "red";

            stage.update();

            showPopup(
              `${cleanWord} is a verb`
            );

            return;
          }

          //----------------------------------
          // ADJECTIVE
          //----------------------------------

          if (
            wordTypes.adjectives.includes(cleanWord)
          ) {

            label.color = "red";

            stage.update();

            showPopup(
              `${cleanWord} is an adjective`
            );
          }

        });

      });

      //----------------------------------
      // HINT
      //----------------------------------

      hintButton.tap(() => {

        const remaining =
          wordTypes.nouns.length -
          foundNouns.length;

        showPopup(
          `${remaining} nouns remaining`
        );

      });

      //----------------------------------
      // ADD FOUND WORD
      //----------------------------------

      function addFoundWord(word) {

        const nounLabel =
          new zim.Label({
            text: word,
            size: 18
          });

        nounLabel.addTo(
          nounContainer
        );

        const index =
          foundNouns.length - 1;

        const col =
          index % 5;

        const row =
          Math.floor(index / 5);

        nounLabel.pos(
          col * 160,
          row * 30
        );

        stage.update();
      }

      //----------------------------------
      // WIN
      //----------------------------------

      function checkWin() {

        if (
          foundNouns.length ===
          wordTypes.nouns.length
        ) {

          showPopup(
            "🎉 Congratulations! You found all nouns!"
          );

        }

      }

      stage.update();
    }

    //----------------------------------
    // POPUP
    //----------------------------------

    function showPopup(message) {

      const overlay =
        new zim.Container()
          .addTo(stage);

      new zim.Rectangle(
        500,
        200,
        "#ffffff"
      )
      .center(overlay);

      new zim.Label({
        text: message,
        size: 24,
        color: "#333",
        align: "center"
      })
      .center(overlay)
      .mov(0, -20);

      const ok =
        new zim.Button({
          label: "OK"
        });

      ok.center(overlay)
        .mov(0, 50);

      ok.tap(() => {
        overlay.removeFrom();
        stage.update();
      });

      stage.update();
    }

    //----------------------------------
    // START GAME
    //----------------------------------

    showLanding();
  }
});

export const meta = {
  id: "word-hunt",
  cardNumber: "04",
  cardArt: "art-hunt",
  title: "Word Hunt",
  description: "Find nouns hidden in the story passage."
};