import * as THREE from 'three';

const BUTTERFLY_COUNT = 30;
const RABBIT_COUNT = 15;
const BIRD_COUNT = 12;

const BUTTERFLY_COLORS = [0xff69b4, 0xffa500, 0xffff00, 0x87ceeb, 0xda70d6, 0x00ff7f];

export class Wildlife {
    constructor(scene) {
        this.scene = scene;
        this.butterflies = [];
        this.rabbits = [];
        this.birds = [];
    }

    spawn(world) {
        const bounds = world.getWorldBounds() - 20;
        this.spawnButterflies(world, bounds);
        this.spawnRabbits(world, bounds);
        this.spawnBirds(bounds);
    }

    spawnButterflies(world, bounds) {
        for (let i = 0; i < BUTTERFLY_COUNT; i++) {
            const x = (Math.random() - 0.5) * 2 * bounds;
            const z = (Math.random() - 0.5) * 2 * bounds;
            const y = world.getHeightAt(x, z) + 1.5 + Math.random() * 2;
            const butterfly = this.createButterfly(x, y, z);
            this.butterflies.push(butterfly);
        }
    }

    createButterfly(x, y, z) {
        const group = new THREE.Group();
        const color = BUTTERFLY_COLORS[Math.floor(Math.random() * BUTTERFLY_COLORS.length)];

        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.bezierCurveTo(0.12, 0.15, 0.25, 0.12, 0.2, 0);
        wingShape.bezierCurveTo(0.25, -0.1, 0.1, -0.12, 0, 0);

        const wingGeometry = new THREE.ShapeGeometry(wingShape);
        const wingMaterial = new THREE.MeshLambertMaterial({
            color,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.85,
        });

        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.rotation.y = 0;
        group.add(leftWing);

        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.scale.x = -1;
        group.add(rightWing);

        // Body
        const bodyGeometry = new THREE.CylinderGeometry(0.01, 0.015, 0.15, 4);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.x = Math.PI / 2;
        group.add(body);

        group.position.set(x, y, z);
        this.scene.add(group);

        return {
            group,
            baseY: y,
            phase: Math.random() * Math.PI * 2,
            speed: 0.5 + Math.random() * 1.0,
            radius: 2 + Math.random() * 4,
            centerX: x,
            centerZ: z,
            wingAngle: 0,
            leftWing,
            rightWing,
        };
    }

    spawnRabbits(world, bounds) {
        for (let i = 0; i < RABBIT_COUNT; i++) {
            const x = (Math.random() - 0.5) * 2 * bounds;
            const z = (Math.random() - 0.5) * 2 * bounds;
            const y = world.getHeightAt(x, z);
            const rabbit = this.createRabbit(x, y, z);
            this.rabbits.push(rabbit);
        }
    }

