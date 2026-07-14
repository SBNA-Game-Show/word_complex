/**
 * Pure streak-math tests — no database involved.
 */

const {
  rewardForDay,
  daysBetween,
  evaluateVisit,
  buildRewardLadder,
} = require("./progressLogic");

// A fixed local-noon clock for a given YYYY-MM-DD, so date-key math is stable
// regardless of the machine's timezone.
const at = (dateKey) => new Date(`${dateKey}T12:00:00`);

describe("rewardForDay", () => {
  it("escalates by one star per day", () => {
    expect(rewardForDay(1)).toBe(5);
    expect(rewardForDay(2)).toBe(6);
    expect(rewardForDay(5)).toBe(9);
  });

  it("caps so the reward can't run away", () => {
    expect(rewardForDay(21)).toBe(25);
    expect(rewardForDay(100)).toBe(25);
  });
});

describe("daysBetween", () => {
  it("counts whole calendar days across a month boundary", () => {
    expect(daysBetween("2026-07-31", "2026-08-01")).toBe(1);
    expect(daysBetween("2026-07-11", "2026-07-11")).toBe(0);
    expect(daysBetween("2026-07-11", "2026-07-14")).toBe(3);
  });
});

describe("evaluateVisit", () => {
  it("starts a streak at 1 on the very first visit", () => {
    const result = evaluateVisit({
      lastVisitDate: null,
      currentStreak: 0,
      now: at("2026-07-11"),
    });
    expect(result).toMatchObject({
      streak: 1,
      lastVisitDate: "2026-07-11",
      awardedStars: 5,
      isNewDay: true,
      giftedCharacters: [],
    });
  });

  it("does nothing on a second visit the same day", () => {
    const result = evaluateVisit({
      lastVisitDate: "2026-07-11",
      currentStreak: 3,
      now: at("2026-07-11"),
    });
    expect(result).toMatchObject({
      streak: 3,
      awardedStars: 0,
      isNewDay: false,
    });
  });

  it("increments and awards on a consecutive day", () => {
    const result = evaluateVisit({
      lastVisitDate: "2026-07-11",
      currentStreak: 1,
      now: at("2026-07-12"),
    });
    expect(result).toMatchObject({ streak: 2, awardedStars: 6, isNewDay: true });
  });

  it("resets to 1 after a missed day", () => {
    const result = evaluateVisit({
      lastVisitDate: "2026-07-11",
      currentStreak: 8,
      now: at("2026-07-14"),
    });
    expect(result).toMatchObject({ streak: 1, awardedStars: 5 });
  });

  it("gifts Luna at day 10 and Comet at day 20", () => {
    const luna = evaluateVisit({
      lastVisitDate: "2026-07-10",
      currentStreak: 9,
      now: at("2026-07-11"),
    });
    expect(luna.streak).toBe(10);
    expect(luna.giftedCharacters).toEqual(["luna"]);

    const comet = evaluateVisit({
      lastVisitDate: "2026-07-20",
      currentStreak: 19,
      now: at("2026-07-21"),
    });
    expect(comet.streak).toBe(20);
    expect(comet.giftedCharacters).toEqual(["comet"]);
  });
});

describe("buildRewardLadder", () => {
  it("returns one entry per day with milestone gifts marked", () => {
    const ladder = buildRewardLadder();
    expect(ladder).toHaveLength(20);
    expect(ladder[0]).toEqual({ day: 1, stars: 5, gift: null });
    expect(ladder[9]).toEqual({ day: 10, stars: 14, gift: "luna" });
    expect(ladder[19]).toEqual({ day: 20, stars: 24, gift: "comet" });
  });
});
