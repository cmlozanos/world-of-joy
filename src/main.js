import * as THREE from 'three';
import { InputManager } from './engine/InputManager.js';
import { ThirdPersonCamera } from './engine/ThirdPersonCamera.js';
import { Character } from './entities/Character.js';
import { World } from './world/World.js';
import { FruitManager } from './entities/FruitManager.js';
import { HUD } from './ui/HUD.js';

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
        this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.0025);

        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
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
        this.world = new World(this.scene);
        this.character = new Character(this.scene);
        this.fruitManager = new FruitManager(this.scene);
        this.cameraController = new ThirdPersonCamera(this.camera, this.character);
        this.hud = new HUD();
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

        this.world.generate(() => {
            this.fruitManager.spawnFruits(this.world.getTreePositions());
            this.hud.setTotalFruits(this.fruitManager.getTotalFruits());

            document.getElementById('loading-screen').style.display = 'none';
            document.getElementById('hud').style.display = 'block';

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
        this.fruitManager.update(delta, this.character, (fruit) => {
            this.score++;
            this.hud.updateScore(this.score, this.fruitManager.getRemainingFruits());
            this.hud.showFruitPopup(fruit, this.camera, this.renderer);
        });

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
