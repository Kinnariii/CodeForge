const Contest = require("../models/Contest");
const User = require("../models/User")

const leaderboardService = require("./leaderboard.service");

const ApiError = require("../utils/ApiError");

const calculateRatingChange = (expectedRank, actualRank, totalParticipants) => {
    if(totalParticipants <= 1) {
        return 0;
    }

    const rankDifference = expectedRank - actualRank;

    const normalizedDifference = rankDifference / (totalParticipants - 1);

    const K = 40;

    let change = Math.round(K * normalizedDifference);

    if (change === 0 && actualRank !== expectedRank) {
        change = actualRank < expectedRank ? 1 : -1;
    }
    return change;
} 

const calculateExpectedRank = (userRating, participantRatings) => {

    let expectedRank = 1;

    for(const participant of participantRatings) {
        if(participant.rating > userRating) {
            expectedRank++;
        }
    }

    return expectedRank;
};

const calculateContestRatings  = async (contestId) => {
    const contest = await Contest.findById(contestId);
    if(!contest) throw new ApiError(404, "Contest not found");

    const now = new Date();
    if(now < contest.endTime) {
        throw new ApiError( 400, "Contest has not ended yet");
    }

    if (contest.ratingsCalculated) {
        console.log(`Ratings already calculated for contest ${contestId}`);

        return {
            alreadyCalculated: true
        };
    }

    // Handle 0 participants contest safely
    if (!contest.participants || contest.participants.length === 0) {
        contest.ratingsCalculated = true;
        contest.ratingsCalculatedAt = new Date();
        await contest.save();
        console.log(`Contest ${contestId} has 0 participants, marked ratingsCalculated = true`);
        return {
            contestId: contest._id,
            contestTitle: contest.title,
            participants: 0,
            message: "No participants in contest"
        };
    }

    // Auto-populate snapshots if missing
    if (!contest.participantRatings || contest.participantRatings.length === 0) {
        const users = await User.find({ _id: { $in: contest.participants } }).select("contestRating");
        contest.participantRatings = users.map(u => ({
            user: u._id,
            rating: u.contestRating ?? 1200
        }));
        await contest.save();
    }

    // Get final leaderboard
    const cacheKey = `leaderboard:${contestId}`;
    const { deleteCache } = require("../utils/cache");
    await deleteCache(cacheKey);

    const leaderboard = await leaderboardService.getContestLeaderboard(contestId);
    if (!leaderboard || leaderboard.length === 0) {
        contest.ratingsCalculated = true;
        contest.ratingsCalculatedAt = new Date();
        await contest.save();
        return {
            contestId: contest._id,
            contestTitle: contest.title,
            participants: 0,
            message: "Leaderboard is empty"
        };
    }

    // Save permanent final leaderboard snapshot
    contest.finalLeaderboard = leaderboard.map(entry => ({
        user: {
            _id: entry.user._id,
            name: entry.user.name
        },
        solved: entry.solved,
        penalty: entry.penalty,
        rank: entry.rank
    }));

    const participantRatings = contest.participantRatings;
    const totalParticipants = leaderboard.length;
    const ratingChanges = [];

    for (const entry of leaderboard) {
        const userId = entry.user._id.toString();

        const snapshot = participantRatings.find(
            participant => participant.user.toString() === userId
        );

        let currentRating = 1200;
        if (snapshot && snapshot.rating != null) {
            currentRating = snapshot.rating;
        } else {
            const userDoc = await User.findById(userId).select("contestRating");
            currentRating = userDoc?.contestRating ?? 1200;
        }

        const expectedRank = calculateExpectedRank(currentRating, participantRatings);

        const actualRank = entry.rank;

        const change = calculateRatingChange(expectedRank, actualRank, totalParticipants);

        const newRating = Math.max(0,currentRating + change);

        ratingChanges.push({
            userId,
            name: entry.user.name,
            oldRating: currentRating,
            expectedRank,
            actualRank,
            change,
            newRating
        });
    }

    // Update users
    for(const result of ratingChanges) {

        await User.findByIdAndUpdate(result.userId,
            {
                $set: {
                    contestRating: result.newRating
                },
                $push: {
                    ratingHistory: {
                        type: "contest",
                        change: result.change,
                        newRating: result.newRating,
                        title: contest.title
                    }
                }
            }
        );
    }
    // Mark ratings as calculated
    contest.ratingsCalculated = true;
    contest.ratingsCalculatedAt = new Date();
    await contest.save();

    return {
        contestId: contest._id, contestTitle: contest.title, participants: ratingChanges.length, ratingChanges
    };
}

module.exports = {
    calculateContestRatings
};