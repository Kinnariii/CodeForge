const {Worker} = require("bullmq");
const {connection} = require("../config/queue.config");
const judgeService = require("../services/judge.service");

const submissionRepository = require("../repositories/submission.repository");

const { getIO } = require("../sockets/socketManager");

const submissionWorker = new Worker("submission-queue", async (job) => {
    const {submissionId, userId} = job.data;
    console.log(`Processing submission ${submissionId} | Job ${job.id}`);

    // 1. Judge Submission
    const result = await judgeService.judgeSubmission(submissionId, userId);
    console.log(`Submission ${submissionId} judged: ${result.status}`);

    // 2. Get submission from DB
    const submission = await submissionRepository.findById(submissionId);

    // 3. Check whether this is a battle submission
    if (submission && submission.battle) {

        console.log(`Battle submission detected: ${submission.battle}`);

        const io = getIO();
        const roomId = `battle:${submission.battle}`;

        // 4. Send judge result to both battle players
        io.to(roomId).emit("battle_submission_result", {
            submissionId,
            userId: userId.toString(),
            status: result.status,
            passedTests: result.passedTests,
            totalTests: result.totalTests,
            runtime: result.runtime,
            memory: result.memory,
            error: result.error,
            sampleResults: result.sampleResults,
            failedCase: result.failedCase
        });
        // If all testcases are accepted, finish battle and update ratings!
        if (result.status === "accepted") {
            const battleResultService = require("../services/battleResult.service");
            const winnerId = submission.user._id || submission.user;
            await battleResultService.finishBattle(submission.battle, winnerId, "accepted");
        }
    }
    return result;
}, {connection, concurrency: 2});

submissionWorker.on("completed", (job) => {
    console.log(`Job ${job.id} completed successfully`);
});

submissionWorker.on("failed", (job, error) => {
    console.error(`Job ${job?.id} failed:`, error.message);
});

submissionWorker.on("error", (error) => {
    console.error("Submission worker error:", error.message);
});

console.log(" Submission worker started");

module.exports = submissionWorker;
