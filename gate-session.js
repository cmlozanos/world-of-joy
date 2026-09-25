(function () {
    'use strict';
    if (!window.LearningGate) { document.body.textContent = '↻ Recarga para cargar el reto'; return; }
    var locked = true, gate, games = [], timers = LearningGate.createTimers();
    timers.pause();
    function pauseGame(game) {
        if (game.fixedStep) game.fixedStep.reset();
        if (game.touchControls) game.touchControls.resetAllInputs();
        if (game.input) { game.input.keys = {}; game.input.setVirtualTurnAxis(0); }
        var audio = game.sound && game.sound.getAudioContext();
        game.learningAudioWasRunning = !!audio && (audio.state === 'running' || game.visibilityAudioWasRunning);
        if (game.learningAudioWasRunning) audio.suspend().catch(function () {});
    }
    var speechWasSpeaking = false, visibilitySpeechWasSpeaking = false;
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
            if (audio) { if (enabled && game.isRunning && !locked && !document.hidden) audio.resume().catch(function () {}); else audio.suspend().catch(function () {}); }
            if (!enabled) game.sound.cancelSpeech();
        });
    });
    document.addEventListener('visibilitychange', function () {
        games.forEach(function (game) {
            var audio = game.sound && game.sound.getAudioContext();
            if (!audio) return;
            if (document.hidden) {
                game.visibilityAudioWasRunning = audio.state === 'running';
                if (game.visibilityAudioWasRunning) audio.suspend().catch(function () {});
            } else {
                if (game.visibilityAudioWasRunning && game.isRunning && window.WorldLearning.soundEnabled && !locked) audio.resume().catch(function () {});
                game.visibilityAudioWasRunning = false;
            }
        });
        var speech = window.speechSynthesis;
        if (!speech) return;
        if (document.hidden) {
            visibilitySpeechWasSpeaking = speech.speaking && !speech.paused;
            if (visibilitySpeechWasSpeaking) speech.pause();
        } else {
            if (visibilitySpeechWasSpeaking && !locked && window.WorldLearning.soundEnabled) speech.resume();
            visibilitySpeechWasSpeaking = false;
        }
    });
    gate = LearningGate.mount({gameId:'world-of-joy',onLock:function () {
        locked = true; timers.pause(); games.forEach(pauseGame);
        var speech = window.speechSynthesis;
        speechWasSpeaking = !!speech && ((speech.speaking && !speech.paused) || visibilitySpeechWasSpeaking);
        if (speechWasSpeaking) speech.pause();
    },onUnlock:function () {
        locked = false; timers.resume();
        games.forEach(function (game) {
            if (game.clock) game.clock.getDelta();
            if (game.fixedStep) game.fixedStep.reset();
            if (window.WorldLearning.soundEnabled && game.isRunning && game.learningAudioWasRunning && game.sound) {
                if (document.hidden) game.visibilityAudioWasRunning = true;
                else game.sound.getAudioContext().resume().catch(function () {});
            }
        });
        if (speechWasSpeaking && window.WorldLearning.soundEnabled && window.speechSynthesis) {
            if (document.hidden) visibilitySpeechWasSpeaking = true;
            else window.speechSynthesis.resume();
        }
    }});
}());
