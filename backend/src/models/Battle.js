const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        initialRating: {
            type: Number,
            required: true
        },
        findalRating: {
            type: Number,
            default: null
        },
        ratingChange: {
            type: Number,
            default: 0
        },
        code: {
            type: String,
            default: ""
        },
        passedTests: {
            type: Number,
            default: 0
        },
        totalTests: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            enum: [
                "waiting", "playing", "submitted", "won", "lost", "draw", "disconnected"
            ],
            default: "waiting"
        }
    }, {
        _id: false
    }
);

const battleSchema = new mongoose.Schema(
    {
        player1: {
            type: playerSchema,
            required: true
        },
        player2: {
            type: playerSchema,
            required: true
        },
        problem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Problem",
            required: true
        },
        winner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        status: {
            type: String,
            enum: [
                "waiting", "in_progress", "completed", "abandoned"
            ],
            default: "waiting"
        },
        startTime: {
            type: Date,
            default: null
        },
        endTime: {
            type: Date,
            default: null
        },
        duration: {
            type: Number,
            default: 15
        },
        endReason: {
            type: String,
            enum: [
                "accepted", "timeout", "surrender", "disconnect", "draw"
            ],
            default: null
        }
    }, {
        timestamps: true
    }
);

module.exports = mongoose.model("Battle", battleSchema);