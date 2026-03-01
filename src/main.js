import * as THREE from 'three';
import { InputManager } from './engine/InputManager.js';
import { ThirdPersonCamera } from './engine/ThirdPersonCamera.js';
import { SoundManager } from './engine/SoundManager.js';
import { ParticleSystem } from './engine/ParticleSystem.js';
import { Character } from './entities/Character.js';
import { World } from './world/World.js';
import { FruitManager } from './entities/FruitManager.js';
import { WaterBottleManager } from './entities/WaterBottleManager.js';
import { Wildlife } from './entities/Wildlife.js';
import { TrampolineManager } from './entities/TrampolineManager.js';
import { HUD } from './ui/HUD.js';
import { Minimap } from './ui/Minimap.js';
import { Compass } from './ui/Compass.js';
import { MusicManager } from './engine/MusicManager.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.clock = new THREE.Clock();
        this.isRunning = false;
        this.score = 0;

        this.initRenderer();
        this.initScene();
        this.initLighting();
        this.initModules();
        this.bindEvents();
    }

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.0012);

        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            2000
        );
    }

    initLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xfff4e0, 1.2);
        directionalLight.position.set(50, 80, 30);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 200;
        directionalLight.shadow.camera.left = -60;
        directionalLight.shadow.camera.right = 60;
        directionalLight.shadow.camera.top = 60;
        directionalLight.shadow.camera.bottom = -60;
        this.scene.add(directionalLight);

        const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x556b2f, 0.4);
        this.scene.add(hemisphereLight);
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
        this.particles = new ParticleSystem(this.scene);
        this.cameraController = new ThirdPersonCamera(this.camera, this.character);
        this.hud = new HUD();
        this.minimap = new Minimap();
        this.compass = new Compass();
        this.music = new MusicManager();
        this.footstepTimer = 0;
        this.lastJumpCount = 0;
    }

    bindEvents() {
        window.addEventListener('resize', () => this.onResize());

        document.getElementById('start-button').addEventListener('click', () => {
            this.startGame();
        });
    }

    startGame() {
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('loading-screen').style.display = 'flex';

        this.sound.init();

        this.world.generate(() => {
            this.fruitManager.spawnFruits(this.world.getTreePositions());
            this.waterBottleManager.spawn(this.world);
            this.wildlife.spawn(this.world);
            this.trampolineManager.spawn(this.world);
            this.hud.setTotalFruits(this.fruitManager.getTotalFruits());

            document.getElementById('loading-screen').style.display = 'none';
            document.getElementById('hud').style.display = 'block';

            this.sound.playAmbient();
            this.music.init(this.sound.getAudioContext());
            this.music.start();
            this.isRunning = true;
            this.clock.start();
            this.loop();
        });
    }

    loop() {
        if (!this.isRunning) return;
        requestAnimationFrame(() => this.loop());

        const delta = Math.min(this.clock.getDelta(), 0.05);

        this.character.update(delta, this.input, this.world);
        this.cameraController.update(delta, this.input);

        // Footstep sounds
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

        // Jump sound (supports double jump)
        if (this.input.jump && this.character.jumpCount > this.lastJumpCount) {
            this.sound.playJump();
        }
        this.lastJumpCount = this.character.jumpCount;
        if (this.character.isGrounded) this.lastJumpCount = 0;

        // Running dust particles
        if (this.input.run && this.character.isMoving()) {
            const pos = this.character.getPosition();
            const dir = this.character.getForwardDirection();
            this.particles.emitRunDust(pos, dir);
        }

        this.fruitManager.update(delta, this.character, (fruit) => {
            this.score++;
            this.hud.updateScore(this.score, this.fruitManager.getRemainingFruits());
            this.hud.showFruitPopup(fruit, this.camera, this.renderer);
            this.hud.showFruitMessage();
            this.sound.playFruitCollect();
            this.particles.emitFruitCollect(fruit.group.position);
        });

        this.waterBottleManager.update(delta, this.character, (duration, multiplier) => {
            this.character.applySpeedBoost(duration, multiplier);
            this.hud.showWaterMessage();
            this.sound.playWaterCollect();
            this.particles.emitWaterCollect(this.character.getPosition());
        });

        // Update trampolines (detect bounce)
        const prevVelY = this.character.velocity.y;
        this.trampolineManager.update(delta, this.character);
        if (this.character.velocity.y > prevVelY + 5) {
            this.sound.playBounce();
            this.particles.emitFruitCollect(this.character.getPosition());
        }

        this.wildlife.update(delta, this.world);
        this.particles.update(delta);
        this.hud.updateBoost(this.character.getBoostTimeRemaining());
        this.minimap.update(this.character, this.fruitManager, this.waterBottleManager, this.world.getWorldBounds());
        this.compass.update(this.character, this.fruitManager);

        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}

const game = new Game();
