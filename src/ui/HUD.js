export class HUD {
    constructor() {
        this.collectedEl = document.getElementById('fruit-collected');
        this.remainingEl = document.getElementById('fruit-remaining');
        this.counterEl = document.getElementById('fruit-counter');
        this.instructionsEl = document.getElementById('instructions');
        this.boostBarContainer = document.getElementById('boost-bar-container');
        this.boostBar = document.getElementById('boost-bar');
        this.messageContainer = document.getElementById('message-container');
        this.compassLabel = document.getElementById('compass-label');

        // Round UI
        this.roundBar = document.getElementById('round-bar');
        this.roundNumberEl = document.getElementById('round-number');
        this.timerBar = document.getElementById('timer-bar-round');
        this.timerText = document.getElementById('timer-text');
        this.missionIconEl = document.getElementById('mission-icon');
        this.missionProgressEl = document.getElementById('mission-progress-text');

        // Overlays
        this.briefingScreen = document.getElementById('briefing-screen');
        this.briefingRoundNum = document.getElementById('briefing-round-num');
        this.briefingThemeName = document.getElementById('briefing-theme-name');
        this.briefingMissionText = document.getElementById('briefing-mission-text');
        this.briefingCountdown = document.getElementById('briefing-countdown');

        this.roundCompleteScreen = document.getElementById('round-complete-screen');
        this.starsDisplay = document.getElementById('stars-display');
        this.timeBonusText = document.getElementById('time-bonus-text');

        this.timeUpScreen = document.getElementById('time-up-screen');
        this.timeUpText = document.getElementById('time-up-text');

        this.briefingMissionHint = document.getElementById('briefing-mission-hint');
        this.missionHintBar = document.getElementById('mission-hint-bar');

        this.victoryScreen = document.getElementById('victory-screen');
        this.victoryStars = document.getElementById('victory-stars');
        this.victoryScoreText = document.getElementById('victory-score-text');

        this.maxBoostDuration = 6;
        this.messageQueue = [];
        this.isShowingMessage = false;

        this.fruitMessages = [
            '¡Genial! ¡La fruta es muy saludable! \u{1F34E}',
            '¡Buen trabajo! ¡Las vitaminas te hacen fuerte! \u{1F4AA}',
            '¡Rico! ¡La naturaleza nos da los mejores bocados! \u{1F33F}',
            '¡Fantástico! ¡Comer fruta te hace más listo! \u{1F9E0}',
            '¡Maravilloso! ¡Eres un campeón de la fruta! \u{1F3C6}',
            '¡Increíble! ¡La fruta te da energía para jugar! \u26A1',
            '¡Brillante! ¡Comida sana, cuerpo feliz! \u{1F60A}',
            '¡Súper! ¡Cada fruta cuenta! ¡Sigue así! \u{1F31F}',
            '¡Wow! ¡Te cuidas muy bien! \u2764\uFE0F',
            '¡Excelente! ¡La fruta es un regalo de los árboles! \u{1F333}',
            '¡Genial! ¡Compartir fruta hace feliz a todos! \u{1F917}',
            '¡Buena atrapada! ¡La fruta fresca es lo mejor! \u{1F34A}',
            '¡Así se hace! ¡Tu cuerpo te lo agradece! \u{1F64C}',
            '¡Perfecto! ¡La fruta es el dulce de la naturaleza! \u{1F36C}',
            '¡Hurra! ¡Sigue explorando y recolectando! \u{1F5FA}\uFE0F',
        ];

        this.waterMessages = [
            '¡Poder acuático! ¡Mantente hidratado! \u{1F4A7}',
            '¡Turbo activado! ¡El agua es vida! \u{1F3C3}',
            '¡Splash! ¡El agua te hace más rápido! \u{1F30A}',
            '¡Héroe de la hidratación! ¡Corre como el viento! \u{1F4A8}',
            '¡Refrescante! ¡Tu cuerpo ama el agua! \u{1F499}',
            '¡Whoosh! ¡El agua te da superpoderes! \u26A1',
        ];

        this.gemMessages = [
            '¡Gema encontrada! ¡Brilla como tú! \u{1F48E}',
            '¡Tesoro oculto descubierto! \u{1F3C6}',
            '¡Qué joya! ¡Sigue buscando! \u2728',
            '¡Gema mágica! ¡Eres un explorador nato! \u{1F30D}',
            '¡Cristal brillante! ¡Qué buen ojo! \u{1F440}',
        ];

        this.starMessages = [
            '¡Estrella atrapada! ¡Brillas mucho! \u2B50',
            '¡Estrella fugaz capturada! ¡Increíble! \u{1F320}',
            '¡Pide un deseo! ¡Estrella recogida! \u2728',
            '¡Atrapaste una estrella del cielo! \u{1F31F}',
            '¡Velocidad estelar! ¡Gran captura! \u{1F4AB}',
        ];

        this.ringMessages = [
            '¡A través del anillo! ¡Genial! \u2B55',
            '¡Vuelo perfecto! ¡Sigue así! \u{1F3AF}',
            '¡Anillo cruzado! ¡Eres imparable! \u{1F4A8}',
            '¡Por el aro! ¡Acrobacia aérea! \u{1F3C5}',
            '¡Ring completado! ¡Espectacular! \u26A1',
        ];
    }

    setTotalFruits(total) {
        this.remainingEl.textContent = total;
    }

    updateScore(collected, remaining) {
        this.collectedEl.textContent = collected;
        this.remainingEl.textContent = remaining;

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

    showFruitPopup() {
        const popup = document.createElement('div');
        popup.className = 'fruit-popup';
        popup.textContent = '+1';

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

    showGemMessage() {
        const msg = this.gemMessages[Math.floor(Math.random() * this.gemMessages.length)];
        this.queueMessage(msg);
    }

    showStarMessage() {
        const msg = this.starMessages[Math.floor(Math.random() * this.starMessages.length)];
        this.queueMessage(msg);
    }

    showRingMessage() {
        const msg = this.ringMessages[Math.floor(Math.random() * this.ringMessages.length)];
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

    // --- Round UI ---

    showBriefing(round, totalRounds, hint) {
        this.hideAllOverlays();
        this.roundBar.style.display = 'none';
        this.briefingRoundNum.textContent = `Ronda ${round.id} / ${totalRounds}`;
        this.briefingThemeName.textContent = round.name;
        this.briefingMissionText.textContent = round.description;
        this.briefingMissionHint.textContent = hint || '';
        this.briefingMissionHint.style.display = hint ? 'block' : 'none';
        this.briefingScreen.style.display = 'flex';
    }

    updateBriefingCountdown(seconds) {
        this.briefingCountdown.textContent = Math.ceil(seconds);
    }

    hideBriefing() {
        this.briefingScreen.style.display = 'none';
    }

    showGameplayUI(round, totalRounds, isTouchDevice = false, hint = '') {
        this.hideAllOverlays();
        this.roundBar.style.display = 'flex';
        this.roundNumberEl.textContent = `Ronda ${round.id}/${totalRounds}`;
        this.missionIconEl.textContent = round.icon;
        this.missionProgressEl.textContent = `0/${round.target}`;

        if (hint && this.missionHintBar) {
            this.missionHintBar.textContent = hint;
            this.missionHintBar.style.display = 'block';
            setTimeout(() => {
                if (this.missionHintBar) this.missionHintBar.style.display = 'none';
            }, 8000);
        }

        if (this.instructionsEl) {
            if (isTouchDevice) {
                this.instructionsEl.style.display = 'none';
            } else {
                this.instructionsEl.style.display = 'block';
                this.instructionsEl.style.opacity = '1';
                setTimeout(() => {
                    if (this.instructionsEl) this.instructionsEl.style.opacity = '0';
                }, 5000);
            }
        }
    }

    updateTimer(timeRemaining, timeLimit) {
        const percent = (timeRemaining / timeLimit) * 100;
        this.timerBar.style.width = `${percent}%`;
        this.timerText.textContent = Math.ceil(timeRemaining);

        if (timeRemaining <= 10) {
            this.timerBar.classList.add('timer-critical');
        } else {
            this.timerBar.classList.remove('timer-critical');
        }
    }

    updateMissionProgress(progress, target) {
        this.missionProgressEl.textContent = `${progress}/${target}`;
    }

    setCompassLabel(text) {
        if (this.compassLabel) {
            this.compassLabel.textContent = text;
        }
    }

    showRoundComplete(stars, timeRemaining) {
        this.hideAllOverlays();
        this.roundBar.style.display = 'none';
        this.starsDisplay.textContent = '\u2B50'.repeat(stars) + '\u2606'.repeat(3 - stars);
        this.timeBonusText.textContent = `Tiempo restante: ${Math.ceil(timeRemaining)}s`;
        this.roundCompleteScreen.style.display = 'flex';
    }

    showTimeUp(progress, target) {
        this.hideAllOverlays();
        this.roundBar.style.display = 'none';
        this.timeUpText.textContent = `Conseguiste ${progress} de ${target}`;
        this.timeUpScreen.style.display = 'flex';
    }

    showVictory(totalStars, maxStars, totalScore) {
        this.hideAllOverlays();
        this.roundBar.style.display = 'none';
        this.victoryStars.textContent = `${totalStars} / ${maxStars} \u2B50`;
        this.victoryScoreText.textContent = `Total recolectado: ${totalScore}`;
        this.victoryScreen.style.display = 'flex';
    }

    hideAllOverlays() {
        this.briefingScreen.style.display = 'none';
        this.roundCompleteScreen.style.display = 'none';
        this.timeUpScreen.style.display = 'none';
        this.victoryScreen.style.display = 'none';
        if (this.missionHintBar) this.missionHintBar.style.display = 'none';
    }

    resetForNewRound() {
        this.collectedEl.textContent = '0';
        this.messageQueue = [];
        this.isShowingMessage = false;
        this.messageContainer.innerHTML = '';
    }
}
