import * as THREE from 'three';

const DISCOVERY_RADIUS = 6.5;
const SIGN_FLOAT_SPEED = 1.4;
const SIGN_FLOAT_AMPLITUDE = 0.12;

export class RoadSignManager {
    constructor(scene) {
        this.scene = scene;
        this.signs = [];
        this.time = 0;
    }

    spawn(placements) {
        this.reset();
        for (const placement of placements) {
            this.createSign(placement);
        }
    }

    createSign({ position, rotationY = 0, template }) {
        const group = new THREE.Group();
        const postMaterial = new THREE.MeshLambertMaterial({ color: 0x6b4b2a });

        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 10), postMaterial);
        post.position.y = 1.3;
        post.castShadow = true;
        group.add(post);

        const panel = new THREE.Mesh(
            new THREE.BoxGeometry(1.75, 1.75, 0.12),
            [
                new THREE.MeshLambertMaterial({ color: 0xffffff }),
                new THREE.MeshLambertMaterial({ color: 0xffffff }),
                new THREE.MeshLambertMaterial({ color: 0xffffff }),
                new THREE.MeshLambertMaterial({ color: 0xffffff }),
                new THREE.MeshLambertMaterial({ map: this.createSignTexture(template) }),
                new THREE.MeshLambertMaterial({ color: 0xffffff }),
            ]
        );
        panel.position.y = 2.45;
        panel.castShadow = true;
        group.add(panel);

        const glow = new THREE.Mesh(
            new THREE.CircleGeometry(0.55, 24),
            new THREE.MeshBasicMaterial({
                color: template.color,
                transparent: true,
                opacity: 0.18,
            })
        );
        glow.position.set(0, 2.45, 0.08);
        group.add(glow);

        const orb = new THREE.Mesh(
            new THREE.SphereGeometry(0.16, 12, 12),
            new THREE.MeshBasicMaterial({
                color: template.color,
                transparent: true,
                opacity: 0.55,
            })
        );
        orb.position.set(0, 3.55, 0);
        group.add(orb);

        group.position.set(position.x, position.y, position.z);
        group.rotation.y = rotationY;
        this.scene.add(group);

        this.signs.push({
            group,
            glow,
            orb,
            template,
            baseY: position.y,
            phaseOffset: Math.random() * Math.PI * 2,
            discovered: false,
        });
    }

    createSignTexture(template) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        const color = template.color;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = color;
        ctx.lineWidth = 14;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

        ctx.fillStyle = color;
        ctx.font = 'bold 108px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(template.icon, canvas.width / 2, 98);

        ctx.fillStyle = '#15314a';
        ctx.font = 'bold 36px Arial';
        ctx.fillText(template.label, canvas.width / 2, 192);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    update(delta, vehicle, onDiscover) {
        this.time += delta;
        const vehiclePosition = vehicle ? vehicle.getPosition() : null;

        for (const sign of this.signs) {
            sign.group.position.y = sign.baseY + Math.sin(this.time * SIGN_FLOAT_SPEED + sign.phaseOffset) * SIGN_FLOAT_AMPLITUDE;
            sign.glow.material.opacity = 0.12 + Math.sin(this.time * 2.4 + sign.phaseOffset) * 0.06;
            sign.orb.position.y = 3.55 + Math.sin(this.time * 2.6 + sign.phaseOffset) * 0.16;

            if (sign.discovered || !vehiclePosition) continue;

            const dx = vehiclePosition.x - sign.group.position.x;
            const dz = vehiclePosition.z - sign.group.position.z;
            if (Math.sqrt(dx * dx + dz * dz) < DISCOVERY_RADIUS) {
                sign.discovered = true;
                if (onDiscover) onDiscover(sign);
            }
        }
    }

    reset() {
        for (const sign of this.signs) {
            this.scene.remove(sign.group);
            sign.group.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (!child.material) return;

                if (Array.isArray(child.material)) {
                    child.material.forEach((material) => {
                        if (material.map) material.map.dispose();
                        material.dispose();
                    });
                } else {
                    if (child.material.map) child.material.map.dispose();
                    child.material.dispose();
                }
            });
        }

        this.signs = [];
        this.time = 0;
    }
}