export const NUMBER_STATE = {
    IDLE: 'IDLE',
    BRIEFING: 'BRIEFING',
    PLAYING: 'PLAYING',
    ROUND_COMPLETE: 'ROUND_COMPLETE',
    VICTORY: 'VICTORY',
};

const NUMBER_NAMES = {
    0: 'cero',
    1: 'uno',
    2: 'dos',
    3: 'tres',
    4: 'cuatro',
    5: 'cinco',
    6: 'seis',
    7: 'siete',
    8: 'ocho',
    9: 'nueve',
};

const BRIEFING_DURATION = 3;
const TOTAL_ROUNDS = 72;

function getOperationSpeech(operator) {
    return operator === '+' ? 'más' : 'menos';
}

function buildRound(id, left, operator, right) {
    const result = operator === '+' ? left + right : left - right;
    const expression = `${left} ${operator} ${right} = ${result}`;
    const collectSequence = [String(left), String(right), String(result)];

    return {
        id,
        left,
        operator,
        right,
        result,
        expression,
        collectSequence,
        hint: `Busca ${left}, ${right} y ${result}`,
        speech: `${NUMBER_NAMES[left]} ${getOperationSpeech(operator)} ${NUMBER_NAMES[right]} son ${NUMBER_NAMES[result]}`,
        lesson: operator === '+' ? 'Suma' : 'Resta',
        tokens: [
            { type: 'value', value: String(left), speech: NUMBER_NAMES[left] },
            { type: 'symbol', value: operator },
            { type: 'value', value: String(right), speech: NUMBER_NAMES[right] },
            { type: 'symbol', value: '=' },
            { type: 'value', value: String(result), speech: NUMBER_NAMES[result] },
        ],
    };
}

function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

export class NumberRoundManager {
    constructor() {
        this.currentRoundIndex = -1;
        this.rounds = [];
        this.state = NUMBER_STATE.IDLE;
        this.collectedNumbers = [];
        this.briefingTimer = 0;
        this.roundStars = [];
        this.totalScore = 0;
        this.totalRounds = TOTAL_ROUNDS;
        this._generateRounds();
    }

    _generateRounds() {
        const easyAdditions = [];
        const mediumAdditions = [];
        const subtractions = [];

        for (let left = 0; left <= 9; left++) {
            for (let right = 0; right <= 9; right++) {
                if (left + right <= 9) {
                    const round = buildRound(0, left, '+', right);
                    if (left <= 4 && right <= 4 && left + right <= 6) easyAdditions.push(round);
                    else mediumAdditions.push(round);
                }

                if (left >= right && left <= 9 && right <= 9) {
                    subtractions.push(buildRound(0, left, '-', right));
                }
            }
        }

        const selected = [
            ...shuffle(easyAdditions).slice(0, 24),
            ...shuffle(mediumAdditions).slice(0, 24),
            ...shuffle(subtractions).slice(0, 24),
        ];

        this.rounds = selected.slice(0, this.totalRounds).map((round, index) => ({
            ...round,
            id: index + 1,
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
            this.state = NUMBER_STATE.VICTORY;
            return;
        }

        this.state = NUMBER_STATE.BRIEFING;
        this.briefingTimer = BRIEFING_DURATION;
        this.collectedNumbers = [];
    }

    update(delta) {
        if (this.state !== NUMBER_STATE.BRIEFING) return;

        this.briefingTimer -= delta;
        if (this.briefingTimer <= 0) {
            this.briefingTimer = 0;
            this.state = NUMBER_STATE.PLAYING;
        }
    }

    addCollectedNumber(value) {
        this.collectedNumbers.push(value);
        const round = this.getCurrentRound();
        if (!round) return;

        if (this.collectedNumbers.length >= round.collectSequence.length) {
            this.completeRound();
        }
    }

    completeRound() {
        this.roundStars.push(3);
        this.totalScore += 1;
        this.state = NUMBER_STATE.ROUND_COMPLETE;
    }

    getLastRoundStars() {
        return this.roundStars[this.roundStars.length - 1] || 0;
    }

    getTotalStars() {
        return this.roundStars.reduce((sum, stars) => sum + stars, 0);
    }

    getMaxStars() {
        return this.rounds.length * 3;
    }

    getTargetExpression() {
        const round = this.getCurrentRound();
        return round ? round.expression : '';
    }

    getTargetSpeech() {
        const round = this.getCurrentRound();
        return round ? round.speech : '';
    }

    isPlaying() {
        return this.state === NUMBER_STATE.PLAYING;
    }

    restart() {
        this.currentRoundIndex = -1;
        this.state = NUMBER_STATE.IDLE;
        this.collectedNumbers = [];
        this.briefingTimer = 0;
        this.roundStars = [];
        this.totalScore = 0;
        this._generateRounds();
    }
}