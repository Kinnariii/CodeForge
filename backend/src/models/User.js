const mongoose = require("mongoose");
const validator = require("validator");

const Schema = mongoose.Schema

const ratingHistorySchema = new Schema(
    {
        type: {
            type: String,
            enum: ["contest", "battle"],
            required: true
        },
        change: {
            type: Number,
            required: true
        },
        newRating: {
            type: Number,
            required: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true,
        _id: false
    }
);

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error("Invalid Email!");
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    }, 
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    // RATING SYSTEM
    contestRating: {
        type: Number,
        default: 1200,
        min: 0
    },
    battleRating: {
        type: Number,
        default: 1200,
        min: 0
    },
    ratingHistory: {
        type: [ratingHistorySchema],
        default: []
    } 
},
{
    timestamps:true
});

module.exports = mongoose.model("User", userSchema);