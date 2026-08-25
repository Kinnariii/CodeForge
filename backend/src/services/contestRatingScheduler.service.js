const Contest = require("../models/Contest");
const ratingService = require("./rating.service");

const checkEndedContests = async () => {

    try {
        const contests = await Contest.find({
            endTime: { $lte: new Date() },
            ratingsCalculated: false
        }).select("_id");

        for(const contest of contests) {
            try{
                await ratingService.calculateContestRatings(contest._id); // Ratings calculated ...
            } catch (error) {
                console.error(`Rating calculation failed for contest ${contest._id}:`,error.message);
            }
        }

    } catch(error) {
        console.error("Contest rating scheduler error:", error.message);
    }
};

const startContestRatingScheduler = () => {
    // 1. Run immediately on server start to catch any contests ended while offline
    checkEndedContests();

    // 2. Check periodically every 30 seconds
    setInterval(checkEndedContests, 30 * 1000);

    console.log("Contest rating scheduler started");
};

module.exports = {
    startContestRatingScheduler
};