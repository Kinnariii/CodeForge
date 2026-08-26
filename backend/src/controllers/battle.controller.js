const battleService = require("../services/battle.service");

const createBattle = async (req, res) => {

    try {
        const { player2Id, problemId } = req.body;
        const battle = await battleService.createBattle(req.user.id, player2Id, problemId);
        return res.status(201).json({
            success: true,
            message: "Battle created successfully",
            data: battle
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
};

const getBattleById = async (req, res) => {

    try {
        const battle = await battleService.getBattleById(req.params.battleId);
        return res.status(200).json({
            success: true,
            data: battle
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
};

module.exports = {
    createBattle, getBattleById
};