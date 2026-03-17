import * as THREE from 'three';
import { InputManager } from './engine/InputManager.js?v=20260317';
import { ThirdPersonCamera } from './engine/ThirdPersonCamera.js';
import { SoundManager } from './engine/SoundManager.js';
import { ParticleSystem } from './engine/ParticleSystem.js';
import { RoundManager, ROUND_STATE, MISSION_TYPE, MISSION_HINTS } from './engine/RoundManager.js';
import { ScenarioTheme } from './engine/ScenarioTheme.js';
import { Character } from './entities/Character.js';
import { World } from './world/World.js';
import { FruitManager } from './entities/FruitManager.js';
import { WaterBottleManager } from './entities/WaterBottleManager.js';
import { Wildlife } from './entities/Wildlife.js';
import { TrampolineManager } from './entities/TrampolineManager.js';
import { GemManager } from './entities/GemManager.js';
import { ShootingStarManager } from './entities/ShootingStarManager.js';
import { SkyRingManager } from './entities/SkyRingManager.js';
import { HUD } from './ui/HUD.js?v=20260317';
import { Minimap } from './ui/Minimap.js';
import { Compass } from './ui/Compass.js';
import { MusicManager } from './engine/MusicManager.js';
import { TouchControls } from './engine/TouchControls.js?v=20260317';

import { WordGame } from './WordGame.js?v=20260317';
import { RacingGame } from './RacingGame.js?v=20260317';
import { NumberGame } from './NumberGame.js?v=20260317';

