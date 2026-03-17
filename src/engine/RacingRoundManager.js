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
        description: 'Conduce hasta la meta por la carretera y mira los colores del camino.',
        icon: '🏁',
        target: 1,
        theme: 'morning',
        hint: '🏎️ Sigue la carretera y fíjate en las señales azul, roja y verde.',
        startProgress: 0.02,
        finishProgress: 0.15,
        timeLimit: 80,
        initialFuel: 105,
        fuelCanCount: 4,
        nitroCanCount: 2,
        lesson: {
            icon: '🎨',
            title: 'Colores del camino',
            coachText: 'Hoy aprendemos colores: azul, rojo y verde.',
            signs: [
                { icon: '⬤', label: 'AZUL', color: '#58b7ff', speech: 'azul', message: 'Azul como el cielo' },
                { icon: '■', label: 'ROJO', color: '#ff6b6b', speech: 'rojo', message: 'Rojo como una señal de parar' },
                { icon: '▲', label: 'VERDE', color: '#6be28b', speech: 'verde', message: 'Verde como la hierba' },
            ],
        },
    },
    {
        id: 2,
        name: 'Curvas del Valle',
        description: 'Recorre las curvas y reconoce formas mientras avanzas.',
        icon: '🛣️',
        target: 1,
        theme: 'forest',
        hint: '⛽ Reposta si lo necesitas y mira círculo, triángulo y cuadrado.',
        startProgress: 0.18,
        finishProgress: 0.34,
        timeLimit: 85,
        initialFuel: 100,
        fuelCanCount: 5,
        nitroCanCount: 2,
        lesson: {
            icon: '🔺',
            title: 'Formas divertidas',
            coachText: 'Busca círculo, triángulo y cuadrado mientras conduces.',
            signs: [
                { icon: '⬤', label: 'CÍRCULO', color: '#6fd3ff', speech: 'círculo', message: 'Eso es un círculo' },
                { icon: '▲', label: 'TRIÁNGULO', color: '#ffd166', speech: 'triángulo', message: 'Eso es un triángulo' },
                { icon: '■', label: 'CUADRADO', color: '#ff88c2', speech: 'cuadrado', message: 'Eso es un cuadrado' },
            ],
        },
    },
    {
        id: 3,
        name: 'Ruta del Sol',
        description: 'Cruza el tramo dorado y repasa las direcciones.',
        icon: '☀️',
        target: 1,
        theme: 'sunset',
        hint: '⚡ Usa el nitro en recta y recuerda izquierda, derecha y recto.',
        startProgress: 0.36,
        finishProgress: 0.52,
        timeLimit: 90,
        initialFuel: 102,
        fuelCanCount: 4,
        nitroCanCount: 3,
        lesson: {
            icon: '🧭',
            title: 'Direcciones',
            coachText: 'Hoy practicamos izquierda, derecha y recto.',
            signs: [
                { icon: '←', label: 'IZQUIERDA', color: '#58b7ff', speech: 'izquierda', message: 'Flecha hacia la izquierda' },
                { icon: '→', label: 'DERECHA', color: '#ff8c42', speech: 'derecha', message: 'Flecha hacia la derecha' },
                { icon: '↑', label: 'RECTO', color: '#6be28b', speech: 'recto', message: 'Recto hacia delante' },
            ],
        },
    },
    {
        id: 4,
        name: 'Niebla Rápida',
        description: 'La meta está lejos: aprende señales de seguridad durante el trayecto.',
        icon: '🌫️',
        target: 1,
        theme: 'misty',
        hint: '🏁 La brújula apunta a la meta. Mira las señales que invitan a ir despacio.',
        startProgress: 0.55,
        finishProgress: 0.72,
        timeLimit: 95,
        initialFuel: 98,
        fuelCanCount: 5,
        nitroCanCount: 3,
        lesson: {
            icon: '🛑',
            title: 'Seguridad vial',
            coachText: 'Aprendemos parar, despacio y atención.',
            signs: [
                { icon: 'STOP', label: 'PARAR', color: '#ff6b6b', speech: 'parar', message: 'STOP significa parar' },
                { icon: '30', label: 'DESPACIO', color: '#ffd166', speech: 'despacio', message: 'Despacio es más seguro' },
                { icon: '⚠', label: 'ATENCIÓN', color: '#5fa8ff', speech: 'atención', message: 'Atención a la carretera' },
            ],
        },
    },
    {
        id: 5,
        name: 'Circuito Cristal',
        description: 'Encadena gasolina y nitro mientras cuentas números sencillos.',
        icon: '💠',
        target: 1,
        theme: 'crystal',
        hint: '⛽ Si bajas de gasolina, reposta. También mira 1, 2 y 3 en los carteles.',
        startProgress: 0.75,
        finishProgress: 0.91,
        timeLimit: 90,
        initialFuel: 100,
        fuelCanCount: 5,
        nitroCanCount: 3,
        lesson: {
            icon: '🔢',
            title: 'Contar en carrera',
            coachText: 'Repasamos los números uno, dos y tres.',
            signs: [
                { icon: '1', label: 'UNO', color: '#58b7ff', speech: 'uno', message: 'Este es el número uno' },
                { icon: '2', label: 'DOS', color: '#ff8c42', speech: 'dos', message: 'Este es el número dos' },
                { icon: '3', label: 'TRES', color: '#9bde5a', speech: 'tres', message: 'Este es el número tres' },
            ],
        },
    },
    {
        id: 6,
        name: 'Gran Vuelta Dorada',
        description: 'Última carrera: completa el gran recorrido recordando palabras bonitas.',
        icon: '🌟',
        target: 1,
        theme: 'golden',
        hint: '🏆 Usa todo lo que recojas y mira estrellas, amigos y alegría en las señales.',
        startProgress: 0.93,
        finishProgress: 0.17,
        timeLimit: 110,
        initialFuel: 110,
        fuelCanCount: 6,
        nitroCanCount: 4,
        lesson: {
            icon: '🌟',
            title: 'Palabras felices',
            coachText: 'Terminamos con bravo, amigos y feliz.',
            signs: [
                { icon: '★', label: 'BRAVO', color: '#ffd166', speech: 'bravo', message: 'Bravo, lo estás haciendo genial' },
                { icon: '❤', label: 'AMIGOS', color: '#ff6b9a', speech: 'amigos', message: 'Los amigos ayudan y acompañan' },
                { icon: '☀', label: 'FELIZ', color: '#58b7ff', speech: 'feliz', message: 'Conducir tranquilo también es feliz' },
            ],
        },
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