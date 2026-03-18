import * as THREE from 'three';
import { InputManager } from './engine/InputManager.js?v=20260317b';
import { ThirdPersonCamera } from './engine/ThirdPersonCamera.js';
import { SoundManager } from './engine/SoundManager.js';
import { ParticleSystem } from './engine/ParticleSystem.js';
import { RacingRoundManager, RACE_STATE, RACE_FAIL_REASON } from './engine/RacingRoundManager.js?v=20260317b';
import { ScenarioTheme } from './engine/ScenarioTheme.js';
import { World } from './world/World.js?v=20260317b';
import { RacingCar } from './entities/RacingCar.js?v=20260317b';
import { FuelCanManager } from './entities/FuelCanManager.js';
import { NitroCanManager } from './entities/NitroCanManager.js';
import { RaceMarkerManager } from './entities/RaceMarkerManager.js';
import { RoadSignManager } from './entities/RoadSignManager.js?v=20260317b';
import { HUD } from './ui/HUD.js?v=20260317b';
import { Minimap } from './ui/Minimap.js';
import { Compass } from './ui/Compass.js';
import { MusicManager } from './engine/MusicManager.js';
import { TouchControls } from './engine/TouchControls.js?v=20260317b';
import { wellbeingManager } from './engine/WellbeingManager.js?v=20260317b';

const CAR_HEIGHT_OFFSET = 0.48;
const NITRO_DURATION = 4.5;
const FINISH_RADIUS = 8;
const EASY_TANK_CAPACITY = 140;