const COMPASS_LABELS = {
    [MISSION_TYPE.FRUIT_RUSH]: '\u{1F34E} Fruta m\u00e1s cercana',
    [MISSION_TYPE.BOUNCE_QUEST]: '\u{1F539} Trampol\u00edn m\u00e1s cercano',
    [MISSION_TYPE.HYDRATION_RUN]: '\u{1F4A7} Botella m\u00e1s cercana',
    [MISSION_TYPE.SPEED_DASH]: '\u26A1 Fruta m\u00e1s cercana',
    [MISSION_TYPE.GEM_HUNT]: '\u{1F48E} Gema m\u00e1s cercana',
    [MISSION_TYPE.STAR_CATCH]: '\u2B50 Estrella m\u00e1s cercana',
    [MISSION_TYPE.RING_FLIGHT]: '\u2B55 Anillo m\u00e1s cercano',
    [MISSION_TYPE.GRAND_FINALE]: '\u{1F31F} Fruta m\u00e1s cercana',
};

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.clock = new THREE.Clock();
        this.isRunning = false;
        this.roundScore = 0;
        this.worldGenerated = false;

        this.initRenderer();
        this.initScene();
        this.initLighting();
        this.initModules();
        this.bindEvents();
    }

    initRenderer() {
        this.isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: !this.isMobile,
            powerPreference: 'high-performance',
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isMobile ? 1.5 : 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.0025);

        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            600
        );
    }

    initLighting() {
        this.lights = {};

        this.lights.ambient = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(this.lights.ambient);

        this.lights.directional = new THREE.DirectionalLight(0xfff4e0, 1.2);
        this.lights.directional.position.set(50, 80, 30);
        this.lights.directional.castShadow = true;
        this.lights.directional.shadow.mapSize.width = 1024;
        this.lights.directional.shadow.mapSize.height = 1024;
        this.lights.directional.shadow.camera.near = 0.5;
        this.lights.directional.shadow.camera.far = 150;
        this.lights.directional.shadow.camera.left = -30;
        this.lights.directional.shadow.camera.right = 30;
        this.lights.directional.shadow.camera.top = 30;
        this.lights.directional.shadow.camera.bottom = -30;
        this.scene.add(this.lights.directional);
        this.scene.add(this.lights.directional.target);

        this.lights.hemisphere = new THREE.HemisphereLight(0x87ceeb, 0x556b2f, 0.4);
        this.scene.add(this.lights.hemisphere);
    }

    initModules() {
        this.input = new InputManager();
        this.sound = new SoundManager();
        this.world = new World(this.scene);
        this.character = new Character(this.scene);
        this.fruitManager = new FruitManager(this.scene);
        this.waterBottleManager = new WaterBottleManager(this.scene);
        this.wildlife = new Wildlife(this.scene);
        this.trampolineManager = new TrampolineManager(this.scene);
        this.gemManager = new GemManager(this.scene);
        this.shootingStarManager = new ShootingStarManager(this.scene);
        this.skyRingManager = new SkyRingManager(this.scene);
        this.particles = new ParticleSystem(this.scene);
        this.cameraController = new ThirdPersonCamera(this.camera, this.character);
        this.hud = new HUD();
        this.minimap = new Minimap();
        this.compass = new Compass();
        this.music = new MusicManager();
        this.roundManager = new RoundManager();
        this.scenarioTheme = new ScenarioTheme();
        this.touchControls = TouchControls.isTouchDevice() ? new TouchControls(this.input) : null;
        this.footstepTimer = 0;
        this.lastJumpCount = 0;
        this.previousRoundState = ROUND_STATE.IDLE;
    }

    bindEvents() {
        window.addEventListener('resize', () => this.onResize());

        document.getElementById('start-button').addEventListener('click', () => {
            this.startGame();
        });

        this.bindHudHandlers();
    }

    bindHudHandlers() {
        document.getElementById('next-round-btn').onclick = () => {
            if (!this.music.isPlaying) this.music.start();
            this.roundManager.startNextRound();
        };

        document.getElementById('retry-btn').onclick = () => {
            this.roundManager.retryRound();
            this.music.start();
        };

        document.getElementById('finish-btn').onclick = () => {
            this.goToStartScreen();
        };

        document.getElementById('play-again-btn').onclick = () => {
            this.roundManager.restart();
            this.music.start();
            this.roundManager.startNextRound();
        };
    }

    startGame() {
        this.bindHudHandlers();
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('word-hud').style.display = 'none';
        document.getElementById('number-hud').style.display = 'none';

        if (this.worldGenerated) {
            document.getElementById('hud').style.display = 'block';
            if (this.touchControls) this.touchControls.show();
            this.sound.playAmbient();
            this.music.start();
            this.isRunning = true;
            this.clock.start();
            this.roundManager.startNextRound();
            this.onRoundStateChanged(this.roundManager.state);
            this.previousRoundState = this.roundManager.state;
            this.renderer.render(this.scene, this.camera);
            this.loop();
            return;
        }

        document.getElementById('loading-screen').style.display = 'flex';
        this.sound.init();

        requestAnimationFrame(() => {
            this.world.generate(() => {
                this.worldGenerated = true;
                this.wildlife.spawn(this.world);
                this.trampolineManager.spawn(this.world);
                this.skyRingManager.spawn(this.world);

                document.getElementById('loading-screen').style.display = 'none';
                document.getElementById('hud').style.display = 'block';

                if (this.touchControls) {
                    this.touchControls.show();
                }

                this.sound.playAmbient();
                this.music.init(this.sound.getAudioContext());
                this.music.start();
                this.isRunning = true;
                this.clock.start();

                this.roundManager.startNextRound();
                this.onRoundStateChanged(this.roundManager.state);
                this.previousRoundState = this.roundManager.state;
                this.renderer.render(this.scene, this.camera);
                this.loop();
            });
        });
    }

    onRoundStateChanged(newState) {
        const round = this.roundManager.getCurrentRound();
        const totalRounds = this.roundManager.getTotalRounds();
        const hint = round ? MISSION_HINTS[round.mission] : '';

        switch (newState) {
            case ROUND_STATE.BRIEFING:
                this.setupRound(round);
                this.scenarioTheme.apply(round.theme, this.scene, this.lights);
                this.hud.setCounterIcon('🍎');
                this.hud.setBoostTheme({
                    icon: '💧',
                    startColor: '#0288d1',
                    endColor: '#4fc3f7',
                    borderColor: 'rgba(79, 195, 247, 0.4)',
                    maxDuration: 6,
                });
                this.hud.setInstructions([
                    'W/↑ - Avanzar | S/↓ - Retroceder | A/← D/→ - Girar',
                    'SHIFT - Correr | ESPACIO - Saltar',
                ]);
                this.hud.hideLessonChip();
                this.hud.showBriefing(round, totalRounds, hint);
                this.hud.setCompassLabel(COMPASS_LABELS[round.mission]);
                if (this.touchControls) this.touchControls.hide();
                break;

            case ROUND_STATE.PLAYING:
                this.hud.hideBriefing();
                this.hud.showGameplayUI(round, totalRounds, !!this.touchControls, hint);
                if (this.touchControls) this.touchControls.show();
                if (round.mission === MISSION_TYPE.SPEED_DASH) {
                    this.character.applySpeedBoost(round.timeLimit, 1.8);
                }
                break;

            case ROUND_STATE.ROUND_COMPLETE:
                if (this.touchControls) this.touchControls.hide();
                this.hud.showRoundComplete(
                    this.roundManager.getLastRoundStars(),
                    this.roundManager.timeRemaining
                );
                break;

            case ROUND_STATE.TIME_UP:
                if (this.touchControls) this.touchControls.hide();
                this.music.stop();
                this.hud.showTimeUp(this.roundManager.progress, round.target);
                break;

            case ROUND_STATE.VICTORY:
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
        this.roundScore = 0;
        this.footstepTimer = 0;
        this.lastJumpCount = 0;

        this.character.resetPosition();
        this.character.group.position.y = this.world.getHeightAt(0, 0) - 0.26;

        this.cameraController.reset();

        this.fruitManager.reset();
        this.fruitManager.spawnFruits(this.world.getTreePositions(), this.world);
        this.hud.setTotalFruits(this.fruitManager.getTotalFruits());

        this.waterBottleManager.reset();
        this.waterBottleManager.spawn(this.world);

        this.gemManager.reset();
        this.gemManager.spawn(this.world);

        this.shootingStarManager.reset();
        if (round.mission === MISSION_TYPE.STAR_CATCH) {
            this.shootingStarManager.init(this.world);
        }

        this.skyRingManager.reset();
        if (round.mission === MISSION_TYPE.RING_FLIGHT) {
            this.skyRingManager.spawn(this.world);
        }

        // Hide all beacons, then show only mission-relevant ones
        this.fruitManager.setBeaconsVisible(false);
        this.waterBottleManager.setBeaconsVisible(false);
        this.gemManager.setBeaconsVisible(false);
        this.trampolineManager.setBeaconsVisible(false);

        switch (round.mission) {
            case MISSION_TYPE.FRUIT_RUSH:
            case MISSION_TYPE.SPEED_DASH:
            case MISSION_TYPE.GRAND_FINALE:
                this.fruitManager.setBeaconsVisible(true);
                break;
            case MISSION_TYPE.HYDRATION_RUN:
                this.waterBottleManager.setBeaconsVisible(true);
                break;
            case MISSION_TYPE.BOUNCE_QUEST:
                this.trampolineManager.setBeaconsVisible(true);
                break;
            case MISSION_TYPE.GEM_HUNT:
                this.gemManager.setBeaconsVisible(true);
                break;
        }

        this.hud.resetForNewRound();
    }

    loop() {
        if (!this.isRunning) return;
        requestAnimationFrame(() => this.loop());

        const delta = Math.min(this.clock.getDelta(), 0.05);

        this.roundManager.update(delta);

        if (this.roundManager.state !== this.previousRoundState) {
            this.onRoundStateChanged(this.roundManager.state);
            this.previousRoundState = this.roundManager.state;
        }

        // Always keep visuals alive
        this.wildlife.update(delta, this.world);
        this.particles.update(delta);

        if (this.roundManager.isPlaying()) {
            this.updateGameplay(delta);
        } else {
            // Animate collectibles even when not playing (visual polish)
            this.fruitManager.animate(delta);
            this.waterBottleManager.animate(delta);
            this.trampolineManager.animate(delta);
            this.gemManager.animate(delta);
            this.skyRingManager.animate(delta);

            if (this.roundManager.state === ROUND_STATE.BRIEFING) {
                this.hud.updateBriefingCountdown(this.roundManager.briefingTimer);
                this.cameraController.update(delta, this.input);
            }
        }

        this.hud.updateBoost(this.character.getBoostTimeRemaining());
        this.updateShadowCamera();
        this.renderer.render(this.scene, this.camera);
    }

    updateGameplay(delta) {
        this.character.update(delta, this.input, this.world);
        this.cameraController.update(delta, this.input);

        this.updateFootsteps(delta);
        this.updateJumpSound();
        this.updateRunDust();

        const round = this.roundManager.getCurrentRound();

        this.fruitManager.update(delta, this.character, (fruit) => {
            this.roundScore++;
            this.hud.updateScore(this.roundScore, this.fruitManager.getRemainingFruits());
            this.hud.showFruitPopup();
            this.hud.showFruitMessage();
            this.sound.playFruitCollect();
            this.particles.emitFruitCollect(fruit.group.position);

            if (this.roundManager.isFruitMission()) {
                this.roundManager.addProgress();
            }
        });

        this.waterBottleManager.update(delta, this.character, (duration, multiplier) => {
            this.character.applySpeedBoost(duration, multiplier);
            this.hud.showWaterMessage();
            this.sound.playWaterCollect();
            this.particles.emitWaterCollect(this.character.getPosition());

            if (round.mission === MISSION_TYPE.HYDRATION_RUN) {
                this.roundManager.addProgress();
            }
        });

        this.trampolineManager.update(delta, this.character, () => {
            this.sound.playBounce();
            this.particles.emitFruitCollect(this.character.getPosition());

            if (round.mission === MISSION_TYPE.BOUNCE_QUEST) {
                this.roundManager.addProgress();
            }
        });

        this.gemManager.update(delta, this.character, (gem) => {
            this.hud.showGemMessage();
            this.sound.playGemCollect();
            this.particles.emitFruitCollect(gem.group.position);

            if (round.mission === MISSION_TYPE.GEM_HUNT) {
                this.roundManager.addProgress();
            }
        });

        this.shootingStarManager.update(delta, this.character, () => {
            this.hud.showStarMessage();
            this.sound.playStarCollect();
            this.particles.emitFruitCollect(this.character.getPosition());

            if (round.mission === MISSION_TYPE.STAR_CATCH) {
                this.roundManager.addProgress();
            }
        });

        this.skyRingManager.update(delta, this.character, () => {
            this.hud.showRingMessage();
            this.sound.playRingPass();
            this.particles.emitFruitCollect(this.character.getPosition());

            if (round.mission === MISSION_TYPE.RING_FLIGHT) {
                this.roundManager.addProgress();
            }
        });

        this.hud.updateTimer(this.roundManager.timeRemaining, round.timeLimit);
        this.hud.updateMissionProgress(this.roundManager.progress, round.target);

        const extraMarkers = [
            { positions: this.gemManager.getActivePositions(), color: '#ff44ff', size: 3 },
            { positions: this.shootingStarManager.getActivePositions(), color: '#ffdd44', size: 4 },
            { positions: this.skyRingManager.getActivePositions(), color: '#ff6644', size: 3 },
        ];

        this.minimap.update(
            this.character,
            this.fruitManager,
            this.waterBottleManager,
            this.world.getWorldBounds(),
            extraMarkers
        );

        const compassTargets = this.getCompassTargets(round);
        this.compass.update(this.character, compassTargets);

        this.updateVisibility();
    }

    getCompassTargets(round) {
        switch (round.mission) {
            case MISSION_TYPE.BOUNCE_QUEST:
                return this.trampolineManager.getPositions();
            case MISSION_TYPE.HYDRATION_RUN:
                return this.waterBottleManager.getActivePositions();
            case MISSION_TYPE.GEM_HUNT:
                return this.gemManager.getActivePositions();
            case MISSION_TYPE.STAR_CATCH:
                return this.shootingStarManager.getActivePositions();
            case MISSION_TYPE.RING_FLIGHT:
                return this.skyRingManager.getActivePositions();
            default:
                return this.fruitManager.getActivePositions();
        }
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

    updateRunDust() {
        if (this.input.run && this.character.isMoving()) {
            const pos = this.character.getPosition();
            const dir = this.character.getForwardDirection();
            this.particles.emitRunDust(pos, dir);
        }
    }

    goToStartScreen() {
        this.isRunning = false;
        this.music.stop();
        this.sound.stopAmbient();
        this.hud.hideAllOverlays();
        this.hud.roundBar.style.display = 'none';
        document.getElementById('hud').style.display = 'none';
        if (this.touchControls) this.touchControls.hide();
        this.roundManager.restart();
        this.character.resetPosition();
        this.cameraController.reset();
        document.getElementById('start-screen').style.display = 'flex';
    }

    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        if (this.cameraController) this.cameraController.updateViewOffset();
    }

    updateShadowCamera() {
        const charPos = this.character.getPosition();
        this.lights.directional.position.set(charPos.x + 50, 80, charPos.z + 30);
        this.lights.directional.target.position.set(charPos.x, 0, charPos.z);
    }

    updateVisibility() {
        const charPos = this.character.getPosition();
        const nearDistSq = 120 * 120;
        const farDistSq = 200 * 200;

        const cull = (items, skipKey, distSq) => {
            for (const item of items) {
                if (item[skipKey]) continue;
                const dx = charPos.x - item.group.position.x;
                const dz = charPos.z - item.group.position.z;
                item.group.visible = (dx * dx + dz * dz) < distSq;
            }
        };

        cull(this.fruitManager.fruits, 'collected', farDistSq);
        cull(this.waterBottleManager.bottles, 'collected', nearDistSq);
        cull(this.gemManager.gems, 'collected', nearDistSq);
        cull(this.skyRingManager.rings, 'passed', nearDistSq);
    }
}

