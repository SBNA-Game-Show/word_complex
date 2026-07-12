/**
 * progressConfig.js
 * --------------------------------------------------------------------------
 * Single source of truth for the daily-streak economy. Every tunable number
 * lives here — change the reward curve, milestone gifts, or character prices
 * in ONE place and both the server (enforcement) and client (display, via the
 * /config endpoint) follow.
 *
 * Character ids match the client roster in
 * client/src/components/CharacterSelect.jsx (CHARACTERS).
 * --------------------------------------------------------------------------
 */

// This feature's OWN collection. It never reads or writes any other one.
const COLLECTION_NAME = "progress";

// Daily reward escalates by 1 star each streak day, capped so it can't run away.
// rewardForDay(day) = min(DAILY_BASE + (day - 1), DAILY_CAP)  (see progressLogic)
const DAILY_BASE = 5;
const DAILY_CAP = 25;

// The three buddies every player owns from day one — no stars needed.
const FREE_CHARACTERS = ["sprout", "bubbles", "cap"];

// Characters gifted automatically the day a streak reaches the milestone.
// Keyed by streak day. A player can't skip a day (streak only ever +1 or
// resets to 1), so each milestone day is always landed on exactly.
const MILESTONE_GIFTS = { 10: "luna", 20: "comet" };

// Characters bought with stars. Priced so a full ~20-day streak (~290 stars)
// comfortably unlocks all three (total 270).
const CHARACTER_PRICES = { tomely: 60, bolt: 90, berry: 120 };

// How many days of the ladder the gift window renders.
const LADDER_LENGTH = 20;

module.exports = {
  COLLECTION_NAME,
  DAILY_BASE,
  DAILY_CAP,
  FREE_CHARACTERS,
  MILESTONE_GIFTS,
  CHARACTER_PRICES,
  LADDER_LENGTH,
};
