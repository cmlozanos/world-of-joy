const NOTES = {
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0,
    A4: 440.0, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25,
    G3: 196.0, C3: 130.81, F3: 174.61, A3: 220.0,
};

// Cheerful melody patterns (relative degrees in C major)
const MELODY_PATTERNS = [
    ['C4', 'E4', 'G4', 'C5', 'G4', 'E4', 'C4', 'D4'],
    ['E4', 'G4', 'A4', 'G4', 'E4', 'D4', 'C4', 'E4'],
    ['C4', 'D4', 'E4', 'G4', 'A4', 'G4', 'E4', 'C4'],
    ['G4', 'E4', 'C4', 'D4', 'E4', 'G4', 'C5', 'G4'],
    ['A4', 'G4', 'E4', 'D4', 'C4', 'E4', 'G4', 'A4'],
    ['C5', 'B4', 'A4', 'G4', 'E4', 'D4', 'E4', 'G4'],
];

const BASS_PATTERNS = [
    ['C3', 'C3', 'G3', 'G3', 'A3', 'A3', 'G3', 'G3'],
    ['F3', 'F3', 'C3', 'C3', 'G3', 'G3', 'C3', 'C3'],
    ['C3', 'G3', 'A3', 'F3', 'C3', 'G3', 'C3', 'G3'],
];

const BPM = 120;
const BEAT_DURATION = 60 / BPM;

export class MusicManager {
    constructor() {
        this.ctx = null;
        this.isPlaying = false;
        this.masterGain = null;
        this.nextBeatTime = 0;
        this.currentBeat = 0;
        this.melodyPattern = 0;
        this.bassPattern = 0;
        this.schedulerInterval = null;
        this.volume = 0.08;
    }

    init(audioContext) {
        this.ctx = audioContext;
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.volume;
        this.masterGain.connect(this.ctx.destination);
    }

    start() {
        if (this.isPlaying || !this.ctx) return;
        this.isPlaying = true;
        this.nextBeatTime = this.ctx.currentTime + 0.1;
        this.currentBeat = 0;
        this.schedulerInterval = setInterval(() => this.schedule(), 100);
    }

    stop() {
        this.isPlaying = false;
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
            this.schedulerInterval = null;
        }
    }

    schedule() {
        if (!this.isPlaying || !this.ctx) return;

        // Schedule ahead by 200ms for smooth playback
        while (this.nextBeatTime < this.ctx.currentTime + 0.2) {
            this.playBeat(this.nextBeatTime);
            this.nextBeatTime += BEAT_DURATION;
            this.currentBeat++;

            // Change patterns every 8 beats
            if (this.currentBeat % 8 === 0) {
                this.melodyPattern = Math.floor(Math.random() * MELODY_PATTERNS.length);
                if (this.currentBeat % 16 === 0) {
                    this.bassPattern = Math.floor(Math.random() * BASS_PATTERNS.length);
                }
            }
        }
    }

    playBeat(time) {
        const beatIndex = this.currentBeat % 8;
        const melody = MELODY_PATTERNS[this.melodyPattern];
        const bass = BASS_PATTERNS[this.bassPattern];

        // Melody note (bright, short, xylophone-like)
        this.playMelodyNote(NOTES[melody[beatIndex]], time);

        // Bass note (on beats 0, 2, 4, 6)
        if (beatIndex % 2 === 0) {
            this.playBassNote(NOTES[bass[beatIndex]], time);
        }

        // Percussion on every beat
        this.playPercussion(time, beatIndex);
    }

    playMelodyNote(frequency, time) {
        if (!frequency) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Xylophone-like: sine + slight overtone
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, time);

        const noteLength = BEAT_DURATION * 0.7;
        gain.gain.setValueAtTime(0.12, time);
        gain.gain.exponentialRampToValueAtTime(0.04, time + noteLength * 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, time + noteLength);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(time);
        osc.stop(time + noteLength);

        // Overtone for brightness
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(frequency * 2, time);
        gain2.gain.setValueAtTime(0.03, time);
        gain2.gain.exponentialRampToValueAtTime(0.001, time + noteLength * 0.5);
        osc2.connect(gain2);
        gain2.connect(this.masterGain);
        osc2.start(time);
        osc2.stop(time + noteLength * 0.5);
    }

    playBassNote(frequency, time) {
        if (!frequency) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(frequency, time);

        const noteLength = BEAT_DURATION * 1.5;
        gain.gain.setValueAtTime(0.08, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + noteLength);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(time);
        osc.stop(time + noteLength);
    }

    playPercussion(time, beatIndex) {
        // Soft kick on beats 0, 4
        if (beatIndex === 0 || beatIndex === 4) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(80, time);
            osc.frequency.exponentialRampToValueAtTime(40, time + 0.08);
            gain.gain.setValueAtTime(0.1, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(time);
            osc.stop(time + 0.1);
        }

        // Hi-hat on every beat (noise-like)
        const bufferSize = this.ctx.sampleRate * 0.03;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.3;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const hihatGain = this.ctx.createGain();
        const hihatFilter = this.ctx.createBiquadFilter();
        hihatFilter.type = 'highpass';
        hihatFilter.frequency.value = 8000;

        hihatGain.gain.setValueAtTime(beatIndex % 2 === 0 ? 0.04 : 0.02, time);
        hihatGain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

        noise.connect(hihatFilter);
        hihatFilter.connect(hihatGain);
        hihatGain.connect(this.masterGain);
        noise.start(time);
    }

    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
    }
}
