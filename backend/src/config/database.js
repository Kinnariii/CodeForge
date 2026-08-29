
const mongoose = require("mongoose");
const dns = require("dns");

// Fix for Node.js querySrv ECONNREFUSED on Windows / router DNS
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDB = async () =>{
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing in .env");
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected");
    } catch (error) {
        console.log("❌ Database Error:", error.message);
        process.exit(1);
    }
}

module.exports = connectDB;