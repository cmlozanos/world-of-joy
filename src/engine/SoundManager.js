const AudioContext = window.AudioContext || window.webkitAudioContext;
const SpeechUtterance = window.SpeechSynthesisUtterance;

const SPANISH_LETTER_NAMES = {
    A: 'a',
    B: 'be',
    C: 'ce',
    D: 'de',
    E: 'e',
    F: 'efe',
    G: 'ge',
    H: 'hache',
    I: 'i',
    J: 'jota',
    K: 'ka',
    L: 'ele',
    M: 'eme',
    N: 'ene',
    '\u00D1': 'e\u00F1e',
    O: 'o',
    P: 'pe',
    Q: 'cu',
    R: 'erre',
    S: 'ese',
    T: 'te',
    U: 'u',
    V: 'uve',
    W: 'uve doble',
    X: 'equis',
    Y: 'ye',
    Z: 'zeta',
};

export class SoundManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.initialized = false;
        this.speech = typeof window !== 'undefined' ? window.speechSynthesis : null;
        this.speechVoice = null;
        this._voicesChangedHandler = () => {
            this.speechVoice = this.getPreferredSpanishVoice();
        };
    }

    init() {
        if (!this.ctx) {
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        if (!this.initialized) {
            this.initSpeech();
        }
        this.initialized = true;
    }

    getAudioContext() {
        return this.ctx;
    }

    initSpeech() {
        if (!this.speech || !SpeechUtterance) return;

        this.speechVoice = this.getPreferredSpanishVoice();

        if (typeof this.speech.addEventListener === 'function') {
            this.speech.addEventListener('voiceschanged', this._voicesChangedHandler);
        } else {
            this.speech.onvoiceschanged = this._voicesChangedHandler;
        }
    }

    getPreferredSpanishVoice() {
        if (!this.speech || typeof this.speech.getVoices !== 'function') return null;

        const voices = this.speech.getVoices();
        if (!voices.length) return null;

        const scoreVoice = (voice) => {
            const lang = (voice.lang || '').toLowerCase();
            const name = (voice.name || '').toLowerCase();
            let score = 0;

            if (lang === 'es-es') score += 100;
            else if (lang.startsWith('es-es')) score += 90;
            else if (lang.startsWith('es')) score += 50;

            if (name.includes('spain')) score += 20;
            if (name.includes('castell')) score += 20;
            if (name.includes('jorge')) score += 5;
            if (voice.default) score += 5;

            return score;
        };

        return [...voices]
            .filter((voice) => (voice.lang || '').toLowerCase().startsWith('es'))
            .sort((left, right) => scoreVoice(right) - scoreVoice(left))[0] || null;
    }

    createSpeechUtterance(text, options = {}) {
        if (!this.speech || !SpeechUtterance || !text) return null;

        if (!this.speechVoice) {
            this.speechVoice = this.getPreferredSpanishVoice();
        }

        const utterance = new SpeechUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = options.rate ?? 0.95;
        utterance.pitch = options.pitch ?? 1;
        utterance.volume = options.volume ?? 1;

        if (this.speechVoice) {
            utterance.voice = this.speechVoice;
            utterance.lang = this.speechVoice.lang || 'es-ES';
        }

        return utterance;
    }

    speakText(text, options = {}) {
        if (!this.enabled || !this.speech || !SpeechUtterance || !text) return;

        if (options.interrupt) {
            this.cancelSpeech();
        }

        const utterance = this.createSpeechUtterance(text, options);
        if (!utterance) return;

        this.speech.speak(utterance);
    }

    speakWord(word, options = {}) {
        if (!word) return;

        const normalizedWord = String(word).toLocaleLowerCase('es-ES');
        this.speakText(normalizedWord, {
            rate: 0.4,
            pitch: 1,
            ...options,
        });
    }

    speakLetter(letter, options = {}) {
        if (!letter) return;

        const rawLetter = String(letter).trim();
        if (!rawLetter) return;

        const upperLetter = rawLetter.toUpperCase();
        const baseLetter = upperLetter === '\u00D1'
            ? upperLetter
            : upperLetter.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const text = SPANISH_LETTER_NAMES[baseLetter] || rawLetter.toLocaleLowerCase('es-ES');

        this.speakText(text, {
            rate: 0.4,
            pitch: 1.05,
            ...options,
        });
    }

    cancelSpeech() {
        if (!this.speech) return;
        this.speech.cancel();
    }

    playNote(frequency, duration, type = 'sine', volume = 0.15) {
        if (!this.enabled || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    createOscillatorWithGain(type = 'sine') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        return { osc, gain };
    }

    playFruitCollect() {
        this.playNote(523, 0.1, 'sine', 0.12);
        setTimeout(() => this.playNote(659, 0.1, 'sine', 0.12), 60);
        setTimeout(() => this.playNote(784, 0.15, 'sine', 0.1), 120);
    }

    playWaterCollect() {
        this.playNote(440, 0.08, 'triangle', 0.1);
        setTimeout(() => this.playNote(587, 0.08, 'triangle', 0.1), 50);
        setTimeout(() => this.playNote(880, 0.2, 'triangle', 0.08), 100);
    }

    playFootstep(isRunning) {
        const freq = 80 + Math.random() * 30;
        const vol = isRunning ? 0.04 : 0.025;
        this.playNote(freq, 0.05, 'triangle', vol);
    }

    playJump() {
        if (!this.enabled || !this.ctx) return;

        const { osc, gain } = this.createOscillatorWithGain('sine');

        osc.frequency.setValueAtTime(250, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(500, this.ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    playAmbient() {
        if (!this.enabled || !this.ctx) return;
        this.ambientActive = true;

        const playBird = () => {
            if (!this.enabled || !this.ctx || !this.ambientActive) return;

            const baseFreq = 1200 + Math.random() * 800;
            const { osc, gain } = this.createOscillatorWithGain('sine');

            osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(
                baseFreq * (0.8 + Math.random() * 0.4),
                this.ctx.currentTime + 0.15
            );

            gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.2);

            this.ambientTimeout = setTimeout(playBird, 3000 + Math.random() * 8000);
        };

        this.ambientTimeout = setTimeout(playBird, 2000);
    }

    stopAmbient() {
        this.ambientActive = false;
        if (this.ambientTimeout) {
            clearTimeout(this.ambientTimeout);
            this.ambientTimeout = null;
        }
    }

    playBounce() {
        if (!this.enabled || !this.ctx) return;

        const { osc, gain } = this.createOscillatorWithGain('sine');

        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.1);
        osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    playGemCollect() {
        this.playNote(660, 0.1, 'sine', 0.12);
        setTimeout(() => this.playNote(880, 0.1, 'sine', 0.1), 50);
        setTimeout(() => this.playNote(1100, 0.15, 'sine', 0.08), 100);
        setTimeout(() => this.playNote(1320, 0.2, 'sine', 0.06), 150);
    }

    playStarCollect() {
        this.playNote(880, 0.08, 'sine', 0.12);
        setTimeout(() => this.playNote(1100, 0.08, 'sine', 0.1), 40);
        setTimeout(() => this.playNote(1320, 0.08, 'sine', 0.1), 80);
        setTimeout(() => this.playNote(1760, 0.2, 'triangle', 0.08), 120);
    }

    playRingPass() {
        if (!this.enabled || !this.ctx) return;

        const { osc, gain } = this.createOscillatorWithGain('sine');

        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.25);

        setTimeout(() => this.playNote(1000, 0.15, 'triangle', 0.08), 80);
    }
}
