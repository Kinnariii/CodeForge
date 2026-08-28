const queue = [];

const addToQueue = (player) => {

    const alreadyInQueue = queue.find( item => item.userId.toString() === player.userId.toString());
    if (alreadyInQueue) return false;

    queue.push({
        userId: player.userId,
        socketId: player.socketId,
        rating: player.rating,
        joinedAt: new Date()
    });
    return true;
};

const removeFromQueue = (userId) => {

    const index = queue.findIndex( item => item.userId.toString() === userId.toString());
    if (index === -1) return false;

    queue.splice(index, 1);

    return true;
};

const findMatch = (player) => {

    let bestMatch = null;
    let bestIndex = -1;
    let smallestDifference = Infinity;

    for (let i = 0; i < queue.length; i++) {

        const opponent = queue[i];

        if (opponent.userId.toString() ===player.userId.toString()) continue;

        const ratingDifference = Math.abs( player.rating - opponent.rating);

        // Maximum allowed rating difference
        if (ratingDifference > 200) {
            continue;
        }

        if (ratingDifference < smallestDifference) {

            smallestDifference = ratingDifference;

            bestMatch = opponent;
            bestIndex = i;
        }
    }

    if (!bestMatch) return null;

    // Remove matched player from queue
    queue.splice(bestIndex, 1);

    return bestMatch;
};

const getQueue = () => {
    return [...queue];
};

module.exports = {
    addToQueue, removeFromQueue, findMatch, getQueue
};