const TURN_SPEED = 2.5;

export class InputManager {
    constructor() {
        this.keys = {};
        this.virtualTurnAxis = 0;
        this.bindEvents();
    }

    bindEvents() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    isKeyPressed(code) {
        return !!this.keys[code];
    }

    get forward() {
        return this.isKeyPressed('KeyW') || this.isKeyPressed('ArrowUp');
    }

    get backward() {
        return this.isKeyPressed('KeyS') || this.isKeyPressed('ArrowDown');
    }

    getKeyboardTurnAxis() {
        let turnAxis = 0;
        if (this.isKeyPressed('KeyA') || this.isKeyPressed('ArrowLeft')) turnAxis += 1;
        if (this.isKeyPressed('KeyD') || this.isKeyPressed('ArrowRight')) turnAxis -= 1;
        return turnAxis;
    }

    getTurnAxis() {
        const keyboardTurnAxis = this.getKeyboardTurnAxis();
        if (keyboardTurnAxis !== 0) return keyboardTurnAxis;
        return this.virtualTurnAxis;
    }

    get turnLeft() {
        return this.getTurnAxis() > 0.15;
    }

    get turnRight() {
        return this.getTurnAxis() < -0.15;
    }

    get run() {
        return this.isKeyPressed('ShiftLeft') || this.isKeyPressed('ShiftRight');
    }

    get jump() {
        return this.isKeyPressed('Space');
    }

    get isMoving() {
        return this.forward || this.backward;
    }

    setVirtualTurnAxis(value) {
        this.virtualTurnAxis = Math.max(-1, Math.min(1, value));
    }

    getTurnAmount(delta) {
        return this.getTurnAxis() * TURN_SPEED * delta;
    }
}
