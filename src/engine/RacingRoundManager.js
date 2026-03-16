export const RACE_STATE = {
    IDLE: 'IDLE',
    BRIEFING: 'BRIEFING',
    PLAYING: 'PLAYING',
    ROUND_COMPLETE: 'ROUND_COMPLETE',
    FAILED: 'FAILED',
    VICTORY: 'VICTORY',
};

export const RACE_FAIL_REASON = {
    TIME: 'TIME',
    FUEL: 'FUEL',
};

const ROUNDS = [
    {
        id: 1,
        name: 'Salida del Pinar',
        description: 'Conduce hasta la meta por la carretera.',
        icon: '🏁',
        theme: 'morning',
        hint: '🏎️ Sigue la carretera, mantén gasolina suficiente y ve directo a la meta.',
        startProgress: 0.02,
        finishProgress: 0.15,
        timeLimit: 80,
        initialFuel: 105,
        fuelCanCount: 4,
        nitroCanCount: 2,
    },
    {
        id: 2,
        name: 'Curvas del Valle',
        description: 'Recorre las curvas y alcanza la llegada.',
        icon: '🛣️',
        theme: 'forest',
        hint: '⛽ Los bidones rojos te mantienen en marcha. Los naranjas te lanzan hacia delante.',
        startProgress: 0.18,
        finishProgress: 0.34,
        timeLimit: 85,
        initialFuel: 100,
        fuelCanCount: 5,
        nitroCanCount: 2,
    },
    {
        id: 3,
        name: 'Ruta del Sol',
        description: 'Cruza el tramo dorado sin quedarte sin combustible.',
        icon: '☀️',
        theme: 'sunset',
        hint: '⚡ Aprovecha el nitro en las rectas largas para ganar tiempo.',
        startProgress: 0.36,
        finishProgress: 0.52,
        timeLimit: 90,
        initialFuel: 102,
        fuelCanCount: 4,
        nitroCanCount: 3,
    },
    {
        id: 4,
        name: 'Niebla Rápida',
        description: 'La meta está lejos: recoge apoyo por el camino.',
        icon: '🌫️',
        theme: 'misty',
        hint: '🏁 La brújula apunta a la meta. No hace falta salir de la carretera.',
        startProgress: 0.55,
        finishProgress: 0.72,
        timeLimit: 95,
        initialFuel: 98,
        fuelCanCount: 5,
        nitroCanCount: 3,
    },
    {
        id: 5,
        name: 'Circuito Cristal',
        description: 'Encadena gasolina y nitro hasta cruzar el arco final.',
        icon: '💠',
        theme: 'crystal',
        hint: '⛽ Si el depósito baja demasiado, prioriza la gasolina antes que el nitro.',
        startProgress: 0.75,
        finishProgress: 0.91,
        timeLimit: 90,
        initialFuel: 100,
        fuelCanCount: 5,
        nitroCanCount: 3,
    },
    {
        id: 6,
        name: 'Gran Vuelta Dorada',
        description: 'Última carrera: completa el gran recorrido de salida a meta.',
        icon: '🌟',
        theme: 'golden',
        hint: '🏆 Usa todo lo que recojas y mantén la trazada por la carretera hasta el final.',
        startProgress: 0.93,
        finishProgress: 0.17,
        timeLimit: 110,
        initialFuel: 110,
        fuelCanCount: 6,
        nitroCanCount: 4,
    },
];

const BRIEFING_DURATION = 3;

export class RacingRoundManager {
    constructor() {
        this.currentRoundIndex = -1;
        this.state = RACE_STATE.IDLE;
        this.progress = 0;
        this.timeRemaining = 0;
        this.briefingTimer = 0;
        this.roundStars = [];
        this.totalScore = 0;
        this.failReason = null;
    }

    startNextRound() {
        this.currentRoundIndex++;
        if (this.currentRoundIndex >= ROUNDS.length) {
            this.state = RACE_STATE.VICTORY;
            return;
        }

        this.state = RACE_STATE.BRIEFING;
        this.briefingTimer = BRIEFING_DURATION;
        this.progress = 0;
        this.failReason = null;
        this.timeRemaining = this.getCurrentRound().timeLimit;
    }

    update(delta) {
        if (this.state === RACE_STATE.BRIEFING) {
            this.briefingTimer -= delta;
            if (this.briefingTimer <= 0) {
                this.briefingTimer = 0;
                this.state = RACE_STATE.PLAYING;
            }
            return;
        }

        if (this.state === RACE_STATE.PLAYING) {
            this.timeRemaining -= delta;
            if (this.timeRemaining <= 0) {
                this.timeRemaining = 0;
                this.failRound(RACE_FAIL_REASON.TIME);
            }
        }
    }

    markGoalReached() {
        if (this.state !== RACE_STATE.PLAYING) return;

        this.progress = 1;
        this.completeRound();
    }

    completeRound() {
        const round = this.getCurrentRound();
        if (!round) return;

        const ratio = round.timeLimit > 0 ? this.timeRemaining / round.timeLimit : 0;
        let stars = 1;
        if (ratio >= 0.45) stars = 3;
        else if (ratio >= 0.22) stars = 2;

        this.roundStars.push(stars);
        this.totalScore += Math.ceil(this.timeRemaining) + 10;
        this.state = RACE_STATE.ROUND_COMPLETE;
    }

    failRound(reason) {
        if (this.state !== RACE_STATE.PLAYING) return;
        this.failReason = reason;
        this.state = RACE_STATE.FAILED;
    }

    retryRound() {
        const round = this.getCurrentRound();
        if (!round) return;

        this.state = RACE_STATE.BRIEFING;
        this.briefingTimer = BRIEFING_DURATION;
        this.progress = 0;
        this.failReason = null;
        this.timeRemaining = round.timeLimit;
    }

    restart() {
        this.currentRoundIndex = -1;
        this.state = RACE_STATE.IDLE;
        this.progress = 0;
        this.timeRemaining = 0;
        this.briefingTimer = 0;
        this.roundStars = [];
        this.totalScore = 0;
        this.failReason = null;
    }

    getCurrentRound() {
        if (this.currentRoundIndex < 0 || this.currentRoundIndex >= ROUNDS.length) return null;
        return ROUNDS[this.currentRoundIndex];
    }

    getTotalRounds() {
        return ROUNDS.length;
    }

    getLastRoundStars() {
        return this.roundStars[this.roundStars.length - 1] || 0;
    }

    getTotalStars() {
        return this.roundStars.reduce((sum, stars) => sum + stars, 0);
    }

    getMaxStars() {
        return ROUNDS.length * 3;
    }

    isPlaying() {
        return this.state === RACE_STATE.PLAYING;
    }
}