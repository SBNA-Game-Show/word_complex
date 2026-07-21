import BackgroundDecor from "./BackgroundDecor";
import { useAuth } from "../auth/AuthContext";
import UserBadge from "./UserBadge";

const tipColors = ["#fff1c2", "#d3f1e0", "#e4dcff", "#cfeeff"];

const guides = {
  "sentence-builder": {
    title: "Passage Reconstruction",
    label: "Story order",
    steps: [
      {
        title: "Read the passage pieces",
        copy: "Look at the word clouds and think about what order would rebuild the story.",
        badgeColor: "var(--ocean)",
        artClass: "htp-art-drag",
        art: (
          <>
            <span className="htp-cloud htp-cloud-lift">the dark forest</span>
            <span className="htp-cloud">alone</span>
          </>
        ),
      },
      {
        title: "Place them in order",
        copy: "Drag each cloud into the numbered slots from the first idea to the last.",
        badgeColor: "var(--grape)",
        artClass: "htp-art-order",
        art: (
          <>
            <span className="htp-slot htp-slot-filled">The prince</span>
            <span className="htp-slot htp-slot-filled">walked</span>
            <span className="htp-slot">3</span>
            <span className="htp-slot">4</span>
          </>
        ),
      },
      {
        title: "Check the rebuild",
        copy: "Press Check when all slots are filled. A correct answer earns 100 points.",
        badgeColor: "var(--leaf)",
        artClass: "htp-art-check",
        art: (
          <>
            <span className="htp-check-btn">Check</span>
            <span className="htp-score-pop">+100</span>
          </>
        ),
      },
    ],
    tips: [
      ["3 attempts per round", "You get three tries before that round resets."],
      [
        "Use story logic",
        "Ask who acts first, what happens next, and what finishes the thought.",
      ],
      ["Reset helps", "Clear the slots if your order starts to feel tangled."],
      ["Stars stack up", "Every correct round adds to your score."],
    ],
  },
  "meaning-bridge": {
    title: "Meaning Bridge",
    label: "Vocabulary pairs",
    steps: [
      {
        title: "Read the clue",
        copy: "Start with the clue card and look for the vocabulary word that means the same idea.",
        badgeColor: "var(--ocean)",
        artClass: "htp-art-drag",
        art: (
          <>
            <span className="htp-cloud htp-cloud-lift">very brave</span>
            <span className="htp-cloud">courageous</span>
          </>
        ),
      },
      {
        title: "Choose its buddy",
        copy: "Match the clue to the word that best fits. Watch out for words that are close but not exact.",
        badgeColor: "var(--grape)",
        artClass: "htp-art-order",
        art: (
          <>
            <span className="htp-slot htp-slot-filled">clue</span>
            <span className="htp-check-btn">match</span>
          </>
        ),
      },
      {
        title: "Build a streak",
        copy: "Keep making correct matches to collect points and finish the set.",
        badgeColor: "var(--leaf)",
        artClass: "htp-art-check",
        art: (
          <>
            <span className="htp-score-pop">+50</span>
            <span className="htp-score-pop">streak</span>
          </>
        ),
      },
    ],
    tips: [
      [
        "Read every option",
        "The first familiar word is not always the best match.",
      ],
      [
        "Use meaning first",
        "Match the idea, not just similar-looking letters.",
      ],
      ["Say it aloud", "A clue often becomes clearer when you hear it."],
      [
        "Compare close choices",
        "If two choices feel close, test each one in the clue.",
      ],
    ],
  },
  "context-cloze-quest": {
    title: "Context Cloze Quest",
    label: "Missing words",
    steps: [
      {
        title: "Read around the blank",
        copy: "Use the sentence before and after the blank to understand what word belongs there.",
        badgeColor: "var(--ocean)",
        artClass: "htp-art-drag",
        art: (
          <>
            <span className="htp-cloud">The sky was ___</span>
            <span className="htp-cloud htp-cloud-lift">stormy</span>
          </>
        ),
      },
      {
        title: "Test each choice",
        copy: "Try each possible word in your head and keep the one that makes the sentence make sense.",
        badgeColor: "var(--grape)",
        artClass: "htp-art-order",
        art: (
          <>
            <span className="htp-slot htp-slot-filled">before</span>
            <span className="htp-slot">blank</span>
            <span className="htp-slot htp-slot-filled">after</span>
          </>
        ),
      },
      {
        title: "Pick the best fit",
        copy: "Choose the word that matches both the meaning and the tone of the paragraph.",
        badgeColor: "var(--leaf)",
        artClass: "htp-art-check",
        art: (
          <>
            <span className="htp-check-btn">Choose</span>
            <span className="htp-score-pop">right fit</span>
          </>
        ),
      },
    ],
    tips: [
      [
        "Context is the clue",
        "Nearby words usually point to the missing meaning.",
      ],
      ["Check grammar", "The answer should sound right in the sentence."],
      [
        "Look for tone",
        "A funny, serious, or spooky passage changes which word fits best.",
      ],
      ["Reread after choosing", "The whole paragraph should flow naturally."],
    ],
  },
  "word-hunt": {
    title: "Word Hunt",
    label: "Hidden Words",
    steps: [
      {
        title: "Scan the passage",
        copy: "Read Carefully and look for hidden nouns, verbs, and adjectives within the passage ",
        badgeColor: "var(--ocean)",
        artClass: "htp-art-drag",
        art: (
          <>
            <span className="htp-slot htp-slot-filled">W</span>
            <span className="htp-slot htp-slot-filled">O</span>
            <span className="htp-slot htp-slot-filled">R</span>
            <span className="htp-slot htp-slot-filled">D</span>
          </>
        ),
      },
      {
        title: "Select the word",
        copy: "Click a word to highlight it and identify whether it is a noun, verb, or adjective",
        badgeColor: "var(--grape)",
        artClass: "htp-art-order",
        art: (
          <>
            <span className="htp-cloud htp-cloud-lift">spark</span>
            <span className="htp-check-btn">trace</span>
          </>
        ),
      },
      {
        title: "Tap the hint Icon",
        copy: "Tap the emoji to receive hints. You earn 1 hint for every 10 words (2 hints at 20 words, 3 at 30, and so on).",
        badgeColor: "var(--leaf)",
        artClass: "htp-art-check",
        art: (
          <>
            <span className="htp-score-pop">found</span>
            <span className="htp-score-pop">+25</span>
          </>
        ),
      },
    ],
    tips: [
      [
        "Timed challenge",
        "You are given 5 seconds for each word depending on the number of words to find.",
        "If replaying a passage, your best previous performance is used as the starting benchmark.",
      ],
      [
        "Scoring",
        "Each correct word earns 10 point.",
        "Using hints reduces your score by 25% for every hint used.",
      ],
      [
        "Time bonuses",
        "Finish within 1/4 of the allotted time: +10 bonus points.",
        "Finish within 1/2 of the allotted time: +5 bonus points.",
        "Finish within 3/4 of the allotted time: +3 bonus points.",
        "No bonus is awarded after 3/4 of the allotted time.",
      ],
      ["Coins", "Earn 2 coins for every 20 points scored."],
    ],
  },
};

