import * as THREE from 'three';

const COLLECTION_RADIUS = 3.6;
const FLOAT_SPEED = 1.8;
const FLOAT_AMPLITUDE = 0.22;
const SPIN_SPEED = 1.2;
const BEACON_HEIGHT = 7;
const FUEL_AMOUNT = 55;

export class FuelCanManager {
    constructor(scene) {
        this.scene = scene;
        this.cans = [];
        this.time = 0;
    }

    spawn(placements) {
        this.reset();
        for (const placement of placements) {
            this.createCan(placement);
        }
    }

    createCan({ position, rotationY = 0 }) {
        const group = new THREE.Group();

        const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.55, 0.72, 0.28),
            new THREE.MeshPhongMaterial({
                color: 0xd94a3f,
                emissive: 0x631818,
                emissiveIntensity: 0.25,
            })
        );
        body.position.y = 0.44;
        body.castShadow = true;
        group.add(body);

        const inset = new THREE.Mesh(
            new THREE.BoxGeometry(0.22, 0.32, 0.06),
            new THREE.MeshPhongMaterial({ color: 0xffd37a })
        );
        inset.position.set(0, 0.46, 0.175);
        group.add(inset);

        const handle = new THREE.Mesh(
            new THREE.BoxGeometry(0.26, 0.08, 0.18),
            new THREE.MeshPhongMaterial({ color: 0x6b1f1f })
        );
        handle.position.set(0, 0.86, 0);
        handle.castShadow = true;
        group.add(handle);

        const spout = new THREE.Mesh(
            new THREE.CylinderGeometry(0.045, 0.045, 0.22, 8),
            new THREE.MeshPhongMaterial({ color: 0xffd37a })
        );
        spout.rotation.z = -Math.PI / 4;
        spout.position.set(0.18, 0.82, 0);
        group.add(spout);

        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.48, 0.05, 8, 24),
            new THREE.MeshBasicMaterial({
                color: 0xff9f43,
                transparent: true,
                opacity: 0.45,
            })
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.08;
        group.add(ring);

        const beacon = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.16, BEACON_HEIGHT, 6),
            new THREE.MeshBasicMaterial({
                color: 0xff9f43,
                transparent: true,
                opacity: 0.28,
            })
        );
        beacon.position.y = 0.7 + BEACON_HEIGHT / 2;
        group.add(beacon);

        const baseY = position.y + 0.75;
        group.position.set(position.x, baseY, position.z);
        group.rotation.y = rotationY;
        this.scene.add(group);

        this.cans.push({
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
        for (const can of this.cans) {
            if (!can.collected) {
                can.beacon.visible = visible;
            }
        }
    }

    getActivePositions() {
        return this.cans.filter((can) => !can.collected).map((can) => can.group.position);
    }

    animate(delta) {
        this.time += delta;
        for (const can of this.cans) {
            if (can.collected) continue;
            can.group.position.y = can.baseY + Math.sin(this.time * FLOAT_SPEED + can.phaseOffset) * FLOAT_AMPLITUDE;
            can.group.rotation.y = can.baseRotation + this.time * SPIN_SPEED;
            can.ring.material.opacity = 0.28 + Math.sin(this.time * 2.5 + can.phaseOffset) * 0.14;
            can.beacon.material.opacity = 0.18 + Math.sin(this.time * 2 + can.phaseOffset) * 0.1;
        }
    }

    update(delta, vehicle, onCollect) {
        this.animate(delta);
        const vehiclePos = vehicle.getPosition();

        for (let index = this.cans.length - 1; index >= 0; index--) {
            const can = this.cans[index];
            if (can.collected) continue;

            const dx = vehiclePos.x - can.group.position.x;
            const dz = vehiclePos.z - can.group.position.z;
            if (Math.sqrt(dx * dx + dz * dz) < COLLECTION_RADIUS) {
                can.collected = true;
                this.collect(can, onCollect);
            }
        }
    }

    collect(can, onCollect) {
        const duration = 0.32;
        let elapsed = 0;

        const animate = () => {
            elapsed += 0.016;
            const t = Math.min(elapsed / duration, 1);
            can.group.position.y += 0.05;
            can.group.scale.setScalar(1 + t * 0.45);
            can.group.traverse((child) => {
                if (child.material) {
                    child.material.transparent = true;
                    child.material.opacity *= 0.88;
                }
            });

            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(can.group);
                this.cans.splice(this.cans.indexOf(can), 1);
            }
        };

        animate();
        if (onCollect) onCollect(FUEL_AMOUNT);
    }

    reset() {
        for (const can of this.cans) {
            this.scene.remove(can.group);
            can.group.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
        this.cans = [];
        this.time = 0;
    }
}