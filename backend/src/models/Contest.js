const mongoose = require("mongoose");

const contestSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 100
        },
        description: {
            type: String,
            required: true,
            trim: true
        },
        startTime: {
            type: Date,
            required: true
        },
        endTime: {
            type: Date,
            required: true
        },
        problems: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Problem",
                required: true
            }
        ],
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        participantRatings: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true
                },
                rating: {
                    type: Number,
                    required: true
                }
            }
        ],
        finalLeaderboard: [
            {
                user: {
                    _id: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "User"
                    },
                    name: {
                        type: String
                    }
                },
                solved: {
                    type: Number,
                    default: 0
                },
                penalty: {
                    type: Number,
                    default: 0
                },
                rank: {
                    type: Number
                }
            }
        ],
        ratingsCalculated: {
            type: Boolean,
            default: false
        },
        ratingsCalculatedAt: {
            type: Date,
            default: null
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },{
        timestamps: true
    }
);

const Contest = mongoose.model("Contest", contestSchema);

module.exports = Contest;