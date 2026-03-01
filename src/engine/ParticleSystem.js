import * as THREE from 'three';

const PARTICLE_POOL_SIZE = 100;
const PARTICLE_LIFETIME = 1.0;

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
    }

    emitFruitCollect(position) {
        const colors = [0xffd700, 0xff6b6b, 0x7bed9f, 0xffa502, 0xff4757];
        for (let i = 0; i < 12; i++) {
            this.spawnParticle(
                position,
                colors[Math.floor(Math.random() * colors.length)],
                0.08 + Math.random() * 0.06,
                PARTICLE_LIFETIME
            );
        }
    }

    emitWaterCollect(position) {
        for (let i = 0; i < 10; i++) {
            this.spawnParticle(
                position,
                0x4fc3f7,
                0.06 + Math.random() * 0.05,
                0.8
            );
        }
    }

    emitRunDust(position, direction) {
        if (Math.random() > 0.3) return;

        const dustPos = position.clone();
        dustPos.y += 0.05;
        dustPos.x -= direction.x * 0.3;
        dustPos.z -= direction.z * 0.3;

        this.spawnDustParticle(dustPos);
    }

    spawnParticle(position, color, size, lifetime) {
        if (this.particles.length >= PARTICLE_POOL_SIZE) return;

        const geometry = new THREE.SphereGeometry(size, 6, 6);
        const material = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 1,
        });
        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.copy(position);
        mesh.position.y += 0.5;

        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 4,
            2 + Math.random() * 3,
            (Math.random() - 0.5) * 4
        );

        this.scene.add(mesh);
        this.particles.push({
            mesh, velocity, lifetime, maxLifetime: lifetime, type: 'sparkle',
        });
    }

    spawnDustParticle(position) {
        if (this.particles.length >= PARTICLE_POOL_SIZE) return;

        const size = 0.05 + Math.random() * 0.08;
        const geometry = new THREE.SphereGeometry(size, 4, 4);
        const material = new THREE.MeshBasicMaterial({
            color: 0xc8b88a,
            transparent: true,
            opacity: 0.4,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);

        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            0.3 + Math.random() * 0.5,
            (Math.random() - 0.5) * 0.5
        );

        this.scene.add(mesh);
        this.particles.push({
            mesh, velocity, lifetime: 0.5, maxLifetime: 0.5, type: 'dust',
        });
    }

    update(delta) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.lifetime -= delta;

            if (p.lifetime <= 0) {
                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
                this.particles.splice(i, 1);
                continue;
            }

            const t = p.lifetime / p.maxLifetime;

            p.mesh.material.opacity = t;
            p.mesh.position.add(p.velocity.clone().multiplyScalar(delta));

            if (p.type === 'sparkle') {
                p.velocity.y -= 6 * delta;
                const scale = 0.5 + t * 0.5;
                p.mesh.scale.setScalar(scale);
            } else {
                p.mesh.scale.setScalar(1 + (1 - t) * 1.5);
            }
        }
    }
}
