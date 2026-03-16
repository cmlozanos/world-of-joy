const JOYSTICK_RADIUS = 60;
const JOYSTICK_DEAD_ZONE = 0.15;

export class TouchControls {
    constructor(inputManager) {
        this.input = inputManager;
        this.visible = false;

        this.joystickActive = false;
        this.joystickTouchId = null;
        this.joystickOrigin = { x: 0, y: 0 };
        this.joystickOffset = { x: 0, y: 0 };

        this.jumpTouchId = null;
        this.runTouchId = null;

        this.buildDOM();
        this.bindEvents();
    }

    buildDOM() {
        this.container = document.createElement('div');
        this.container.id = 'touch-controls';

        // Joystick area (left side)
        this.joystickArea = document.createElement('div');
        this.joystickArea.id = 'joystick-area';

        this.joystickBase = document.createElement('div');
        this.joystickBase.id = 'joystick-base';

        this.joystickKnob = document.createElement('div');
        this.joystickKnob.id = 'joystick-knob';

        this.joystickBase.appendChild(this.joystickKnob);
        this.joystickArea.appendChild(this.joystickBase);

        // Action buttons (right side)
        this.buttonsArea = document.createElement('div');
        this.buttonsArea.id = 'touch-buttons';

        this.jumpBtn = document.createElement('div');
        this.jumpBtn.id = 'touch-jump';
        this.jumpBtn.className = 'touch-btn';
        this.jumpBtn.textContent = 'Saltar';

        this.runBtn = document.createElement('div');
        this.runBtn.id = 'touch-run';
        this.runBtn.className = 'touch-btn';
        this.runBtn.textContent = 'Correr';

        this.buttonsArea.appendChild(this.jumpBtn);
        this.buttonsArea.appendChild(this.runBtn);

        this.container.appendChild(this.joystickArea);
        this.container.appendChild(this.buttonsArea);

        document.getElementById('game-container').appendChild(this.container);
        this.setButtons();
    }

    bindEvents() {
        this.joystickArea.addEventListener('touchstart', (e) => this.onJoystickStart(e), { passive: false });
        this.joystickArea.addEventListener('touchmove', (e) => this.onJoystickMove(e), { passive: false });
        this.joystickArea.addEventListener('touchend', (e) => this.onJoystickEnd(e), { passive: false });
        this.joystickArea.addEventListener('touchcancel', (e) => this.onJoystickEnd(e), { passive: false });

        this.jumpBtn.addEventListener('touchstart', (e) => this.onJumpStart(e), { passive: false });
        this.jumpBtn.addEventListener('touchend', (e) => this.onJumpEnd(e), { passive: false });
        this.jumpBtn.addEventListener('touchcancel', (e) => this.onJumpEnd(e), { passive: false });

        this.runBtn.addEventListener('touchstart', (e) => this.onRunStart(e), { passive: false });
        this.runBtn.addEventListener('touchend', (e) => this.onRunEnd(e), { passive: false });
        this.runBtn.addEventListener('touchcancel', (e) => this.onRunEnd(e), { passive: false });
    }

    onJoystickStart(e) {
        e.preventDefault();
        if (this.joystickActive) return;

        const touch = e.changedTouches[0];
        this.joystickTouchId = touch.identifier;
        this.joystickActive = true;

        const rect = this.joystickArea.getBoundingClientRect();
        this.joystickOrigin.x = touch.clientX - rect.left;
        this.joystickOrigin.y = touch.clientY - rect.top;

        this.joystickBase.style.left = `${this.joystickOrigin.x - JOYSTICK_RADIUS}px`;
        this.joystickBase.style.top = `${this.joystickOrigin.y - JOYSTICK_RADIUS}px`;
        this.joystickBase.style.opacity = '1';
        this.joystickKnob.style.transform = 'translate(0, 0)';
    }

