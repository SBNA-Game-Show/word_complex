const leaderboardService = require("../service/wordhuntLeaderboardService");

/**
 * GET /wordhunt/leaderboard
 */
const getWordHuntLeaderboard = async (req,res)=>{
    try {

        const leaderboard =
            await leaderboardService.getWordHuntLeaderboard();

        res.status(200).json({
            success: true,
            data: leaderboard,
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};

/**
 * GET /wordhunt/leaderboard/stats
 */
const getLeaderboardStats = async (req, res) => {

    try {

        const stats =
            await leaderboardService.getLeaderboardStats();

        res.status(200).json({
            success: true,
            data: stats,
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }

};

/**
 * GET /wordhunt/leaderboard/player/:playerName
 */
const getPlayerRank = async (req, res) => {

    try {

        const { playerName } = req.params;

        const player =
            await leaderboardService.getPlayerRank(playerName);

        if (!player) {

            return res.status(404).json({
                success: false,
                message: "Player not found",
            });

        }

        res.status(200).json({
            success: true,
            data: player,
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }

};

module.exports = {

    getWordHuntLeaderboard,

    getLeaderboardStats,

    getPlayerRank,

};