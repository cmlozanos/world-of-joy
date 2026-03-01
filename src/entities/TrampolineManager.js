import * as THREE from 'three';

const TRAMPOLINE_COUNT = 25;
const BOUNCE_FORCE = 18;
const TRAMPOLINE_RADIUS = 1.2;
const DETECTION_RADIUS = 1.5;
const BOUNCE_ANIMATION_SPEED = 8;

export class TrampolineManager {
    constructor(scene) {
        this.scene = scene;
        this.trampolines = [];
        this.time = 0;
    }

    spawn(world) {
        const bounds = world.getWorldBounds() - 15;

        for (let i = 0; i < TRAMPOLINE_COUNT; i++) {
            const x = (Math.random() - 0.5) * 2 * bounds;
            const z = (Math.random() - 0.5) * 2 * bounds;
            const y = world.getHeightAt(x, z);
            this.createTrampoline(x, y, z);
        }
    }

    createTrampoline(x, y, z) {
        const group = new THREE.Group();

        // Base ring - metallic frame
        const ringGeometry = new THREE.TorusGeometry(TRAMPOLINE_RADIUS, 0.08, 8, 24);
        const ringMaterial = new THREE.MeshPhongMaterial({
            color: 0xc0c0c0,
            emissive: 0x444444,
            emissiveIntensity: 0.2,
            shininess: 80,
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.3;
        group.add(ring);

        // Legs (4 supports)
        const legGeometry = new THREE.CylinderGeometry(0.04, 0.06, 0.3, 6);
        const legMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
        const legPositions = [
            [0.8, 0, 0.8],
            [-0.8, 0, 0.8],
            [0.8, 0, -0.8],
            [-0.8, 0, -0.8],
        ];
        for (const [lx, , lz] of legPositions) {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(lx, 0.15, lz);
            group.add(leg);
        }

        // Bounce surface - colorful stretchy pad
        const padGeometry = new THREE.CircleGeometry(TRAMPOLINE_RADIUS - 0.1, 24);
        const padMaterial = new THREE.MeshPhongMaterial({
            color: 0xff4081,
            emissive: 0xff1744,
            emissiveIntensity: 0.15,
            side: THREE.DoubleSide,
        });
        const pad = new THREE.Mesh(padGeometry, padMaterial);
        pad.rotation.x = -Math.PI / 2;
        pad.position.y = 0.3;
        group.add(pad);

        // Decorative colored edge stripes
        const stripeColors = [0xffeb3b, 0x4caf50, 0x2196f3, 0xff9800];
        for (let i = 0; i < 4; i++) {
            const stripeGeometry = new THREE.TorusGeometry(
                TRAMPOLINE_RADIUS - 0.03,
                0.025,
                4,
                24,
                Math.PI / 2
            );
            const stripeMaterial = new THREE.MeshBasicMaterial({
                color: stripeColors[i],
            });
            const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
            stripe.rotation.x = Math.PI / 2;
            stripe.rotation.z = (i * Math.PI) / 2;
            stripe.position.y = 0.32;
            group.add(stripe);
        }

        // Glow indicator ring on the ground
        const glowGeometry = new THREE.RingGeometry(TRAMPOLINE_RADIUS + 0.1, TRAMPOLINE_RADIUS + 0.3, 24);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff4081,
            transparent: true,
            opacity: 0.25,
            side: THREE.DoubleSide,
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.rotation.x = -Math.PI / 2;
        glow.position.y = 0.02;
        group.add(glow);

        // Upward arrow indicators (so kids know it bounces)
        const arrowGroup = new THREE.Group();
        for (let i = 0; i < 3; i++) {
            const arrowGeometry = new THREE.ConeGeometry(0.08, 0.2, 4);
            const arrowMaterial = new THREE.MeshBasicMaterial({
                color: 0xffeb3b,
                transparent: true,
                opacity: 0.6,
            });
            const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
            arrow.position.y = 0.6 + i * 0.3;
            arrowGroup.add(arrow);
        }
        group.add(arrowGroup);

        group.position.set(x, y, z);
        this.scene.add(group);

        this.trampolines.push({
            group,
            pad,
            arrowGroup,
            glow,
            x,
            y,
            z,
            bounceTimer: 0,
            padBaseY: 0.3,
        });
    }

    update(delta, character) {
        this.time += delta;
        const charPos = character.getPosition();

        for (const t of this.trampolines) {
            // Animate arrows floating up
            for (let i = 0; i < t.arrowGroup.children.length; i++) {
                const arrow = t.arrowGroup.children[i];
                const offset = (this.time * 1.5 + i * 0.4) % 1.5;
                arrow.position.y = 0.5 + offset * 0.6;
                arrow.material.opacity = 0.6 * (1 - offset / 1.5);
            }

            // Glow pulse
            t.glow.material.opacity = 0.15 + Math.sin(this.time * 3) * 0.1;

            // Bounce animation recovery
            if (t.bounceTimer > 0) {
                t.bounceTimer -= delta * BOUNCE_ANIMATION_SPEED;
                const depress = Math.sin(t.bounceTimer * Math.PI) * 0.1;
                t.pad.position.y = t.padBaseY - Math.max(0, depress);
            }

            // Check if character lands on trampoline
            const dx = charPos.x - t.x;
            const dz = charPos.z - t.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            const heightDiff = charPos.y - t.y;

            if (dist < DETECTION_RADIUS && heightDiff >= -0.1 && heightDiff < 1.0 && character.velocity.y <= 0) {
                character.velocity.y = BOUNCE_FORCE;
                character.isGrounded = false;
                t.bounceTimer = 1;
            }
        }
    }

    getTrampolinePositions() {
        return this.trampolines.map((t) => new THREE.Vector3(t.x, t.y, t.z));
    }
}
