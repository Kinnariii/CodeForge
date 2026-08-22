const IORedis = require("ioredis");

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", { maxRetriesPerRequest: null});

connection.on("connect", () => {
    console.log("BullMQ Redis connected");
});

connection.on("ready", () => {
    console.log("BullMQ Redis ready");
});

connection.on("error", (error) => {
    console.error("BullMQ Redis error:", error.message);
});

module.exports = {
    connection
};