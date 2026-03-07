import * as THREE from 'three';

const COLLECTION_RADIUS = 2.0;
const LETTER_FLOAT_HEIGHT = 0.8;
const LETTER_BOUNCE_SPEED = 1.5;
const LETTER_BOUNCE_AMPLITUDE = 0.2;
const LETTER_SPIN_SPEED = 0.8;
const EXTRA_LETTERS_COUNT = 40; // extra random letters scattered around
const ALL_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Each letter has a fixed, distinct color
const LETTER_COLORS = {
    A: 0xff4444, B: 0xffdd00, C: 0x44cc44, D: 0xff8800,
    E: 0x4488ff, F: 0xff44ff, G: 0x00ccaa, H: 0xcc44ff,
    I: 0xff6666, J: 0x66ddff, K: 0xffaa44, L: 0x88ff44,
    M: 0xff4488, N: 0x44ffcc, O: 0xddaa00, P: 0xaa66ff,
    Q: 0xff8866, R: 0x44aaff, S: 0xffcc44, T: 0x66ff88,
    U: 0xdd66ff, V: 0x44dddd, W: 0xffffff, X: 0xff6644,
    Y: 0xaaff66, Z: 0x6688ff,
};

export class LetterManager {
    constructor(scene) {
        this.scene = scene;
        this.letters = [];
        this.time = 0;
    }

    spawnLetters(word, roomBounds) {
        this.reset();
        this.targetWord = word.toUpperCase();
        const needed = this.targetWord.split('');
        const margin = 3;
        const half = roomBounds / 2 - margin;
        const minDist = 4; // minimum distance between letters
        const placed = [];

        const pickPos = () => {
            for (let attempt = 0; attempt < 50; attempt++) {
                const x = (Math.random() - 0.5) * 2 * half;
                const z = (Math.random() - 0.5) * 2 * half;
                let tooClose = false;
                for (const p of placed) {
                    if ((x - p.x) ** 2 + (z - p.z) ** 2 < minDist * minDist) {
                        tooClose = true; break;
                    }
                }
                if (!tooClose) { placed.push({ x, z }); return { x, z }; }
            }
            const x = (Math.random() - 0.5) * 2 * half;
            const z = (Math.random() - 0.5) * 2 * half;
            placed.push({ x, z });
            return { x, z };
        };

        // Spawn the word letters (must be present)
        for (let i = 0; i < needed.length; i++) {
            const char = needed[i];
            if (char === ' ') continue;
            const pos = pickPos();
            this.createLetter(char, pos.x, LETTER_FLOAT_HEIGHT, pos.z, i, true);
        }

        // Spawn duplicates of word letters (2-3 copies each)
        for (const char of needed) {
            if (char === ' ') continue;
            const copies = 2 + Math.floor(Math.random() * 2); // 2-3
            for (let c = 0; c < copies; c++) {
                const pos = pickPos();
                this.createLetter(char, pos.x, LETTER_FLOAT_HEIGHT, pos.z, -1, false);
            }
        }

        // Spawn extra random letters
        for (let i = 0; i < EXTRA_LETTERS_COUNT; i++) {
            const char = ALL_CHARS[Math.floor(Math.random() * ALL_CHARS.length)];
            const pos = pickPos();
            this.createLetter(char, pos.x, LETTER_FLOAT_HEIGHT, pos.z, -1, false);
        }
    }

    createLetter(char, x, y, z, orderIndex, isWordLetter = false) {
        const group = new THREE.Group();
        const color = LETTER_COLORS[char] || 0xffffff;

        // 3D letter using extruded shape via canvas texture on a box
        const letterMesh = this._buildLetterMesh(char, color);
        group.add(letterMesh);

        // Glow ring on the ground
        const ringGeometry = new THREE.RingGeometry(0.8, 1.1, 24);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.25,
            side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = -LETTER_FLOAT_HEIGHT + 0.05;
        group.add(ring);

        // Vertical light pillar
        const beaconGeometry = new THREE.CylinderGeometry(0.03, 0.12, 6, 6);
        const beaconMaterial = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.2,
        });
        const beacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
        beacon.position.y = 3;
        group.add(beacon);

        group.position.set(x, y, z);
        this.scene.add(group);

        this.letters.push({
            group,
            ring,
            beacon,
            char,
            baseY: y,
            phaseOffset: Math.random() * Math.PI * 2,
            collected: false,
            orderIndex,
            isWordLetter,
        });
    }

    _buildLetterMesh(char, color) {
        // Create a canvas texture with the letter
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
        ctx.font = 'bold 100px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(char, 64, 68);

        // Add white outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeText(char, 64, 68);

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;

        // Front face
        const frontMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
        });
        // Side material
        const sideMaterial = new THREE.MeshLambertMaterial({
            color,
            emissive: color,
            emissiveIntensity: 0.3,
        });

        const geometry = new THREE.BoxGeometry(1.2, 1.2, 0.4);
        const materials = [
            sideMaterial, sideMaterial, // left, right
            sideMaterial, sideMaterial, // top, bottom
            frontMaterial, frontMaterial, // front, back
        ];
        const mesh = new THREE.Mesh(geometry, materials);
        mesh.castShadow = true;
        return mesh;
    }

    animate(delta) {
        this.time += delta;
        for (const letter of this.letters) {
            if (letter.collected) continue;
            letter.group.position.y =
                letter.baseY + Math.sin(this.time * LETTER_BOUNCE_SPEED + letter.phaseOffset) * LETTER_BOUNCE_AMPLITUDE;
            letter.group.rotation.y = this.time * LETTER_SPIN_SPEED + letter.phaseOffset;

            // Pulse ring
            letter.ring.material.opacity = 0.15 + Math.sin(this.time * 2 + letter.phaseOffset) * 0.1;
            // Pulse beacon
            letter.beacon.material.opacity = 0.12 + Math.sin(this.time * 2.5 + letter.phaseOffset) * 0.08;
        }
    }

    update(delta, character, expectedChar, onCollect) {
        this.animate(delta);
        const charPos = character.getPosition();

        for (const letter of this.letters) {
            if (letter.collected) continue;

            const dx = charPos.x - letter.group.position.x;
            const dz = charPos.z - letter.group.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance < COLLECTION_RADIUS && letter.char === expectedChar) {
                letter.collected = true;
                this.collectLetter(letter, onCollect);
                break; // only collect one per frame
            }
        }
    }

    collectLetter(letter, onCollect) {
        const duration = 0.4;
        let elapsed = 0;

        const animateCollect = () => {
            elapsed += 0.016;
            const t = Math.min(elapsed / duration, 1);

            letter.group.position.y += 0.08;
            const scale = 1 + t * 0.6;
            letter.group.scale.set(scale, scale, scale);
            letter.group.rotation.y += 0.25;

            letter.group.traverse((child) => {
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => { m.transparent = true; m.opacity *= 0.9; });
                    } else {
                        child.material.transparent = true;
                        child.material.opacity *= 0.9;
                    }
                }
            });

            if (t < 1) {
                requestAnimationFrame(animateCollect);
            } else {
                this.scene.remove(letter.group);
            }
        };

        animateCollect();
        if (onCollect) onCollect(letter);
    }

    getActivePositions() {
        return this.letters
            .filter(l => !l.collected)
            .map(l => l.group.position);
    }

    getActiveLetters() {
        return this.letters.filter(l => !l.collected);
    }

    getRemainingCount() {
        return this.letters.filter(l => !l.collected).length;
    }

    reset() {
        for (const letter of this.letters) {
            this.scene.remove(letter.group);
            letter.group.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        }
        this.letters = [];
        this.time = 0;
    }
}
