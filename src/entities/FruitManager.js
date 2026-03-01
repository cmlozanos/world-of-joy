import * as THREE from 'three';

const COLLECTION_RADIUS = 2.0;
const FRUIT_FLOAT_HEIGHT = 2.5;
const FRUIT_BOUNCE_SPEED = 2;
const FRUIT_BOUNCE_AMPLITUDE = 0.3;
const FRUIT_SPIN_SPEED = 1.5;
const FRUITS_PER_TREE = 3;
const FRUIT_SCATTER_RADIUS = 3;

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
    }

    getTotalFruits() {
        return this.totalFruits;
    }

    getRemainingFruits() {
        return this.fruits.filter((f) => !f.collected).length;
    }

    spawnFruits(treePositions) {
        for (const treePos of treePositions) {
            for (let i = 0; i < FRUITS_PER_TREE; i++) {
                const angle = (i / FRUITS_PER_TREE) * Math.PI * 2 + Math.random() * 0.5;
                const distance = 0.5 + Math.random() * FRUIT_SCATTER_RADIUS;

                const x = treePos.x + Math.cos(angle) * distance;
                const z = treePos.z + Math.sin(angle) * distance;
                const y = treePos.y + FRUIT_FLOAT_HEIGHT;

                this.createFruit(x, y, z);
            }
        }
    }

    createFruit(x, y, z) {
        const type = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
        const group = new THREE.Group();

        // Fruit body
        const geometry = new THREE.SphereGeometry(type.size, 10, 10);
        const material = new THREE.MeshLambertMaterial({
            color: type.color,
            emissive: type.color,
            emissiveIntensity: 0.15,
        });
        const mesh = new THREE.Mesh(geometry, material);
        group.add(mesh);

        // Small leaf on top
        const leafGeometry = new THREE.PlaneGeometry(0.1, 0.08);
        const leafMaterial = new THREE.MeshLambertMaterial({
            color: 0x228b22,
            side: THREE.DoubleSide,
        });
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        leaf.position.set(0.03, type.size, 0);
        leaf.rotation.x = -0.3;
        leaf.rotation.z = 0.5;
        group.add(leaf);

        // Glow ring
        const ringGeometry = new THREE.TorusGeometry(type.size * 1.5, 0.02, 8, 16);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: type.color,
            transparent: true,
            opacity: 0.4,
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);

        group.position.set(x, y, z);
        this.scene.add(group);

        const phaseOffset = Math.random() * Math.PI * 2;

        this.fruits.push({
            group,
            baseY: y,
            phaseOffset,
            collected: false,
            type,
        });

        this.totalFruits++;
    }

    update(delta, character, onCollect) {
        this.time += delta;
        const characterPos = character.getPosition();

        for (let i = this.fruits.length - 1; i >= 0; i--) {
            const fruit = this.fruits[i];
            if (fruit.collected) continue;

            // Animate floating and spinning
            fruit.group.position.y =
                fruit.baseY +
                Math.sin(this.time * FRUIT_BOUNCE_SPEED + fruit.phaseOffset) * FRUIT_BOUNCE_AMPLITUDE;
            fruit.group.rotation.y = this.time * FRUIT_SPIN_SPEED;

            // Check collection
            const dx = characterPos.x - fruit.group.position.x;
            const dy = characterPos.y - fruit.group.position.y;
            const dz = characterPos.z - fruit.group.position.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (distance < COLLECTION_RADIUS) {
                fruit.collected = true;
                this.collectFruit(fruit, onCollect);
            }
        }
    }

    collectFruit(fruit, onCollect) {
        // Collection animation: scale up and fade
        const startScale = fruit.group.scale.clone();
        const duration = 0.4;
        let elapsed = 0;

        const animate = () => {
            elapsed += 0.016;
            const t = Math.min(elapsed / duration, 1);

            const scale = 1 + t * 0.5;
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
