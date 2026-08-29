const express = require("express");

const cors = require("cors");

const app = express();

const routes = require("./routes/index");

// Allow requests from frontend URL (set FRONTEND_URL in env on Render)
const allowedOrigins = process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL, "http://localhost:5173"]
    : ["*"];

app.use(cors({
    origin: allowedOrigins.includes("*") ? "*" : allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint — used by UptimeRobot to keep service alive
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/v1", routes);

module.exports = app;