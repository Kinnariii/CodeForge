const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const dotenv = require('dotenv');
dotenv.config();

const http = require("http");
const {Server} = require("socket.io");

const app = require("./src/app");

const connectDB = require("./src/config/database");
const { connectRedis } = require("./src/config/redis");
const {startContestRatingScheduler } = require("./src/services/contestRatingScheduler.service");

const setupSocket = require("./src/sockets/socket");

require("./src/workers/submission.worker");

const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Create Socket.io server
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

setupSocket(io);

connectDB().then(async () => {

    await connectRedis();

    startContestRatingScheduler();

    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Socket.io server ready`);
    });

});
