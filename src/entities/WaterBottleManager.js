import * as THREE from 'three';

const BOTTLE_COUNT = 40;
const COLLECTION_RADIUS = 1.8;
const BOOST_MULTIPLIER = 1.8;
const BOOST_DURATION = 6;
const SPIN_SPEED = 2;
const FLOAT_SPEED = 1.5;
const FLOAT_AMPLITUDE = 0.15;

export class WaterBottleManager {
    constructor(scene) {
        this.scene = scene;
        this.bottles = [];
        this.time = 0;
    }

    spawn(world) {
        const halfWorld = world.getWorldBounds() - 10;

        for (let i = 0; i < BOTTLE_COUNT; i++) {
            const x = (Math.random() - 0.5) * 2 * halfWorld;
            const z = (Math.random() - 0.5) * 2 * halfWorld;
            const y = world.getHeightAt(x, z);

            this.createBottle(x, y, z);
        }
    }

    createBottle(x, y, z) {
        const group = new THREE.Group();

        // Bottle body
        const bodyGeometry = new THREE.CylinderGeometry(0.12, 0.14, 0.5, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({
            color: 0x4fc3f7,
            transparent: true,
            opacity: 0.7,
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.25;
        group.add(body);

        // Bottle neck
        const neckGeometry = new THREE.CylinderGeometry(0.06, 0.1, 0.15, 8);
        const neckMaterial = new THREE.MeshLambertMaterial({
            color: 0x4fc3f7,
            transparent: true,
            opacity: 0.7,
        });
        const neck = new THREE.Mesh(neckGeometry, neckMaterial);
        neck.position.y = 0.575;
        group.add(neck);

        // Cap
        const capGeometry = new THREE.CylinderGeometry(0.07, 0.07, 0.06, 8);
        const capMaterial = new THREE.MeshLambertMaterial({ color: 0x1565c0 });
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.position.y = 0.68;
        group.add(cap);

        // Water inside (slightly smaller, visible through transparent body)
        const waterGeometry = new THREE.CylinderGeometry(0.1, 0.12, 0.4, 8);
        const waterMaterial = new THREE.MeshLambertMaterial({
            color: 0x0288d1,
            transparent: true,
            opacity: 0.5,
        });
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.position.y = 0.22;
        group.add(water);

        // Glow ring
        const ringGeometry = new THREE.TorusGeometry(0.25, 0.02, 8, 16);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x4fc3f7,
            transparent: true,
            opacity: 0.35,
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.3;
        group.add(ring);

        const baseY = y + 0.6;
        group.position.set(x, baseY, z);
        this.scene.add(group);

        this.bottles.push({
            group,
            baseY,
            phaseOffset: Math.random() * Math.PI * 2,
            collected: false,
        });
    }

    update(delta, character, onCollect) {
        this.time += delta;
        const characterPos = character.getPosition();

        for (let i = this.bottles.length - 1; i >= 0; i--) {
            const bottle = this.bottles[i];
            if (bottle.collected) continue;

            // Animate
            bottle.group.position.y =
                bottle.baseY + Math.sin(this.time * FLOAT_SPEED + bottle.phaseOffset) * FLOAT_AMPLITUDE;
            bottle.group.rotation.y = this.time * SPIN_SPEED;

            // Check collection
            const dx = characterPos.x - bottle.group.position.x;
            const dy = characterPos.y - bottle.group.position.y;
            const dz = characterPos.z - bottle.group.position.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (distance < COLLECTION_RADIUS) {
                bottle.collected = true;
                this.collectBottle(bottle, onCollect);
            }
        }
    }

    collectBottle(bottle, onCollect) {
        const duration = 0.3;
        let elapsed = 0;

        const animate = () => {
            elapsed += 0.016;
            const t = Math.min(elapsed / duration, 1);

            bottle.group.position.y += 0.05;
            bottle.group.traverse((child) => {
                if (child.material) {
                    child.material.transparent = true;
                    child.material.opacity *= 0.9;
                }
            });

            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(bottle.group);
                this.bottles.splice(this.bottles.indexOf(bottle), 1);
            }
        };

        animate();

        if (onCollect) {
            onCollect(BOOST_DURATION, BOOST_MULTIPLIER);
        }
    }
}
