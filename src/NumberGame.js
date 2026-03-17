import * as THREE from 'three';
import { InputManager } from './engine/InputManager.js?v=20260317';
import { ThirdPersonCamera } from './engine/ThirdPersonCamera.js';
import { SoundManager } from './engine/SoundManager.js';
import { ParticleSystem } from './engine/ParticleSystem.js';
import { NumberRoundManager, NUMBER_STATE } from './engine/NumberRoundManager.js?v=20260317';
import { Character } from './entities/Character.js';
import { NumberManager } from './entities/NumberManager.js?v=20260317';
import { Room } from './world/Room.js';
import { NumberHUD } from './ui/NumberHUD.js?v=20260317';
import { MusicManager } from './engine/MusicManager.js';
import { TouchControls } from './engine/TouchControls.js?v=20260317';

const DIGIT_NAMES = {
    0: 'cero',
    1: 'uno',
    2: 'dos',
    3: 'tres',
    4: 'cuatro',
    5: 'cinco',
    6: 'seis',
    7: 'siete',
    8: 'ocho',
    9: 'nueve',
};

export class NumberGame {
    constructor(onBack, renderer) {
        this.onBack = onBack;
        this.canvas = document.getElementById('game-canvas');
        this.renderer = renderer;
        this.clock = new THREE.Clock();
        this.isRunning = false;
        this.initialized = false;

        this.initScene();
        this.initLighting();
        this.initModules();
        this.bindEvents();
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x243654);
        this.scene.fog = null;

        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            200
        );
    }

    initLighting() {
        this.lights = {};

        this.lights.ambient = new THREE.AmbientLight(0xffffff, 0.65);
        this.scene.add(this.lights.ambient);

        this.lights.directional = new THREE.DirectionalLight(0xffffff, 0.85);
        this.lights.directional.position.set(12, 20, 10);
        this.lights.directional.castShadow = true;
        this.lights.directional.shadow.mapSize.width = 1024;
        this.lights.directional.shadow.mapSize.height = 1024;
        this.lights.directional.shadow.camera.near = 0.5;
        this.lights.directional.shadow.camera.far = 80;
        this.lights.directional.shadow.camera.left = -50;
        this.lights.directional.shadow.camera.right = 50;
        this.lights.directional.shadow.camera.top = 50;
        this.lights.directional.shadow.camera.bottom = -50;
        this.scene.add(this.lights.directional);
        this.scene.add(this.lights.directional.target);

        const colors = [0xff8fab, 0x72ddf7, 0x95f9c3, 0xffd166, 0xcdb4ff, 0xa0c4ff];
        for (let index = 0; index < 8; index++) {
            const light = new THREE.PointLight(colors[index % colors.length], 0.55, 52);
            const angle = (index / 8) * Math.PI * 2;
            light.position.set(Math.cos(angle) * 26, 5, Math.sin(angle) * 26);
            this.scene.add(light);
        }
    }

    initModules() {
        this.input = new InputManager();
        this.sound = new SoundManager();
        this.room = new Room(this.scene);
        this.character = new Character(this.scene);
        this.numberManager = new NumberManager(this.scene);
        this.particles = new ParticleSystem(this.scene);
        this.cameraController = new ThirdPersonCamera(this.camera, this.character);
        this.hud = new NumberHUD();
        this.hud.setReplayHandler((speech) => {
            this.sound.speakText(speech, { interrupt: true, rate: 0.55 });
        });
        this.music = new MusicManager();
        this.roundManager = new NumberRoundManager();
        this.touchControls = TouchControls.isTouchDevice() ? new TouchControls(this.input) : null;
        this.footstepTimer = 0;
        this.lastJumpCount = 0;
        this.previousState = NUMBER_STATE.IDLE;

        if (this.touchControls) {
            this.touchControls.setButtons({ showJump: true, showRun: false, jumpLabel: 'Saltar' });
        }
    }

    bindEvents() {
        this._resizeHandler = () => this.onResize();
        window.addEventListener('resize', this._resizeHandler);

        const nextRoundButton = document.getElementById('number-next-round-btn');
        if (nextRoundButton) {
            nextRoundButton.addEventListener('click', () => {
                this.roundManager.startNextRound();
            });
        }

        const playAgainButton = document.getElementById('number-play-again-btn');
        if (playAgainButton) {
            playAgainButton.addEventListener('click', () => {
                this.roundManager.restart();
                this.roundManager.startNextRound();
            });
        }

        const backButton = document.getElementById('number-back-btn');
        if (backButton) {
            backButton.addEventListener('click', () => {
                this.goToMenu();
            });
        }
    }

    start() {
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('word-hud').style.display = 'none';
        document.getElementById('hud').style.display = 'none';
        this.hud.show();

        if (this.touchControls) {
            this.touchControls.setButtons({ showJump: true, showRun: false, jumpLabel: 'Saltar' });
        }

        if (this.initialized) {
            this.isRunning = true;
            this.clock.start();
            this.roundManager.restart();
            this.roundManager.startNextRound();
            this.onStateChanged(this.roundManager.state);
            this.previousState = this.roundManager.state;
            this.renderer.render(this.scene, this.camera);
            this.loop();
            return;
        }

        this.sound.init();
        this.room.generate();
        this.music.init(this.sound.getAudioContext());

        this.character.resetPosition();
        this.character.group.position.y = -0.26;
        this.cameraController.reset();

        this.initialized = true;
        this.isRunning = true;
        this.clock.start();

        this.roundManager.startNextRound();
        this.onStateChanged(this.roundManager.state);
        this.previousState = this.roundManager.state;
        this.renderer.render(this.scene, this.camera);

        if (this.touchControls) this.touchControls.show();
        this.loop();
    }

    stop() {
        this.isRunning = false;
        this.music.stop();
        this.sound.stopAmbient();
        this.sound.cancelSpeech();
        this.hud.hide();
        if (this.touchControls) this.touchControls.hide();
    }

    goToMenu() {
        this.stop();
        if (this.onBack) this.onBack();
    }

    onStateChanged(newState) {
        const round = this.roundManager.getCurrentRound();
        const totalRounds = this.roundManager.getTotalRounds();

        switch (newState) {
            case NUMBER_STATE.BRIEFING:
                this.setupRound(round);
                this.hud.showBriefing(round, totalRounds);
                this.sound.speakText(round.speech, { interrupt: true, rate: 0.55 });
                if (this.touchControls) this.touchControls.hide();
                break;

            case NUMBER_STATE.PLAYING:
                this.hud.hideBriefing();
                this.hud.showGameplayUI(round, totalRounds);
                if (!this.music.isPlaying) this.music.start();
                if (this.touchControls) this.touchControls.show();
                break;

            case NUMBER_STATE.ROUND_COMPLETE:
                if (this.touchControls) this.touchControls.hide();
                this.hud.showRoundComplete(
                    this.roundManager.getLastRoundStars(),
                    this.roundManager.getTargetExpression(),
                    this.roundManager.getTargetSpeech()
                );
                this.sound.speakText(this.roundManager.getTargetSpeech(), { rate: 0.55 });
                break;

            case NUMBER_STATE.VICTORY:
                if (this.touchControls) this.touchControls.hide();
                this.music.stop();
                this.hud.showVictory(
                    this.roundManager.getTotalStars(),
                    this.roundManager.getMaxStars(),
                    this.roundManager.totalScore
                );
                break;
        }
    }

    setupRound(round) {
        this.footstepTimer = 0;
        this.lastJumpCount = 0;

        this.character.resetPosition();
        this.character.group.position.y = -0.26;
        this.cameraController.reset();

        this.numberManager.spawnNumbers(round.collectSequence, this.room.getRoomBounds());
        this.hud.resetForNewRound();
    }

    loop() {
        if (!this.isRunning) return;
        requestAnimationFrame(() => this.loop());

        const delta = Math.min(this.clock.getDelta(), 0.05);

        this.roundManager.update(delta);

        if (this.roundManager.state !== this.previousState) {
            this.onStateChanged(this.roundManager.state);
            this.previousState = this.roundManager.state;
        }

        this.particles.update(delta);

        if (this.roundManager.isPlaying()) {
            this.updateGameplay(delta);
        } else {
            this.numberManager.animate(delta);

            if (this.roundManager.state === NUMBER_STATE.BRIEFING) {
                this.hud.updateBriefingCountdown(this.roundManager.briefingTimer);
                this.cameraController.update(delta, this.input);
            }
        }

        this.renderer.render(this.scene, this.camera);
    }

    updateGameplay(delta) {
        this.character.update(delta, this.input, this.room);
        this.cameraController.update(delta, this.input);

        this.updateFootsteps(delta);
        this.updateJumpSound();

        const round = this.roundManager.getCurrentRound();
        const nextIndex = this.roundManager.collectedNumbers.length;
        const expectedValue = nextIndex < round.collectSequence.length ? round.collectSequence[nextIndex] : null;

        this.numberManager.update(delta, this.character, expectedValue, (token) => {
            this.roundManager.addCollectedNumber(token.value);
            this.hud.updateEquationDisplay(round, this.roundManager.collectedNumbers);
            this.hud.showCollectMessage();
            this.sound.playFruitCollect();
            this.sound.speakText(DIGIT_NAMES[token.value] || token.value, {
                interrupt: true,
                rate: 0.58,
            });
            this.particles.emitFruitCollect(token.group.position);
        });

        this.hud.updateEquationDisplay(round, this.roundManager.collectedNumbers);
    }

    updateFootsteps(delta) {
        if (this.character.isMoving()) {
            this.footstepTimer -= delta;
            if (this.footstepTimer <= 0) {
                const isRunning = this.character.isBoosted() || this.input.run;
                this.sound.playFootstep(isRunning);
                this.footstepTimer = isRunning ? 0.25 : 0.4;
            }
        } else {
            this.footstepTimer = 0;
        }
    }

    updateJumpSound() {
        if (this.input.jump && this.character.jumpCount > this.lastJumpCount) {
            this.sound.playJump();
        }
        this.lastJumpCount = this.character.jumpCount;
        if (this.character.isGrounded) this.lastJumpCount = 0;
    }

    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        if (this.cameraController) this.cameraController.updateViewOffset();
    }

    dispose() {
        this.stop();
        window.removeEventListener('resize', this._resizeHandler);
        this.numberManager.reset();
        this.room.dispose();
    }
}