const IORedis = require("ioredis");

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const isTLS = redisUrl.startsWith("rediss://");

const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    ...(isTLS && { tls: {} })
});

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