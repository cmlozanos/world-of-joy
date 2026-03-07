import * as THREE from 'three';

const POOL_SIZE = 100;

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.active = [];
        this._updateVec = new THREE.Vector3();
        this._dustPos = new THREE.Vector3();

        this.sparkleGeometry = new THREE.SphereGeometry(1, 6, 6);
        this.dustGeometry = new THREE.SphereGeometry(1, 4, 4);

        this.pool = [];
        for (let i = 0; i < POOL_SIZE; i++) {
            const material = new THREE.MeshBasicMaterial({
                transparent: true,
                depthWrite: false,
            });
            const mesh = new THREE.Mesh(this.sparkleGeometry, material);
            mesh.visible = false;
            scene.add(mesh);
            this.pool.push(mesh);
        }
    }

    getAvailableMesh(isDust) {
        for (const mesh of this.pool) {
            if (!mesh.visible) {
                mesh.geometry = isDust ? this.dustGeometry : this.sparkleGeometry;
                return mesh;
            }
        }
        return null;
    }

    emitFruitCollect(position) {
        const colors = [0xffd700, 0xff6b6b, 0x7bed9f, 0xffa502, 0xff4757];
        for (let i = 0; i < 12; i++) {
            this.spawnParticle(
                position,
                colors[Math.floor(Math.random() * colors.length)],
                0.08 + Math.random() * 0.06,
                1.0
            );
        }
    }

    emitWaterCollect(position) {
        for (let i = 0; i < 10; i++) {
            this.spawnParticle(position, 0x4fc3f7, 0.06 + Math.random() * 0.05, 0.8);
        }
    }

    emitRunDust(position, direction) {
        if (Math.random() > 0.3) return;

        this._dustPos.copy(position);
        this._dustPos.y += 0.05;
        this._dustPos.x -= direction.x * 0.3;
        this._dustPos.z -= direction.z * 0.3;

        this.spawnDustParticle(this._dustPos);
    }

    spawnParticle(position, color, size, lifetime) {
        const mesh = this.getAvailableMesh(false);
        if (!mesh) return;

        mesh.visible = true;
        mesh.material.color.setHex(color);
        mesh.material.opacity = 1;
        mesh.scale.setScalar(size);
        mesh.position.copy(position);
        mesh.position.y += 0.5;

        this.active.push({
            mesh,
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 4,
                2 + Math.random() * 3,
                (Math.random() - 0.5) * 4
            ),
            lifetime,
            maxLifetime: lifetime,
            baseSize: size,
            type: 'sparkle',
        });
    }

    spawnDustParticle(position) {
        const mesh = this.getAvailableMesh(true);
        if (!mesh) return;

        const size = 0.05 + Math.random() * 0.08;
        mesh.visible = true;
        mesh.material.color.setHex(0xc8b88a);
        mesh.material.opacity = 0.4;
        mesh.scale.setScalar(size);
        mesh.position.copy(position);

        this.active.push({
            mesh,
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                0.3 + Math.random() * 0.5,
                (Math.random() - 0.5) * 0.5
            ),
            lifetime: 0.5,
            maxLifetime: 0.5,
            baseSize: size,
            type: 'dust',
        });
    }

    update(delta) {
        for (let i = this.active.length - 1; i >= 0; i--) {
            const p = this.active[i];
            p.lifetime -= delta;

            if (p.lifetime <= 0) {
                p.mesh.visible = false;
                this.active.splice(i, 1);
                continue;
            }

            const t = p.lifetime / p.maxLifetime;
            p.mesh.material.opacity = t;

            this._updateVec.copy(p.velocity).multiplyScalar(delta);
            p.mesh.position.add(this._updateVec);

            if (p.type === 'sparkle') {
                p.velocity.y -= 6 * delta;
                p.mesh.scale.setScalar(p.baseSize * (0.5 + t * 0.5));
            } else {
                p.mesh.scale.setScalar(p.baseSize * (1 + (1 - t) * 1.5));
            }
        }
    }
}
