import { expect, test } from "@playwright/test";
import {
  MOCK_PROGRESS_VISIT,
  mockSharedPlatformApis,
  openAppAsGuest,
} from "./helpers/app-fixtures.js";

async function openDailyRewards(page) {
  await page.getByRole("button", { name: "Open daily rewards" }).click();

  await expect(page.getByTestId("streak-rewards-page")).toBeVisible({
    timeout: 15_000,
  });
}

async function openCharacterSelect(page) {
  await page.getByRole("button", { name: "Choose character" }).click();

  await expect(page.getByTestId("character-select-page")).toBeVisible({
    timeout: 15_000,
  });
}

test.describe("Daily rewards and streak celebration", () => {
  test("daily rewards displays streak, stars, earned days, and milestone gifts", async ({
    page,
  }) => {
    await mockSharedPlatformApis(page);
    await openAppAsGuest(page);
    await openDailyRewards(page);

    await expect(page.getByTestId("streak-rewards-streak")).toContainText(
      "3 days",
    );

    await expect(page.getByTestId("streak-rewards-stars")).toContainText(
      "18 stars",
    );

    await expect(
      page.locator('[data-testid^="streak-reward-day-"]'),
    ).toHaveCount(5);

    await expect(page.getByTestId("streak-reward-day-1")).toHaveAttribute(
      "data-earned",
      "true",
    );

    await expect(page.getByTestId("streak-reward-day-3")).toHaveAttribute(
      "data-today",
      "true",
    );

    await expect(page.getByTestId("streak-reward-day-10")).toHaveAttribute(
      "data-gift",
      "luna",
    );

    await expect(page.getByTestId("streak-reward-day-10")).toContainText(
      "Reach day 10",
    );

    await expect(page.getByTestId("streak-reward-day-20")).toHaveAttribute(
      "data-gift",
      "comet",
    );

    await expect(page.getByTestId("streak-reward-day-20")).toContainText(
      "Reach day 20",
    );
  });

  test("daily rewards Back returns to the launcher", async ({ page }) => {
    await mockSharedPlatformApis(page);
    await openAppAsGuest(page);
    await openDailyRewards(page);

    await page.getByTestId("streak-rewards-back-button").click();

    await expect(page.getByTestId("launcher-page")).toBeVisible();
  });

  test("daily rewards shows a loading state while progress is pending", async ({
    page,
  }) => {
    await mockSharedPlatformApis(page, {
      progressConfigDelayMs: 8_000,
      progressVisitDelayMs: 8_000,
    });

    await openAppAsGuest(page);
    await openDailyRewards(page);

    await expect(page.getByTestId("streak-rewards-loading")).toBeVisible();
  });

  test("new-day reward appears after story selection and can be dismissed", async ({
    page,
  }) => {
    await mockSharedPlatformApis(page, {
      progressVisit: {
        streak: 10,
        stars: 100,
        ownedCharacters: ["luna"],
        lastVisitDate: "2026-07-16",
        awardedStars: 14,
        isNewDay: true,
        giftedCharacters: ["luna"],
      },
    });

    await openAppAsGuest(page);

    const toast = page.getByTestId("streak-toast");

    await expect(toast).toBeVisible();
    await expect(toast).toHaveAttribute("data-streak", "10");
    await expect(toast).toHaveAttribute("data-awarded-stars", "14");
    await expect(toast).toHaveAttribute("data-gifted", "true");
    await expect(toast).toContainText("Day 10 streak!");
    await expect(toast).toContainText("+14");
    await expect(toast).toContainText("New buddy unlocked!");

    await toast.click();

    await expect(page.getByTestId("streak-toast")).toHaveCount(0);
  });

  test("same-day progress does not display a reward toast", async ({
    page,
  }) => {
    await mockSharedPlatformApis(page);
    await openAppAsGuest(page);

    await expect(page.getByTestId("streak-toast")).toHaveCount(0);
  });
});