    onJoystickMove(e) {
        e.preventDefault();
        if (!this.joystickActive) return;

        const touch = this.findTouch(e.changedTouches, this.joystickTouchId);
        if (!touch) return;

        const rect = this.joystickArea.getBoundingClientRect();
        const dx = (touch.clientX - rect.left) - this.joystickOrigin.x;
        const dy = (touch.clientY - rect.top) - this.joystickOrigin.y;

        const distance = Math.min(Math.sqrt(dx * dx + dy * dy), JOYSTICK_RADIUS);
        const angle = Math.atan2(dy, dx);

        this.joystickOffset.x = (distance / JOYSTICK_RADIUS) * Math.cos(angle);
        this.joystickOffset.y = (distance / JOYSTICK_RADIUS) * Math.sin(angle);

        const knobX = distance * Math.cos(angle);
        const knobY = distance * Math.sin(angle);
        this.joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;

        this.updateInputFromJoystick();
    }

    onJoystickEnd(e) {
        e.preventDefault();
        const touch = this.findTouch(e.changedTouches, this.joystickTouchId);
        if (!touch && this.joystickActive) {
            this.resetJoystick();
            return;
        }
        if (touch) {
            this.resetJoystick();
        }
    }

    resetJoystick() {
        this.joystickActive = false;
        this.joystickTouchId = null;
        this.joystickOffset.x = 0;
        this.joystickOffset.y = 0;
        this.joystickKnob.style.transform = 'translate(0, 0)';
        this.joystickBase.style.opacity = '0.5';
        this.updateInputFromJoystick();
    }

    onJumpStart(e) {
        e.preventDefault();
        this.jumpTouchId = e.changedTouches[0].identifier;
        this.input.keys['Space'] = true;
        this.jumpBtn.classList.add('active');
    }

    onJumpEnd(e) {
        e.preventDefault();
        this.jumpTouchId = null;
        this.input.keys['Space'] = false;
        this.jumpBtn.classList.remove('active');
    }

    onRunStart(e) {
        e.preventDefault();
        this.runTouchId = e.changedTouches[0].identifier;
        this.input.keys['ShiftLeft'] = true;
        this.runBtn.classList.add('active');
    }

    onRunEnd(e) {
        e.preventDefault();
        this.runTouchId = null;
        this.input.keys['ShiftLeft'] = false;
        this.runBtn.classList.remove('active');
    }

    updateInputFromJoystick() {
        const ax = Math.abs(this.joystickOffset.x);
        const ay = Math.abs(this.joystickOffset.y);

        this.input.keys['KeyW'] = this.joystickOffset.y < -JOYSTICK_DEAD_ZONE;
        this.input.keys['KeyS'] = this.joystickOffset.y > JOYSTICK_DEAD_ZONE;
        this.input.keys['KeyA'] = this.joystickOffset.x < -JOYSTICK_DEAD_ZONE;
        this.input.keys['KeyD'] = this.joystickOffset.x > JOYSTICK_DEAD_ZONE;

        // Auto-run when joystick is near full tilt
        const magnitude = Math.sqrt(ax * ax + ay * ay);
        if (magnitude > 0.85 && !this.runTouchId) {
            this.input.keys['ShiftLeft'] = true;
        } else if (!this.runTouchId) {
            this.input.keys['ShiftLeft'] = false;
        }
    }

    findTouch(touchList, id) {
        for (let i = 0; i < touchList.length; i++) {
            if (touchList[i].identifier === id) return touchList[i];
        }
        return null;
    }

    setButtons({
        showJump = true,
        showRun = true,
        jumpLabel = 'Saltar',
        runLabel = 'Correr',
    } = {}) {
        this.jumpBtn.textContent = jumpLabel;
        this.runBtn.textContent = runLabel;
        this.jumpBtn.style.display = showJump ? 'flex' : 'none';
        this.runBtn.style.display = showRun ? 'flex' : 'none';
        this.buttonsArea.style.display = showJump || showRun ? 'flex' : 'none';

        if (!showJump) {
            this.jumpTouchId = null;
            this.input.keys.Space = false;
            this.jumpBtn.classList.remove('active');
        }

        if (!showRun) {
            this.runTouchId = null;
            this.input.keys.ShiftLeft = false;
            this.runBtn.classList.remove('active');
        }
    }

    show() {
        this.visible = true;
        this.container.style.display = 'flex';
    }

    hide() {
        this.visible = false;
        this.container.style.display = 'none';
    }

    static isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
}