export class RacingGame {
    constructor(onBack, renderer) {
        this.onBack = onBack;
        this.canvas = document.getElementById('game-canvas');
        this.renderer = renderer;
        this.clock = new THREE.Clock();
        this.isRunning = false;
        this.initialized = false;
        this.routePreviewPoints = [];
        this.previousState = RACE_STATE.IDLE;
        this.didReachFinish = false;
        this.lessonAnnouncementCooldown = 0;
        this.lessonDiscoveryCount = 0;

        this.initScene();
        this.initLighting();
        this.initModules();
        this.bindEvents();
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.0018);

        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            700
        );
    }

    initLighting() {
        this.lights = {};

        this.lights.ambient = new THREE.AmbientLight(0xffffff, 0.55);
        this.scene.add(this.lights.ambient);

        this.lights.directional = new THREE.DirectionalLight(0xfff4e0, 1.15);
        this.lights.directional.position.set(45, 80, 35);
        this.lights.directional.castShadow = true;
        this.lights.directional.shadow.mapSize.width = 1024;
        this.lights.directional.shadow.mapSize.height = 1024;
        this.lights.directional.shadow.camera.near = 0.5;
        this.lights.directional.shadow.camera.far = 180;
        this.lights.directional.shadow.camera.left = -35;
        this.lights.directional.shadow.camera.right = 35;
        this.lights.directional.shadow.camera.top = 35;
        this.lights.directional.shadow.camera.bottom = -35;
        this.scene.add(this.lights.directional);
        this.scene.add(this.lights.directional.target);

        this.lights.hemisphere = new THREE.HemisphereLight(0x87ceeb, 0x556b2f, 0.42);
        this.scene.add(this.lights.hemisphere);
    }

    initModules() {
        this.input = new InputManager();
        this.sound = new SoundManager();
        this.world = new World(this.scene);
        this.car = new RacingCar(this.scene);
        this.fuelCanManager = new FuelCanManager(this.scene);
        this.nitroCanManager = new NitroCanManager(this.scene);
        this.raceMarkerManager = new RaceMarkerManager(this.scene);
        this.roadSignManager = new RoadSignManager(this.scene);
        this.particles = new ParticleSystem(this.scene);
        this.cameraController = new ThirdPersonCamera(this.camera, this.car, {
            followTargetRotation: true,
            offsetY: 3.2,
            offsetZ: -11,
            lookAtY: 1.1,
            pitch: 0.24,
            feetScreenOffset: 210,
            jumpExtraY: 0,
            jumpExtraZ: 0,
            jumpExtraPitch: 0,
            ySmoothing: 2.5,
        });
        this.hud = new HUD();
        this.minimap = new Minimap();
        this.compass = new Compass();
        this.music = new MusicManager();
        this.roundManager = new RacingRoundManager();
        this.scenarioTheme = new ScenarioTheme();
        this.touchControls = TouchControls.isTouchDevice() ? new TouchControls(this.input) : null;
        if (this.touchControls) {
            this.touchControls.setButtons({ showJump: false, showRun: false });
        }
    }

    bindEvents() {
        this._resizeHandler = () => this.onResize();
        window.addEventListener('resize', this._resizeHandler);
    }

    bindHudHandlers() {
        document.getElementById('hud-back-btn').onclick = () => {
            this.goToMenu();
        };

        document.getElementById('next-round-btn').onclick = () => {
            this.roundManager.startNextRound();
        };

        document.getElementById('retry-btn').onclick = () => {
            this.roundManager.retryRound();
            if (!this.music.isPlaying) this.music.start();
        };

        document.getElementById('finish-btn').onclick = () => {
            this.goToMenu();
        };

        document.getElementById('play-again-btn').onclick = () => {
            this.roundManager.restart();
            this.roundManager.startNextRound();
            this.onStateChanged(this.roundManager.state);
            this.previousState = this.roundManager.state;
        };
    }

    start() {
        if (!wellbeingManager.beginActivity('racing', () => this.goToMenu())) {
            return;
        }

        this.bindHudHandlers();
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('word-hud').style.display = 'none';
        document.getElementById('number-hud').style.display = 'none';
        document.getElementById('hud').style.display = 'block';

        if (this.touchControls) {
            this.touchControls.setButtons({ showJump: false, showRun: false });
        }

        this.sound.init();
        if (!this.music.ctx) {
            this.music.init(this.sound.getAudioContext());
        }

        if (this.initialized) {
            this.sound.stopAmbient();
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

        document.getElementById('loading-screen').style.display = 'flex';

        requestAnimationFrame(() => {
            this.world.generate({ profile: 'racing' }, () => {
                this.initialized = true;
                document.getElementById('loading-screen').style.display = 'none';
                document.getElementById('hud').style.display = 'block';
                this.isRunning = true;
                this.clock.start();

                this.roundManager.startNextRound();
                this.onStateChanged(this.roundManager.state);
                this.previousState = this.roundManager.state;
                this.renderer.render(this.scene, this.camera);
                this.loop();
            });
        });
    }

    stop() {
        this.isRunning = false;
        wellbeingManager.endActivity();
        this.music.stop();
        this.sound.stopAmbient();
        this.sound.cancelSpeech();
        this.hud.hideAllOverlays();
        this.hud.hideLessonChip();
        this.hud.roundBar.style.display = 'none';
        document.getElementById('hud').style.display = 'none';
        if (this.touchControls) this.touchControls.hide();
    }

    goToMenu() {
        this.stop();
        if (this.onBack) this.onBack();
    }

    onStateChanged(newState) {
        const round = this.roundManager.getCurrentRound();
        const totalRounds = this.roundManager.getTotalRounds();
        const lessonHint = round?.lesson ? `${round.hint} ${round.lesson.coachText}` : round?.hint;

        switch (newState) {
            case RACE_STATE.BRIEFING:
                this.setupRound(round);
                this.scenarioTheme.apply(round.theme, this.scene, this.lights);
                this.hud.setCounterIcon('⛽');
                this.hud.setBoostTheme({
                    icon: '⚡',
                    startColor: '#ff8c42',
                    endColor: '#ffe066',
                    borderColor: 'rgba(255, 174, 66, 0.45)',
                    maxDuration: NITRO_DURATION,
                });
                this.hud.setInstructions([
                    'W/↑ - Acelerar | S/↓ - Frenar o marcha atrás',
                    'A/← D/→ - Girar | Sigue la carretera hasta la meta',
                ]);
                this.hud.setCompassLabel('🏁 Meta');
                if (round.lesson) this.hud.showLessonChip(round.lesson.icon, round.lesson.title);
                this.hud.showBriefing(round, totalRounds, lessonHint);
                if (round.lesson?.coachText) {
                    this.sound.speakText(round.lesson.coachText, { interrupt: true, rate: 0.82 });
                }
                if (this.touchControls) this.touchControls.hide();
                break;

            case RACE_STATE.PLAYING:
                this.hud.hideBriefing();
                if (round.lesson) this.hud.showLessonChip(round.lesson.icon, round.lesson.title);
                this.hud.showGameplayUI(
                    round,
                    totalRounds,
                    !!this.touchControls,
                    round.lesson?.coachText || round.hint
                );
                if (!this.music.isPlaying) this.music.start();
                if (this.touchControls) this.touchControls.show();
                break;

            case RACE_STATE.ROUND_COMPLETE:
                if (this.touchControls) this.touchControls.hide();
                this.sound.playFinish();
                this.hud.showRoundComplete(
                    this.roundManager.getLastRoundStars(),
                    this.roundManager.timeRemaining
                );
                break;

            case RACE_STATE.FAILED:
                if (this.touchControls) this.touchControls.hide();
                this.music.stop();
                if (this.roundManager.failReason === RACE_FAIL_REASON.FUEL) {
                    this.sound.playOutOfFuel();
                    this.hud.showFailure(
                        'Sin gasolina',
                        'El coche se ha detenido antes de llegar a la meta.',
                        '⛽'
                    );
                } else {
                    this.hud.showFailure(
                        '¡Se acabó el tiempo!',
                        'No llegaste a la meta dentro del límite de tiempo.',
                        '⏰'
                    );
                }
                break;

            case RACE_STATE.VICTORY:
                if (this.touchControls) this.touchControls.hide();
                this.music.stop();
                this.hud.showVictory(
                    this.roundManager.getTotalStars(),
                    this.roundManager.getMaxStars(),
                    this.roundManager.totalScore,
                    'Puntos de carrera'
                );
                break;
        }
    }

    setupRound(round) {
        this.didReachFinish = false;
        this.lessonAnnouncementCooldown = 0;
        this.lessonDiscoveryCount = 0;
        this.hud.resetForNewRound();

        const startInfo = this.world.getRoadPoint(round.startProgress);
        const finishInfo = this.world.getRoadPoint(round.finishProgress);

        const spawnPosition = startInfo.position.clone().add(startInfo.tangent.clone().multiplyScalar(-4.5));
        spawnPosition.y = this.world.getHeightAt(spawnPosition.x, spawnPosition.z) + CAR_HEIGHT_OFFSET;

        this.car.resetPosition();
        this.car.setSpawn(spawnPosition, startInfo.tangent);
        this.car.configureFuel(round.initialFuel, EASY_TANK_CAPACITY);
        this.cameraController.reset();

        this.raceMarkerManager.spawn(startInfo, finishInfo);
        this.routePreviewPoints = this.world
            .getRoadRoutePoints(round.startProgress, round.finishProgress, 52)
            .map(({ position }) => position);

        this.roadSignManager.spawn(this.buildLessonPlacements(round.startProgress, round.finishProgress, round.lesson));

        this.fuelCanManager.spawn(this.buildPlacements(round.startProgress, round.finishProgress, round.fuelCanCount, 2.7));
        this.nitroCanManager.spawn(this.buildPlacements(round.startProgress, round.finishProgress, round.nitroCanCount, 0));
        this.fuelCanManager.setBeaconsVisible(true);
        this.nitroCanManager.setBeaconsVisible(true);

        this.hud.updateCounter(Math.ceil(this.car.getFuel()), this.car.getMaxFuel());
        this.hud.updateMissionProgress(0, 1);
        this.hud.updateBoost(0, NITRO_DURATION);
    }

    buildPlacements(startProgress, finishProgress, count, lateralOffset) {
        const span = this.world.getRoadSpan(startProgress, finishProgress);
        const placements = [];

        for (let index = 0; index < count; index++) {
            const t = (index + 1) / (count + 1);
            const roadInfo = this.world.getRoadPoint(startProgress + span * t);
            const side = lateralOffset === 0 ? 0 : (index % 2 === 0 ? 1 : -1);
            const lateral = new THREE.Vector3(-roadInfo.tangent.z, 0, roadInfo.tangent.x).normalize();
            const position = roadInfo.position.clone().addScaledVector(lateral, lateralOffset * side);
            position.y = this.world.getHeightAt(position.x, position.z);
            placements.push({
                position,
                rotationY: Math.atan2(roadInfo.tangent.x, roadInfo.tangent.z),
            });
        }

        return placements;
    }

    buildLessonPlacements(startProgress, finishProgress, lesson) {
        if (!lesson?.signs?.length) return [];

        const placements = [];
        const span = this.world.getRoadSpan(startProgress, finishProgress);
        const count = Math.max(lesson.signs.length * 2, 6);

        for (let index = 0; index < count; index++) {
            const t = (index + 1) / (count + 1);
            const roadInfo = this.world.getRoadPoint(startProgress + span * t);
            const lateral = new THREE.Vector3(-roadInfo.tangent.z, 0, roadInfo.tangent.x).normalize();
            const side = index % 2 === 0 ? 1 : -1;
            const position = roadInfo.position.clone().addScaledVector(lateral, 8 * side);
            position.y = this.world.getHeightAt(position.x, position.z);

            const lookAtRoad = roadInfo.position.clone().sub(position).normalize();

            placements.push({
                position,
                rotationY: Math.atan2(lookAtRoad.x, lookAtRoad.z),
                template: lesson.signs[index % lesson.signs.length],
            });
        }

        return placements;
    }

    loop() {
        if (!this.isRunning) return;
        requestAnimationFrame(() => this.loop());

        const delta = Math.min(this.clock.getDelta(), 0.05);

        if (wellbeingManager.tick(delta)) {
            return;
        }

        this.roundManager.update(delta);

        if (this.roundManager.state !== this.previousState) {
            this.onStateChanged(this.roundManager.state);
            this.previousState = this.roundManager.state;
        }

        this.raceMarkerManager.update(delta);
        if (!this.roundManager.isPlaying()) {
            this.roadSignManager.update(delta);
        }
        this.particles.update(delta);

        if (this.roundManager.isPlaying()) {
            this.updateGameplay(delta);
        } else {
            this.fuelCanManager.animate(delta);
            this.nitroCanManager.animate(delta);

            if (this.roundManager.state === RACE_STATE.BRIEFING) {
                this.hud.updateBriefingCountdown(this.roundManager.briefingTimer);
                this.cameraController.update(delta, this.input);
            }
        }

        this.hud.updateBoost(this.car.getBoostTimeRemaining(), NITRO_DURATION);
        this.updateShadowCamera();
        this.renderer.render(this.scene, this.camera);
    }

    updateGameplay(delta) {
        this.lessonAnnouncementCooldown = Math.max(0, this.lessonAnnouncementCooldown - delta);

        this.car.update(delta, this.input, this.world);
        this.cameraController.update(delta, this.input);

        if (this.car.isMoving()) {
            this.particles.emitRunDust(this.car.getPosition(), this.car.getForwardDirection());
        }

        this.roadSignManager.update(delta, this.car, (sign) => {
            if (this.lessonDiscoveryCount >= 4 || this.lessonAnnouncementCooldown > 0) return;
            this.lessonDiscoveryCount += 1;
            this.lessonAnnouncementCooldown = 3.25;
            this.hud.queueMessage(`${sign.template.icon} ${sign.template.message}`);
            this.sound.speakText(sign.template.speech, { interrupt: false, rate: 0.86 });
            this.particles.emitFruitCollect(sign.group.position);
        });

        this.fuelCanManager.update(delta, this.car, (fuelAmount) => {
            this.car.refuel(fuelAmount);
            this.hud.showFuelMessage();
            this.sound.playFuelCollect();
            this.particles.emitWaterCollect(this.car.getPosition());
        });

        this.nitroCanManager.update(delta, this.car, (duration, multiplier) => {
            this.car.applySpeedBoost(duration, multiplier);
            this.hud.showNitroMessage();
            this.sound.playNitroCollect();
            this.particles.emitFruitCollect(this.car.getPosition());
        });

        const finishPosition = this.raceMarkerManager.getFinishPosition();
        if (!this.didReachFinish && finishPosition) {
            const carPosition = this.car.getPosition();
            const dx = carPosition.x - finishPosition.x;
            const dz = carPosition.z - finishPosition.z;
            if (Math.sqrt(dx * dx + dz * dz) < FINISH_RADIUS) {
                this.didReachFinish = true;
                this.hud.showFinishMessage();
                this.particles.emitFruitCollect(finishPosition);
                this.roundManager.markGoalReached();
            }
        }

        if (this.car.isStranded()) {
            this.roundManager.failRound(RACE_FAIL_REASON.FUEL);
        }

        const round = this.roundManager.getCurrentRound();
        this.hud.updateTimer(this.roundManager.timeRemaining, round.timeLimit);
        this.hud.updateMissionProgress(this.roundManager.progress, 1);
        this.hud.updateCounter(Math.ceil(this.car.getFuel()), this.car.getMaxFuel());

        const markerGroups = [
            {
                positions: this.fuelCanManager.getActivePositions(),
                color: '#ff8c42',
                size: 3,
            },
            {
                positions: this.nitroCanManager.getActivePositions(),
                color: '#ffe066',
                size: 3,
            },
        ];

        if (finishPosition) {
            markerGroups.push({
                positions: [finishPosition],
                color: '#8cff9b',
                size: 4,
            });
        }

        this.minimap.updateCustom(
            this.car,
            this.world.getWorldBounds(),
            markerGroups,
            this.routePreviewPoints
        );

        this.compass.update(this.car, finishPosition ? [finishPosition] : []);
    }

    updateShadowCamera() {
        const carPos = this.car.getPosition();
        this.lights.directional.position.set(carPos.x + 55, 85, carPos.z + 35);
        this.lights.directional.target.position.set(carPos.x, 0, carPos.z);
    }

    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        if (this.cameraController) this.cameraController.updateViewOffset();
    }
}