import * as THREE from 'three';

const WORLD_SIZE = 600;
const WORLD_HALF = WORLD_SIZE / 2;
const TERRAIN_SEGMENTS = 100;
const TREE_COUNT = 350;
const ROCK_COUNT = 120;
const BUSH_COUNT = 180;
const FLOWER_COUNT = 150;
const TREE_COLLISION_RADIUS = 0.8;

export class World {
    constructor(scene) {
        this.scene = scene;
        this.trees = [];
        this.colliders = [];
        this.heightData = null;
        this._dummy = new THREE.Object3D();
        this._color = new THREE.Color();
    }

    generate(onComplete) {
        this.createTerrain();
        this.createTrees();
        this.createRocks();
        this.createBushes();
        this.createFlowers();
        this.createClouds();

        if (onComplete) {
            setTimeout(onComplete, 100);
        }
    }

    createTerrain() {
        const geometry = new THREE.PlaneGeometry(
            WORLD_SIZE, WORLD_SIZE,
            TERRAIN_SEGMENTS, TERRAIN_SEGMENTS
        );
        geometry.rotateX(-Math.PI / 2);

        const vertices = geometry.attributes.position.array;
        this.heightData = new Float32Array(vertices.length / 3);

        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 2];
            const height = this.generateHeight(x, z);
            vertices[i + 1] = height;
            this.heightData[i / 3] = height;
        }

        geometry.computeVertexNormals();

        const colors = new Float32Array(vertices.length);
        for (let i = 0; i < vertices.length; i += 3) {
            this.applyTerrainColor(vertices[i + 1], colors, i);
        }
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.MeshLambertMaterial({ vertexColors: true });
        const terrain = new THREE.Mesh(geometry, material);
        terrain.receiveShadow = true;
        this.scene.add(terrain);
        this.terrain = terrain;
    }

    generateHeight(x, z) {
        const scale1 = 0.015;
        const scale2 = 0.04;
        const scale3 = 0.08;

        const h1 = Math.sin(x * scale1 + 1.3) * Math.cos(z * scale1 + 0.7) * 4;
        const h2 = Math.sin(x * scale2 + 3.1) * Math.cos(z * scale2 + 2.4) * 1.5;
        const h3 = Math.sin(x * scale3 + 5.2) * Math.cos(z * scale3 + 4.8) * 0.5;

        return h1 + h2 + h3;
    }

    applyTerrainColor(height, colorsArray, index) {
        const color = this._color;

        if (height < -1) {
            color.setHex(0x3d7a3d);
        } else if (height < 1) {
            color.setHex(0x4a8f3f);
        } else if (height < 3) {
            color.setHex(0x5da34f);
        } else {
            color.setHex(0x6bb85e);
        }

        const variation = (Math.random() - 0.5) * 0.05;
        colorsArray[index] = Math.max(0, Math.min(1, color.r + variation));
        colorsArray[index + 1] = Math.max(0, Math.min(1, color.g + variation));
        colorsArray[index + 2] = Math.max(0, Math.min(1, color.b + variation));
    }

    createTrees() {
        const halfWorld = WORLD_SIZE / 2 - 10;
        const roundTreeData = [];
        const pineTreeData = [];

        for (let i = 0; i < TREE_COUNT; i++) {
            const x = (Math.random() - 0.5) * 2 * halfWorld;
            const z = (Math.random() - 0.5) * 2 * halfWorld;

            if (Math.abs(x) < 5 && Math.abs(z) < 5) continue;

            const y = this.getHeightAt(x, z);

            this.trees.push({ position: new THREE.Vector3(x, y, z) });
            this.colliders.push({
                position: new THREE.Vector3(x, 0, z),
                radius: TREE_COLLISION_RADIUS,
            });

            if (Math.random() < 0.5) {
                roundTreeData.push({
                    x, y, z,
                    trunkHeight: 1.5 + Math.random(),
                    crownRadius: 1.2 + Math.random() * 0.8,
                    greenShade: 0x228b22 + Math.floor(Math.random() * 0x003300),
                });
            } else {
                const trunkHeight = 2 + Math.random();
                const cones = [];
                for (let j = 0; j < 3; j++) {
                    cones.push({
                        radius: 1.2 - j * 0.3,
                        height: 1.5 - j * 0.2,
                        yOffset: trunkHeight + j * 0.8,
                        greenShade: 0x1a6b1a + Math.floor(Math.random() * 0x002200),
                    });
                }
                pineTreeData.push({ x, y, z, trunkHeight, cones });
            }
        }

        this.buildRoundTreeInstances(roundTreeData);
        this.buildPineTreeInstances(pineTreeData);
    }

    buildRoundTreeInstances(trees) {
        if (trees.length === 0) return;

        const count = trees.length;
        const dummy = this._dummy;
        const color = this._color;

        const trunkGeo = new THREE.CylinderGeometry(0.15, 0.2, 1, 6);
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6b4226 });
        const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
        trunks.castShadow = true;
        trunks.receiveShadow = true;

        const crownGeo = new THREE.SphereGeometry(1, 8, 8);
        const crownMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const crowns = new THREE.InstancedMesh(crownGeo, crownMat, count);
        crowns.castShadow = true;
        crowns.receiveShadow = true;

        for (let i = 0; i < count; i++) {
            const t = trees[i];

            dummy.position.set(t.x, t.y + t.trunkHeight / 2, t.z);
            dummy.scale.set(1, t.trunkHeight, 1);
            dummy.rotation.set(0, 0, 0);
            dummy.updateMatrix();
            trunks.setMatrixAt(i, dummy.matrix);

            dummy.position.set(t.x, t.y + t.trunkHeight + t.crownRadius * 0.6, t.z);
            dummy.scale.setScalar(t.crownRadius);
            dummy.updateMatrix();
            crowns.setMatrixAt(i, dummy.matrix);

            color.setHex(t.greenShade);
            crowns.setColorAt(i, color);
        }

        trunks.instanceMatrix.needsUpdate = true;
        crowns.instanceMatrix.needsUpdate = true;
        crowns.instanceColor.needsUpdate = true;

        this.scene.add(trunks);
        this.scene.add(crowns);
    }

    buildPineTreeInstances(trees) {
        if (trees.length === 0) return;

        const count = trees.length;
        const dummy = this._dummy;
        const color = this._color;

        const trunkGeo = new THREE.CylinderGeometry(0.12, 0.18, 1, 6);
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5c3a1e });
        const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
        trunks.castShadow = true;
        trunks.receiveShadow = true;

        const totalCones = count * 3;
        const coneGeo = new THREE.ConeGeometry(1, 1, 8);
        const coneMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const cones = new THREE.InstancedMesh(coneGeo, coneMat, totalCones);
        cones.castShadow = true;
        cones.receiveShadow = true;

        for (let i = 0; i < count; i++) {
            const t = trees[i];

            dummy.position.set(t.x, t.y + t.trunkHeight / 2, t.z);
            dummy.scale.set(1, t.trunkHeight, 1);
            dummy.rotation.set(0, 0, 0);
            dummy.updateMatrix();
            trunks.setMatrixAt(i, dummy.matrix);

            for (let j = 0; j < 3; j++) {
                const ci = i * 3 + j;
                const c = t.cones[j];

                dummy.position.set(t.x, t.y + c.yOffset, t.z);
                dummy.scale.set(c.radius, c.height, c.radius);
                dummy.updateMatrix();
                cones.setMatrixAt(ci, dummy.matrix);

                color.setHex(c.greenShade);
                cones.setColorAt(ci, color);
            }
        }

        trunks.instanceMatrix.needsUpdate = true;
        cones.instanceMatrix.needsUpdate = true;
        cones.instanceColor.needsUpdate = true;

        this.scene.add(trunks);
        this.scene.add(cones);
    }

    createRocks() {
        const halfWorld = WORLD_SIZE / 2 - 10;
        const dummy = this._dummy;
        const color = this._color;

        const geometry = new THREE.DodecahedronGeometry(1, 0);
        const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const rocks = new THREE.InstancedMesh(geometry, material, ROCK_COUNT);
        rocks.castShadow = true;
        rocks.receiveShadow = true;

        for (let i = 0; i < ROCK_COUNT; i++) {
            const x = (Math.random() - 0.5) * 2 * halfWorld;
            const z = (Math.random() - 0.5) * 2 * halfWorld;
            const y = this.getHeightAt(x, z);
            const scale = 0.3 + Math.random() * 0.6;

            dummy.position.set(x, y + scale * 0.3, z);
            dummy.scale.set(scale, scale * 0.7, scale);
            dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            dummy.updateMatrix();
            rocks.setMatrixAt(i, dummy.matrix);

            color.setHex(0x666666 + Math.floor(Math.random() * 0x333333));
            rocks.setColorAt(i, color);
        }

        rocks.instanceMatrix.needsUpdate = true;
        rocks.instanceColor.needsUpdate = true;

        this.scene.add(rocks);
    }

    createBushes() {
        const halfWorld = WORLD_SIZE / 2 - 10;
        const dummy = this._dummy;
        const color = this._color;

        const geometry = new THREE.SphereGeometry(1, 8, 8);
        const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const bushes = new THREE.InstancedMesh(geometry, material, BUSH_COUNT);
        bushes.castShadow = true;

        for (let i = 0; i < BUSH_COUNT; i++) {
            const x = (Math.random() - 0.5) * 2 * halfWorld;
            const z = (Math.random() - 0.5) * 2 * halfWorld;
            const y = this.getHeightAt(x, z);
            const scale = 0.3 + Math.random() * 0.4;

            dummy.position.set(x, y + scale * 0.4, z);
            dummy.scale.set(scale * 1.3, scale, scale * 1.3);
            dummy.rotation.set(0, 0, 0);
            dummy.updateMatrix();
            bushes.setMatrixAt(i, dummy.matrix);

            color.setHex(0x2d7a2d + Math.floor(Math.random() * 0x002200));
            bushes.setColorAt(i, color);
        }

        bushes.instanceMatrix.needsUpdate = true;
        bushes.instanceColor.needsUpdate = true;

        this.scene.add(bushes);
    }

    createFlowers() {
        const halfWorld = WORLD_SIZE / 2 - 10;
        const flowerColors = [0xff6b6b, 0xffd93d, 0x6bcaff, 0xff9ff3, 0xffffff, 0xff7675];
        const dummy = this._dummy;
        const color = this._color;

        const stemGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.25, 4);
        const stemMat = new THREE.MeshLambertMaterial({ color: 0x228b22 });
        const stems = new THREE.InstancedMesh(stemGeo, stemMat, FLOWER_COUNT);

        const headGeo = new THREE.SphereGeometry(0.1, 6, 6);
        const headMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const heads = new THREE.InstancedMesh(headGeo, headMat, FLOWER_COUNT);

        for (let i = 0; i < FLOWER_COUNT; i++) {
            const x = (Math.random() - 0.5) * 2 * halfWorld;
            const z = (Math.random() - 0.5) * 2 * halfWorld;
            const y = this.getHeightAt(x, z);

            dummy.position.set(x, y + 0.125, z);
            dummy.scale.set(1, 1, 1);
            dummy.rotation.set(0, 0, 0);
            dummy.updateMatrix();
            stems.setMatrixAt(i, dummy.matrix);

            dummy.position.set(x, y + 0.28, z);
            dummy.updateMatrix();
            heads.setMatrixAt(i, dummy.matrix);

            color.setHex(flowerColors[Math.floor(Math.random() * flowerColors.length)]);
            heads.setColorAt(i, color);
        }

        stems.instanceMatrix.needsUpdate = true;
        heads.instanceMatrix.needsUpdate = true;
        heads.instanceColor.needsUpdate = true;

        this.scene.add(stems);
        this.scene.add(heads);
    }

    createClouds() {
        const cloudPuffs = [];

        for (let i = 0; i < 20; i++) {
            const cx = (Math.random() - 0.5) * WORLD_SIZE;
            const cy = 40 + Math.random() * 20;
            const cz = (Math.random() - 0.5) * WORLD_SIZE;
            const numPuffs = 3 + Math.floor(Math.random() * 4);

            for (let j = 0; j < numPuffs; j++) {
                const scale = 2 + Math.random() * 3;
                cloudPuffs.push({
                    x: cx + (Math.random() - 0.5) * 6,
                    y: cy + (Math.random() - 0.5) * 1,
                    z: cz + (Math.random() - 0.5) * 3,
                    sx: scale,
                    sy: scale * 0.5,
                    sz: scale * 0.7,
                });
            }
        }

        const geometry = new THREE.SphereGeometry(1, 8, 8);
        const material = new THREE.MeshLambertMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.85,
        });
        const clouds = new THREE.InstancedMesh(geometry, material, cloudPuffs.length);

        const dummy = this._dummy;
        for (let i = 0; i < cloudPuffs.length; i++) {
            const c = cloudPuffs[i];
            dummy.position.set(c.x, c.y, c.z);
            dummy.scale.set(c.sx, c.sy, c.sz);
            dummy.rotation.set(0, 0, 0);
            dummy.updateMatrix();
            clouds.setMatrixAt(i, dummy.matrix);
        }

        clouds.instanceMatrix.needsUpdate = true;
        this.scene.add(clouds);
    }

    getHeightAt(x, z) {
        return this.generateHeight(x, z);
    }

    checkCollision(position, radius) {
        for (const collider of this.colliders) {
            const dx = position.x - collider.position.x;
            const dz = position.z - collider.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance < radius + collider.radius) {
                return true;
            }
        }
        return false;
    }

    getTreePositions() {
        return this.trees.map((t) => t.position.clone());
    }

    getWorldBounds() {
        return WORLD_HALF - 5;
    }
}
