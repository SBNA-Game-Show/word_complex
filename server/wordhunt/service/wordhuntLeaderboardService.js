/**
 * ============================================================
 * Word Hunt Leaderboard Service
 * ------------------------------------------------------------
 * This service builds the leaderboard from the mock JSON data.
 *
 * Ranking Rules
 * ------------------------------------------------------------
 * 1. Lowest bestTime wins
 * 2. If tied, lowest hintsUsed wins
 * 3. If tied, highest totalScore wins
 * 4. If tied, highest coins wins
 * 5. If tied, newest achievedDate wins
 * ============================================================
 */

const fs = require("fs");
const path = require("path");

/**
 * Location of the mock JSON.
 *
 * Change this path if your JSON file is stored somewhere else.
 */
const DATA_PATH = path.join(
    __dirname,
    "..",
    "wordhuntLeaderboardMock.json"
);
/**
 * Reads the mock JSON from disk.
 */
const readLeaderboardData = () => {

    if (!fs.existsSync(DATA_PATH)) {
        throw new Error(`Leaderboard JSON not found: ${DATA_PATH}`);
    }

    const rawData = fs.readFileSync(DATA_PATH, "utf8");

    return JSON.parse(rawData);
};

/**
 * ============================================================
 * Compare two attempts.
 *
 * Returns:
 * negative -> attemptA ranks higher
 * positive -> attemptB ranks higher
 * ============================================================
 */
const compareAttempts = (attemptA, attemptB) => {

    //--------------------------------------------
    // Rule 1
    // Lowest Best Time
    //--------------------------------------------
    const timeA = Number(attemptA.bestTime ?? Number.MAX_SAFE_INTEGER);
    const timeB = Number(attemptB.bestTime ?? Number.MAX_SAFE_INTEGER);

    if (timeA !== timeB) {
        return timeA - timeB;
    }

    //--------------------------------------------
    // Rule 2
    // Lowest hints used
    //--------------------------------------------
    const hintsA = Number(attemptA.hintsUsed ?? Number.MAX_SAFE_INTEGER);
    const hintsB = Number(attemptB.hintsUsed ?? Number.MAX_SAFE_INTEGER);

    if (hintsA !== hintsB) {
        return hintsA - hintsB;
    }

    //--------------------------------------------
    // Rule 3
    // Highest score
    //--------------------------------------------
    const scoreA = Number(attemptA.totalScore ?? 0);
    const scoreB = Number(attemptB.totalScore ?? 0);

    if (scoreA !== scoreB) {
        return scoreB - scoreA;
    }

    //--------------------------------------------
    // Rule 4
    // Highest coins
    //--------------------------------------------
    const coinsA = Number(attemptA.coins ?? 0);
    const coinsB = Number(attemptB.coins ?? 0);

    if (coinsA !== coinsB) {
        return coinsB - coinsA;
    }

    //--------------------------------------------
    // Rule 5
    // Most recent achievement
    //--------------------------------------------
    const dateA = new Date(
        attemptA.achievedDate ?? 0
    ).getTime();

    const dateB = new Date(
        attemptB.achievedDate ?? 0
    ).getTime();

    return dateB - dateA;
};

/**
 * ============================================================
 * Finds the single best attempt inside a history array.
 * ============================================================
 */
const getBestAttempt = (history = []) => {

    if (!Array.isArray(history)) {
        return null;
    }

    if (history.length === 0) {
        return null;
    }

    return [...history].sort(compareAttempts)[0];
};

/**
 * ============================================================
 * Calculates total score from a collection of attempts.
 * ============================================================
 */
const calculateTotalScore = (attempts = []) => {

    return attempts.reduce((total, attempt) => {

        return total + Number(attempt?.totalScore ?? 0);

    }, 0);
};

/**
 * ============================================================
 * Calculates total coins from a collection of attempts.
 * ============================================================
 */
const calculateTotalCoins = (attempts = []) => {

    return attempts.reduce((total, attempt) => {

        return total + Number(attempt?.coins ?? 0);

    }, 0);
};
/**
 * ============================================================
 * Build one leaderboard row.
 * ============================================================
 */
const buildLeaderboardRow = (
    playerName,
    bestAttempt,
    totalScore,
    totalCoins
) => {

    return {

        playerName,

        bestTime: Number(bestAttempt?.bestTime ?? 0),

        hintsUsed: Number(bestAttempt?.hintsUsed ?? 0),

        totalScore,

        coins: totalCoins,

        achievedDate: bestAttempt?.achievedDate ?? null,

    };

};
/**
 * ============================================================
 * Build leaderboard from every story.
 * ============================================================
 */
