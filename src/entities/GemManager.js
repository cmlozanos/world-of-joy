import * as THREE from 'three';

const GEM_COUNT = 30;
const COLLECTION_RADIUS = 2.5;
const FLOAT_SPEED = 1.2;
const FLOAT_AMPLITUDE = 0.2;
const SPIN_SPEED = 1.8;
const GEM_SCALE = 1.8;
const BEACON_HEIGHT = 10;

const GEM_TYPES = [
    { color: 0xff0066, emissive: 0xcc0044, name: 'ruby' },
    { color: 0x00ccff, emissive: 0x0088cc, name: 'sapphire' },
    { color: 0x44ff44, emissive: 0x22aa22, name: 'emerald' },
    { color: 0xaa44ff, emissive: 0x7722cc, name: 'amethyst' },
    { color: 0xffdd00, emissive: 0xccaa00, name: 'topaz' },
];

export class GemManager {
    constructor(scene) {
        this.scene = scene;
        this.gems = [];
        this.time = 0;
    }

    spawn(world) {
        const bounds = world.getWorldBounds() - 20;

        for (let i = 0; i < GEM_COUNT; i++) {
            const x = (Math.random() - 0.5) * 2 * bounds;
            const z = (Math.random() - 0.5) * 2 * bounds;
            const y = world.getHeightAt(x, z);
            this.createGem(x, y, z);
        }
    }

    createGem(x, y, z) {
        const type = GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
        const group = new THREE.Group();

        // Diamond-shaped gem body (two cones)
        const topGeometry = new THREE.ConeGeometry(0.18, 0.25, 6);
        const material = new THREE.MeshPhongMaterial({
            color: type.color,
            emissive: type.emissive,
            emissiveIntensity: 0.4,
            shininess: 120,
            transparent: true,
            opacity: 0.85,
        });
        const top = new THREE.Mesh(topGeometry, material);
        top.position.y = 0.125;
        group.add(top);

        const bottomGeometry = new THREE.ConeGeometry(0.18, 0.15, 6);
        const bottom = new THREE.Mesh(bottomGeometry, material.clone());
        bottom.rotation.x = Math.PI;
        bottom.position.y = -0.075;
        group.add(bottom);

        // Sparkle particles around gem
        const sparkleGeometry = new THREE.SphereGeometry(0.03, 4, 4);
        const sparkleMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.7,
        });
        for (let i = 0; i < 4; i++) {
            const sparkle = new THREE.Mesh(sparkleGeometry, sparkleMaterial.clone());
            const angle = (i / 4) * Math.PI * 2;
            sparkle.position.set(Math.cos(angle) * 0.3, 0, Math.sin(angle) * 0.3);
            group.add(sparkle);
        }

        // Ground glow ring
        const glowGeometry = new THREE.RingGeometry(0.3, 0.6, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: type.color,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide,
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.rotation.x = -Math.PI / 2;
        glow.position.y = -0.3;
        group.add(glow);

        // Beacon pillar
        const beaconGeometry = new THREE.CylinderGeometry(0.04, 0.18, BEACON_HEIGHT, 6);
        const beaconMaterial = new THREE.MeshBasicMaterial({
            color: type.color,
            transparent: true,
            opacity: 0.3,
        });
        const beacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
        beacon.position.y = BEACON_HEIGHT / 2;
        beacon.visible = false;
        group.add(beacon);

        // Beacon top glow sphere
        const beaconTopGeo = new THREE.SphereGeometry(0.1, 8, 8);
        const beaconTopMat = new THREE.MeshBasicMaterial({
            color: type.color,
            transparent: true,
            opacity: 0.5,
        });
        const beaconTop = new THREE.Mesh(beaconTopGeo, beaconTopMat);
        beaconTop.position.y = BEACON_HEIGHT;
        beaconTop.visible = false;
        group.add(beaconTop);

        group.scale.set(GEM_SCALE, GEM_SCALE, GEM_SCALE);

        const baseY = y + 1.2;
        group.position.set(x, baseY, z);
        this.scene.add(group);

        this.gems.push({
            group,
            beacon,
            beaconTop,
            baseY,
            phaseOffset: Math.random() * Math.PI * 2,
            collected: false,
            type,
        });
    }

    setBeaconsVisible(visible) {
        for (const gem of this.gems) {
            if (!gem.collected) {
                gem.beacon.visible = visible;
                gem.beaconTop.visible = visible;
            }
        }
    }

    getActivePositions() {
        return this.gems
            .filter((g) => !g.collected)
            .map((g) => g.group.position);
    }

    reset() {
        for (const gem of this.gems) {
            this.scene.remove(gem.group);
            gem.group.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
        this.gems = [];
        this.time = 0;
    }

    animate(delta) {
        this.time += delta;
        for (const gem of this.gems) {
            if (gem.collected) continue;
            gem.group.position.y =
                gem.baseY + Math.sin(this.time * FLOAT_SPEED + gem.phaseOffset) * FLOAT_AMPLITUDE;
            gem.group.rotation.y = this.time * SPIN_SPEED;

            // Animate sparkles orbiting
            const children = gem.group.children;
            for (let i = 2; i < 6; i++) {
                if (!children[i]) continue;
                const angle = (i - 2) / 4 * Math.PI * 2 + this.time * 2;
                children[i].position.set(
                    Math.cos(angle) * 0.3,
                    Math.sin(this.time * 3 + i) * 0.1,
                    Math.sin(angle) * 0.3
                );
                children[i].material.opacity = 0.4 + Math.sin(this.time * 4 + i) * 0.3;
            }

            // Pulse beacon
            if (gem.beacon.visible) {
                const pulse = 0.2 + Math.sin(this.time * 2.5 + gem.phaseOffset) * 0.12;
                gem.beacon.material.opacity = pulse;
                gem.beaconTop.material.opacity = 0.4 + Math.sin(this.time * 3 + gem.phaseOffset) * 0.2;
                const s = 0.08 + Math.sin(this.time * 3 + gem.phaseOffset) * 0.04;
                gem.beaconTop.scale.setScalar(s / 0.1);
            }
        }
    }

    update(delta, character, onCollect) {
        this.animate(delta);
        const charPos = character.getPosition();

        for (let i = this.gems.length - 1; i >= 0; i--) {
            const gem = this.gems[i];
            if (gem.collected) continue;

            const dx = charPos.x - gem.group.position.x;
            const dz = charPos.z - gem.group.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance < COLLECTION_RADIUS) {
                gem.collected = true;
                this.collectGem(gem, onCollect);
            }
        }
    }

    collectGem(gem, onCollect) {
        const duration = 0.5;
        let elapsed = 0;

        const animateCollect = () => {
            elapsed += 0.016;
            const t = Math.min(elapsed / duration, 1);

            const scale = GEM_SCALE * (1 + t * 0.8);
            gem.group.scale.set(scale, scale, scale);
            gem.group.rotation.y += 0.3;

            gem.group.traverse((child) => {
                if (child.material) {
                    child.material.transparent = true;
                    child.material.opacity *= 0.92;
                }
            });

            if (t < 1) {
                requestAnimationFrame(animateCollect);
            } else {
                this.scene.remove(gem.group);
                this.gems.splice(this.gems.indexOf(gem), 1);
            }
        };

        animateCollect();

        if (onCollect) {
            onCollect(gem);
        }
    }
}
