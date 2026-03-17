import * as THREE from 'three';

const COLLECTION_RADIUS = 2.2;
const NUMBER_FLOAT_HEIGHT = 0.9;
const NUMBER_BOUNCE_SPEED = 1.7;
const NUMBER_BOUNCE_AMPLITUDE = 0.18;
const NUMBER_SPIN_SPEED = 0.9;
const EXTRA_NUMBERS_COUNT = 32;
const DUPLICATE_COPIES = 2;
const ALL_NUMBERS = '0123456789';

const NUMBER_COLORS = {
    0: 0xff6b6b,
    1: 0xff9f43,
    2: 0xffd166,
    3: 0x06d6a0,
    4: 0x4ecdc4,
    5: 0x5fa8ff,
    6: 0x6c5ce7,
    7: 0xff66c4,
    8: 0x9bde5a,
    9: 0xffffff,
};

export class NumberManager {
    constructor(scene) {
        this.scene = scene;
        this.numbers = [];
        this.time = 0;
    }

    spawnNumbers(sequence, roomBounds) {
        this.reset();

        const margin = 3;
        const half = roomBounds / 2 - margin;
        const minDistance = 4;
        const placed = [];

        const pickPosition = () => {
            for (let attempt = 0; attempt < 50; attempt++) {
                const x = (Math.random() - 0.5) * 2 * half;
                const z = (Math.random() - 0.5) * 2 * half;
                let tooClose = false;

                for (const point of placed) {
                    if ((x - point.x) ** 2 + (z - point.z) ** 2 < minDistance * minDistance) {
                        tooClose = true;
                        break;
                    }
                }

                if (!tooClose) {
                    placed.push({ x, z });
                    return { x, z };
                }
            }

            const x = (Math.random() - 0.5) * 2 * half;
            const z = (Math.random() - 0.5) * 2 * half;
            placed.push({ x, z });
            return { x, z };
        };

        for (const value of sequence) {
            const position = pickPosition();
            this.createNumber(value, position.x, NUMBER_FLOAT_HEIGHT, position.z, true);
        }

        for (const value of sequence) {
            for (let copy = 0; copy < DUPLICATE_COPIES; copy++) {
                const position = pickPosition();
                this.createNumber(value, position.x, NUMBER_FLOAT_HEIGHT, position.z, false);
            }
        }

        for (let index = 0; index < EXTRA_NUMBERS_COUNT; index++) {
            const value = ALL_NUMBERS[Math.floor(Math.random() * ALL_NUMBERS.length)];
            const position = pickPosition();
            this.createNumber(value, position.x, NUMBER_FLOAT_HEIGHT, position.z, false);
        }
    }

    createNumber(value, x, y, z, isTarget = false) {
        const group = new THREE.Group();
        const color = NUMBER_COLORS[value] || 0xffffff;

        const tokenMesh = this.buildNumberMesh(value, color);
        group.add(tokenMesh);

        const ring = new THREE.Mesh(
            new THREE.RingGeometry(0.82, 1.08, 24),
            new THREE.MeshBasicMaterial({
                color,
                transparent: true,
                opacity: 0.22,
                side: THREE.DoubleSide,
            })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = -NUMBER_FLOAT_HEIGHT + 0.06;
        group.add(ring);

        const beacon = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.12, 6, 6),
            new THREE.MeshBasicMaterial({
                color,
                transparent: true,
                opacity: isTarget ? 0.28 : 0.14,
            })
        );
        beacon.position.y = 3;
        group.add(beacon);

        group.position.set(x, y, z);
        this.scene.add(group);

        this.numbers.push({
            group,
            ring,
            beacon,
            value,
            speech: value,
            baseY: y,
            phaseOffset: Math.random() * Math.PI * 2,
            collected: false,
            isTarget,
        });
    }

    buildNumberMesh(value, color) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#111111';
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
        ctx.font = 'bold 102px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value, 64, 70);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeText(value, 64, 70);

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;

        const frontMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
        });
        const sideMaterial = new THREE.MeshLambertMaterial({
            color,
            emissive: color,
            emissiveIntensity: 0.26,
        });

        const geometry = new THREE.BoxGeometry(1.25, 1.25, 0.42);
        const materials = [
            sideMaterial, sideMaterial,
            sideMaterial, sideMaterial,
            frontMaterial, frontMaterial,
        ];

        const mesh = new THREE.Mesh(geometry, materials);
        mesh.castShadow = true;
        return mesh;
    }

    animate(delta) {
        this.time += delta;

        for (const token of this.numbers) {
            if (token.collected) continue;

            token.group.position.y =
                token.baseY + Math.sin(this.time * NUMBER_BOUNCE_SPEED + token.phaseOffset) * NUMBER_BOUNCE_AMPLITUDE;
            token.group.rotation.y = this.time * NUMBER_SPIN_SPEED + token.phaseOffset;
            token.ring.material.opacity = 0.14 + Math.sin(this.time * 2 + token.phaseOffset) * 0.08;
            token.beacon.material.opacity = (token.isTarget ? 0.2 : 0.1) + Math.sin(this.time * 2.4 + token.phaseOffset) * 0.08;
        }
    }

    update(delta, character, expectedValue, onCollect) {
        this.animate(delta);
        const characterPosition = character.getPosition();

        for (const token of this.numbers) {
            if (token.collected) continue;

            const dx = characterPosition.x - token.group.position.x;
            const dz = characterPosition.z - token.group.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance < COLLECTION_RADIUS && token.value === expectedValue) {
                token.collected = true;
                this.collectNumber(token, onCollect);
                break;
            }
        }
    }

    collectNumber(token, onCollect) {
        const duration = 0.4;
        let elapsed = 0;

        const animateCollect = () => {
            elapsed += 0.016;
            const t = Math.min(elapsed / duration, 1);

            token.group.position.y += 0.08;
            const scale = 1 + t * 0.55;
            token.group.scale.set(scale, scale, scale);
            token.group.rotation.y += 0.24;

            token.group.traverse((child) => {
                if (!child.material) return;

                if (Array.isArray(child.material)) {
                    child.material.forEach((material) => {
                        material.transparent = true;
                        material.opacity *= 0.9;
                    });
                } else {
                    child.material.transparent = true;
                    child.material.opacity *= 0.9;
                }
            });

            if (t < 1) {
                requestAnimationFrame(animateCollect);
            } else {
                this.scene.remove(token.group);
            }
        };

        animateCollect();
        if (onCollect) onCollect(token);
    }

    getActivePositions() {
        return this.numbers.filter((token) => !token.collected).map((token) => token.group.position);
    }

    reset() {
        for (const token of this.numbers) {
            this.scene.remove(token.group);
            token.group.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (!child.material) return;

                if (Array.isArray(child.material)) {
                    child.material.forEach((material) => {
                        if (material.map) material.map.dispose();
                        material.dispose();
                    });
                } else {
                    if (child.material.map) child.material.map.dispose();
                    child.material.dispose();
                }
            });
        }

        this.numbers = [];
        this.time = 0;
    }
}