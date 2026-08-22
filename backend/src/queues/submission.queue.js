const { Queue } = require("bullmq");
const { connection } = require("../config/queue.config");

const submissionQueue = new Queue("submission-queue", { connection, 
    defaultJobOptions: { 
        attempts: 3, 
        backoff: {
            type: "exponential",
            delay: 1000
        },
        removeOnComplete: {
            age: 60 * 60
        },
        removeOnFail: {
            age: 24 * 60 * 60
        }
    }
});

module.exports = submissionQueue;