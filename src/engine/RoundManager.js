export const MISSION_TYPE = {
    FRUIT_RUSH: 'FRUIT_RUSH',
    BOUNCE_QUEST: 'BOUNCE_QUEST',
    HYDRATION_RUN: 'HYDRATION_RUN',
    SPEED_DASH: 'SPEED_DASH',
    GEM_HUNT: 'GEM_HUNT',
    STAR_CATCH: 'STAR_CATCH',
    RING_FLIGHT: 'RING_FLIGHT',
    GRAND_FINALE: 'GRAND_FINALE',
};

export const ROUND_STATE = {
    IDLE: 'IDLE',
    BRIEFING: 'BRIEFING',
    PLAYING: 'PLAYING',
    ROUND_COMPLETE: 'ROUND_COMPLETE',
    TIME_UP: 'TIME_UP',
    VICTORY: 'VICTORY',
};

export const MISSION_HINTS = {
    [MISSION_TYPE.FRUIT_RUSH]: '🍎 ¡Camina hacia las frutas brillantes para recogerlas! Sigue la flecha dorada.',
    [MISSION_TYPE.BOUNCE_QUEST]: '🔵 ¡Salta encima de los trampolines azules del suelo! Pulsa SALTAR cerca de ellos.',
    [MISSION_TYPE.HYDRATION_RUN]: '💧 ¡Camina hacia las botellas de agua azules para recogerlas! Te darán velocidad.',
    [MISSION_TYPE.SPEED_DASH]: '⚡ ¡Tienes supervelocidad! Recoge las frutas brillantes antes de que se acabe el tiempo.',
    [MISSION_TYPE.GEM_HUNT]: '💎 ¡Busca las gemas de colores escondidas por el mundo! Camina sobre ellas.',
    [MISSION_TYPE.STAR_CATCH]: '⭐ ¡Las estrellas caen del cielo! Corre hacia donde caen y tócalas.',
    [MISSION_TYPE.RING_FLIGHT]: '⭕ ¡Salta a través de los anillos flotantes! Usa doble salto para llegar alto.',
    [MISSION_TYPE.GRAND_FINALE]: '🌟 ¡Última ronda! Recoge todas las frutas brillantes que puedas. ¡Tú puedes!',
};

const ROUNDS = [
    {
        id: 1,
        name: 'Pradera Matutina',
        mission: MISSION_TYPE.FRUIT_RUSH,
        description: '¡Recoge 8 frutas!',
        icon: '🍎',
        target: 8,
        timeLimit: 75,
        theme: 'morning',
    },
    {
        id: 2,
        name: 'Bosque Denso',
        mission: MISSION_TYPE.BOUNCE_QUEST,
        description: '¡Salta en 5 trampolines!',
        icon: '🔵',
        target: 5,
        timeLimit: 75,
        theme: 'forest',
    },
    {
        id: 3,
        name: 'Valle del Atardecer',
        mission: MISSION_TYPE.HYDRATION_RUN,
        description: '¡Recoge 5 botellas de agua!',
        icon: '💧',
        target: 5,
        timeLimit: 75,
        theme: 'sunset',
    },
    {
        id: 4,
        name: 'Tierras Brumosas',
        mission: MISSION_TYPE.SPEED_DASH,
        description: '¡Recoge 10 frutas a toda velocidad!',
        icon: '⚡',
        target: 10,
        timeLimit: 90,
        theme: 'misty',
    },
    {
        id: 5,
        name: 'Cuevas Cristalinas',
        mission: MISSION_TYPE.GEM_HUNT,
        description: '¡Encuentra 6 gemas ocultas!',
        icon: '💎',
        target: 6,
        timeLimit: 80,
        theme: 'crystal',
    },
    {
        id: 6,
        name: 'Cielo Estrellado',
        mission: MISSION_TYPE.STAR_CATCH,
        description: '¡Atrapa 6 estrellas fugaces!',
        icon: '⭐',
        target: 6,
        timeLimit: 90,
        theme: 'starry',
    },
    {
        id: 7,
        name: 'Alturas Celestiales',
        mission: MISSION_TYPE.RING_FLIGHT,
        description: '¡Pasa por 8 anillos aéreos!',
        icon: '⭕',
        target: 8,
        timeLimit: 90,
        theme: 'aerial',
    },
    {
        id: 8,
        name: 'Hora Dorada',
        mission: MISSION_TYPE.GRAND_FINALE,
        description: '¡Recoge 15 frutas!',
        icon: '🌟',
        target: 15,
        timeLimit: 90,
        theme: 'golden',
    },
];

