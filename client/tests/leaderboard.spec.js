import { expect, test } from "@playwright/test";
import {
  MOCK_LEADERBOARD_ROWS,
  mockLeaderboardApis,
  mockSharedPlatformApis,
  openAppAsGuest,
} from "./helpers/app-fixtures.js";

async function openLeaderboard(page) {
  await page.getByRole("button", { name: "Open leaderboards" }).click();

  await expect(page.getByTestId("leaderboard-page")).toBeVisible({
    timeout: 15_000,
  });
}

async function selectBoard(page, boardKey, expectedTitle) {
  const tab = page.getByTestId(`leaderboard-tab-${boardKey}`);

  await tab.click();
  await expect(tab).toHaveAttribute("aria-pressed", "true");

  await expect(page.getByTestId("leaderboard-board-title")).toContainText(
    expectedTitle,
  );
}

test.describe("Standalone leaderboard", () => {
  test("opens on Master with all five board tabs", async ({ page }) => {
    await mockSharedPlatformApis(page);
    await mockLeaderboardApis(page);
    await openAppAsGuest(page);
    await openLeaderboard(page);

    await expect(
      page.getByRole("heading", {
        name: "Leaderboards",
        exact: true,
      }),
    ).toBeVisible();

    await expect(page.locator('[data-testid^="leaderboard-tab-"]')).toHaveCount(
      5,
    );

    await expect(page.getByTestId("leaderboard-tab-master")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await expect(page.getByTestId("leaderboard-board-title")).toContainText(
      "Master — Top Players",
    );
  });

  test("Back returns to the launcher", async ({ page }) => {
    await mockSharedPlatformApis(page);
    await mockLeaderboardApis(page);
    await openAppAsGuest(page);
    await openLeaderboard(page);

    await page.getByTestId("leaderboard-back-button").click();

    await expect(page.getByTestId("launcher-page")).toBeVisible();
  });

  test("displays a loading state while Master data is pending", async ({
    page,
  }) => {
    await mockSharedPlatformApis(page);
    await mockLeaderboardApis(page, {
      delayMsByBoard: {
        master: 1_500,
      },
      playerRankDelayMsByBoard: {
        master: 1_500,
      },
    });

    await openAppAsGuest(page);
    await openLeaderboard(page);

    await expect(page.getByTestId("leaderboard-loading")).toBeVisible();

    await expect(page.getByTestId("leaderboard-refresh-button")).toBeDisabled();

    await expect(page.getByTestId("leaderboard-podium-rank-1")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("renders the Master podium and ranked list", async ({ page }) => {
    await mockSharedPlatformApis(page);
    await mockLeaderboardApis(page);
    await openAppAsGuest(page);
    await openLeaderboard(page);

    const first = page.getByTestId("leaderboard-podium-rank-1");
    const second = page.getByTestId("leaderboard-podium-rank-2");
    const third = page.getByTestId("leaderboard-podium-rank-3");

    await expect(first).toHaveAttribute("data-player-id", "player-alpha");
    await expect(first).toContainText("Asha Reader");
    await expect(first).toContainText("399");

    await expect(second).toHaveAttribute("data-player-id", "player-beta");
    await expect(second).toContainText("Ben Builder");

    await expect(third).toHaveAttribute("data-player-id", "player-gamma");
    await expect(third).toContainText("Cora Canvas");

    await expect(page.getByTestId("leaderboard-ranked-list")).toBeVisible();

    await expect(
      page.getByTestId("leaderboard-row-player-delta"),
    ).toHaveAttribute("data-rank", "4");

    await expect(
      page.getByTestId("leaderboard-row-player-epsilon"),
    ).toHaveAttribute("data-rank", "5");

    // Master scores do not display per-game completion times.
    await expect(page.locator(".lb-time")).toHaveCount(0);
    await expect(page.locator(".lb-podium-time")).toHaveCount(0);
  });

  test("switches across all game boards and uses the correct endpoints", async ({
    page,
  }) => {
    const calls = await mockLeaderboardApis(page);
    await mockSharedPlatformApis(page);
    await openAppAsGuest(page);
    await openLeaderboard(page);

    await selectBoard(page, "WordHunt", "Word Hunt — Top Players");

    await expect.poll(() => calls.board.WordHunt ?? 0).toBeGreaterThan(0);

    await expect(page.getByTestId("leaderboard-podium-rank-1")).toContainText(
      "Word Winner",
    );

    await selectBoard(
      page,
      "PassageReconstruction",
      "Passage Reconstruction — Top Players",
    );

    const passageWinner = page.getByTestId("leaderboard-podium-rank-1");

    await expect(passageWinner).toContainText("Passage Pro");
    await expect(passageWinner).toContainText("99");
    await expect(passageWinner).toContainText("1:05.2");

    await selectBoard(page, "ContextQuiz", "Context Quiz — Top Players");

    await expect(page.getByTestId("leaderboard-podium-rank-1")).toContainText(
      "Context Champion",
    );

    await selectBoard(page, "MeaningBridge", "Meaning Bridge — Top Players");

    await expect(page.getByTestId("leaderboard-podium-rank-1")).toContainText(
      "Meaning Master",
    );

    await expect.poll(() => calls.board.WordHunt ?? 0).toBeGreaterThan(0);

    await expect
      .poll(() => calls.board.PassageReconstruction ?? 0)
      .toBeGreaterThan(0);

    await expect.poll(() => calls.board.ContextQuiz ?? 0).toBeGreaterThan(0);

    await expect.poll(() => calls.board.MeaningBridge ?? 0).toBeGreaterThan(0);

    expect(
      calls.lastBoardRequests.some(
        ({ board, url }) =>
          board === "MeaningBridge" &&
          url.includes("/api/v1/meaningBridge/score/leaderboard?limit=100"),
      ),
    ).toBe(true);

    expect(
      calls.lastBoardRequests.some(
        ({ board, url }) =>
          board === "PassageReconstruction" &&
          url.includes("/api/v1/passageReconstruct/leaderboard?limit=10"),
      ),
    ).toBe(true);

    expect(
      calls.lastBoardRequests.some(
        ({ board, url }) =>
          board === "ContextQuiz" &&
          url.includes("/api/v1/fillInBlanks/leaderboard?limit=10"),
      ),
    ).toBe(true);

    expect(
      calls.lastBoardRequests.some(
        ({ board, url }) =>
          board === "WordHunt" &&
          url.includes("/api/v1/wordHunt/leaderboard?limit=10"),
      ),
    ).toBe(true);

    await selectBoard(page, "MeaningBridge", "Meaning Bridge — Top Players");

    await expect.poll(() => calls.board.MeaningBridge ?? 0).toBeGreaterThan(0);

    await expect(page.getByTestId("leaderboard-podium-rank-1")).toContainText(
      "Meaning Master",
    );

    await expect.poll(() => calls.board.WordHunt ?? 0).toBeGreaterThan(0);

    await expect
      .poll(() => calls.board.PassageReconstruction ?? 0)
      .toBeGreaterThan(0);

    await expect.poll(() => calls.board.ContextQuiz ?? 0).toBeGreaterThan(0);

    expect(
      calls.lastBoardRequests.some(
        ({ board, url }) =>
          board === "MeaningBridge" &&
          url.includes("/api/v1/meaningBridge/score/leaderboard?limit=100"),
      ),
    ).toBe(true);

    expect(
      calls.lastBoardRequests.some(
        ({ board, url }) =>
          board === "PassageReconstruction" &&
          url.includes("/api/v1/passageReconstruct/leaderboard?limit=10"),
      ),
    ).toBe(true);

    expect(
      calls.lastBoardRequests.some(
        ({ board, url }) =>
          board === "ContextQuiz" &&
          url.includes("/api/v1/fillInBlanks/leaderboard?limit=10"),
      ),
    ).toBe(true);
  });

  test("displays the empty-board state", async ({ page }) => {
    await mockSharedPlatformApis(page);
    await mockLeaderboardApis(page, {
      rowsByBoard: {
        ...MOCK_LEADERBOARD_ROWS,
        master: [],
      },
    });

    await openAppAsGuest(page);
    await openLeaderboard(page);

    await expect(page.getByTestId("leaderboard-empty")).toContainText(
      "No scores yet — be the first to climb the tower!",
    );

    await expect(page.getByTestId("leaderboard-podium")).toHaveCount(0);
  });

  test("displays an API error without leaving the leaderboard page", async ({
    page,
  }) => {
    await mockSharedPlatformApis(page);
    await mockLeaderboardApis(page, {
      statusByBoard: {
        master: 503,
      },
    });

    await openAppAsGuest(page);
    await openLeaderboard(page);

    await expect(page.getByTestId("leaderboard-error")).toContainText(
      "Couldn’t load the leaderboard. master leaderboard unavailable.",
    );

    await expect(page.getByTestId("leaderboard-page")).toBeVisible();
    await expect(page.getByTestId("leaderboard-back-button")).toBeVisible();
  });

  test("labels the current player as You when they are on the podium", async ({
    page,
  }) => {
    await mockSharedPlatformApis(page);
    await mockLeaderboardApis(page, {
      rowsByBoard: {
        ...MOCK_LEADERBOARD_ROWS,
        master: [
          {
            rank: 1,
            uuid: "e2e-user",
            displayName: "E2E Reader",
            avatar: null,
            score: 500,
            bestTime: null,
          },
          ...MOCK_LEADERBOARD_ROWS.master.slice(1),
        ],
      },
    });

    await openAppAsGuest(page);
    await openLeaderboard(page);

    const winner = page.getByTestId("leaderboard-podium-rank-1");

    await expect(winner).toHaveAttribute("data-player-id", "e2e-user");
    await expect(winner).toContainText("You");

    await expect(page.getByTestId("leaderboard-pinned-player")).toHaveCount(0);

    await expect(page.getByTestId("leaderboard-no-player-record")).toHaveCount(
      0,
    );
  });

  test("labels the current player as You inside the ranked list", async ({
    page,
  }) => {
    await mockSharedPlatformApis(page);
    await mockLeaderboardApis(page, {
      rowsByBoard: {
        ...MOCK_LEADERBOARD_ROWS,
        master: [
          ...MOCK_LEADERBOARD_ROWS.master.slice(0, 3),
          {
            rank: 4,
            uuid: "e2e-user",
            displayName: "E2E Reader",
            avatar: null,
            score: 250,
            bestTime: null,
          },
          MOCK_LEADERBOARD_ROWS.master[4],
        ],
      },
    });

    await openAppAsGuest(page);
    await openLeaderboard(page);

    const currentPlayer = page.getByTestId("leaderboard-row-e2e-user");

    await expect(currentPlayer).toContainText("You");
    await expect(currentPlayer).toContainText("YOU");

    await expect(page.getByTestId("leaderboard-pinned-player")).toHaveCount(0);
  });

  test("pins the current player's rank when they are outside the visible rows", async ({
    page,
  }) => {
    await mockSharedPlatformApis(page);
    await mockLeaderboardApis(page, {
      playerRanksByBoard: {
        master: {
          uuid: "e2e-user",
          rank: 42,
          score: 123,
        },
      },
    });

    await openAppAsGuest(page);
    await openLeaderboard(page);

    const pinned = page.getByTestId("leaderboard-pinned-player");

    await expect(pinned).toHaveAttribute("data-player-id", "e2e-user");
    await expect(pinned).toHaveAttribute("data-rank", "42");
    await expect(pinned).toContainText("You");
    await expect(pinned).toContainText("123");

    await expect(page.getByTestId("leaderboard-no-player-record")).toHaveCount(
      0,
    );
  });

  test("prompts a player with no leaderboard record to play a game", async ({
    page,
  }) => {
    await mockSharedPlatformApis(page);
    await mockLeaderboardApis(page);

    await openAppAsGuest(page);
    await openLeaderboard(page);

    await expect(
      page.getByTestId("leaderboard-no-player-record"),
    ).toContainText("Play a game to claim your spot on the board.");

    await expect(page.getByTestId("leaderboard-pinned-player")).toHaveCount(0);
  });

  test("Refresh keeps the board visible and issues a new request", async ({
    page,
  }) => {
    const calls = await mockLeaderboardApis(page, {
      delayMsByBoard: {
        master: 800,
      },
      playerRankDelayMsByBoard: {
        master: 800,
      },
    });

    await mockSharedPlatformApis(page);
    await openAppAsGuest(page);
    await openLeaderboard(page);

    await expect(page.getByTestId("leaderboard-podium-rank-1")).toBeVisible({
      timeout: 10_000,
    });

    const initialRequests = calls.board.master ?? 0;
    const refreshButton = page.getByTestId("leaderboard-refresh-button");

    await refreshButton.click();

    await expect(refreshButton).toBeDisabled();
    await expect(refreshButton).toContainText("Refreshing");

    // Existing rows remain visible during a refresh.
    await expect(page.getByTestId("leaderboard-podium-rank-1")).toContainText(
      "Asha Reader",
    );

    await expect
      .poll(() => calls.board.master ?? 0)
      .toBeGreaterThan(initialRequests);

    await expect(refreshButton).toBeEnabled({
      timeout: 10_000,
    });

    await expect(refreshButton).toContainText("Refresh");
  });

  test("a slower stale board response cannot overwrite the newest board", async ({
    page,
  }) => {
    await mockSharedPlatformApis(page);
    await mockLeaderboardApis(page, {
      delayMsByBoard: {
        WordHunt: 1_500,
        PassageReconstruction: 100,
      },
      playerRankDelayMsByBoard: {
        WordHunt: 1_500,
        PassageReconstruction: 100,
      },
    });

    await openAppAsGuest(page);
    await openLeaderboard(page);

    await expect(page.getByTestId("leaderboard-podium-rank-1")).toBeVisible();

    await page.getByTestId("leaderboard-tab-WordHunt").click();
    await page.getByTestId("leaderboard-tab-PassageReconstruction").click();

    await expect(page.getByTestId("leaderboard-board-title")).toContainText(
      "Passage Reconstruction — Top Players",
    );

    await expect(page.getByTestId("leaderboard-podium-rank-1")).toContainText(
      "Passage Pro",
    );

    // Wait longer than the deliberately slow Word Hunt response.
    await page.waitForTimeout(1_700);

    await expect(
      page.getByTestId("leaderboard-tab-PassageReconstruction"),
    ).toHaveAttribute("aria-pressed", "true");

    await expect(page.getByTestId("leaderboard-podium-rank-1")).toContainText(
      "Passage Pro",
    );

    await expect(page.getByText("Word Winner", { exact: true })).toHaveCount(0);
  });
});
