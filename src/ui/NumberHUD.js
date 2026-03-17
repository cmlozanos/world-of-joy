const NUMBER_COLORS = {
    0: '#ff6b6b',
    1: '#ff9f43',
    2: '#ffd166',
    3: '#06d6a0',
    4: '#4ecdc4',
    5: '#5fa8ff',
    6: '#6c5ce7',
    7: '#ff66c4',
    8: '#9bde5a',
    9: '#ffffff',
};

export class NumberHUD {
    constructor() {
        this.numberHud = document.getElementById('number-hud');
        this.roundInfo = document.getElementById('number-round-info');
        this.displayPanel = document.getElementById('number-display-panel');
        this.display = document.getElementById('number-display');
        this.replayButton = document.getElementById('number-replay-btn');
        this.messageContainer = document.getElementById('number-message-container');

        this.briefing = document.getElementById('number-briefing-screen');
        this.briefingRound = document.getElementById('number-briefing-round');
        this.briefingExpression = document.getElementById('number-briefing-expression');
        this.briefingHint = document.getElementById('number-briefing-hint');
        this.briefingCountdown = document.getElementById('number-briefing-countdown');

        this.complete = document.getElementById('number-complete-screen');
        this.completeStars = document.getElementById('number-complete-stars');
        this.completeExpression = document.getElementById('number-complete-expression');
        this.completeReplayButton = document.getElementById('number-complete-replay-btn');

        this.victory = document.getElementById('number-victory-screen');
        this.victoryStars = document.getElementById('number-victory-stars');
        this.victoryScore = document.getElementById('number-victory-score');

        this.messageQueue = [];
        this.isShowingMessage = false;
        this.currentReplayText = '';
        this.replayHandler = null;

        this.collectMessages = [
            '¡Número correcto! 🔢',
            '¡Muy bien! Esa cifra ayuda a resolverlo. ✨',
            '¡Genial! La operación ya casi está hecha. 🌟',
            '¡Bravo! Sigue buscando números. 🎯',
            '¡Buen trabajo! Cada número cuenta. 🧠',
        ];

        this.bindReplayButtons();
    }

    bindReplayButtons() {
        const replay = () => {
            if (!this.replayHandler || !this.currentReplayText) return;
            this.replayHandler(this.currentReplayText);
        };

        [this.replayButton, this.completeReplayButton].forEach((button) => {
            if (!button) return;
            button.addEventListener('click', replay);
        });

        this.updateReplayButtons();
    }

    setReplayHandler(handler) {
        this.replayHandler = handler;
        this.updateReplayButtons();
    }

    setReplayText(text) {
        this.currentReplayText = text || '';
        this.updateReplayButtons();
    }

    updateReplayButtons() {
        const disabled = !this.currentReplayText || !this.replayHandler;
        [this.replayButton, this.completeReplayButton].forEach((button) => {
            if (!button) return;
            button.disabled = disabled;
        });
    }

    show() {
        this.numberHud.style.display = 'block';
    }

    hide() {
        this.numberHud.style.display = 'none';
        this.hideDisplayPanel();
        this.hideAllOverlays();
    }

    showDisplayPanel() {
        this.displayPanel.style.display = 'flex';
    }

    hideDisplayPanel() {
        this.displayPanel.style.display = 'none';
    }

    setRoundInfo(roundNum, totalRounds) {
        this.roundInfo.textContent = `Ronda ${roundNum}/${totalRounds}`;
    }

    updateEquationDisplay(round, collectedNumbers) {
        this.display.innerHTML = '';
        let numberIndex = 0;

        for (const token of round.tokens) {
            const span = document.createElement('span');

            if (token.type === 'symbol') {
                span.className = 'number-symbol';
                span.textContent = token.value;
                this.display.appendChild(span);
                continue;
            }

            span.className = 'number-token';
            span.textContent = token.value;
            const color = NUMBER_COLORS[token.value] || '#ffffff';

            if (numberIndex < collectedNumbers.length) {
                span.classList.add('collected');
                span.style.color = color;
                span.style.textShadow = `0 0 12px ${color}`;
            } else if (numberIndex === collectedNumbers.length) {
                span.classList.add('next-number');
                span.style.color = color;
                span.style.textShadow = `0 0 18px ${color}`;
            } else {
                span.style.color = 'rgba(255,255,255,0.35)';
                span.style.textShadow = 'none';
            }

            numberIndex++;
            this.display.appendChild(span);
        }
    }

    showCollectMessage() {
        const message = this.collectMessages[Math.floor(Math.random() * this.collectMessages.length)];
        this.queueMessage(message);
    }

    queueMessage(text) {
        this.messageQueue.push(text);
        if (!this.isShowingMessage) this.displayNextMessage();
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

    showBriefing(round, totalRounds) {
        this.hideAllOverlays();
        this.hideDisplayPanel();
        this.setReplayText(round.speech);
        this.briefingRound.textContent = `Ronda ${round.id} / ${totalRounds}`;
        this.briefingExpression.textContent = round.expression;
        this.briefingHint.textContent = round.hint;
        this.briefing.style.display = 'flex';
    }

    updateBriefingCountdown(seconds) {
        this.briefingCountdown.textContent = Math.ceil(seconds);
    }

    hideBriefing() {
        this.briefing.style.display = 'none';
    }

    showGameplayUI(round, totalRounds) {
        this.hideAllOverlays();
        this.setRoundInfo(round.id, totalRounds);
        this.setReplayText(round.speech);
        this.showDisplayPanel();
        this.updateEquationDisplay(round, []);
    }

    showRoundComplete(stars, expression, speech) {
        this.hideAllOverlays();
        this.hideDisplayPanel();
        this.setReplayText(speech);
        this.completeStars.textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
        this.completeExpression.textContent = expression;
        this.complete.style.display = 'flex';
    }

    showVictory(totalStars, maxStars, totalScore) {
        this.hideAllOverlays();
        this.hideDisplayPanel();
        this.setReplayText('');
        this.victoryStars.textContent = `${totalStars} / ${maxStars} ⭐`;
        this.victoryScore.textContent = `Operaciones completadas: ${totalScore}`;
        this.victory.style.display = 'flex';
    }

    hideAllOverlays() {
        this.briefing.style.display = 'none';
        this.complete.style.display = 'none';
        this.victory.style.display = 'none';
    }

    resetForNewRound() {
        this.messageQueue = [];
        this.isShowingMessage = false;
        this.messageContainer.innerHTML = '';
    }
}