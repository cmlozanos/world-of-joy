import * as THREE from 'three';

export class ThirdPersonCamera {
    constructor(camera, character) {
        this.camera = camera;
        this.character = character;
        this.yaw = 0;
        this.currentPosition = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();
        this.smoothedY = 0;
        this.initialized = false;

        // Tunable parameters
        this.offsetX = 0;
        this.offsetY = 1.8;
        this.offsetZ = -7.6;
        this.lookAtX = 0;
        this.lookAtY = 0.8;
        this.lookAtZ = 0;
        this.pitch = 0.2;
        this.smoothing = 8;
        this.ySmoothing = 1.5;
        this.feetScreenOffset = 150; // pixels from bottom of screen

        // Jump zoom-out
        this.jumpExtraZ = -3.5;   // how much further back when airborne
        this.jumpExtraY = 1.5;    // how much higher when airborne
        this.jumpExtraPitch = 0.15; // extra pitch (look down) when airborne
        this.jumpTransitionSpeed = 3; // transition speed
        this.currentJumpFactor = 0;   // 0 = grounded, 1 = full jump offset

        // Debug panel
        this.debugEnabled = false;
        this.debugPanel = null;
        this._initDebugControls();
    }

    _initDebugControls() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'F9') {
                this.debugEnabled = !this.debugEnabled;
                if (this.debugEnabled) {
                    this._createDebugPanel();
                } else {
                    this._removeDebugPanel();
                }
            }
        });
    }

    _createDebugPanel() {
        if (this.debugPanel) return;

        const panel = document.createElement('div');
        panel.id = 'camera-debug-panel';
        panel.style.cssText = `
            position: fixed; top: 10px; right: 200px; z-index: 9999;
            background: rgba(0,0,0,0.85); color: #0f0; font-family: monospace;
            font-size: 13px; padding: 12px 16px; border-radius: 8px;
            border: 1px solid #0f0; pointer-events: auto; min-width: 280px;
        `;
        panel.innerHTML = `
            <div style="font-size:14px;font-weight:bold;margin-bottom:8px;color:#0f0;">
                📷 Cámara (F9 para cerrar)
            </div>
            <div style="font-size:11px;color:#aaa;margin-bottom:6px;">
                Usa los controles para ajustar. Copia los valores finales.
            </div>
        `;

        const params = [
            { key: 'offsetX',    label: 'Offset X',    min: -10, max: 10, step: 0.1 },
            { key: 'offsetY',    label: 'Offset Y',    min: -5,  max: 10, step: 0.1 },
            { key: 'offsetZ',    label: 'Offset Z',    min: -15, max: 0,  step: 0.1 },
            { key: 'lookAtX',    label: 'LookAt X',    min: -5,  max: 5,  step: 0.1 },
            { key: 'lookAtY',    label: 'LookAt Y',    min: -3,  max: 5,  step: 0.1 },
            { key: 'lookAtZ',    label: 'LookAt Z',    min: -5,  max: 10, step: 0.1 },
            { key: 'pitch',      label: 'Pitch',       min: -0.5,max: 0.5,step: 0.01 },
            { key: 'ySmoothing', label: 'Y Smooth',    min: 0.1, max: 10, step: 0.1 },
        ];

        this._sliders = {};

        for (const p of params) {
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;align-items:center;gap:6px;margin:3px 0;';

            const label = document.createElement('span');
            label.style.cssText = 'min-width:75px;font-size:12px;';
            label.textContent = p.label;

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = p.min;
            slider.max = p.max;
            slider.step = p.step;
            slider.value = this[p.key];
            slider.style.cssText = 'flex:1;accent-color:#0f0;';

            const val = document.createElement('span');
            val.style.cssText = 'min-width:45px;text-align:right;font-size:12px;';
            val.textContent = Number(this[p.key]).toFixed(2);

            slider.addEventListener('input', () => {
                this[p.key] = parseFloat(slider.value);
                val.textContent = Number(this[p.key]).toFixed(2);
            });

            this._sliders[p.key] = { slider, val };

            row.appendChild(label);
            row.appendChild(slider);
            row.appendChild(val);
            panel.appendChild(row);
        }

        // Copy button
        const copyBtn = document.createElement('button');
        copyBtn.textContent = '📋 Copiar valores';
        copyBtn.style.cssText = `
            margin-top: 8px; padding: 5px 12px; background: #0f0; color: #000;
            border: none; border-radius: 4px; cursor: pointer; font-weight: bold;
            font-size: 12px; width: 100%;
        `;
        copyBtn.addEventListener('click', () => {
            const text = `offsetX=${this.offsetX}, offsetY=${this.offsetY}, offsetZ=${this.offsetZ}, ` +
                `lookAtX=${this.lookAtX}, lookAtY=${this.lookAtY}, lookAtZ=${this.lookAtZ}, ` +
                `pitch=${this.pitch}, ySmoothing=${this.ySmoothing}`;
            navigator.clipboard.writeText(text);
            copyBtn.textContent = '✅ ¡Copiado!';
            setTimeout(() => copyBtn.textContent = '📋 Copiar valores', 1500);
        });
        panel.appendChild(copyBtn);

        document.body.appendChild(panel);
        this.debugPanel = panel;
    }

    _removeDebugPanel() {
        if (this.debugPanel) {
            this.debugPanel.remove();
            this.debugPanel = null;
            this._sliders = null;
        }
    }

    reset() {
        this.yaw = 0;

        // Immediately position camera at correct location
        const characterPosition = this.character.getPosition();
        this.smoothedY = characterPosition.y;

        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationFromEuler(
            new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ')
        );

        const cameraOffset = new THREE.Vector3(this.offsetX, this.offsetY, this.offsetZ);
        const offset = cameraOffset.applyMatrix4(rotationMatrix);
        this.currentPosition.copy(characterPosition).add(offset);

        const lookAtRotation = new THREE.Matrix4();
        lookAtRotation.makeRotationY(this.yaw);
        const lookAtOffset = new THREE.Vector3(this.lookAtX, this.lookAtY, this.lookAtZ);
        const rotatedLookAt = lookAtOffset.applyMatrix4(lookAtRotation);
        this.currentLookAt.copy(characterPosition).add(rotatedLookAt);

        this.camera.position.copy(this.currentPosition);
        this.camera.lookAt(this.currentLookAt);
        this.updateViewOffset();

        this.initialized = true;
    }

    updateViewOffset() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const yOffset = this.feetScreenOffset - height / 2;
        this.camera.setViewOffset(width, height, 0, yOffset, width, height);
    }

    update(delta, input) {
        this.yaw += input.getTurnAmount(delta);

        const characterPosition = this.character.getPosition();
        const isAirborne = !this.character.isGrounded;

        // Smoothly interpolate jump factor
        const targetJumpFactor = isAirborne ? 1 : 0;
        const jt = 1 - Math.exp(-this.jumpTransitionSpeed * delta);
        this.currentJumpFactor += (targetJumpFactor - this.currentJumpFactor) * jt;

        const currentPitch = this.pitch + this.jumpExtraPitch * this.currentJumpFactor;

        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationFromEuler(
            new THREE.Euler(currentPitch, this.yaw, 0, 'YXZ')
        );

        const tY = 1 - Math.exp(-this.ySmoothing * delta);
        if (!this.initialized) {
            this.smoothedY = characterPosition.y;
        } else {
            this.smoothedY += (characterPosition.y - this.smoothedY) * tY;
        }

        const smoothedCharPos = characterPosition.clone();
        smoothedCharPos.y = this.smoothedY;

        const cameraOffset = new THREE.Vector3(
            this.offsetX,
            this.offsetY + this.jumpExtraY * this.currentJumpFactor,
            this.offsetZ + this.jumpExtraZ * this.currentJumpFactor
        );
        const lookAtOffset = new THREE.Vector3(this.lookAtX, this.lookAtY, this.lookAtZ);

        const offset = cameraOffset.applyMatrix4(rotationMatrix);
        const targetPosition = smoothedCharPos.clone().add(offset);

        const lookAtRotation = new THREE.Matrix4();
        lookAtRotation.makeRotationY(this.yaw);
        const rotatedLookAt = lookAtOffset.applyMatrix4(lookAtRotation);
        const targetLookAt = smoothedCharPos.clone().add(rotatedLookAt);

        if (!this.initialized) {
            this.currentPosition.copy(targetPosition);
            this.currentLookAt.copy(targetLookAt);
            this.initialized = true;
        } else {
            const t = 1 - Math.exp(-this.smoothing * delta);
            this.currentPosition.lerp(targetPosition, t);
            this.currentLookAt.lerp(targetLookAt, t);
        }

        this.camera.position.copy(this.currentPosition);
        this.camera.lookAt(this.currentLookAt);
        this.updateViewOffset();

        this.character.setRotationY(this.yaw);
    }
}
