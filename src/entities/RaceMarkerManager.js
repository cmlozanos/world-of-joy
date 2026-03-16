import * as THREE from 'three';

const GATE_WIDTH = 7;
const POLE_HEIGHT = 3.6;

export class RaceMarkerManager {
    constructor(scene) {
        this.scene = scene;
        this.startMarker = null;
        this.finishMarker = null;
        this.time = 0;
    }

    spawn(startInfo, finishInfo) {
        this.reset();
        this.startMarker = this.createGate(startInfo, {
            label: 'SALIDA',
            primaryColor: 0x4caf50,
            secondaryColor: 0xe8ffe8,
            beaconColor: 0x8cff9b,
            checkered: false,
        });
        this.finishMarker = this.createGate(finishInfo, {
            label: 'META',
            primaryColor: 0xf5f5f5,
            secondaryColor: 0x111111,
            beaconColor: 0xffdf6b,
            checkered: true,
        });
    }

    createGate({ position, tangent }, options) {
        const group = new THREE.Group();
        const heading = Math.atan2(tangent.x, tangent.z);
        const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

        const poleGeometry = new THREE.CylinderGeometry(0.18, 0.22, POLE_HEIGHT, 10);
        const poleMaterial = new THREE.MeshLambertMaterial({ color: options.primaryColor });
        const leftPole = new THREE.Mesh(poleGeometry, poleMaterial);
        leftPole.position.set(-GATE_WIDTH / 2, POLE_HEIGHT / 2, 0);
        leftPole.castShadow = true;
        group.add(leftPole);

        const rightPole = new THREE.Mesh(poleGeometry, poleMaterial);
        rightPole.position.set(GATE_WIDTH / 2, POLE_HEIGHT / 2, 0);
        rightPole.castShadow = true;
        group.add(rightPole);

        const bannerMaterial = options.checkered
            ? new THREE.MeshLambertMaterial({ map: this.createCheckeredTexture() })
            : new THREE.MeshLambertMaterial({ color: options.secondaryColor });
        const banner = new THREE.Mesh(new THREE.BoxGeometry(GATE_WIDTH + 0.7, 0.65, 0.28), bannerMaterial);
        banner.position.y = POLE_HEIGHT + 0.1;
        banner.castShadow = true;
        group.add(banner);

        const labelPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(3.6, 0.9),
            new THREE.MeshBasicMaterial({
                map: this.createLabelTexture(options.label, options.primaryColor, options.checkered ? 0xffffff : 0x234d23),
                transparent: true,
            })
        );
        labelPlane.position.set(0, POLE_HEIGHT + 0.1, 0.16);
        group.add(labelPlane);

        const strip = new THREE.Mesh(
            new THREE.BoxGeometry(GATE_WIDTH + 1.2, 0.04, 1.8),
            new THREE.MeshBasicMaterial({ color: options.checkered ? 0xfafafa : 0xbff3c1 })
        );
        strip.position.set(0, 0.02, 0);
        group.add(strip);

        const beacon = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.22, 10, 8),
            new THREE.MeshBasicMaterial({
                color: options.beaconColor,
                transparent: true,
                opacity: 0.24,
            })
        );
        beacon.position.set(0, 5.4, 0);
        group.add(beacon);

        const arrow = new THREE.Mesh(
            new THREE.ConeGeometry(0.5, 1.1, 5),
            new THREE.MeshBasicMaterial({ color: options.beaconColor })
        );
        arrow.position.set(0, 2.2, 0);
        arrow.rotation.x = Math.PI;
        group.add(arrow);

        group.position.set(position.x, position.y + 0.02, position.z);
        group.rotation.y = heading;
        group.position.add(side.multiplyScalar(0));
        this.scene.add(group);

        return { group, beacon, arrow, tangent: tangent.clone() };
    }

    createLabelTexture(text, colorHex, bgHex) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = `#${bgHex.toString(16).padStart(6, '0')}`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = `#${colorHex.toString(16).padStart(6, '0')}`;
        ctx.font = 'bold 72px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 4);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    createCheckeredTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const cell = 16;

        for (let y = 0; y < canvas.height; y += cell) {
            for (let x = 0; x < canvas.width; x += cell) {
                const isDark = ((x / cell) + (y / cell)) % 2 === 0;
                ctx.fillStyle = isDark ? '#111111' : '#f5f5f5';
                ctx.fillRect(x, y, cell, cell);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.needsUpdate = true;
        return texture;
    }

    update(delta) {
        this.time += delta;
        const markers = [this.startMarker, this.finishMarker];
        for (const marker of markers) {
            if (!marker) continue;
            marker.beacon.material.opacity = 0.18 + Math.sin(this.time * 2.6) * 0.08;
            marker.arrow.position.y = 2.2 + Math.sin(this.time * 3.2) * 0.18;
        }
    }

    getFinishPosition() {
        return this.finishMarker ? this.finishMarker.group.position.clone() : null;
    }

    getStartPosition() {
        return this.startMarker ? this.startMarker.group.position.clone() : null;
    }

    reset() {
        const markers = [this.startMarker, this.finishMarker];
        for (const marker of markers) {
            if (!marker) continue;
            this.scene.remove(marker.group);
            marker.group.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        for (const material of child.material) material.dispose();
                    } else {
                        if (child.material.map) child.material.map.dispose();
                        child.material.dispose();
                    }
                }
            });
        }

        this.startMarker = null;
        this.finishMarker = null;
        this.time = 0;
    }
}