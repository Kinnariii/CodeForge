const jwt = require("jsonwebtoken");
const { getCache } = require("../utils/cache");

const setupSocket = (io) => {

    // Socket authentication middleware
    io.use(async (socket, next) => {

        try{

            const token = socket.handshake.auth?.token;
            if(token) return next(new Error("Authentication token missing"));

            // check blacklist
            const isBlacklisted = await getCache(`blacklist:${token}`);
            if(isBlacklisted) return next(new Error("Token has need revoked"))

            // Verify JWT
            const decoded = jwt.verify( token, process.env.JWT_SECRET);

            // Store authenticated user on socket
            socket.user = decoded;
            socket.token = token;

            next();

        } catch(error) {
            console.error("Socket authentication failed:", error.message);
            next(new Error("Invalid or expired token"));
        }
    });

    // Socket connection
    io.on("connection", (socket) => {

        console.log(`Socket connected: ${socket.id}`);

        console.log(`User connected: ${socket.user.id}`);

        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${socket.id}`, reason)
        });

    })
}

module.exports = setupSocket;