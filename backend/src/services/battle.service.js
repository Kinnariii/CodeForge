const User = require("../models/User");
const battleRepository = require("../repositories/battle.repository");
const ApiError = require("../utils/ApiError");

const createBattle = async (player1Id, player2Id, problemId) => {
    if (player1Id.toString() === player2Id.toString()) {
        throw new ApiError(400, "You cannot battle yourself");
    }

    const player1 = await User.findById(player1Id).select("name battleRating");
    const player2 = await User.findById(player2Id).select("name battleRating");

    if (!player1 || !player2) {
        throw new ApiError(404, "Player not found");
    }

    const player1Rating = player1.battleRating ?? 1200;
    const player2Rating = player2.battleRating ?? 1200;

    const battle = await battleRepository.createBattle({
        player1: {
            user: player1._id,
            initialRating: player1Rating
        },
        player2: {
            user: player2._id,
            initialRating: player2Rating
        },
        problem: problemId,
        status: "waiting",
        duration: 15
    });

    return battle;
};

const getBattleById = async (battleId) => {

    const battle = await battleRepository.findBattleById(battleId);
    if (!battle) throw new ApiError(404, "Battle not found");

    return battle;
};

const getPlayerNumber = async (battleId, userId) => {
    const battle = await battleRepository.findBattleById(battleId);
    if(!battle) throw new ApiError(404, "Battle not found");

    if (battle.player1.user._id.toString() === userId.toString()) return 1;

    if (battle.player2.user._id.toString() === userId.toString())return 2;

    throw new ApiError(403, "You are not a player in this battle");
}

module.exports = {
    createBattle, getBattleById, getPlayerNumber 
};