const game = new Game();
let wordGame = null;
let racingGame = null;
let numberGame = null;

function showStartScreen() {
    document.getElementById('start-screen').style.display = 'flex';
    document.getElementById('hud').style.display = 'none';
    document.getElementById('word-hud').style.display = 'none';
    document.getElementById('number-hud').style.display = 'none';
}

document.getElementById('word-mode-button').addEventListener('click', () => {
    game.isRunning = false;
    if (racingGame) racingGame.stop();
    if (numberGame) numberGame.stop();
    if (!wordGame) {
        wordGame = new WordGame(() => showStartScreen(), game.renderer);
    }
    wordGame.start();
});

document.getElementById('racing-mode-button').addEventListener('click', () => {
    game.isRunning = false;
    if (wordGame) wordGame.stop();
    if (numberGame) numberGame.stop();
    if (!racingGame) {
        racingGame = new RacingGame(() => showStartScreen(), game.renderer);
    }
    racingGame.start();
});

document.getElementById('number-mode-button').addEventListener('click', () => {
    game.isRunning = false;
    if (wordGame) wordGame.stop();
    if (racingGame) racingGame.stop();
    if (!numberGame) {
        numberGame = new NumberGame(() => showStartScreen(), game.renderer);
    }
    numberGame.start();
});
