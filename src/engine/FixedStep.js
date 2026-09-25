// Physics runs at 60 Hz even when the display only presents 10–30 frames/s.
// Long interruptions are bounded; explicit pauses reset the accumulator entirely.
export class FixedStep {
    constructor() { this.remainder = 0; }

    reset() { this.remainder = 0; }

    advance(elapsed, update) {
        const step = 1 / 60;
        this.remainder += Math.min(Math.max(elapsed, 0), 0.25);
        let advanced = 0;
        while (this.remainder + 1e-9 >= step) {
            this.remainder -= step;
            if (update(step) === false) { this.reset(); break; }
            advanced += step;
        }
        return advanced;
    }
}

export function uiDue(game, delta) {
    game.uiElapsed = (game.uiElapsed || 0) + delta;
    if (game.uiElapsed + 1e-9 < 0.1) return false;
    game.uiElapsed = Math.max(0, game.uiElapsed - 0.1);
    return true;
}
