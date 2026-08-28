const calculateElo = (ratingA, ratingB, scoreA) => {
    const K = 32;
    const expectedA = 1/(1+Math.pow(10, (ratingB - ratingA) / 400));
    const changeA = Math.round( K * (scoreA - expectedA));
    const changeB = -changeA;

    return {
        player1Change: changeA, player2Change: changeB
    };
}

module.exports = {
    calculateElo
};