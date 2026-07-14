/**
 * StreakToast.jsx
 * --------------------------------------------------------------------------
 * The little celebration that pops in when a new day's streak reward lands.
 * Self-contained: it reads the award straight from useProgress() and dismisses
 * itself (auto after a few seconds, or when tapped), so callers just drop
 * <StreakToast /> anywhere inside the provider.
 * --------------------------------------------------------------------------
 */

import { useEffect } from "react";
import { useProgress } from "./ProgressContext";
import "./StreakToast.css";

const AUTO_DISMISS_MS = 6000;

export default function StreakToast() {
  const { dailyAward, dismissAward } = useProgress();

  useEffect(() => {
    if (!dailyAward) return undefined;
    const timer = window.setTimeout(dismissAward, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [dailyAward, dismissAward]);

  if (!dailyAward) return null;

  const { streak, awardedStars, giftedCharacters } = dailyAward;
  const gifted = giftedCharacters?.length > 0;

  return (
    <button
      type="button"
      className="streak-toast"
      onClick={dismissAward}
      role="status"
      aria-live="polite"
    >
      <span className="streak-toast-flame" aria-hidden="true">
        🔥
      </span>
      <span className="streak-toast-copy">
        <strong>Day {streak} streak!</strong>
        <span>
          +{awardedStars} <span aria-hidden="true">⭐</span> stars
          {gifted ? " · New buddy unlocked!" : ""}
        </span>
      </span>
    </button>
  );
}
