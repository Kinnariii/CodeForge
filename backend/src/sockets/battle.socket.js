const matchmakingService = require("../services/matchmaking.service");
const battleService = require("../services/battle.service");
const battleRepository = require("../repositories/battle.repository");
const submissionService = require("../services/submission.service");
const battleResultService = require("../services/battleResult.service");

// Maps to track active timers
const battleTimers = new Map(); // battleId -> timeoutId
const disconnectTimers = new Map(); // `${battleId}:${userId}` -> timeoutId

const registerBattleSocket = (io, socket) => {

    // 1. join matchmaking queue
    socket.on("join_queue", async () => {
        try {
            const userId = socket.user.id;
            const rating = socket.user.battleRating ?? 1200;

            const added = matchmakingService.addToQueue({ userId, socketId: socket.id, rating });

            if (!added) {
                socket.emit("queue_error", {
                    message: "You are already in the matchmaking queue"
                });
                return;
            }

            socket.emit("queue_joined", {
                message: "Searching for opponent..."
            });

            // Try to find opponent
            const opponent = matchmakingService.findMatch({ userId, rating });

            if (!opponent) return;

            // match found
            const problemId = await getRandomProblemId();
            const battle = await battleService.createBattle(userId, opponent.userId, problemId);

            const roomId = `battle:${battle._id}`;

            // Both players join same private room
            socket.join(roomId);

            const opponentSocket = io.sockets.sockets.get(opponent.socketId);
            if (opponentSocket) {
                opponentSocket.join(roomId);
            }

            // Update battle status
            const populatedBattle = await battleRepository.updateBattle(battle._id, { 
                status: "in_progress", 
                startTime: new Date() 
            });

            // Notify both players
            io.to(roomId).emit("match_found", {
                battleId: battle._id,
                roomId,
                problem: populatedBattle.problem,
                player1: populatedBattle.player1,
                player2: populatedBattle.player2,
                duration: battle.duration
            });

            // Schedule Battle Duration Auto-Timeout (Default 15 mins)
            const durationMs = (battle.duration || 15) * 60 * 1000;
            const timeoutId = setTimeout(async () => {
                try {
                    await battleResultService.handleBattleTimeout(battle._id);
                    battleTimers.delete(battle._id.toString());
                } catch (err) {
                    console.error("Battle auto-timeout error:", err.message);
                }
            }, durationMs);

            battleTimers.set(battle._id.toString(), timeoutId);

        } catch (error) {
            console.error("Matchmaking error:", error);
            socket.emit("queue_error", { message: error.message || "Matchmaking failed" });
        }
    });

    // 2. leave queue
    socket.on("leave_queue", () => {
        const removed = matchmakingService.removeFromQueue(socket.user.id);
        socket.emit("queue_left", {
            success: removed
        });
    });

    // 3. TEST PROGRESS UPDATE (Live tests passed broadcast)
    socket.on("test_progress_update", async (data) => {
        try {
            const { battleId, passedTests, totalTests } = data;
            const userId = socket.user.id;

            const battle = await battleRepository.findBattleById(battleId);
            if (!battle) {
                socket.emit("battle_error", { message: "Battle not found" });
                return;
            }

            const playerNumber = await battleService.getPlayerNumber(battleId, userId);
            const roomId = `battle:${battleId}`;

            await battleRepository.updatePlayer(battleId, playerNumber, {
                passedTests, totalTests
            });

            socket.to(roomId).emit("opponent_progress", {
                passedTests, totalTests
            });

        } catch (error) {
            console.error("Progress update error:", error);
            socket.emit("battle_error", { message: error.message });
        }
    });

    // 4. REAL-TIME CODE SYNC / TYPING STATUS
    socket.on("code_sync", ({ battleId, codeLength, linesCount }) => {
        const roomId = `battle:${battleId}`;
        socket.to(roomId).emit("opponent_code_sync", {
            codeLength, linesCount
        });
    });

    // 5. submit battle code
    socket.on("submit_battle_code", async (data) => {
        try {
            const { battleId, code, language = "cpp" } = data;
            const userId = socket.user.id;

            const battle = await battleRepository.findBattleById(battleId);
            if (!battle) {
                socket.emit("battle_error", { message: "Battle not found" });
                return;
            }
            if (battle.status !== "in_progress") {
                socket.emit("battle_error", { message: "Battle is not active" });
                return;
            }

            const playerNumber = await battleService.getPlayerNumber(battleId, userId);

            // Save submitted code
            await battleRepository.updatePlayer(battleId, playerNumber, {
                code, status: "submitted"
            });

            // Create submission in queue
            const submission = await submissionService.createSubmission({
                problem: battle.problem._id || battle.problem,
                language,
                code,
                battleId
            }, userId);

            socket.emit("battle_submission_queued", {
                submissionId: submission._id,
                message: "Code submitted. Judging..."
            });

        } catch (error) {
            console.error("Battle submission error:", error);
            socket.emit("battle_error", { message: error.message });
        }
    });

    // 6. re-join battle (After disconnect or page refresh)
    socket.on("rejoin_battle", async ({ battleId }) => {
        try {
            const userId = socket.user.id;
            const battle = await battleRepository.findBattleById(battleId);

            if (battle && battle.status === "in_progress") {
                const roomId = `battle:${battleId}`;
                socket.join(roomId);

                // Cancel disconnect forfeit timer if active
                const timerKey = `${battleId}:${userId}`;
                if (disconnectTimers.has(timerKey)) {
                    clearTimeout(disconnectTimers.get(timerKey));
                    disconnectTimers.delete(timerKey);
                }

                socket.emit("battle_reconnected", { battle });
                socket.to(roomId).emit("opponent_reconnected", { userId });
            }
        } catch (error) {
            console.error("Rejoin battle error:", error);
        }
    });

    // 7. surrender battle
    socket.on("surrender_battle", async ({ battleId }) => {
        try {
            const userId = socket.user.id;
            const battle = await battleRepository.findBattleById(battleId);
            if (!battle || battle.status !== "in_progress") return;

            const player1Id = battle.player1.user._id.toString();
            const player2Id = battle.player2.user._id.toString();
            const opponentId = userId === player1Id ? player2Id : player1Id;

            // Clear battle timer
            if (battleTimers.has(battleId.toString())) {
                clearTimeout(battleTimers.get(battleId.toString()));
                battleTimers.delete(battleId.toString());
            }

            await battleResultService.finishBattle(battleId, opponentId, "surrender");
        } catch (error) {
            console.error("Surrender error:", error);
            socket.emit("battle_error", { message: error.message });
        }
    });
};

const getRandomProblemId = async () => {
    const Problem = require("../models/Problem");

    const count = await Problem.countDocuments();
    if (count === 0) throw new Error("No problems available");

    const random = Math.floor(Math.random() * count);

    const problem = await Problem.findOne()
        .skip(random)
        .select("_id");

    return problem._id;
};

module.exports = registerBattleSocket;