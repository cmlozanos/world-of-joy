import * as THREE from 'three';
import { InputManager } from './engine/InputManager.js';
import { ThirdPersonCamera } from './engine/ThirdPersonCamera.js';
import { SoundManager } from './engine/SoundManager.js';
import { ParticleSystem } from './engine/ParticleSystem.js';
import { WordRoundManager, WORD_STATE } from './engine/WordRoundManager.js';
import { Character } from './entities/Character.js';
import { LetterManager } from './entities/LetterManager.js';
import { Room } from './world/Room.js';
import { WordHUD } from './ui/WordHUD.js';
import { MusicManager } from './engine/MusicManager.js';
import { TouchControls } from './engine/TouchControls.js';

export class WordGame {
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
        this.scene.background = new THREE.Color(0x404060);
        this.scene.fog = null; // No fog in a room

        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            200
        );
    }

    initLighting() {
        this.lights = {};

        this.lights.ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(this.lights.ambient);

        this.lights.directional = new THREE.DirectionalLight(0xffffff, 0.8);
        this.lights.directional.position.set(10, 20, 10);
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

        // Colorful point lights for atmosphere in larger room
        const colors = [0xff6688, 0x66aaff, 0x88ff66, 0xffcc44, 0xff66cc, 0x66ffdd];
        for (let i = 0; i < 8; i++) {
            const light = new THREE.PointLight(colors[i % colors.length], 0.5, 50);
            const angle = (i / 8) * Math.PI * 2;
            light.position.set(Math.cos(angle) * 25, 5, Math.sin(angle) * 25);
            this.scene.add(light);
        }
    }

    initModules() {
        this.input = new InputManager();
        this.sound = new SoundManager();
        this.room = new Room(this.scene);
        this.character = new Character(this.scene);
        this.letterManager = new LetterManager(this.scene);
        this.particles = new ParticleSystem(this.scene);
        this.cameraController = new ThirdPersonCamera(this.camera, this.character);
        this.hud = new WordHUD();
        this.music = new MusicManager();
        this.roundManager = new WordRoundManager();
        this.touchControls = TouchControls.isTouchDevice() ? new TouchControls(this.input) : null;
        this.footstepTimer = 0;
        this.lastJumpCount = 0;
        this.previousState = WORD_STATE.IDLE;
    }

    bindEvents() {
        this._resizeHandler = () => this.onResize();
        window.addEventListener('resize', this._resizeHandler);

        const nextRoundButton = document.getElementById('word-next-round-btn');
        if (nextRoundButton) {
            nextRoundButton.addEventListener('click', () => {
                this.roundManager.startNextRound();
            });
        } else {
            console.warn('Missing #word-next-round-btn button in word mode HUD');
        }

        const playAgainButton = document.getElementById('word-play-again-btn');
        if (playAgainButton) {
            playAgainButton.addEventListener('click', () => {
                this.roundManager.restart();
                this.roundManager.startNextRound();
            });
        } else {
            console.warn('Missing #word-play-again-btn button in word mode HUD');
        }

        const backButton = document.getElementById('word-back-btn');
        if (backButton) {
            backButton.addEventListener('click', () => {
                this.goToMenu();
            });
        } else {
            console.warn('Missing #word-back-btn button in word mode HUD');
        }
    }

    start() {
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('word-hud').style.display = 'block';

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
            case WORD_STATE.BRIEFING:
                this.setupRound(round);
                this.hud.showBriefing(round, totalRounds);
                this.sound.speakWord(round.word, { interrupt: true });
                if (this.touchControls) this.touchControls.hide();
                break;

            case WORD_STATE.PLAYING:
                this.hud.hideBriefing();
                this.hud.showGameplayUI(round, totalRounds);
                if (!this.music.isPlaying) this.music.start();
                if (this.touchControls) this.touchControls.show();
                break;

            case WORD_STATE.ROUND_COMPLETE:
                if (this.touchControls) this.touchControls.hide();
                this.hud.showRoundComplete(
                    this.roundManager.getLastRoundStars(),
                    this.roundManager.getTargetWord()
                );
                this.sound.speakWord(this.roundManager.getTargetWord());
                break;

            case WORD_STATE.VICTORY:
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

        this.letterManager.spawnLetters(round.word, this.room.getRoomBounds());
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
            this.letterManager.animate(delta);

            if (this.roundManager.state === WORD_STATE.BRIEFING) {
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

        // Determine the next expected letter
        const nextIndex = this.roundManager.collectedLetters.length;
        const expectedChar = nextIndex < round.word.length ? round.word[nextIndex] : null;

        this.letterManager.update(delta, this.character, expectedChar, (letter) => {
            this.roundManager.addCollectedLetter(letter.char);
            this.hud.updateWordDisplay(
                round.word,
                this.roundManager.collectedLetters
            );
            this.hud.showCollectMessage();
            this.sound.playFruitCollect();
            this.sound.speakLetter(letter.char);
            this.particles.emitFruitCollect(letter.group.position);
        });

        this.hud.updateWordDisplay(round.word, this.roundManager.collectedLetters);
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
        this.letterManager.reset();
        this.room.dispose();
    }
}
