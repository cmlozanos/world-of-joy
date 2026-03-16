import * as THREE from 'three';

const COLLECTION_RADIUS = 3.4;
const FLOAT_SPEED = 2.1;
const FLOAT_AMPLITUDE = 0.24;
const SPIN_SPEED = 1.7;
const BOOST_DURATION = 4.5;
const BOOST_MULTIPLIER = 1.75;
const BEACON_HEIGHT = 7;

export class NitroCanManager {
    constructor(scene) {
        this.scene = scene;
        this.canisters = [];
        this.time = 0;
    }

    spawn(placements) {
        this.reset();
        for (const placement of placements) {
            this.createCanister(placement);
        }
    }

    createCanister({ position, rotationY = 0 }) {
        const group = new THREE.Group();

        const shellMaterial = new THREE.MeshPhongMaterial({
            color: 0xff8c42,
            emissive: 0xa03a00,
            emissiveIntensity: 0.4,
        });

        const leftCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.9, 10), shellMaterial);
        leftCylinder.position.set(-0.16, 0.45, 0);
        leftCylinder.castShadow = true;
        group.add(leftCylinder);

        const rightCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.9, 10), shellMaterial);
        rightCylinder.position.set(0.16, 0.45, 0);
        rightCylinder.castShadow = true;
        group.add(rightCylinder);

        const bridge = new THREE.Mesh(
            new THREE.BoxGeometry(0.52, 0.15, 0.22),
            new THREE.MeshPhongMaterial({ color: 0x5e2a00 })
        );
        bridge.position.set(0, 0.72, 0);
        bridge.castShadow = true;
        group.add(bridge);

        const bolt = new THREE.Mesh(
            new THREE.BoxGeometry(0.16, 0.42, 0.06),
            new THREE.MeshBasicMaterial({ color: 0xfff4b3 })
        );
        bolt.position.set(0, 0.42, 0.19);
        bolt.rotation.z = 0.35;
        group.add(bolt);

        const boltTail = new THREE.Mesh(
            new THREE.BoxGeometry(0.13, 0.22, 0.06),
            new THREE.MeshBasicMaterial({ color: 0xfff4b3 })
        );
        boltTail.position.set(0.06, 0.13, 0.19);
        boltTail.rotation.z = -0.35;
        group.add(boltTail);

        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.52, 0.06, 8, 28),
            new THREE.MeshBasicMaterial({
                color: 0xffe066,
                transparent: true,
                opacity: 0.5,
            })
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.08;
        group.add(ring);

        const beacon = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.15, BEACON_HEIGHT, 6),
            new THREE.MeshBasicMaterial({
                color: 0xffd166,
                transparent: true,
                opacity: 0.32,
            })
        );
        beacon.position.y = 0.7 + BEACON_HEIGHT / 2;
        group.add(beacon);

        const baseY = position.y + 0.72;
        group.position.set(position.x, baseY, position.z);
        group.rotation.y = rotationY;
        this.scene.add(group);

        this.canisters.push({
            group,
            ring,
            beacon,
            baseY,
            baseRotation: rotationY,
            phaseOffset: Math.random() * Math.PI * 2,
            collected: false,
        });
    }

    setBeaconsVisible(visible) {
        for (const canister of this.canisters) {
            if (!canister.collected) canister.beacon.visible = visible;
        }
    }

    getActivePositions() {
        return this.canisters.filter((canister) => !canister.collected).map((canister) => canister.group.position);
    }

    animate(delta) {
        this.time += delta;
        for (const canister of this.canisters) {
            if (canister.collected) continue;
            canister.group.position.y = canister.baseY + Math.sin(this.time * FLOAT_SPEED + canister.phaseOffset) * FLOAT_AMPLITUDE;
            canister.group.rotation.y = canister.baseRotation + this.time * SPIN_SPEED;
            canister.ring.material.opacity = 0.28 + Math.sin(this.time * 3 + canister.phaseOffset) * 0.18;
            canister.beacon.material.opacity = 0.2 + Math.sin(this.time * 2.6 + canister.phaseOffset) * 0.12;
        }
    }

    update(delta, vehicle, onCollect) {
        this.animate(delta);
        const vehiclePos = vehicle.getPosition();

        for (let index = this.canisters.length - 1; index >= 0; index--) {
            const canister = this.canisters[index];
            if (canister.collected) continue;

            const dx = vehiclePos.x - canister.group.position.x;
            const dz = vehiclePos.z - canister.group.position.z;
            if (Math.sqrt(dx * dx + dz * dz) < COLLECTION_RADIUS) {
                canister.collected = true;
                this.collect(canister, onCollect);
            }
        }
    }

    collect(canister, onCollect) {
        const duration = 0.3;
        let elapsed = 0;

        const animate = () => {
            elapsed += 0.016;
            const t = Math.min(elapsed / duration, 1);
            canister.group.position.y += 0.07;
            canister.group.scale.setScalar(1 + t * 0.6);
            canister.group.traverse((child) => {
                if (child.material) {
                    child.material.transparent = true;
                    child.material.opacity *= 0.86;
                }
            });

            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(canister.group);
                this.canisters.splice(this.canisters.indexOf(canister), 1);
            }
        };

        animate();
        if (onCollect) onCollect(BOOST_DURATION, BOOST_MULTIPLIER);
    }

    reset() {
        for (const canister of this.canisters) {
            this.scene.remove(canister.group);
            canister.group.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
        this.canisters = [];
        this.time = 0;
    }
}