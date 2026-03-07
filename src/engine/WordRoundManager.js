export const WORD_STATE = {
    IDLE: 'IDLE',
    BRIEFING: 'BRIEFING',
    PLAYING: 'PLAYING',
    ROUND_COMPLETE: 'ROUND_COMPLETE',
    TIME_UP: 'TIME_UP',
    VICTORY: 'VICTORY',
};

// Positive words for children: actions, adjectives, nouns
const WORD_POOL = [
    // 3 letters
    'SOL', 'PAZ', 'LUZ', 'MAR', 'RIO',
    // 4 letters
    'AMOR', 'VIDA', 'RISA', 'ARCO', 'LUNA',
    'FLOR', 'AZUL', 'NUBE', 'ARTE', 'BESO',
    // 5 letters
    'SALUD', 'SUEÑO', 'BAILE', 'BRAVO', 'GENIO',
    'JUGAR', 'REINA', 'PODER', 'CAMPO', 'DULCE',
    // 6 letters
    'AMABLE', 'BONITO', 'BRILLO', 'FUTURO', 'PLANTA',
    'CANTAR', 'MAXIMO', 'BUENAS', 'ABRAZO', 'VALENT',
    // 7 letters
    'ALEGRIA', 'AMISTAD', 'VALIOSO', 'SINCERO', 'HERMOSO',
    'CREATIV', 'FAMILIA', 'ESTRELA', 'SONRISA', 'ENERGIA',
];

const BRIEFING_DURATION = 3;
const TIME_PER_LETTER = 8; // seconds per letter in the word

export class WordRoundManager {
    constructor() {
        this.currentRoundIndex = -1;
        this.rounds = [];
        this.state = WORD_STATE.IDLE;
        this.collectedLetters = [];
        this.timeRemaining = 0;
        this.briefingTimer = 0;
        this.totalRounds = 8;
        this.roundStars = [];
        this.totalScore = 0;
        this._generateRounds();
    }

    _generateRounds() {
        // Shuffle and pick words, progressively harder (longer words)
        const shuffled = [...WORD_POOL].sort(() => Math.random() - 0.5);
        const short = shuffled.filter(w => w.length <= 4);
        const medium = shuffled.filter(w => w.length === 5 || w.length === 6);
        const long = shuffled.filter(w => w.length >= 7);

        const picks = [
            ...short.slice(0, 3),
            ...medium.slice(0, 3),
            ...long.slice(0, 2),
        ];

        // Ensure we have enough, fill remaining from pool
        while (picks.length < this.totalRounds) {
            picks.push(WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)]);
        }

        this.rounds = picks.slice(0, this.totalRounds).map((word, i) => ({
            id: i + 1,
            word: word.toUpperCase(),
            timeLimit: word.length * TIME_PER_LETTER,
        }));
    }

    getCurrentRound() {
        return this.rounds[this.currentRoundIndex] || null;
    }

    getTotalRounds() {
        return this.totalRounds;
    }

    startNextRound() {
        this.currentRoundIndex++;
        if (this.currentRoundIndex >= this.rounds.length) {
            this.state = WORD_STATE.VICTORY;
            return;
        }
        this.state = WORD_STATE.BRIEFING;
        this.briefingTimer = BRIEFING_DURATION;
        this.collectedLetters = [];
        this.timeRemaining = this.getCurrentRound().timeLimit;
    }

    update(delta) {
        if (this.state === WORD_STATE.BRIEFING) {
            this.briefingTimer -= delta;
            if (this.briefingTimer <= 0) {
                this.briefingTimer = 0;
                this.state = WORD_STATE.PLAYING;
            }
        } else if (this.state === WORD_STATE.PLAYING) {
            this.timeRemaining -= delta;
            if (this.timeRemaining <= 0) {
                this.timeRemaining = 0;
                this.state = WORD_STATE.TIME_UP;
            }
        }
    }

    addCollectedLetter(char) {
        this.collectedLetters.push(char);
        const round = this.getCurrentRound();
        if (this.collectedLetters.length >= round.word.length) {
            this._completeRound();
        }
    }

    _completeRound() {
        const round = this.getCurrentRound();
        const timePercent = (this.timeRemaining / round.timeLimit) * 100;
        let stars = 1;
        if (timePercent > 50) stars = 3;
        else if (timePercent > 25) stars = 2;

        this.roundStars.push(stars);
        this.totalScore += this.collectedLetters.length;
        this.state = WORD_STATE.ROUND_COMPLETE;
    }

    getLastRoundStars() {
        return this.roundStars[this.roundStars.length - 1] || 0;
    }

    getTotalStars() {
        return this.roundStars.reduce((a, b) => a + b, 0);
    }

    getMaxStars() {
        return this.rounds.length * 3;
    }

    getCollectedWord() {
        return this.collectedLetters.join('');
    }

    getTargetWord() {
        const round = this.getCurrentRound();
        return round ? round.word : '';
    }

    isPlaying() {
        return this.state === WORD_STATE.PLAYING;
    }

    retryRound() {
        this.currentRoundIndex--;
        this.startNextRound();
    }

    restart() {
        this.currentRoundIndex = -1;
        this.state = WORD_STATE.IDLE;
        this.collectedLetters = [];
        this.roundStars = [];
        this.totalScore = 0;
        this._generateRounds();
    }
}
