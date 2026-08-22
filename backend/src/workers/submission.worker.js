const {Worker} = require("bullmq");
const {connection} = require("../config/queue.config");
const judgeService = require("../services/judge.service");

const submissionWorker = new Worker("submission-queue", async (job) => {
    const {submissionId, userId} = job.data;
    console.log(`Processing submission ${submissionId} | Job ${job.id}`);

        const result = await judgeService.judgeSubmission(submissionId, userId);
        console.log(`Submission ${submissionId} judged: ${result.status}`);

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
