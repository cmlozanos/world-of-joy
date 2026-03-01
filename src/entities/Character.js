import * as THREE from 'three';

const WALK_SPEED = 10;
const RUN_SPEED = 20;
const GRAVITY = -25;
const JUMP_FORCE = 10;
const MAX_JUMPS = 2;

const STATE = {
    IDLE: 'idle',
    WALKING: 'walking',
    RUNNING: 'running',
    JUMPING: 'jumping',
};

export class Character {
    constructor(scene) {
        this.scene = scene;
        this.velocity = new THREE.Vector3();
        this.isGrounded = true;
        this.jumpCount = 0;
        this.state = STATE.IDLE;
        this.animationTime = 0;
        this.rotationY = 0;
        this.speedMultiplier = 1;
        this.boostTimeRemaining = 0;

        this.group = new THREE.Group();
        this.buildModel();
        this.group.position.set(0, 0, 0);
        this.scene.add(this.group);
    }

    buildModel() {
        const skinColor = 0xf5cba7;
        const shirtColor = 0x3498db;
        const pantsColor = 0x2c3e50;
        const shoeColor = 0x6b4226;
        const hairColor = 0x5d3a1a;

        // Body (torso)
        const torsoGeometry = new THREE.BoxGeometry(0.6, 0.7, 0.35);
        const torsoMaterial = new THREE.MeshLambertMaterial({ color: shirtColor });
        this.torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
        this.torso.position.y = 1.15;
        this.torso.castShadow = true;
        this.group.add(this.torso);

        // Head
        const headGeometry = new THREE.SphereGeometry(0.25, 12, 10);
        const headMaterial = new THREE.MeshLambertMaterial({ color: skinColor });
        this.head = new THREE.Mesh(headGeometry, headMaterial);
        this.head.position.y = 1.75;
        this.head.castShadow = true;
        this.group.add(this.head);

        // Hair
        const hairGeometry = new THREE.SphereGeometry(0.27, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.6);
        const hairMaterial = new THREE.MeshLambertMaterial({ color: hairColor });
        this.hair = new THREE.Mesh(hairGeometry, hairMaterial);
        this.hair.position.y = 1.78;
        this.hair.castShadow = true;
        this.group.add(this.hair);

        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.04, 8, 8);
        const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.08, 1.76, 0.22);
        this.group.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.08, 1.76, 0.22);
        this.group.add(rightEye);

        // Smile
        const smileGeometry = new THREE.TorusGeometry(0.06, 0.015, 8, 10, Math.PI);
        const smileMaterial = new THREE.MeshLambertMaterial({ color: 0xcc6666 });
        this.smile = new THREE.Mesh(smileGeometry, smileMaterial);
        this.smile.position.set(0, 1.7, 0.23);
        this.smile.rotation.x = Math.PI;
        this.group.add(this.smile);

        // Arms
        const armGeometry = new THREE.BoxGeometry(0.18, 0.55, 0.18);
        const armMaterial = new THREE.MeshLambertMaterial({ color: skinColor });

        this.leftArmPivot = new THREE.Group();
        this.leftArmPivot.position.set(-0.42, 1.4, 0);
        this.leftArm = new THREE.Mesh(armGeometry, armMaterial);
        this.leftArm.position.y = -0.28;
        this.leftArm.castShadow = true;
        this.leftArmPivot.add(this.leftArm);
        this.group.add(this.leftArmPivot);

        this.rightArmPivot = new THREE.Group();
        this.rightArmPivot.position.set(0.42, 1.4, 0);
        this.rightArm = new THREE.Mesh(armGeometry, armMaterial);
        this.rightArm.position.y = -0.28;
        this.rightArm.castShadow = true;
        this.rightArmPivot.add(this.rightArm);
        this.group.add(this.rightArmPivot);

        // Legs
        const legGeometry = new THREE.BoxGeometry(0.22, 0.5, 0.22);
        const legMaterial = new THREE.MeshLambertMaterial({ color: pantsColor });

        this.leftLegPivot = new THREE.Group();
        this.leftLegPivot.position.set(-0.15, 0.8, 0);
        this.leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        this.leftLeg.position.y = -0.25;
        this.leftLeg.castShadow = true;
        this.leftLegPivot.add(this.leftLeg);
        this.group.add(this.leftLegPivot);

        this.rightLegPivot = new THREE.Group();
        this.rightLegPivot.position.set(0.15, 0.8, 0);
        this.rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        this.rightLeg.position.y = -0.25;
        this.rightLeg.castShadow = true;
        this.rightLegPivot.add(this.rightLeg);
        this.group.add(this.rightLegPivot);

        // Shoes
        const shoeGeometry = new THREE.BoxGeometry(0.22, 0.12, 0.3);
        const shoeMaterial = new THREE.MeshLambertMaterial({ color: shoeColor });

        const leftShoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
        leftShoe.position.set(0, -0.48, 0.04);
        leftShoe.castShadow = true;
        this.leftLegPivot.add(leftShoe);

        const rightShoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
        rightShoe.position.set(0, -0.48, 0.04);
        rightShoe.castShadow = true;
        this.rightLegPivot.add(rightShoe);

        // Shadow beneath character (added to scene, not group, so it stays on the ground)
        const shadowGeometry = new THREE.CircleGeometry(0.4, 16);
        const shadowMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.3,
        });
        this.shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
        this.shadow.rotation.x = -Math.PI / 2;
        this.scene.add(this.shadow);
    }

    update(delta, input, world) {
        this.updateMovement(delta, input);
        this.updatePhysics(delta, world);
        this.updateAnimation(delta);
        this.updateShadow(world);
    }

    updateMovement(delta, input) {
        // Update boost timer
        if (this.boostTimeRemaining > 0) {
            this.boostTimeRemaining -= delta;
            if (this.boostTimeRemaining <= 0) {
                this.boostTimeRemaining = 0;
                this.speedMultiplier = 1;
            }
        }

        const isMoving = input.isMoving;
        const isRunning = input.run && isMoving;
        const baseSpeed = isRunning ? RUN_SPEED : WALK_SPEED;
        const speed = baseSpeed * this.speedMultiplier;

        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationY);

        const moveDirection = new THREE.Vector3();

        if (input.forward) moveDirection.add(forward);
        if (input.backward) moveDirection.sub(forward);

        if (moveDirection.lengthSq() > 0) {
            moveDirection.normalize();
            this.velocity.x = moveDirection.x * speed;
            this.velocity.z = moveDirection.z * speed;
            this.state = isRunning ? STATE.RUNNING : STATE.WALKING;
        } else {
            this.velocity.x *= 0.85;
            this.velocity.z *= 0.85;
            if (Math.abs(this.velocity.x) < 0.1 && Math.abs(this.velocity.z) < 0.1) {
                this.velocity.x = 0;
                this.velocity.z = 0;
                if (this.isGrounded) this.state = STATE.IDLE;
            }
        }

        if (input.jump && this.jumpCount < MAX_JUMPS) {
            this.velocity.y = JUMP_FORCE;
            this.isGrounded = false;
            this.jumpCount++;
            this.state = STATE.JUMPING;
        }
    }

    updatePhysics(delta, world) {
        this.velocity.y += GRAVITY * delta;

        const newPos = this.group.position.clone();
        newPos.x += this.velocity.x * delta;
        newPos.y += this.velocity.y * delta;
        newPos.z += this.velocity.z * delta;

        const terrainY = world.getHeightAt(newPos.x, newPos.z);

        if (newPos.y <= terrainY) {
            newPos.y = terrainY;
            this.velocity.y = 0;
            this.isGrounded = true;
            this.jumpCount = 0;
            if (this.state === STATE.JUMPING) {
                this.state = this.velocity.x !== 0 || this.velocity.z !== 0
                    ? STATE.WALKING
                    : STATE.IDLE;
            }
        } else {
            this.isGrounded = false;
        }

        // Collision with trees
        if (!world.checkCollision(newPos, 0.5)) {
            this.group.position.copy(newPos);
        } else {
            this.velocity.x = 0;
            this.velocity.z = 0;
            this.group.position.y = newPos.y;
        }

        // Clamp to world boundaries
        const boundary = world.getWorldBounds();
        this.group.position.x = THREE.MathUtils.clamp(this.group.position.x, -boundary, boundary);
        this.group.position.z = THREE.MathUtils.clamp(this.group.position.z, -boundary, boundary);
    }

    updateShadow(world) {
        const pos = this.group.position;
        const groundY = world.getHeightAt(pos.x, pos.z);
        this.shadow.position.set(pos.x, groundY + 0.02, pos.z);
    }

    updateAnimation(delta) {
        this.animationTime += delta;

        switch (this.state) {
            case STATE.IDLE:
                this.animateIdle();
                break;
            case STATE.WALKING:
                this.animateWalk(6);
                break;
            case STATE.RUNNING:
                this.animateWalk(12);
                break;
            case STATE.JUMPING:
                this.animateJump();
                break;
        }

        // Subtle body bounce
        if (this.state === STATE.WALKING || this.state === STATE.RUNNING) {
            const bounceSpeed = this.state === STATE.RUNNING ? 12 : 6;
            this.torso.position.y = 1.15 + Math.abs(Math.sin(this.animationTime * bounceSpeed)) * 0.05;
        }
    }

    animateIdle() {
        const breathe = Math.sin(this.animationTime * 2) * 0.02;
        this.torso.position.y = 1.15 + breathe;

        this.leftArmPivot.rotation.x = 0;
        this.rightArmPivot.rotation.x = 0;
        this.leftLegPivot.rotation.x = 0;
        this.rightLegPivot.rotation.x = 0;
    }

    animateWalk(speed) {
        const swing = Math.sin(this.animationTime * speed);
        const armSwing = swing * 0.6;
        const legSwing = swing * 0.5;

        this.leftArmPivot.rotation.x = armSwing;
        this.rightArmPivot.rotation.x = -armSwing;
        this.leftLegPivot.rotation.x = -legSwing;
        this.rightLegPivot.rotation.x = legSwing;
    }

    animateJump() {
        this.leftArmPivot.rotation.x = -0.8;
        this.rightArmPivot.rotation.x = -0.8;
        this.leftLegPivot.rotation.x = 0.3;
        this.rightLegPivot.rotation.x = -0.3;
    }

    setRotationY(angle) {
        this.rotationY = angle;
        this.group.rotation.y = angle;
    }

    getPosition() {
        return this.group.position.clone();
    }

    getCollisionRadius() {
        return 0.5;
    }

    applySpeedBoost(duration, multiplier) {
        this.speedMultiplier = multiplier;
        this.boostTimeRemaining = duration;
    }

    getBoostTimeRemaining() {
        return this.boostTimeRemaining;
    }

    isBoosted() {
        return this.boostTimeRemaining > 0;
    }

    isMoving() {
        return this.state === STATE.WALKING || this.state === STATE.RUNNING;
    }

    getForwardDirection() {
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationY);
        return forward;
    }
}
