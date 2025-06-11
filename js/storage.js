const highScoreKey = 'cyberscapeHighScore';

function saveHighScore(score) {
    try {
        localStorage.setItem(highScoreKey, score.toString());
    } catch (e) {
        console.error("Failed to save high score to localStorage:", e);
    }
}

function loadHighScore() {
    try {
        const score = localStorage.getItem(highScoreKey);
        return score ? parseInt(score, 10) : 0;
    } catch (e) {
        console.error("Failed to load high score from localStorage:", e);
        return 0;
    }
}
