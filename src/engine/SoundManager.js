const AudioContext = window.AudioContext || window.webkitAudioContext;

export class SoundManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        this.ctx = new AudioContext();
        this.initialized = true;
    }

    getAudioContext() {
        return this.ctx;
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

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(250, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(500, this.ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    playAmbient() {
        if (!this.enabled || !this.ctx) return;

        const playBird = () => {
            if (!this.enabled || !this.ctx) return;

            const baseFreq = 1200 + Math.random() * 800;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(
                baseFreq * (0.8 + Math.random() * 0.4),
                this.ctx.currentTime + 0.15
            );

            gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.2);

            setTimeout(playBird, 3000 + Math.random() * 8000);
        };

        setTimeout(playBird, 2000);
    }

    playBounce() {
        if (!this.enabled || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.1);
        osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }
}
