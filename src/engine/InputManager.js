const TURN_SPEED = 2.5;

export class InputManager {
    constructor() {
        this.keys = {};
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

    get turnLeft() {
        return this.isKeyPressed('KeyA') || this.isKeyPressed('ArrowLeft');
    }

    get turnRight() {
        return this.isKeyPressed('KeyD') || this.isKeyPressed('ArrowRight');
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

    getTurnAmount(delta) {
        let turn = 0;
        if (this.turnLeft) turn += TURN_SPEED * delta;
        if (this.turnRight) turn -= TURN_SPEED * delta;
        return turn;
    }
}