const BRIEFING_DURATION = 3;
const STARS_THRESHOLD_3 = 30;
const STARS_THRESHOLD_2 = 15;

export class RoundManager {
    constructor() {
        this.currentRoundIndex = -1;
        this.state = ROUND_STATE.IDLE;
        this.progress = 0;
        this.timeRemaining = 0;
        this.briefingTimer = 0;
        this.roundStars = [];
        this.totalScore = 0;
    }

    startNextRound() {
        this.currentRoundIndex++;
        if (this.currentRoundIndex >= ROUNDS.length) {
            this.state = ROUND_STATE.VICTORY;
            return;
        }
        this.state = ROUND_STATE.BRIEFING;
        this.briefingTimer = BRIEFING_DURATION;
        this.progress = 0;
        this.timeRemaining = this.getCurrentRound().timeLimit;
    }

    update(delta) {
        if (this.state === ROUND_STATE.BRIEFING) {
            this.briefingTimer -= delta;
            if (this.briefingTimer <= 0) {
                this.briefingTimer = 0;
                this.state = ROUND_STATE.PLAYING;
            }
        } else if (this.state === ROUND_STATE.PLAYING) {
            this.timeRemaining -= delta;
            if (this.timeRemaining <= 0) {
                this.timeRemaining = 0;
                this.state = ROUND_STATE.TIME_UP;
            }
        }
    }

    addProgress(amount = 1) {
        if (this.state !== ROUND_STATE.PLAYING) return;
        this.progress += amount;
        if (this.progress >= this.getCurrentRound().target) {
            this.progress = this.getCurrentRound().target;
            this.completeRound();
        }
    }

    completeRound() {
        let stars = 1;
        if (this.timeRemaining >= STARS_THRESHOLD_3) stars = 3;
        else if (this.timeRemaining >= STARS_THRESHOLD_2) stars = 2;
        this.roundStars.push(stars);
        this.totalScore += this.progress;
        this.state = ROUND_STATE.ROUND_COMPLETE;
    }

    retryRound() {
        this.state = ROUND_STATE.BRIEFING;
        this.briefingTimer = BRIEFING_DURATION;
        this.progress = 0;
        this.timeRemaining = this.getCurrentRound().timeLimit;
    }

    restart() {
        this.currentRoundIndex = -1;
        this.state = ROUND_STATE.IDLE;
        this.progress = 0;
        this.timeRemaining = 0;
        this.briefingTimer = 0;
        this.roundStars = [];
        this.totalScore = 0;
    }

    getCurrentRound() {
        if (this.currentRoundIndex < 0 || this.currentRoundIndex >= ROUNDS.length) return null;
        return ROUNDS[this.currentRoundIndex];
    }

    getCurrentRoundNumber() {
        return this.currentRoundIndex + 1;
    }

    getTotalStars() {
        return this.roundStars.reduce((sum, s) => sum + s, 0);
    }

    getMaxStars() {
        return ROUNDS.length * 3;
    }

    getTotalRounds() {
        return ROUNDS.length;
    }

    getLastRoundStars() {
        return this.roundStars[this.roundStars.length - 1] || 0;
    }

    isPlaying() {
        return this.state === ROUND_STATE.PLAYING;
    }

    isFruitMission() {
        const round = this.getCurrentRound();
        if (!round) return false;
        return [MISSION_TYPE.FRUIT_RUSH, MISSION_TYPE.SPEED_DASH, MISSION_TYPE.GRAND_FINALE].includes(round.mission);
    }
}