    createRabbit(x, y, z) {
        const group = new THREE.Group();
        const furColor = Math.random() > 0.5 ? 0xf5f5dc : 0xd2b48c;

        // Body
        const bodyGeometry = new THREE.SphereGeometry(0.2, 8, 6);
        const furMaterial = new THREE.MeshLambertMaterial({ color: furColor });
        const body = new THREE.Mesh(bodyGeometry, furMaterial);
        body.scale.set(1, 0.8, 1.2);
        body.position.y = 0.2;
        group.add(body);

        // Head
        const headGeometry = new THREE.SphereGeometry(0.14, 8, 6);
        const head = new THREE.Mesh(headGeometry, furMaterial);
        head.position.set(0, 0.32, 0.18);
        group.add(head);

        // Ears
        const earGeometry = new THREE.CylinderGeometry(0.02, 0.04, 0.2, 6);
        const leftEar = new THREE.Mesh(earGeometry, furMaterial);
        leftEar.position.set(-0.06, 0.5, 0.16);
        leftEar.rotation.z = 0.15;
        group.add(leftEar);

        const rightEar = new THREE.Mesh(earGeometry, furMaterial);
        rightEar.position.set(0.06, 0.5, 0.16);
        rightEar.rotation.z = -0.15;
        group.add(rightEar);

        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.025, 6, 6);
        const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.06, 0.35, 0.3);
        group.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.06, 0.35, 0.3);
        group.add(rightEye);

        // Nose
        const noseGeometry = new THREE.SphereGeometry(0.02, 6, 6);
        const noseMaterial = new THREE.MeshLambertMaterial({ color: 0xffaaaa });
        const nose = new THREE.Mesh(noseGeometry, noseMaterial);
        nose.position.set(0, 0.32, 0.32);
        group.add(nose);

        // Tail (fluffy ball)
        const tailGeometry = new THREE.SphereGeometry(0.06, 6, 6);
        const tail = new THREE.Mesh(tailGeometry, new THREE.MeshLambertMaterial({ color: 0xffffff }));
        tail.position.set(0, 0.22, -0.22);
        group.add(tail);

        group.position.set(x, y, z);
        this.scene.add(group);

        return {
            group,
            world: null,
            phase: Math.random() * Math.PI * 2,
            hopTimer: Math.random() * 3,
            hopCooldown: 2 + Math.random() * 4,
            direction: Math.random() * Math.PI * 2,
            isHopping: false,
            hopProgress: 0,
            startX: x,
            startZ: z,
            baseY: y,
        };
    }

    spawnBirds(bounds) {
        for (let i = 0; i < BIRD_COUNT; i++) {
            const x = (Math.random() - 0.5) * 2 * bounds;
            const z = (Math.random() - 0.5) * 2 * bounds;
            const y = 15 + Math.random() * 20;
            const bird = this.createBird(x, y, z);
            this.birds.push(bird);
        }
    }

    createBird(x, y, z) {
        const group = new THREE.Group();
        const birdColors = [0xff6347, 0x4682b4, 0xffd700, 0x32cd32, 0xff69b4];
        const color = birdColors[Math.floor(Math.random() * birdColors.length)];

        // Body
        const bodyGeometry = new THREE.SphereGeometry(0.12, 8, 6);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.scale.set(1, 0.8, 1.4);
        group.add(body);

        // Head
        const headGeometry = new THREE.SphereGeometry(0.08, 8, 6);
        const head = new THREE.Mesh(headGeometry, bodyMaterial);
        head.position.set(0, 0.06, 0.14);
        group.add(head);

        // Beak
        const beakGeometry = new THREE.ConeGeometry(0.03, 0.08, 4);
        const beakMaterial = new THREE.MeshLambertMaterial({ color: 0xffa500 });
        const beak = new THREE.Mesh(beakGeometry, beakMaterial);
        beak.position.set(0, 0.04, 0.22);
        beak.rotation.x = Math.PI / 2;
        group.add(beak);

        // Wings
        const wingGeometry = new THREE.PlaneGeometry(0.3, 0.1);
        const wingMaterial = new THREE.MeshLambertMaterial({
            color,
            side: THREE.DoubleSide,
        });

        const leftWingPivot = new THREE.Group();
        leftWingPivot.position.set(-0.1, 0.02, 0);
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.x = -0.15;
        leftWingPivot.add(leftWing);
        group.add(leftWingPivot);

        const rightWingPivot = new THREE.Group();
        rightWingPivot.position.set(0.1, 0.02, 0);
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.x = 0.15;
        rightWingPivot.add(rightWing);
        group.add(rightWingPivot);

        group.position.set(x, y, z);
        this.scene.add(group);

        return {
            group,
            leftWingPivot,
            rightWingPivot,
            phase: Math.random() * Math.PI * 2,
            speed: 1 + Math.random() * 2,
            radius: 20 + Math.random() * 40,
            centerX: x,
            centerZ: z,
            baseY: y,
        };
    }

    update(delta, world) {
        this.updateButterflies(delta);
        this.updateRabbits(delta, world);
        this.updateBirds(delta);
    }

    updateButterflies(delta) {
        for (const b of this.butterflies) {
            b.phase += delta * b.speed;

            // Circular flight pattern
            b.group.position.x = b.centerX + Math.cos(b.phase) * b.radius;
            b.group.position.z = b.centerZ + Math.sin(b.phase) * b.radius;
            b.group.position.y = b.baseY + Math.sin(b.phase * 2.5) * 0.5;

            // Face direction of movement
            b.group.rotation.y = -b.phase + Math.PI / 2;

            // Wing flapping
            b.wingAngle += delta * 12;
            const flap = Math.sin(b.wingAngle) * 0.7;
            b.leftWing.rotation.y = flap;
            b.rightWing.rotation.y = -flap;
        }
    }

    updateRabbits(delta, world) {
        for (const r of this.rabbits) {
            r.hopTimer += delta;

            if (!r.isHopping && r.hopTimer > r.hopCooldown) {
                r.isHopping = true;
                r.hopProgress = 0;
                r.hopTimer = 0;
                r.hopCooldown = 2 + Math.random() * 4;
                r.direction = Math.random() * Math.PI * 2;
            }

            if (r.isHopping) {
                r.hopProgress += delta * 3;
                const hopArc = Math.sin(r.hopProgress * Math.PI);
                r.group.position.y = r.baseY + hopArc * 0.4;

                const hopSpeed = 2;
                r.group.position.x += Math.sin(r.direction) * hopSpeed * delta;
                r.group.position.z += Math.cos(r.direction) * hopSpeed * delta;
                r.group.rotation.y = r.direction;

                if (r.hopProgress >= 1) {
                    r.isHopping = false;
                    r.baseY = world.getHeightAt(r.group.position.x, r.group.position.z);
                    r.group.position.y = r.baseY;
                }
            }

            // Idle ear twitch
            r.phase += delta;
        }
    }

    updateBirds(delta) {
        for (const b of this.birds) {
            b.phase += delta * b.speed * 0.3;

            // Circular soaring pattern
            b.group.position.x = b.centerX + Math.cos(b.phase) * b.radius;
            b.group.position.z = b.centerZ + Math.sin(b.phase) * b.radius;
            b.group.position.y = b.baseY + Math.sin(b.phase * 0.7) * 3;

            // Face direction of flight
            b.group.rotation.y = -b.phase + Math.PI / 2;

            // Wing flapping
            const flapSpeed = 6;
            const flap = Math.sin(b.phase * flapSpeed) * 0.5;
            b.leftWingPivot.rotation.z = flap;
            b.rightWingPivot.rotation.z = -flap;
        }
    }

    getActiveAnimals() {
        return {
            butterflies: this.butterflies.length,
            rabbits: this.rabbits.length,
            birds: this.birds.length,
        };
    }
}