const buildLeaderboard = () => {

    const stories = readLeaderboardData();

    /*
     * Store one record per player.
     */
    const playerMap = new Map();

    //----------------------------------------------------------
    // Read every story
    //----------------------------------------------------------
    for (const story of stories) {

        const players = story.info || [];

        //------------------------------------------------------
        // Read every player inside the story
        //------------------------------------------------------
        for (const player of players) {

            const name = player.playerName;

            if (!playerMap.has(name)) {

                playerMap.set(name, {

                    playerName: name,

                    nounHistory: [],

                    verbHistory: [],

                    adjectiveHistory: [],

                });

            }

            const currentPlayer = playerMap.get(name);

            //--------------------------------------------------
            // Merge all histories
            //--------------------------------------------------

            currentPlayer.nounHistory.push(

                ...(player.game?.Noun?.history || [])

            );

            currentPlayer.verbHistory.push(

                ...(player.game?.Verb?.history || [])

            );

            currentPlayer.adjectiveHistory.push(

                ...(player.game?.Adjective?.history || [])

            );

        }

    }

    //----------------------------------------------------------
    // Build leaderboard rows
    //----------------------------------------------------------

    const leaderboard = [];

    for (const player of playerMap.values()) {

        const bestNoun =
            getBestAttempt(player.nounHistory);

        const bestVerb =
            getBestAttempt(player.verbHistory);

        const bestAdjective =
            getBestAttempt(player.adjectiveHistory);

        const attempts = [

            bestNoun,

            bestVerb,

            bestAdjective,

        ].filter(Boolean);

        const totalScore =
            calculateTotalScore(attempts);

        const totalCoins =
            calculateTotalCoins(attempts);

        const overallBest =
            [...attempts]
                .sort(compareAttempts)[0];

        leaderboard.push(

            buildLeaderboardRow(

                player.playerName,

                overallBest,

                totalScore,

                totalCoins

            )

        );

    }

    return leaderboard;

};
/**
 * ============================================================
 * Sort leaderboard and assign ranks.
 * ============================================================
 */
const sortLeaderboard = (leaderboard = []) => {

    leaderboard.sort((playerA, playerB) => {

        return compareAttempts(playerA, playerB);

    });

    return leaderboard.map((player, index) => ({

        rank: index + 1,

        ...player,

    }));
};

/**
 * ============================================================
 * Returns the complete Word Hunt leaderboard.
 * ============================================================
 */
const getWordHuntLeaderboard = () => {

    const leaderboard = buildLeaderboard();

    return sortLeaderboard(leaderboard);

};

/**
 * ============================================================
 * Returns one player's leaderboard information.
 * ============================================================
 */
/**
 * ============================================================
 * Returns one player's leaderboard information.
 * Searches by playerName because the mock data does not
 * contain a unique playerId.
 * ============================================================
 */
const getPlayerRank = (playerName) => {

    const leaderboard = getWordHuntLeaderboard();

    const player = leaderboard.find(
        (row) => row.playerName.toLowerCase() === playerName.toLowerCase()
    );

    if (!player) {

        return null;

    }

    return player;

};

/**
 * ============================================================
 * Returns the Top N players.
 * ============================================================
 */
const getTopPlayers = (limit = 10) => {

    const leaderboard = getWordHuntLeaderboard();

    return leaderboard.slice(0, limit);

};

/**
 * ============================================================
 * Returns leaderboard statistics.
 * ============================================================
 */
const getLeaderboardStats = () => {

    const leaderboard = getWordHuntLeaderboard();

    return {

        totalPlayers: leaderboard.length,

        fastestTime:
            leaderboard.length > 0
                ? leaderboard[0].bestTime
                : null,

        highestScore:
            leaderboard.length > 0
                ? Math.max(
                      ...leaderboard.map(
                          (player) => player.totalScore
                      )
                  )
                : 0,

        highestCoins:
            leaderboard.length > 0
                ? Math.max(
                      ...leaderboard.map(
                          (player) => player.coins
                      )
                  )
                : 0,

    };

};

/**
 * ============================================================
 * Module Exports
 * ============================================================
 */
module.exports = {

    getWordHuntLeaderboard,

    getTopPlayers,

    getPlayerRank,

    getLeaderboardStats,

};