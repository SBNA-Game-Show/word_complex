/**
 * progressLogic.js
 * --------------------------------------------------------------------------
 * Pure streak math — no database, no Express, no side effects. Everything
 * here is a function of its inputs, so it is trivial to unit-test and the
 * service layer can trust it as the single authority on "what happens on a
 * visit".
 *
 * Days are compared as local calendar days (YYYY-MM-DD keys). The reset
 * boundary is therefore local midnight: opening the app on a new calendar day
 * advances (or breaks) the streak; a second visit the same day does nothing.
 * --------------------------------------------------------------------------
 */

const {
  DAILY_BASE,
  DAILY_CAP,
  MILESTONE_GIFTS,
  LADDER_LENGTH,
} = require("./progressConfig");

/** Stars awarded for reaching a given streak day. */
const rewardForDay = (day) => Math.min(DAILY_BASE + (day - 1), DAILY_CAP);

/** Local calendar-day key, e.g. "2026-07-11". */
const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/** Whole calendar days between two YYYY-MM-DD keys (parsed as UTC to dodge DST). */
const daysBetween = (fromKey, toKey) => {
  const from = Date.parse(`${fromKey}T00:00:00Z`);
  const to = Date.parse(`${toKey}T00:00:00Z`);
  return Math.round((to - from) / 86_400_000);
};

/**
 * Decide what a visit does to a player's streak.
 *
 * @param {Object}      args
 * @param {string|null} args.lastVisitDate  Previous visit's date key, or null.
 * @param {number}      args.currentStreak  Streak before this visit.
 * @param {Date}        [args.now]          Injectable clock (defaults to now).
 * @returns {{
 *   streak: number,          // streak after this visit
 *   lastVisitDate: string,   // today's key, to persist
 *   awardedStars: number,    // stars earned by this visit (0 if same day)
 *   isNewDay: boolean,       // false when already counted today
 *   giftedCharacters: string[] // milestone characters unlocked by this visit
 * }}
 */
const evaluateVisit = ({ lastVisitDate, currentStreak = 0, now = new Date() }) => {
  const today = toDateKey(now);

  // Already counted today — a repeat visit changes nothing.
  if (lastVisitDate === today) {
    return {
      streak: currentStreak,
      lastVisitDate: today,
      awardedStars: 0,
      isNewDay: false,
      giftedCharacters: [],
    };
  }

  // Consecutive day continues the streak; a gap (or first ever visit) restarts it.
  const isConsecutive =
    lastVisitDate && daysBetween(lastVisitDate, today) === 1;
  const streak = isConsecutive ? currentStreak + 1 : 1;

  const gift = MILESTONE_GIFTS[streak];

  return {
    streak,
    lastVisitDate: today,
    awardedStars: rewardForDay(streak),
    isNewDay: true,
    giftedCharacters: gift ? [gift] : [],
  };
};

/**
 * The reward ladder the client renders in the gift window: one entry per day,
 * with the stars for that day and any milestone character gift.
 */
const buildRewardLadder = (length = LADDER_LENGTH) =>
  Array.from({ length }, (_, index) => {
    const day = index + 1;
    return { day, stars: rewardForDay(day), gift: MILESTONE_GIFTS[day] ?? null };
  });

module.exports = {
  rewardForDay,
  toDateKey,
  daysBetween,
  evaluateVisit,
  buildRewardLadder,
};
