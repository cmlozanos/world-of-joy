import * as THREE from 'three';

export class HUD {
    constructor() {
        this.collectedEl = document.getElementById('fruit-collected');
        this.remainingEl = document.getElementById('fruit-remaining');
        this.counterEl = document.getElementById('fruit-counter');
        this.instructionsEl = document.getElementById('instructions');
        this.boostBarContainer = document.getElementById('boost-bar-container');
        this.boostBar = document.getElementById('boost-bar');
        this.messageContainer = document.getElementById('message-container');
        this.maxBoostDuration = 6;
        this.messageQueue = [];
        this.isShowingMessage = false;

        this.fruitMessages = [
            'Awesome! Fruit is super healthy! 🍎',
            'Great job! Vitamins make you strong! 💪',
            'Yummy! Nature gives us the best snacks! 🌿',
            'Fantastic! Eating fruit makes you smarter! 🧠',
            'Wonderful! You are a fruit champion! 🏆',
            'Amazing! Fruit gives you energy to play! ⚡',
            'Brilliant! Healthy food, happy body! 😊',
            'Super! Every fruit counts! Keep going! 🌟',
            'Wow! You are taking care of yourself! ❤️',
            'Excellent! Fruit is a gift from trees! 🌳',
            'Cool! Sharing fruit makes everyone happy! 🤗',
            'Nice catch! Fresh fruit is the best! 🍊',
            'Way to go! Your body says thank you! 🙌',
            'Perfect! Fruit is nature\'s candy! 🍬',
            'Hooray! Keep exploring and collecting! 🗺️',
        ];

        this.waterMessages = [
            'Water power! Stay hydrated! 💧',
            'Speed boost! Water is life! 🏃',
            'Splash! Water makes you faster! 🌊',
            'Hydration hero! Run like the wind! 💨',
            'Refreshing! Your body loves water! 💙',
            'Whoosh! Water gives you superpowers! ⚡',
        ];

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

    updateBoost(timeRemaining) {
        if (timeRemaining > 0) {
            this.boostBarContainer.style.display = 'flex';
            const percent = (timeRemaining / this.maxBoostDuration) * 100;
            this.boostBar.style.width = `${percent}%`;
        } else {
            this.boostBarContainer.style.display = 'none';
        }
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

    showFruitMessage() {
        const msg = this.fruitMessages[Math.floor(Math.random() * this.fruitMessages.length)];
        this.queueMessage(msg);
    }

    showWaterMessage() {
        const msg = this.waterMessages[Math.floor(Math.random() * this.waterMessages.length)];
        this.queueMessage(msg);
    }

    queueMessage(text) {
        this.messageQueue.push(text);
        if (!this.isShowingMessage) {
            this.displayNextMessage();
        }
    }

    displayNextMessage() {
        if (this.messageQueue.length === 0) {
            this.isShowingMessage = false;
            return;
        }

        this.isShowingMessage = true;
        const text = this.messageQueue.shift();

        const el = document.createElement('div');
        el.className = 'game-message';
        el.textContent = text;
        this.messageContainer.appendChild(el);

        // Trigger entrance animation
        requestAnimationFrame(() => el.classList.add('visible'));

        setTimeout(() => {
            el.classList.remove('visible');
            el.classList.add('fade-out');
            setTimeout(() => {
                el.remove();
                this.displayNextMessage();
            }, 500);
        }, 2500);
    }
}
