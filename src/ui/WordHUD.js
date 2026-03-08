const LETTER_COLORS = {
    A: '#ff4444', B: '#ffdd00', C: '#44cc44', D: '#ff8800',
    E: '#4488ff', F: '#ff44ff', G: '#00ccaa', H: '#cc44ff',
    I: '#ff6666', J: '#66ddff', K: '#ffaa44', L: '#88ff44',
    M: '#ff4488', N: '#44ffcc', O: '#ddaa00', P: '#aa66ff',
    Q: '#ff8866', R: '#44aaff', S: '#ffcc44', T: '#66ff88',
    U: '#dd66ff', V: '#44dddd', W: '#ffffff', X: '#ff6644',
    Y: '#aaff66', Z: '#6688ff',
};

export class WordHUD {
    constructor() {
        this.wordDisplay = document.getElementById('word-display');
        this.wordRoundInfo = document.getElementById('word-round-info');
        this.wordHud = document.getElementById('word-hud');
        this.wordMessageContainer = document.getElementById('word-message-container');
        this.wordBriefing = document.getElementById('word-briefing-screen');
        this.wordBriefingWord = document.getElementById('word-briefing-word');
        this.wordBriefingRound = document.getElementById('word-briefing-round');
        this.wordBriefingCountdown = document.getElementById('word-briefing-countdown');
        this.wordComplete = document.getElementById('word-complete-screen');
        this.wordCompleteStars = document.getElementById('word-complete-stars');
        this.wordCompleteWord = document.getElementById('word-complete-word');

        this.wordVictory = document.getElementById('word-victory-screen');
        this.wordVictoryStars = document.getElementById('word-victory-stars');
        this.wordVictoryScore = document.getElementById('word-victory-score');

        this.messageQueue = [];
        this.isShowingMessage = false;

        this.collectMessages = [
            '¡Muy bien! ¡Sigue así! 🌟',
            '¡Genial! ¡Esa letra era importante! ✨',
            '¡Fantástico! ¡Cada letra cuenta! 💫',
            '¡Increíble! ¡Vas formando la palabra! 🎯',
            '¡Buen ojo! ¡Sigue recogiendo! 🏆',
            '¡Bravo! ¡Eres un crack! ⭐',
        ];
    }

    show() {
        this.wordHud.style.display = 'block';
    }

    hide() {
        this.wordHud.style.display = 'none';
        this.hideAllOverlays();
    }

    updateWordDisplay(targetWord, collectedLetters) {
        this.wordDisplay.innerHTML = '';
        const nextIndex = collectedLetters.length;
        for (let i = 0; i < targetWord.length; i++) {
            const span = document.createElement('span');
            span.className = 'word-letter';
            const letter = targetWord[i];
            span.textContent = letter;
            if (i < nextIndex) {
                // Already collected
                span.classList.add('collected');
                span.style.color = LETTER_COLORS[letter] || '#fff';
                span.style.textShadow = `0 0 10px ${LETTER_COLORS[letter] || '#fff'}`;
            } else if (i === nextIndex) {
                // Next letter to find — highlighted and pulsing
                span.classList.add('next-letter');
                span.style.color = LETTER_COLORS[letter] || '#ffd700';
                span.style.textShadow = `0 0 16px ${LETTER_COLORS[letter] || '#ffd700'}`;
            } else {
                // Future letters — dimmed but visible
                span.style.color = 'rgba(255,255,255,0.35)';
                span.style.textShadow = 'none';
            }
            this.wordDisplay.appendChild(span);
        }
    }



    setRoundInfo(roundNum, totalRounds) {
        this.wordRoundInfo.textContent = `Ronda ${roundNum}/${totalRounds}`;
    }

    showCollectMessage() {
        const msg = this.collectMessages[Math.floor(Math.random() * this.collectMessages.length)];
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
        this.wordMessageContainer.appendChild(el);

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
        this.wordBriefingRound.textContent = `Ronda ${round.id} / ${totalRounds}`;
        this.wordBriefingWord.textContent = round.word.split('').join(' ');
        this.wordBriefing.style.display = 'flex';
    }

    _maskedWord(word) {
        return word.split('').map(() => '?').join(' ');
    }

    updateBriefingCountdown(seconds) {
        this.wordBriefingCountdown.textContent = Math.ceil(seconds);
    }

    hideBriefing() {
        this.wordBriefing.style.display = 'none';
    }

    showGameplayUI(round, totalRounds) {
        this.hideAllOverlays();
        this.setRoundInfo(round.id, totalRounds);
        this.updateWordDisplay(round.word, []);
    }

    showRoundComplete(stars, word) {
        this.hideAllOverlays();
        this.wordCompleteStars.textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
        this.wordCompleteWord.textContent = word;
        this.wordComplete.style.display = 'flex';
    }



    showVictory(totalStars, maxStars, totalScore) {
        this.hideAllOverlays();
        this.wordVictoryStars.textContent = `${totalStars} / ${maxStars} ⭐`;
        this.wordVictoryScore.textContent = `Palabras completadas: ${totalScore}`;
        this.wordVictory.style.display = 'flex';
    }

    hideAllOverlays() {
        this.wordBriefing.style.display = 'none';
        this.wordComplete.style.display = 'none';
        this.wordVictory.style.display = 'none';
    }

    resetForNewRound() {
        this.messageQueue = [];
        this.isShowingMessage = false;
        this.wordMessageContainer.innerHTML = '';
    }
}
