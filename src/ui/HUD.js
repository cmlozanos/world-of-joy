import * as THREE from 'three';

export class HUD {
    constructor() {
        this.collectedEl = document.getElementById('fruit-collected');
        this.remainingEl = document.getElementById('fruit-remaining');
        this.counterEl = document.getElementById('fruit-counter');
        this.instructionsEl = document.getElementById('instructions');

        // Hide instructions after a few seconds
        setTimeout(() => {
            if (this.instructionsEl) {
                this.instructionsEl.style.opacity = '0';
            }
        }, 8000);
    }

    setTotalFruits(total) {
        this.remainingEl.textContent = total;
    }

    updateScore(collected, remaining) {
        this.collectedEl.textContent = collected;
        this.remainingEl.textContent = remaining;

        // Pulse animation on score change
        this.counterEl.style.transform = 'scale(1.2)';
        setTimeout(() => {
            this.counterEl.style.transform = 'scale(1)';
        }, 150);
    }

    showFruitPopup(fruit, camera, renderer) {
        const screenPos = this.worldToScreen(fruit.group.position, camera, renderer);
        if (!screenPos) return;

        const popup = document.createElement('div');
        popup.className = 'fruit-popup';
        popup.textContent = '+1';
        popup.style.left = `${screenPos.x}px`;
        popup.style.top = `${screenPos.y}px`;

        document.getElementById('game-container').appendChild(popup);

        setTimeout(() => popup.remove(), 1000);
    }

    worldToScreen(worldPos, camera, renderer) {
        const vector = worldPos.clone();
        vector.project(camera);

        if (vector.z > 1) return null;

        const canvas = renderer.domElement;
        return {
            x: (vector.x * 0.5 + 0.5) * canvas.clientWidth,
            y: (-vector.y * 0.5 + 0.5) * canvas.clientHeight,
        };
    }
}
