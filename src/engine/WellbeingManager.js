const REMINDER_AFTER_SECONDS = 8 * 60;
const BREAK_AFTER_SECONDS = 12 * 60;
const BREAK_DURATION_SECONDS = 45;

const BREAK_TIPS = [
    'Bebe un poco de agua.',
    'Mira a lo lejos unos segundos para descansar la vista.',
    'Estira brazos, espalda y piernas.',
    'Respira despacio tres veces.',
    'Habla con alguien o cambia de actividad un momento.',
];

class WellbeingManager {
    constructor() {
        this.activityLabel = '';
        this.onMandatoryBreak = null;
        this.playSecondsSinceBreak = 0;
        this.reminderShown = false;
        this.breakEndsAt = 0;
        this.breakInterval = null;
        this.chipTimeout = null;
        this.currentTipIndex = 0;
        this.elementsReady = false;
    }

    resolveElements() {
        if (this.elementsReady) return;

        this.chipEl = document.getElementById('wellbeing-chip');
        this.overlayEl = document.getElementById('wellbeing-overlay');
        this.titleEl = document.getElementById('wellbeing-title');
        this.textEl = document.getElementById('wellbeing-text');
        this.countdownEl = document.getElementById('wellbeing-countdown');
        this.tipEl = document.getElementById('wellbeing-tip');
        this.elementsReady = true;
    }

    beginActivity(activityLabel, onMandatoryBreak) {
        this.resolveElements();

        if (this.isBreakActive()) {
            this.showBreakOverlay();
            this.startBreakInterval();
            return false;
        }

        this.activityLabel = activityLabel;
        this.onMandatoryBreak = onMandatoryBreak;
        return true;
    }

    endActivity() {
        this.activityLabel = '';
        this.onMandatoryBreak = null;
        this.hideChip();
    }

    tick(delta) {
        if (!this.activityLabel || this.isBreakActive()) return false;

        this.playSecondsSinceBreak += delta;

        if (!this.reminderShown && this.playSecondsSinceBreak >= REMINDER_AFTER_SECONDS) {
            this.reminderShown = true;
            const minutesLeft = Math.max(
                1,
                Math.ceil((BREAK_AFTER_SECONDS - this.playSecondsSinceBreak) / 60)
            );
            this.showChip(`💛 En unos ${minutesLeft} min toca una pausa corta.`, 6500);
        }

        if (this.playSecondsSinceBreak >= BREAK_AFTER_SECONDS) {
            this.startMandatoryBreak();
            return true;
        }

        return false;
    }

    isBreakActive() {
        return this.breakEndsAt > Date.now();
    }

    startMandatoryBreak() {
        this.playSecondsSinceBreak = 0;
        this.reminderShown = false;
        this.breakEndsAt = Date.now() + BREAK_DURATION_SECONDS * 1000;
        this.currentTipIndex = Math.floor(Math.random() * BREAK_TIPS.length);
        this.hideChip();
        this.showBreakOverlay();
        this.startBreakInterval();

        const callback = this.onMandatoryBreak;
        this.activityLabel = '';
        this.onMandatoryBreak = null;

        if (callback) callback();
    }

    startBreakInterval() {
        if (this.breakInterval) return;

        const update = () => {
            if (!this.isBreakActive()) {
                this.breakEndsAt = 0;
                if (this.breakInterval) {
                    clearInterval(this.breakInterval);
                    this.breakInterval = null;
                }
                this.hideBreakOverlay();
                this.showChip('💚 Puedes volver cuando quieras. Mejor si has descansado de verdad.', 6000);
                return;
            }

            this.renderBreakState();
        };

        update();
        this.breakInterval = setInterval(update, 250);
    }

    renderBreakState() {
        this.resolveElements();
        if (!this.overlayEl) return;

        const remainingSeconds = Math.max(0, Math.ceil((this.breakEndsAt - Date.now()) / 1000));
        this.showBreakOverlay();

        if (this.titleEl) this.titleEl.textContent = 'Momento de descanso';
        if (this.textEl) {
            this.textEl.textContent = 'Jugar mejor también significa parar un rato y volver con energía.';
        }
        if (this.countdownEl) this.countdownEl.textContent = String(remainingSeconds);
        if (this.tipEl) {
            const tipIndex = Math.floor((BREAK_DURATION_SECONDS - remainingSeconds) / 12) % BREAK_TIPS.length;
            this.tipEl.textContent = BREAK_TIPS[(this.currentTipIndex + tipIndex) % BREAK_TIPS.length];
        }
    }

    showBreakOverlay() {
        this.resolveElements();
        if (this.overlayEl) this.overlayEl.style.display = 'flex';
    }

    hideBreakOverlay() {
        this.resolveElements();
        if (this.overlayEl) this.overlayEl.style.display = 'none';
    }

    showChip(text, duration = 5000) {
        this.resolveElements();
        if (!this.chipEl) return;

        if (this.chipTimeout) {
            clearTimeout(this.chipTimeout);
            this.chipTimeout = null;
        }

        this.chipEl.textContent = text;
        this.chipEl.style.display = 'block';

        if (duration > 0) {
            this.chipTimeout = setTimeout(() => this.hideChip(), duration);
        }
    }

    hideChip() {
        this.resolveElements();
        if (this.chipTimeout) {
            clearTimeout(this.chipTimeout);
            this.chipTimeout = null;
        }
        if (this.chipEl) this.chipEl.style.display = 'none';
    }
}

export const wellbeingManager = new WellbeingManager();