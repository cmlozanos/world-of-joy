import * as THREE from 'three';

const CAMERA_OFFSET = new THREE.Vector3(0, 2.8, -7);
const LOOK_AT_OFFSET = new THREE.Vector3(0, 1.2, 2);
const PITCH = 0.15;
const SMOOTHING = 8;

export class ThirdPersonCamera {
    constructor(camera, character) {
        this.camera = camera;
        this.character = character;
        this.yaw = 0;
        this.currentPosition = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();
        this.initialized = false;
    }

    update(delta, input) {
        this.yaw += input.getTurnAmount(delta);

        const characterPosition = this.character.getPosition();

        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationFromEuler(
            new THREE.Euler(PITCH, this.yaw, 0, 'YXZ')
        );

        const offset = CAMERA_OFFSET.clone().applyMatrix4(rotationMatrix);
        const targetPosition = characterPosition.clone().add(offset);
        const targetLookAt = characterPosition.clone().add(LOOK_AT_OFFSET);

        if (!this.initialized) {
            this.currentPosition.copy(targetPosition);
            this.currentLookAt.copy(targetLookAt);
            this.initialized = true;
        } else {
            const t = 1 - Math.exp(-SMOOTHING * delta);
            this.currentPosition.lerp(targetPosition, t);
            this.currentLookAt.lerp(targetLookAt, t);
        }

        this.camera.position.copy(this.currentPosition);
        this.camera.lookAt(this.currentLookAt);

        this.character.setRotationY(this.yaw);
    }
}
