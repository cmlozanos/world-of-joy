import * as THREE from 'three';

const MAX_FORWARD_SPEED = 32;
const MAX_REVERSE_SPEED = 10;
const ACCELERATION = 28;
const BRAKE_FORCE = 40;
const COAST_DECELERATION = 12;
const TURN_SPEED = 1.8;
const CHASSIS_HEIGHT = 0.48;
const WHEEL_RADIUS = 0.34;
const BASE_FUEL_DRAIN = 0.22;
const SPEED_FUEL_DRAIN = 0.7;
const BOOST_DRAIN_FACTOR = 0.2;

function moveToward(current, target, maxDelta) {
    if (current < target) return Math.min(current + maxDelta, target);
    if (current > target) return Math.max(current - maxDelta, target);
    return target;
}

export class RacingCar {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.bodyRoot = new THREE.Group();
        this.group.add(this.bodyRoot);
        this.scene.add(this.group);

        this.speed = 0;
        this.rotationY = 0;
        this.speedMultiplier = 1;
        this.boostTimeRemaining = 0;
        this.fuel = 0;
        this.maxFuel = 100;
        this.isGrounded = true;
        this.animationTime = 0;

        this.wheels = [];
        this.buildModel();

        const shadowGeometry = new THREE.CircleGeometry(1.05, 20);
        const shadowMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.28,
        });
        this.shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
        this.shadow.rotation.x = -Math.PI / 2;
        this.scene.add(this.shadow);
    }

    buildModel() {
        const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x1b1b1b });
        const rimMaterial = new THREE.MeshLambertMaterial({ color: 0xdadada });
        const redMaterial = new THREE.MeshLambertMaterial({ color: 0xd94141 });
        const darkRedMaterial = new THREE.MeshLambertMaterial({ color: 0x8c1f2d });
        const glassMaterial = new THREE.MeshLambertMaterial({ color: 0x9fd7ff, transparent: true, opacity: 0.82 });

        const base = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.55, 4.8), redMaterial);
        base.position.y = 0.75;
        base.castShadow = true;
        this.bodyRoot.add(base);

        const bumperFront = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.28, 0.45), darkRedMaterial);
        bumperFront.position.set(0, 0.5, 2.48);
        bumperFront.castShadow = true;
        this.bodyRoot.add(bumperFront);

        const bumperRear = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.28, 0.45), darkRedMaterial);
        bumperRear.position.set(0, 0.5, -2.48);
        bumperRear.castShadow = true;
        this.bodyRoot.add(bumperRear);

        const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.95, 2.0), glassMaterial);
        cabin.position.set(0, 1.35, -0.1);
        cabin.castShadow = true;
        this.bodyRoot.add(cabin);

        const roof = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.18, 1.6), darkRedMaterial);
        roof.position.set(0, 1.88, -0.1);
        roof.castShadow = true;
        this.bodyRoot.add(roof);

        const hood = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.18, 1.2), darkRedMaterial);
        hood.position.set(0, 1.05, 1.35);
        hood.castShadow = true;
        this.bodyRoot.add(hood);

        const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 0.4), darkRedMaterial);
        spoiler.position.set(0, 1.35, -2.15);
        spoiler.castShadow = true;
        this.bodyRoot.add(spoiler);

        const spoilerSupportGeometry = new THREE.BoxGeometry(0.1, 0.35, 0.08);
        const leftSupport = new THREE.Mesh(spoilerSupportGeometry, darkRedMaterial);
        leftSupport.position.set(-0.55, 1.12, -2.15);
        leftSupport.castShadow = true;
        this.bodyRoot.add(leftSupport);

        const rightSupport = new THREE.Mesh(spoilerSupportGeometry, darkRedMaterial);
        rightSupport.position.set(0.55, 1.12, -2.15);
        rightSupport.castShadow = true;
        this.bodyRoot.add(rightSupport);

        const headlightGeometry = new THREE.BoxGeometry(0.45, 0.16, 0.08);
        const headlightMaterial = new THREE.MeshBasicMaterial({ color: 0xfff1b0 });
        const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        leftHeadlight.position.set(-0.75, 0.88, 2.43);
        this.bodyRoot.add(leftHeadlight);

        const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        rightHeadlight.position.set(0.75, 0.88, 2.43);
        this.bodyRoot.add(rightHeadlight);

        const taillightGeometry = new THREE.BoxGeometry(0.45, 0.14, 0.08);
        const taillightMaterial = new THREE.MeshBasicMaterial({ color: 0xff5555 });
        const leftTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
        leftTaillight.position.set(-0.75, 0.84, -2.43);
        this.bodyRoot.add(leftTaillight);

        const rightTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
        rightTaillight.position.set(0.75, 0.84, -2.43);
        this.bodyRoot.add(rightTaillight);

        const wheelGeometry = new THREE.CylinderGeometry(WHEEL_RADIUS, WHEEL_RADIUS, 0.34, 18);
        const rimGeometry = new THREE.CylinderGeometry(WHEEL_RADIUS * 0.52, WHEEL_RADIUS * 0.52, 0.36, 14);
        const wheelPositions = [
            [-1.2, 0.34, 1.55],
            [1.2, 0.34, 1.55],
            [-1.2, 0.34, -1.55],
            [1.2, 0.34, -1.55],
        ];

        for (const [x, y, z] of wheelPositions) {
            const wheel = new THREE.Group();

            const tire = new THREE.Mesh(wheelGeometry, wheelMaterial);
            tire.rotation.z = Math.PI / 2;
            tire.castShadow = true;
            wheel.add(tire);

            const rim = new THREE.Mesh(rimGeometry, rimMaterial);
            rim.rotation.z = Math.PI / 2;
            wheel.add(rim);

            wheel.position.set(x, y, z);
            this.bodyRoot.add(wheel);
            this.wheels.push(wheel);
        }
    }

    update(delta, input, world) {
        this.animationTime += delta;
        this.updateBoost(delta);
        this.updateDriving(delta, input, world);
        this.updateFuel(delta);
        this.updateVisuals(delta, input);
        this.updateShadow(world);
    }

    updateBoost(delta) {
        if (this.boostTimeRemaining <= 0) return;

        this.boostTimeRemaining -= delta;
        if (this.boostTimeRemaining <= 0) {
            this.boostTimeRemaining = 0;
            this.speedMultiplier = 1;
        }
    }

    updateDriving(delta, input, world) {
        const hasFuel = this.fuel > 0.01;

        if (input.forward && hasFuel) {
            this.speed += ACCELERATION * delta * this.speedMultiplier;
        } else if (input.backward) {
            if (this.speed > 0) {
                this.speed -= BRAKE_FORCE * delta;
            } else {
                this.speed -= ACCELERATION * 0.65 * delta;
            }
        } else {
            const coastFactor = Math.abs(this.speed) > 18 ? 1.2 : 1;
            this.speed = moveToward(this.speed, 0, COAST_DECELERATION * coastFactor * delta);
        }

        const steerInput = typeof input.getTurnAxis === 'function'
            ? input.getTurnAxis()
            : (input.turnLeft ? 1 : 0) - (input.turnRight ? 1 : 0);
        const maxForwardSpeed = MAX_FORWARD_SPEED * this.speedMultiplier;
        const speedRatio = THREE.MathUtils.clamp(Math.abs(this.speed) / Math.max(1, maxForwardSpeed), 0, 1);

        if (Math.abs(steerInput) > 0.01 && Math.abs(this.speed) > 0.5) {
            const turnAmount = TURN_SPEED * delta * (0.35 + speedRatio * 0.95);
            this.rotationY += turnAmount * steerInput * (this.speed >= 0 ? 1 : -1);
            this.group.rotation.y = this.rotationY;
        }

        this.speed = THREE.MathUtils.clamp(this.speed, -MAX_REVERSE_SPEED, maxForwardSpeed);

        const forward = this.getForwardDirection();
        const nextPosition = this.group.position.clone();
        nextPosition.x += forward.x * this.speed * delta;
        nextPosition.z += forward.z * this.speed * delta;
        nextPosition.y = world.getHeightAt(nextPosition.x, nextPosition.z) + CHASSIS_HEIGHT;

        if (!world.checkCollision(nextPosition, 1.45)) {
            this.group.position.copy(nextPosition);
        } else {
            this.speed *= -0.18;
        }

        const boundary = world.getWorldBounds();
        this.group.position.x = THREE.MathUtils.clamp(this.group.position.x, -boundary, boundary);
        this.group.position.z = THREE.MathUtils.clamp(this.group.position.z, -boundary, boundary);
        this.group.position.y = world.getHeightAt(this.group.position.x, this.group.position.z) + CHASSIS_HEIGHT;
    }

    updateFuel(delta) {
        if (this.fuel <= 0 || Math.abs(this.speed) < 0.25) return;

        const movementRatio = THREE.MathUtils.clamp(Math.abs(this.speed) / MAX_FORWARD_SPEED, 0, 1);
        const boostFactor = 1 + Math.max(0, this.speedMultiplier - 1) * BOOST_DRAIN_FACTOR;
        const drain = (BASE_FUEL_DRAIN + movementRatio * SPEED_FUEL_DRAIN * boostFactor) * delta;
        this.fuel = Math.max(0, this.fuel - drain);
    }

    updateVisuals(delta, input) {
        const wheelRotation = (this.speed * delta) / WHEEL_RADIUS;
        for (const wheel of this.wheels) {
            wheel.rotation.x -= wheelRotation;
        }

        const steerAxis = typeof input.getTurnAxis === 'function'
            ? input.getTurnAxis()
            : (input.turnLeft ? 1 : 0) - (input.turnRight ? 1 : 0);
        const steerLean = steerAxis * 0.05;
        const targetLean = steerLean * THREE.MathUtils.clamp(Math.abs(this.speed) / MAX_FORWARD_SPEED, 0, 1);
        this.bodyRoot.rotation.z += (targetLean - this.bodyRoot.rotation.z) * Math.min(1, delta * 5);
        this.bodyRoot.position.y = Math.sin(this.animationTime * 10) * Math.min(0.03, Math.abs(this.speed) * 0.0008);
    }

    updateShadow(world) {
        const pos = this.group.position;
        const groundY = world.getHeightAt(pos.x, pos.z);
        const speedScale = 1 + THREE.MathUtils.clamp(Math.abs(this.speed) / MAX_FORWARD_SPEED, 0, 0.25);
        this.shadow.position.set(pos.x, groundY + 0.04, pos.z);
        this.shadow.scale.set(speedScale, speedScale, speedScale);
    }

    setSpawn(position, tangent) {
        this.speed = 0;
        this.group.position.copy(position);
        this.rotationY = Math.atan2(tangent.x, tangent.z);
        this.group.rotation.y = this.rotationY;
        this.bodyRoot.rotation.z = 0;
        this.bodyRoot.position.y = 0;
    }

    configureFuel(currentFuel, maxFuel = 100) {
        this.maxFuel = maxFuel;
        this.fuel = THREE.MathUtils.clamp(currentFuel, 0, maxFuel);
    }

    refuel(amount) {
        this.fuel = THREE.MathUtils.clamp(this.fuel + amount, 0, this.maxFuel);
    }

    applySpeedBoost(duration, multiplier) {
        this.speedMultiplier = Math.max(this.speedMultiplier, multiplier);
        this.boostTimeRemaining = Math.max(this.boostTimeRemaining, duration);
    }

    getBoostTimeRemaining() {
        return this.boostTimeRemaining;
    }

    isBoosted() {
        return this.boostTimeRemaining > 0;
    }

    hasFuel() {
        return this.fuel > 0.01;
    }

    isStranded() {
        return !this.hasFuel() && Math.abs(this.speed) < 0.6;
    }

    isMoving() {
        return Math.abs(this.speed) > 1;
    }

    getFuel() {
        return this.fuel;
    }

    getMaxFuel() {
        return this.maxFuel;
    }

    getPosition() {
        return this.group.position.clone();
    }

    getRotationY() {
        return this.rotationY;
    }

    setRotationY(angle) {
        this.rotationY = angle;
        this.group.rotation.y = angle;
    }

    getForwardDirection() {
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationY);
        return forward;
    }

    resetPosition() {
        this.speed = 0;
        this.group.position.set(0, CHASSIS_HEIGHT, 0);
        this.rotationY = 0;
        this.group.rotation.y = 0;
        this.speedMultiplier = 1;
        this.boostTimeRemaining = 0;
        this.bodyRoot.rotation.z = 0;
        this.bodyRoot.position.y = 0;
    }
}