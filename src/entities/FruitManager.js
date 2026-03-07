import * as THREE from 'three';

const COLLECTION_RADIUS = 3.0;
const FRUIT_FLOAT_HEIGHT = 1.5;
const FRUIT_BOUNCE_SPEED = 2;
const FRUIT_BOUNCE_AMPLITUDE = 0.3;
const FRUIT_SPIN_SPEED = 1.5;
const FRUITS_PER_TREE = 2;
const FRUIT_SCATTER_RADIUS = 5;
const FRUIT_SCALE = 2.5;
const BEACON_HEIGHT = 8;

const FRUIT_TYPES = [
    { name: 'apple', color: 0xff3333, size: 0.2 },
    { name: 'orange', color: 0xff8c00, size: 0.22 },
    { name: 'pear', color: 0xccff00, size: 0.2 },
    { name: 'plum', color: 0x8b008b, size: 0.18 },
    { name: 'peach', color: 0xffb7c5, size: 0.2 },
];

export class FruitManager {
    constructor(scene) {
        this.scene = scene;
        this.fruits = [];
        this.totalFruits = 0;
        this.time = 0;

        this.bodyGeometry = new THREE.SphereGeometry(1, 8, 8);
        this.leafGeometry = new THREE.PlaneGeometry(0.1, 0.08);
        this.ringGeometry = new THREE.TorusGeometry(1, 0.02, 6, 12);
        this.beaconGeometry = new THREE.CylinderGeometry(0.04, 0.15, BEACON_HEIGHT, 6);
    }

    getTotalFruits() {
        return this.totalFruits;
    }

    getRemainingFruits() {
        return this.fruits.filter((f) => !f.collected).length;
    }

    spawnFruits(treePositions, world) {
        for (const treePos of treePositions) {
            for (let i = 0; i < FRUITS_PER_TREE; i++) {
                const angle = (i / FRUITS_PER_TREE) * Math.PI * 2 + Math.random() * 0.5;
                const distance = 0.5 + Math.random() * FRUIT_SCATTER_RADIUS;

                const x = treePos.x + Math.cos(angle) * distance;
                const z = treePos.z + Math.sin(angle) * distance;
                const groundY = world ? world.getHeightAt(x, z) : treePos.y;
                const y = groundY + FRUIT_FLOAT_HEIGHT;

                this.createFruit(x, y, z);
            }
        }
    }

    createFruit(x, y, z) {
        const type = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
        const group = new THREE.Group();

        const material = new THREE.MeshLambertMaterial({
            color: type.color,
            emissive: type.color,
            emissiveIntensity: 0.15,
        });
        const mesh = new THREE.Mesh(this.bodyGeometry, material);
        mesh.scale.setScalar(type.size);
        group.add(mesh);

        const leaf = new THREE.Mesh(this.leafGeometry,
            new THREE.MeshLambertMaterial({ color: 0x228b22, side: THREE.DoubleSide }));
        leaf.position.set(0.03, type.size, 0);
        leaf.rotation.x = -0.3;
        leaf.rotation.z = 0.5;
        group.add(leaf);

        const ringMaterial = new THREE.MeshBasicMaterial({
            color: type.color,
            transparent: true,
            opacity: 0.4,
        });
        const ring = new THREE.Mesh(this.ringGeometry, ringMaterial);
        ring.scale.setScalar(type.size * 1.5);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);

        const beaconMaterial = new THREE.MeshBasicMaterial({
            color: type.color,
            transparent: true,
            opacity: 0.35,
        });
        const beacon = new THREE.Mesh(this.beaconGeometry, beaconMaterial);
        beacon.position.y = BEACON_HEIGHT / 2;
        beacon.visible = false;
        group.add(beacon);

        // Beacon top glow sphere
        const beaconTopGeo = new THREE.SphereGeometry(0.12, 8, 8);
        const beaconTopMat = new THREE.MeshBasicMaterial({
            color: type.color,
            transparent: true,
            opacity: 0.5,
        });
        const beaconTop = new THREE.Mesh(beaconTopGeo, beaconTopMat);
        beaconTop.position.y = BEACON_HEIGHT;
        beaconTop.visible = false;
        group.add(beaconTop);

        group.scale.set(FRUIT_SCALE, FRUIT_SCALE, FRUIT_SCALE);

        group.position.set(x, y, z);
        this.scene.add(group);

        const phaseOffset = Math.random() * Math.PI * 2;

        this.fruits.push({
            group,
            beacon,
            beaconTop,
            baseY: y,
            phaseOffset,
            collected: false,
            type,
        });

        this.totalFruits++;
    }

    setBeaconsVisible(visible) {
        for (const fruit of this.fruits) {
            if (!fruit.collected) {
                fruit.beacon.visible = visible;
                fruit.beaconTop.visible = visible;
            }
        }
    }

    getActivePositions() {
        return this.fruits
            .filter((f) => !f.collected)
            .map((f) => f.group.position);
    }

    reset() {
        for (const fruit of this.fruits) {
            this.scene.remove(fruit.group);
            fruit.group.traverse((child) => {
                if (child.material) child.material.dispose();
            });
        }
        this.fruits = [];
        this.totalFruits = 0;
        this.time = 0;
    }

    animate(delta) {
        this.time += delta;
        for (const fruit of this.fruits) {
            if (fruit.collected) continue;
            fruit.group.position.y =
                fruit.baseY +
                Math.sin(this.time * FRUIT_BOUNCE_SPEED + fruit.phaseOffset) * FRUIT_BOUNCE_AMPLITUDE;
            fruit.group.rotation.y = this.time * FRUIT_SPIN_SPEED;

            // Pulse beacon
            if (fruit.beacon.visible) {
                const pulse = 0.25 + Math.sin(this.time * 2.5 + fruit.phaseOffset) * 0.12;
                fruit.beacon.material.opacity = pulse;
                fruit.beaconTop.material.opacity = 0.4 + Math.sin(this.time * 3 + fruit.phaseOffset) * 0.2;
                const s = 0.1 + Math.sin(this.time * 3 + fruit.phaseOffset) * 0.04;
                fruit.beaconTop.scale.setScalar(s / 0.12);
            }
        }
    }

    update(delta, character, onCollect) {
        this.animate(delta);
        const characterPos = character.getPosition();

        for (let i = this.fruits.length - 1; i >= 0; i--) {
            const fruit = this.fruits[i];
            if (fruit.collected) continue;

            // Check collection using 2D (XZ) distance only
            const dx = characterPos.x - fruit.group.position.x;
            const dz = characterPos.z - fruit.group.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance < COLLECTION_RADIUS) {
                fruit.collected = true;
                this.collectFruit(fruit, onCollect);
            }
        }
    }

    collectFruit(fruit, onCollect) {
        const duration = 0.4;
        let elapsed = 0;

        const animate = () => {
            elapsed += 0.016;
            const t = Math.min(elapsed / duration, 1);

            const scale = FRUIT_SCALE * (1 + t * 0.5);
            fruit.group.scale.set(scale, scale, scale);

            fruit.group.traverse((child) => {
                if (child.material) {
                    child.material.transparent = true;
                    child.material.opacity = 1 - t;
                }
            });

            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(fruit.group);
                this.fruits.splice(this.fruits.indexOf(fruit), 1);
            }
        };

        animate();

        if (onCollect) {
            onCollect(fruit);
        }
    }
}
