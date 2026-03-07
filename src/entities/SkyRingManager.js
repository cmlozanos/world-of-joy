import * as THREE from 'three';

const RING_COUNT = 20;
const RING_RADIUS = 2.0;
const RING_TUBE = 0.12;
const DETECTION_RADIUS = 2.5;
const FLOAT_HEIGHT_MIN = 4;
const FLOAT_HEIGHT_MAX = 12;
const RING_BOB_SPEED = 1.0;
const RING_BOB_AMPLITUDE = 0.4;

const RING_COLORS = [
    { color: 0xff4444, emissive: 0xcc0000 },
    { color: 0x44ff44, emissive: 0x00cc00 },
    { color: 0x4488ff, emissive: 0x0044cc },
    { color: 0xffaa00, emissive: 0xcc8800 },
    { color: 0xff44ff, emissive: 0xcc00cc },
];

export class SkyRingManager {
    constructor(scene) {
        this.scene = scene;
        this.rings = [];
        this.time = 0;
    }

    spawn(world) {
        const bounds = world.getWorldBounds() - 25;

        for (let i = 0; i < RING_COUNT; i++) {
            const x = (Math.random() - 0.5) * 2 * bounds;
            const z = (Math.random() - 0.5) * 2 * bounds;
            const groundY = world.getHeightAt(x, z);
            const floatHeight = FLOAT_HEIGHT_MIN + Math.random() * (FLOAT_HEIGHT_MAX - FLOAT_HEIGHT_MIN);
            const y = groundY + floatHeight;
            this.createRing(x, y, z, floatHeight);
        }
    }

    createRing(x, y, z, floatHeight) {
        const colorSet = RING_COLORS[Math.floor(Math.random() * RING_COLORS.length)];
        const group = new THREE.Group();

        // Main ring torus
        const ringGeometry = new THREE.TorusGeometry(RING_RADIUS, RING_TUBE, 12, 32);
        const ringMaterial = new THREE.MeshPhongMaterial({
            color: colorSet.color,
            emissive: colorSet.emissive,
            emissiveIntensity: 0.35,
            shininess: 80,
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);

        // Inner glow disc
        const discGeometry = new THREE.CircleGeometry(RING_RADIUS - 0.2, 24);
        const discMaterial = new THREE.MeshBasicMaterial({
            color: colorSet.color,
            transparent: true,
            opacity: 0.08,
            side: THREE.DoubleSide,
        });
        const disc = new THREE.Mesh(discGeometry, discMaterial);
        disc.rotation.x = Math.PI / 2;
        group.add(disc);

        // Sparkle particles at cardinal points
        const sparkleGeometry = new THREE.SphereGeometry(0.08, 4, 4);
        for (let i = 0; i < 4; i++) {
            const sparkleMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.6,
            });
            const sparkle = new THREE.Mesh(sparkleGeometry, sparkleMaterial);
            const angle = (i / 4) * Math.PI * 2;
            sparkle.position.set(
                Math.cos(angle) * RING_RADIUS,
                0,
                Math.sin(angle) * RING_RADIUS
            );
            group.add(sparkle);
        }

        // Vertical beam below ring so player can see it from ground
        const beamGeometry = new THREE.CylinderGeometry(0.05, 0.3, floatHeight, 6);
        const beamMaterial = new THREE.MeshBasicMaterial({
            color: colorSet.color,
            transparent: true,
            opacity: 0.12,
        });
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        beam.position.y = -floatHeight / 2;
        group.add(beam);

        group.position.set(x, y, z);
        this.scene.add(group);

        this.rings.push({
            group,
            disc,
            baseY: y,
            phaseOffset: Math.random() * Math.PI * 2,
            passed: false,
            colorSet,
        });
    }

    getActivePositions() {
        return this.rings
            .filter((r) => !r.passed)
            .map((r) => r.group.position);
    }

    reset() {
        for (const ring of this.rings) {
            this.scene.remove(ring.group);
            ring.group.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
        this.rings = [];
        this.time = 0;
    }

    animate(delta) {
        this.time += delta;
        for (const ring of this.rings) {
            if (ring.passed) continue;
            ring.group.position.y =
                ring.baseY + Math.sin(this.time * RING_BOB_SPEED + ring.phaseOffset) * RING_BOB_AMPLITUDE;

            // Rotate sparkles
            const children = ring.group.children;
            for (let i = 2; i < 6; i++) {
                if (!children[i]) continue;
                const angle = (i - 2) / 4 * Math.PI * 2 + this.time * 1.5;
                children[i].position.set(
                    Math.cos(angle) * RING_RADIUS,
                    0,
                    Math.sin(angle) * RING_RADIUS
                );
                children[i].material.opacity = 0.4 + Math.sin(this.time * 3 + i) * 0.2;
            }

            // Pulse disc
            ring.disc.material.opacity = 0.05 + Math.sin(this.time * 2 + ring.phaseOffset) * 0.04;
        }
    }

    update(delta, character, onPass) {
        this.animate(delta);
        const charPos = character.getPosition();

        for (const ring of this.rings) {
            if (ring.passed) continue;

            const dx = charPos.x - ring.group.position.x;
            const dy = charPos.y - ring.group.position.y;
            const dz = charPos.z - ring.group.position.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (distance < DETECTION_RADIUS) {
                ring.passed = true;
                this.onRingPassed(ring, onPass);
            }
        }
    }

    onRingPassed(ring, onPass) {
        const duration = 0.6;
        let elapsed = 0;

        const animatePass = () => {
            elapsed += 0.016;
            const t = Math.min(elapsed / duration, 1);

            const scale = 1 + t * 1.5;
            ring.group.scale.set(scale, scale, scale);

            ring.group.traverse((child) => {
                if (child.material) {
                    child.material.transparent = true;
                    child.material.opacity *= 0.9;
                }
            });

            if (t < 1) {
                requestAnimationFrame(animatePass);
            } else {
                this.scene.remove(ring.group);
                this.rings.splice(this.rings.indexOf(ring), 1);
            }
        };

        animatePass();

        if (onPass) {
            onPass(ring);
        }
    }
}
