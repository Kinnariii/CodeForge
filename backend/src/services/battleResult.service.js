const User = require("../models/User");
const battleRepository = require("../repositories/battle.repository");
const { calculateElo } = require("./elo.service");
const { getIO } = require("../sockets/socketManager");

const finishBattle = async (battleId, winnerId, reason = "accepted") => {

    const battle = await battleRepository.findBattleById(battleId);
    if (!battle) throw new Error("Battle not found");

    if (battle.status === "completed") return battle;

    const player1Id = battle.player1.user._id.toString();
    const player2Id = battle.player2.user._id.toString();

    const winner = winnerId.toString();
    if (winner !== player1Id && winner !== player2Id) {
        throw new Error("Winner is not a player in this battle");
    }

    const player1Won = winner === player1Id;
    const scorePlayer1 = player1Won ? 1 : 0;
    const elo = calculateElo(battle.player1.initialRating, battle.player2.initialRating, scorePlayer1);

    const player1FinalRating = Math.max(0, battle.player1.initialRating + elo.player1Change);
    const player2FinalRating = Math.max(0, battle.player2.initialRating + elo.player2Change);

    // update battle
    const updatedBattle = await battleRepository.updateBattle(
        battleId,
        {
            winner: winnerId,
            status: "completed",
            endTime: new Date(),
            endReason: reason,
            "player1.finalRating": player1FinalRating,
            "player1.ratingChange": elo.player1Change,
            "player1.status": player1Won ? "won" : "lost",
            "player2.finalRating": player2FinalRating,
            "player2.ratingChange": elo.player2Change,
            "player2.status": player1Won ? "lost" : "won"
        }
    );

    // Updates Players
    await User.findByIdAndUpdate(player1Id, { 
        $set: { 
            battleRating: player1FinalRating 
        }, 
        $push: {
            ratingHistory: {
                type: "battle",
                change: elo.player1Change,
                newRating: player1FinalRating,
                title: "1v1 Battle"
            }
        }
    });

    await User.findByIdAndUpdate(player2Id, {
        $set: {
            battleRating: player2FinalRating
        }, 
        $push: {
            ratingHistory: {
                type: "battle",
                change: elo.player2Change,
                newRating: player2FinalRating,
                title: "1v1 Battle"
            }
        }
    });

    // Notify both players
    try {
        const io = getIO();
        const roomId = `battle:${battleId}`;

        io.to(roomId).emit("battle_ended", {
            battleId: battleId.toString(),
            winner: winnerId.toString(),
            player1: {
                user: player1Id,
                ratingChange: elo.player1Change,
                finalRating: player1FinalRating
            },
            player2: {
                user: player2Id,
                ratingChange: elo.player2Change,
                finalRating: player2FinalRating
            },
            reason: reason
        });
    } catch (socketErr) {
        console.error("Socket emit battle_ended error:", socketErr.message);
    }
    
    return updatedBattle;
};

const finishBattleDraw = async (battleId, reason = "draw") => {
    const battle = await battleRepository.findBattleById(battleId);
    if (!battle) throw new Error("Battle not found");

    if (battle.status === "completed") return battle;

    const player1Id = battle.player1.user._id.toString();
    const player2Id = battle.player2.user._id.toString();

    const elo = calculateElo(battle.player1.initialRating, battle.player2.initialRating, 0.5);

    const player1FinalRating = Math.max(0, battle.player1.initialRating + elo.player1Change);
    const player2FinalRating = Math.max(0, battle.player2.initialRating + elo.player2Change);

    const updatedBattle = await battleRepository.updateBattle(
        battleId,
        {
            winner: null,
            status: "completed",
            endTime: new Date(),
            endReason: reason,
            "player1.finalRating": player1FinalRating,
            "player1.ratingChange": elo.player1Change,
            "player1.status": "draw",
            "player2.finalRating": player2FinalRating,
            "player2.ratingChange": elo.player2Change,
            "player2.status": "draw"
        }
    );

    await User.findByIdAndUpdate(player1Id, {
        $set: { battleRating: player1FinalRating },
        $push: {
            ratingHistory: {
                type: "battle",
                change: elo.player1Change,
                newRating: player1FinalRating,
                title: "1v1 Battle (Draw)"
            }
        }
    });

    await User.findByIdAndUpdate(player2Id, {
        $set: { battleRating: player2FinalRating },
        $push: {
            ratingHistory: {
                type: "battle",
                change: elo.player2Change,
                newRating: player2FinalRating,
                title: "1v1 Battle (Draw)"
            }
        }
    });

    try {
        const io = getIO();
        const roomId = `battle:${battleId}`;

        io.to(roomId).emit("battle_ended", {
            battleId: battleId.toString(),
            winner: null,
            player1: {
                user: player1Id,
                ratingChange: elo.player1Change,
                finalRating: player1FinalRating
            },
            player2: {
                user: player2Id,
                ratingChange: elo.player2Change,
                finalRating: player2FinalRating
            },
            reason: reason
        });
    } catch (socketErr) {
        console.error("Socket emit battle_ended error:", socketErr.message);
    }

    return updatedBattle;
};

const handleBattleTimeout = async (battleId) => {
    const battle = await battleRepository.findBattleById(battleId);
    if (!battle || battle.status !== "in_progress") return;

    const p1Passed = battle.player1.passedTests || 0;
    const p2Passed = battle.player2.passedTests || 0;

    if (p1Passed > p2Passed) {
        return await finishBattle(battleId, battle.player1.user._id, "timeout");
    } else if (p2Passed > p1Passed) {
        return await finishBattle(battleId, battle.player2.user._id, "timeout");
    } else {
        return await finishBattleDraw(battleId, "timeout");
    }
};

module.exports = {
    finishBattle,
    finishBattleDraw,
    handleBattleTimeout
};