export default function HowToPlay({
  gameId = "sentence-builder",
  onBack,
  onPlay,
}) {
  const { logout, user } = useAuth();
  const guide = guides[gameId] ?? guides["sentence-builder"];

  // E2E TEST SELECTORS:
  // The How-to-Play page is shared by all games. These selectors let Playwright
  // verify the selected guide and its existing Back/Play actions without relying
  // on CSS classes or changing player-facing behaviour.
  return (
    <main className="how-to-play" data-testid={`how-to-play-page-${gameId}`}>
      <BackgroundDecor />

      <header className="htp-header">
        <div className="htp-nav-left">
          <button
            className="back-button"
            data-testid={`how-to-play-back-${gameId}`}
            type="button"
            onClick={onBack}
          >
            <span className="back-arrow" aria-hidden="true">
              &larr;
            </span>
            Back
          </button>
          <div className="header-titles">
            <p className="eyebrow">{guide.label}</p>
            <h1>{guide.title}</h1>
          </div>
        </div>
        <UserBadge user={user} onLogout={logout} />
      </header>

      <div className="htp-body">
        <section className="htp-section">
          <p className="htp-section-label">The 3 steps</p>
          <div className="htp-steps">
            {guide.steps.map((step, index) => (
              <div
                className="htp-step-card"
                data-testid={`how-to-play-step-${gameId}-${index + 1}`}
                key={step.title}
              >
                <div className={`htp-art ${step.artClass}`} aria-hidden="true">
                  {step.art}
                </div>
                <span
                  className="htp-num-badge"
                  style={{ background: step.badgeColor }}
                >
                  {index + 1}
                </span>
                <h2>{step.title}</h2>
                <p>{step.copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="htp-section">
          <p className="htp-section-label">Good to know</p>
          <div className="htp-tips">
            {guide.tips.map(([title, ...copyLines], index) => (
              <div
                className="htp-tip"
                data-testid={`how-to-play-tip-${gameId}-${index + 1}`}
                key={title}
              >
                <span
                  className="htp-tip-icon"
                  style={{ background: tipColors[index] }}
                >
                  {index + 1}
                </span>

                <div>
                  <strong>{title}</strong>

                  {copyLines.map((copy, copyIndex) => (
                    <p key={`${title}-${copyIndex}`}>{copy}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="htp-footer">
          <button
            className="btn-primary"
            data-testid={`how-to-play-play-${gameId}`}
            type="button"
            onClick={onPlay}
          >
            Play {guide.title}
            <span className="btn-arrow" aria-hidden="true">
              &rarr;
            </span>
          </button>
        </div>
      </div>
    </main>
  );
}
