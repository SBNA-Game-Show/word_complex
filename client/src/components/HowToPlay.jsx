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
      ["Use story logic", "Ask who acts first, what happens next, and what finishes the thought."],
      ["Reset helps", "Clear the slots if your order starts to feel tangled."],
      ["Stars stack up", "Every correct round adds to your score."],
    ],
  },
  "word-match": {
    title: "Word Match",
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
      ["Read every option", "The first familiar word is not always the best match."],
      ["Use meaning first", "Match the idea, not just similar-looking letters."],
      ["Say it aloud", "A clue often becomes clearer when you hear it."],
      ["Compare close choices", "If two choices feel close, test each one in the clue."],
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
      ["Context is the clue", "Nearby words usually point to the missing meaning."],
      ["Check grammar", "The answer should sound right in the sentence."],
      ["Look for tone", "A funny, serious, or spooky passage changes which word fits best."],
      ["Reread after choosing", "The whole paragraph should flow naturally."],
    ],
  },
  "word-hunt": {
    title: "Word Hunt",
    label: "Hidden words",
    steps: [
      {
        title: "Scan the puzzle",
        copy: "Look across, down, and diagonally for the hidden vocabulary words.",
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
        title: "Trace the word",
        copy: "Start at the first letter and drag through each letter until the whole word is selected.",
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
        title: "Collect the clue",
        copy: "Found words disappear from the list so you can focus on what remains.",
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
      ["Start with rare letters", "Letters like z, q, x, and k are easier to spot."],
      ["Search both directions", "A word may hide forward or backward."],
      ["Use the list", "Cross off words mentally as you find them."],
      ["Slow scanning wins", "Move row by row when the puzzle feels crowded."],
    ],
  },
};

export default function HowToPlay({ gameId = "sentence-builder", onBack, onPlay }) {
  const { logout, user } = useAuth();
  const guide = guides[gameId] ?? guides["sentence-builder"];

  return (
    <main className="how-to-play">
      <BackgroundDecor />

      <header className="htp-header">
        <div className="htp-nav-left">
          <button className="back-button" type="button" onClick={onBack}>
            <span className="back-arrow" aria-hidden="true">&larr;</span>
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
              <div className="htp-step-card" key={step.title}>
                <div className={`htp-art ${step.artClass}`} aria-hidden="true">
                  {step.art}
                </div>
                <span className="htp-num-badge" style={{ background: step.badgeColor }}>
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
            {guide.tips.map(([title, copy], index) => (
              <div className="htp-tip" key={title}>
                <span className="htp-tip-icon" style={{ background: tipColors[index] }}>
                  {index + 1}
                </span>
                <div>
                  <strong>{title}</strong>
                  <p>{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="htp-footer">
          <button className="btn-primary" type="button" onClick={onPlay}>
            Play {guide.title}
            <span className="btn-arrow" aria-hidden="true">&rarr;</span>
          </button>
        </div>
      </div>
    </main>
  );
}
