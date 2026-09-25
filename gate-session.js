(function () {
    'use strict';
    if (!window.LearningGate) { document.body.textContent = '↻ Recarga para cargar el reto'; return; }
    var locked = true, gate, games = [], timers = LearningGate.createTimers();
    timers.pause();
    function pauseGame(game) {
        if (game.touchControls) game.touchControls.resetAllInputs();
        if (game.input) { game.input.keys = {}; game.input.setVirtualTurnAxis(0); }
        var audio = game.sound && game.sound.getAudioContext();
        game.learningAudioWasRunning = !!audio && audio.state === 'running';
        if (game.learningAudioWasRunning) audio.suspend().catch(function () {});
    }
    var speechWasSpeaking = false;
    window.WorldLearning = {
        timers: timers,
        soundEnabled: false,
        attach: function (game) { games.push(game); if (game.sound) game.sound.enabled = window.WorldLearning.soundEnabled; if (locked) pauseGame(game); },
        blocked: function () { if (gate) gate.check(); return locked; }
    };
    var soundButton = document.getElementById('global-sound-btn');
    soundButton.addEventListener('click', function () {
        var enabled = !window.WorldLearning.soundEnabled;
        window.WorldLearning.soundEnabled = enabled;
        soundButton.textContent = enabled ? '🔊' : '🔇';
        soundButton.setAttribute('aria-pressed', String(enabled));
        soundButton.setAttribute('aria-label', enabled ? 'Desactivar sonido' : 'Activar sonido');
        soundButton.title = soundButton.getAttribute('aria-label');
        games.forEach(function (game) {
            if (!game.sound) return;
            game.sound.enabled = enabled;
            var audio = game.sound.getAudioContext();
            if (audio) { if (enabled && game.isRunning && !locked) audio.resume().catch(function () {}); else audio.suspend().catch(function () {}); }
            if (!enabled) game.sound.cancelSpeech();
        });
    });
    gate = LearningGate.mount({gameId:'world-of-joy',onLock:function () {
        locked = true; timers.pause(); games.forEach(pauseGame);
        var speech = window.speechSynthesis;
        speechWasSpeaking = !!speech && speech.speaking && !speech.paused;
        if (speechWasSpeaking) speech.pause();
    },onUnlock:function () {
        locked = false; timers.resume();
        games.forEach(function (game) {
            if (game.clock) game.clock.getDelta();
            if (window.WorldLearning.soundEnabled && game.learningAudioWasRunning && game.sound) game.sound.getAudioContext().resume().catch(function () {});
        });
        if (speechWasSpeaking && window.speechSynthesis) window.speechSynthesis.resume();
    }});
}());
