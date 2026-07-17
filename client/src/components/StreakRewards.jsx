import BackgroundDecor from "./BackgroundDecor";
import { useProgress } from "../progress";
import { CHARACTERS } from "./CharacterSelect";
import "./StreakRewards.css";

// The reward ladder screen you reach by tapping the streak pill. It shows every
// day of the streak: what you've already earned, today, and what's still ahead —
// including the two buddies gifted at day 10 and day 20. All the numbers come
// from useProgress() (served by the backend), so nothing is hardcoded here.

const characterById = (id) =>
  CHARACTERS.find((character) => character.id === id) ?? null;

export default function StreakRewards({ onBack }) {
  const { streak, stars, ladder, loading } = useProgress();

  // E2E TEST SELECTORS:
  // These attributes expose the existing reward ladder states to Playwright.
  // They do not change streak calculations, rewards, or player interactions.
  return (
    <main className="streak-rewards" data-testid="streak-rewards-page">
      <BackgroundDecor />

      <header className="game-header">
        <button
          className="back-button"
          data-testid="streak-rewards-back-button"
          type="button"
          onClick={onBack}
        >
          <span className="back-arrow" aria-hidden="true">
            &larr;
          </span>
          Back
        </button>
        <div className="header-titles">
          <p className="eyebrow">Daily rewards</p>
          <h1>Your Streak</h1>
        </div>
        <div className="sr-stats">
          <span className="sr-stat" data-testid="streak-rewards-streak">
            <span aria-hidden="true">🔥</span> {streak} day
            {streak === 1 ? "" : "s"}
          </span>
          <span className="sr-stat alt" data-testid="streak-rewards-stars">
            <span aria-hidden="true">⭐</span> {stars} star
            {stars === 1 ? "" : "s"}
          </span>
        </div>
      </header>

      <section className="sr-intro">
        <p className="eyebrow">Keep it going</p>
        <h2>
          Come back every day to earn <span className="rainbow">stars</span>
        </h2>
        <p className="sr-intro-text">
          Each day gives a little more than the last. Reach day 10 and day 20 to
          unlock two special buddies!
        </p>
      </section>

      <section className="sr-ladder" aria-label="Reward ladder">
        {loading && ladder.length === 0 ? (
          <p className="sr-loading" data-testid="streak-rewards-loading">
            Loading your rewards…
          </p>
        ) : (
          <ol className="sr-grid">
            {ladder.map(({ day, stars: dayStars, gift }) => {
              const earned = day <= streak;
              const isToday = day === streak;
              const buddy = gift ? characterById(gift) : null;
              const className = [
                "sr-day",
                buddy ? "sr-day--gift" : "",
                earned ? "is-earned" : "is-locked",
                isToday ? "is-today" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <li
                  key={day}
                  className={className}
                  data-testid={`streak-reward-day-${day}`}
                  data-earned={earned ? "true" : "false"}
                  data-today={isToday ? "true" : "false"}
                  data-gift={buddy?.id ?? ""}
                  style={
                    buddy ? { "--c": buddy.c, "--c2": buddy.c2 } : undefined
                  }
                >
                  <span className="sr-day-num">Day {day}</span>

                  {buddy ? (
                    <>
                      <span className="sr-gift-ribbon">Gift</span>
                      <span className="sr-gift-stage">
                        <img
                          className="sr-gift-img"
                          src={`/characters/${buddy.id}.webp`}
                          alt={buddy.name}
                          draggable="false"
                        />
                      </span>
                      <span className="sr-gift-name">{buddy.name}</span>
                      <span className="sr-day-reward">
                        {earned ? "Unlocked!" : `Reach day ${day}`}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="sr-star" aria-hidden="true" />
                      <span className="sr-day-reward">+{dayStars}</span>
                    </>
                  )}

                  {earned && (
                    <span className="sr-check" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </main>
  );
}
