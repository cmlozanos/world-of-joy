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
            '¡Genial! ¡La fruta es súper saludable! 🍎',
            '¡Buen trabajo! ¡Las vitaminas te hacen fuerte! 💪',
            '¡Qué rico! ¡La naturaleza nos da los mejores snacks! 🌿',
            '¡Fantástico! ¡Comer fruta te hace más listo! 🧠',
            '¡Maravilloso! ¡Eres un campeón de la fruta! 🏆',
            '¡Increíble! ¡La fruta te da energía para jugar! ⚡',
            '¡Brillante! ¡Comida sana, cuerpo feliz! 😊',
            '¡Súper! ¡Cada fruta cuenta! ¡Sigue así! 🌟',
            '¡Wow! ¡Te estás cuidando muy bien! ❤️',
            '¡Excelente! ¡La fruta es un regalo de los árboles! 🌳',
            '¡Guay! ¡Compartir fruta hace feliz a todos! 🤗',
            '¡Buena captura! ¡La fruta fresca es la mejor! 🍊',
            '¡Así se hace! ¡Tu cuerpo te da las gracias! 🙌',
            '¡Perfecto! ¡La fruta es el dulce de la naturaleza! 🍬',
            '¡Hurra! ¡Sigue explorando y recolectando! 🗺️',
        ];

        this.waterMessages = [
            '¡Poder del agua! ¡Mantente hidratado! 💧',
            '¡Turbo activado! ¡El agua es vida! 🏃',
            '¡Splash! ¡El agua te hace más rápido! 🌊',
            '¡Héroe de la hidratación! ¡Corre como el viento! 💨',
            '¡Refrescante! ¡Tu cuerpo adora el agua! 💙',
            '¡Whoosh! ¡El agua te da superpoderes! ⚡',
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
