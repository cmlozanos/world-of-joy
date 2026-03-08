export const WORD_STATE = {
    IDLE: 'IDLE',
    BRIEFING: 'BRIEFING',
    PLAYING: 'PLAYING',
    ROUND_COMPLETE: 'ROUND_COMPLETE',
    VICTORY: 'VICTORY',
};

// Positive words for children: actions, adjectives, nouns
const WORD_POOL = [
    // 3 letters
    'SOL', 'PAZ', 'LUZ', 'MAR', 'RIO',
    'FIN', 'AVE', 'OJO', 'DIA', 'MES',
    // 4 letters
    'AMOR', 'VIDA', 'RISA', 'ARCO', 'LUNA',
    'FLOR', 'AZUL', 'NUBE', 'ARTE', 'BESO',
    'AGUA', 'CIELO', 'ROSA', 'CAFE', 'RAYO',
    'PUMA', 'LAGO', 'HOJA', 'PATO', 'ISLA',
    // 5 letters
    'SALUD', 'BAILE', 'BRAVO', 'GENIO', 'JUGAR',
    'REINA', 'PODER', 'CAMPO', 'DULCE', 'PLAYA',
    'FELIZ', 'LIBRE', 'SABIO', 'NOBLE', 'LINDO',
    'CANTO', 'TIGRE', 'FUEGO', 'NIEVE', 'ANGEL',
    'REMAR', 'NADAR', 'LIMON', 'GLOBO', 'PERLA',
    // 6 letters
    'AMABLE', 'BONITO', 'BRILLO', 'FUTURO', 'PLANTA',
    'CANTAR', 'ABRAZO', 'JARDIN', 'TESORO', 'CUMBRE',
    'PASION', 'PINTAR', 'OCEANO', 'LUCERO', 'MADERA',
    'CAMINO', 'PUENTE', 'PIEDRA', 'DRAGON', 'BOSQUE',
    'CORRER', 'VIENTO', 'PUEBLO', 'MUSICA', 'FIESTA',
    // 7 letters
    'ALEGRIA', 'AMISTAD', 'VALIOSO', 'SINCERO', 'HERMOSO',
    'FAMILIA', 'SONRISA', 'ENERGIA', 'VALENTE', 'ARCOIRI',
    'CRIANZA', 'AVENTUR', 'ESTRELA', 'COLORES', 'COSECHA',
    'CASCADA', 'GUARDIA', 'PINTURA', 'LECTURA', 'PALACIO',
    'DIAMANT', 'PLANETA', 'MONTAÑA', 'CASTILO', 'VICTORIA',
];

const BRIEFING_DURATION = 3;

export class WordRoundManager {
    constructor() {
        this.currentRoundIndex = -1;
        this.rounds = [];
        this.state = WORD_STATE.IDLE;
        this.collectedLetters = [];
        this.briefingTimer = 0;
        this.totalRounds = 100;
        this.roundStars = [];
        this.totalScore = 0;
        this._generateRounds();
    }

    _generateRounds() {
        // Shuffle pool and build rounds with progressive difficulty
        const shuffled = [...WORD_POOL].sort(() => Math.random() - 0.5);
        const short = shuffled.filter(w => w.length <= 4);
        const medium = shuffled.filter(w => w.length === 5 || w.length === 6);
        const long = shuffled.filter(w => w.length >= 7);

        // Start easy, gradually get harder
        const picks = [
            ...short.slice(0, 20),
            ...medium.slice(0, 40),
            ...long.slice(0, 40),
        ];

        // Fill remaining from reshuffled pool to reach 100
        while (picks.length < this.totalRounds) {
            const extra = [...WORD_POOL].sort(() => Math.random() - 0.5);
            for (const w of extra) {
                if (picks.length >= this.totalRounds) break;
                picks.push(w);
            }
        }

        this.rounds = picks.slice(0, this.totalRounds).map((word, i) => ({
            id: i + 1,
            word: word.toUpperCase(),
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
    }

    update(delta) {
        if (this.state === WORD_STATE.BRIEFING) {
            this.briefingTimer -= delta;
            if (this.briefingTimer <= 0) {
                this.briefingTimer = 0;
                this.state = WORD_STATE.PLAYING;
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
        const stars = 3;
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

    restart() {
        this.currentRoundIndex = -1;
        this.state = WORD_STATE.IDLE;
        this.collectedLetters = [];
        this.roundStars = [];
        this.totalScore = 0;
        this._generateRounds();
    }
}
