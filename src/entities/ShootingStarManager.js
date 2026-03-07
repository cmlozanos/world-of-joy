import * as THREE from 'three';

const SPAWN_INTERVAL_MIN = 3;
const SPAWN_INTERVAL_MAX = 6;
const STAR_LIFETIME = 12;
const FALL_SPEED = 15;
const GROUND_LINGER = 10;
const COLLECTION_RADIUS = 3.0;
const MAX_ACTIVE_STARS = 5;
const STAR_SCALE = 2.0;
const BEACON_HEIGHT = 12;

export class ShootingStarManager {
    constructor(scene) {
        this.scene = scene;
        this.stars = [];
        this.spawnTimer = 2;
        this.time = 0;
        this.world = null;
        this.enabled = false;
    }

    init(world) {
        this.world = world;
        this.enabled = true;
        this.spawnTimer = 1;
    }

    reset() {
        for (const star of this.stars) {
            this.scene.remove(star.group);
            star.group.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
        this.stars = [];
        this.spawnTimer = 2;
        this.time = 0;
        this.enabled = false;
    }

    createStar(x, z) {
        const group = new THREE.Group();

        // Star body - 5-pointed star shape using merged cones
        const starBody = new THREE.Group();
        const coneGeometry = new THREE.ConeGeometry(0.12, 0.35, 4);
        const starMaterial = new THREE.MeshPhongMaterial({
            color: 0xffdd44,
            emissive: 0xffaa00,
            emissiveIntensity: 0.6,
            shininess: 100,
        });

        for (let i = 0; i < 5; i++) {
            const spike = new THREE.Mesh(coneGeometry, starMaterial);
            const angle = (i / 5) * Math.PI * 2;
            spike.rotation.z = -Math.PI / 2;
            spike.rotation.y = angle;
            spike.position.set(Math.cos(angle) * 0.12, 0, Math.sin(angle) * 0.12);
            starBody.add(spike);
        }

        // Central sphere
        const coreGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9,
        });
        starBody.add(new THREE.Mesh(coreGeometry, coreMaterial));

        group.add(starBody);

        // Glow ring
        const glowGeometry = new THREE.RingGeometry(0.4, 0.8, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffdd44,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.rotation.x = -Math.PI / 2;
        group.add(glow);

        // Upward beacon so player can spot it from distance
        const beaconGeometry = new THREE.CylinderGeometry(0.04, 0.2, BEACON_HEIGHT, 6);
        const beaconMaterial = new THREE.MeshBasicMaterial({
            color: 0xffdd44,
            transparent: true,
            opacity: 0.25,
        });
        const beacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
        beacon.position.y = BEACON_HEIGHT / 2;
        group.add(beacon);

        // Trail particles (pre-placed, animated later)
        const trailGroup = new THREE.Group();
        const trailGeometry = new THREE.SphereGeometry(0.06, 4, 4);
        for (let i = 0; i < 8; i++) {
            const trailMaterial = new THREE.MeshBasicMaterial({
                color: 0xffcc00,
                transparent: true,
                opacity: 0.5 - i * 0.05,
            });
            const trail = new THREE.Mesh(trailGeometry, trailMaterial);
            trail.position.y = 0.5 + i * 0.4;
            trailGroup.add(trail);
        }
        group.add(trailGroup);

        group.scale.set(STAR_SCALE, STAR_SCALE, STAR_SCALE);

        const groundY = this.world.getHeightAt(x, z);
        const startY = groundY + 60 + Math.random() * 20;
        group.position.set(x, startY, z);
        this.scene.add(group);

        this.stars.push({
            group,
            starBody,
            trailGroup,
            beacon,
            glow,
            groundY: groundY + 1.5,
            targetY: groundY + 1.5,
            state: 'falling',
            lifetime: STAR_LIFETIME,
            lingerTimer: GROUND_LINGER,
            collected: false,
        });
    }

    getActivePositions() {
        return this.stars
            .filter((s) => !s.collected && s.state === 'grounded')
            .map((s) => s.group.position);
    }

    animate(delta) {
        this.time += delta;
        for (const star of this.stars) {
            if (star.collected) continue;

            star.starBody.rotation.y = this.time * 2;
            star.glow.material.opacity = 0.2 + Math.sin(this.time * 3) * 0.15;

            // Pulse beacon
            const beaconPulse = 0.18 + Math.sin(this.time * 2.5) * 0.1;
            star.beacon.material.opacity = beaconPulse;

            if (star.state === 'falling') {
                star.group.position.y -= FALL_SPEED * delta;
                // Animate trail during fall
                for (let i = 0; i < star.trailGroup.children.length; i++) {
                    star.trailGroup.children[i].position.y = 0.5 + i * 0.5;
                    star.trailGroup.children[i].material.opacity = 0.5 - i * 0.06;
                }
                if (star.group.position.y <= star.targetY) {
                    star.group.position.y = star.targetY;
                    star.state = 'grounded';
                    // Hide trail when grounded
                    star.trailGroup.visible = false;
                }
            } else if (star.state === 'grounded') {
                star.lingerTimer -= delta;
                star.group.position.y = star.targetY + Math.sin(this.time * 2) * 0.15;

                // Start blinking when about to expire
                if (star.lingerTimer <= 3) {
                    const blink = Math.sin(this.time * 10) > 0;
                    star.group.visible = blink;
                }

                if (star.lingerTimer <= 0) {
                    star.state = 'expired';
                }
            }
        }
    }

    update(delta, character, onCollect) {
        if (!this.enabled) return;

        this.animate(delta);

        // Spawn new stars
        this.spawnTimer -= delta;
        const activeCount = this.stars.filter((s) => !s.collected && s.state !== 'expired').length;
        if (this.spawnTimer <= 0 && activeCount < MAX_ACTIVE_STARS) {
            const bounds = this.world.getWorldBounds() - 30;
            const x = (Math.random() - 0.5) * 2 * bounds;
            const z = (Math.random() - 0.5) * 2 * bounds;
            this.createStar(x, z);
            this.spawnTimer = SPAWN_INTERVAL_MIN + Math.random() * (SPAWN_INTERVAL_MAX - SPAWN_INTERVAL_MIN);
        }

        // Check collection
        const charPos = character.getPosition();
        for (let i = this.stars.length - 1; i >= 0; i--) {
            const star = this.stars[i];

            if (star.state === 'expired') {
                this.removeStar(star, i);
                continue;
            }

            if (star.collected || star.state !== 'grounded') continue;

            const dx = charPos.x - star.group.position.x;
            const dy = charPos.y - star.group.position.y;
            const dz = charPos.z - star.group.position.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (distance < COLLECTION_RADIUS) {
                star.collected = true;
                this.collectStar(star, i, onCollect);
            }
        }
    }

    removeStar(star, index) {
        this.scene.remove(star.group);
        star.group.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
        this.stars.splice(index, 1);
    }

    collectStar(star, index, onCollect) {
        const duration = 0.4;
        let elapsed = 0;

        const animateCollect = () => {
            elapsed += 0.016;
            const t = Math.min(elapsed / duration, 1);

            star.group.position.y += 0.15;
            const scale = STAR_SCALE * (1 + t * 0.5);
            star.group.scale.set(scale, scale, scale);

            star.group.traverse((child) => {
                if (child.material) {
                    child.material.transparent = true;
                    child.material.opacity *= 0.88;
                }
            });

            if (t < 1) {
                requestAnimationFrame(animateCollect);
            } else {
                this.removeStar(star, this.stars.indexOf(star));
            }
        };

        star.group.visible = true;
        animateCollect();

        if (onCollect) {
            onCollect(star);
        }
    }
}