test.describe("Character selection and purchasing", () => {
  test("character roster displays free, purchasable, and milestone characters", async ({
    page,
  }) => {
    await mockSharedPlatformApis(page);
    await openAppAsGuest(page);
    await openCharacterSelect(page);

    await expect(page.locator('[data-testid^="character-card-"]')).toHaveCount(
      8,
    );

    await expect(page.getByTestId("character-select-stars")).toContainText(
      "18",
    );

    for (const characterId of ["tomely", "sprout", "bubbles"]) {
      await expect(
        page.getByTestId(`character-card-${characterId}`),
      ).toHaveAttribute("data-owned", "true");
    }

    await expect(page.getByTestId("character-card-cap")).toHaveAttribute(
      "data-price",
      "30",
    );

    await expect(page.getByTestId("character-card-bolt")).toHaveAttribute(
      "data-price",
      "55",
    );

    await expect(page.getByTestId("character-card-berry")).toHaveAttribute(
      "data-price",
      "85",
    );

    await expect(page.getByTestId("character-card-luna")).toHaveAttribute(
      "data-milestone-day",
      "10",
    );

    await expect(page.getByTestId("character-card-comet")).toHaveAttribute(
      "data-milestone-day",
      "20",
    );
  });

  test("selecting a free character updates the page and local storage", async ({
    page,
  }) => {
    await mockSharedPlatformApis(page);
    await openAppAsGuest(page);
    await openCharacterSelect(page);

    const sprout = page.getByTestId("character-card-sprout");

    await sprout.click();

    await expect(sprout).toHaveAttribute("aria-pressed", "true");

    await expect(page.getByTestId("character-selected-summary")).toContainText(
      "Sprout",
    );

    await expect
      .poll(() =>
        page.evaluate(() =>
          window.localStorage.getItem("wc:selectedCharacter"),
        ),
      )
      .toBe("sprout");
  });

  test("selected character remains selected after leaving and reopening", async ({
    page,
  }) => {
    await mockSharedPlatformApis(page);
    await openAppAsGuest(page);
    await openCharacterSelect(page);

    await page.getByTestId("character-card-bubbles").click();

    await page.getByTestId("character-select-back-button").click();
    await expect(page.getByTestId("launcher-page")).toBeVisible();

    await openCharacterSelect(page);

    await expect(page.getByTestId("character-card-bubbles")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await expect(page.getByTestId("character-selected-summary")).toContainText(
      "Bubbles",
    );
  });

  test("unaffordable character purchase is disabled without making a request", async ({
    page,
  }) => {
    const calls = await mockSharedPlatformApis(page);

    await openAppAsGuest(page);
    await openCharacterSelect(page);

    await expect(page.getByTestId("character-buy-cap")).toBeDisabled();

    await expect(page.getByTestId("character-buy-bolt")).toBeDisabled();

    await expect(page.getByTestId("character-buy-berry")).toBeDisabled();

    expect(calls.progressBuy).toBe(0);
  });

  test("successful purchase spends stars, unlocks, and selects the character", async ({
    page,
  }) => {
    const richProgress = {
      ...MOCK_PROGRESS_VISIT,
      stars: 100,
    };

    const calls = await mockSharedPlatformApis(page, {
      progressVisit: richProgress,
      progressBuyData: {
        streak: 3,
        stars: 70,
        ownedCharacters: ["tomely", "sprout", "bubbles", "cap"],
        lastVisitDate: "2026-07-16",
      },
    });

    await openAppAsGuest(page);
    await openCharacterSelect(page);

    await expect(page.getByTestId("character-buy-cap")).toBeEnabled();

    await page.getByTestId("character-buy-cap").click();

    await expect.poll(() => calls.progressBuy).toBe(1);

    expect(calls.lastProgressBuyBody).toEqual({
      uid: "e2e-user",
      characterId: "cap",
    });

    await expect(page.getByTestId("character-select-notice")).toContainText(
      "Cap is yours!",
    );

    await expect(page.getByTestId("character-select-stars")).toContainText(
      "70",
    );

    await expect(page.getByTestId("character-card-cap")).toHaveAttribute(
      "data-owned",
      "true",
    );

    await expect(page.getByTestId("character-card-cap")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await expect
      .poll(() =>
        page.evaluate(() =>
          window.localStorage.getItem("wc:selectedCharacter"),
        ),
      )
      .toBe("cap");
  });

  test("failed purchase displays the server error and leaves the character locked", async ({
    page,
  }) => {
    const calls = await mockSharedPlatformApis(page, {
      progressVisit: {
        ...MOCK_PROGRESS_VISIT,
        stars: 100,
      },
      progressBuyStatus: 400,
      progressBuyMessage: "Purchase rejected for E2E test.",
    });

    await openAppAsGuest(page);
    await openCharacterSelect(page);

    await page.getByTestId("character-buy-cap").click();

    await expect.poll(() => calls.progressBuy).toBe(1);

    await expect(page.getByTestId("character-select-notice")).toContainText(
      "Purchase rejected for E2E test.",
    );

    await expect(page.getByTestId("character-card-cap")).toHaveAttribute(
      "data-owned",
      "false",
    );

    await expect(page.getByTestId("character-select-stars")).toContainText(
      "100",
    );
  });

  test("character Back returns to the launcher", async ({ page }) => {
    await mockSharedPlatformApis(page);
    await openAppAsGuest(page);
    await openCharacterSelect(page);

    await page.getByTestId("character-select-back-button").click();

    await expect(page.getByTestId("launcher-page")).toBeVisible();
  });
});
