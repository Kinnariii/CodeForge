const Battle = require("../models/Battle");

const createBattle = async (BattleData) => {
    return await Battle.create(BattleData);
}

const findBattleById = async (battleId) => {
    return await Battle.findById(battleId)
            .populate("player1.user", "name battleRating")
            .populate("player2.user", "name battleRating")
            .populate("problem");
};

const updateBattle = async (battleId, updateData) => {
    return await Battle.findByIdAndUpdate(battleId, updateData, {new : true});
}

module.exports = {
    createBattle, findBattleById, updateBattle
};