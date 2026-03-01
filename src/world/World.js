import * as THREE from 'three';

const WORLD_SIZE = 400;
const TERRAIN_SEGMENTS = 100;
const TREE_COUNT = 120;
const ROCK_COUNT = 60;
const FLOWER_COUNT = 200;
const BUSH_COUNT = 80;
const TREE_COLLISION_RADIUS = 0.8;

export class World {
    constructor(scene) {
        this.scene = scene;
        this.trees = [];
        this.colliders = [];
        this.heightData = null;
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

        // Color the terrain based on height
        const colors = new Float32Array(vertices.length);
        for (let i = 0; i < vertices.length; i += 3) {
            const height = vertices[i + 1];
            const color = this.getTerrainColor(height);
            colors[i] = color.r;
            colors[i + 1] = color.g;
            colors[i + 2] = color.b;
        }
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.MeshLambertMaterial({
            vertexColors: true,
        });

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

    getTerrainColor(height) {
        const color = new THREE.Color();

        if (height < -1) {
            color.setHex(0x3d7a3d);
        } else if (height < 1) {
            color.setHex(0x4a8f3f);
        } else if (height < 3) {
            color.setHex(0x5da34f);
        } else {
            color.setHex(0x6bb85e);
        }

        // Add variation
        const variation = (Math.random() - 0.5) * 0.05;
        color.r = Math.max(0, Math.min(1, color.r + variation));
        color.g = Math.max(0, Math.min(1, color.g + variation));
        color.b = Math.max(0, Math.min(1, color.b + variation));

        return color;
    }

    createTrees() {
        const halfWorld = WORLD_SIZE / 2 - 10;

        for (let i = 0; i < TREE_COUNT; i++) {
            const x = (Math.random() - 0.5) * 2 * halfWorld;
            const z = (Math.random() - 0.5) * 2 * halfWorld;

            // Keep area around spawn clear
            if (Math.abs(x) < 5 && Math.abs(z) < 5) continue;

            const y = this.getHeightAt(x, z);
            const tree = this.createTree(x, y, z);

            this.trees.push({ position: new THREE.Vector3(x, y, z), mesh: tree });
            this.colliders.push({
                position: new THREE.Vector3(x, 0, z),
                radius: TREE_COLLISION_RADIUS,
            });
        }
    }

    createTree(x, y, z) {
        const group = new THREE.Group();
        group.position.set(x, y, z);

        const treeType = Math.random();

        if (treeType < 0.5) {
            // Round tree
            const trunkHeight = 1.5 + Math.random() * 1;
            const trunkGeometry = new THREE.CylinderGeometry(0.15, 0.2, trunkHeight, 8);
            const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x6b4226 });
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.y = trunkHeight / 2;
            trunk.castShadow = true;
            group.add(trunk);

            const crownRadius = 1.2 + Math.random() * 0.8;
            const crownGeometry = new THREE.SphereGeometry(crownRadius, 10, 10);
            const greenShade = 0x228b22 + Math.floor(Math.random() * 0x003300);
            const crownMaterial = new THREE.MeshLambertMaterial({ color: greenShade });
            const crown = new THREE.Mesh(crownGeometry, crownMaterial);
            crown.position.y = trunkHeight + crownRadius * 0.6;
            crown.castShadow = true;
            group.add(crown);
        } else {
            // Pine tree
            const trunkHeight = 2 + Math.random() * 1;
            const trunkGeometry = new THREE.CylinderGeometry(0.12, 0.18, trunkHeight, 8);
            const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x5c3a1e });
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.y = trunkHeight / 2;
            trunk.castShadow = true;
            group.add(trunk);

            for (let j = 0; j < 3; j++) {
                const coneRadius = 1.2 - j * 0.3;
                const coneHeight = 1.5 - j * 0.2;
                const coneGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, 8);
                const greenShade = 0x1a6b1a + Math.floor(Math.random() * 0x002200);
                const coneMaterial = new THREE.MeshLambertMaterial({ color: greenShade });
                const cone = new THREE.Mesh(coneGeometry, coneMaterial);
                cone.position.y = trunkHeight + j * 0.8;
                cone.castShadow = true;
                group.add(cone);
            }
        }

        this.scene.add(group);
        return group;
    }

    createRocks() {
        const halfWorld = WORLD_SIZE / 2 - 10;
        const rockGeometry = new THREE.DodecahedronGeometry(1, 0);

        for (let i = 0; i < ROCK_COUNT; i++) {
            const x = (Math.random() - 0.5) * 2 * halfWorld;
            const z = (Math.random() - 0.5) * 2 * halfWorld;
            const y = this.getHeightAt(x, z);
            const scale = 0.3 + Math.random() * 0.6;

            const grayShade = 0x666666 + Math.floor(Math.random() * 0x333333);
            const material = new THREE.MeshLambertMaterial({ color: grayShade });
            const rock = new THREE.Mesh(rockGeometry, material);

            rock.position.set(x, y + scale * 0.3, z);
            rock.scale.set(scale, scale * 0.7, scale);
            rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            rock.castShadow = true;
            rock.receiveShadow = true;

            this.scene.add(rock);
        }
    }

    createBushes() {
        const halfWorld = WORLD_SIZE / 2 - 10;
        const bushGeometry = new THREE.SphereGeometry(1, 8, 8);

        for (let i = 0; i < BUSH_COUNT; i++) {
            const x = (Math.random() - 0.5) * 2 * halfWorld;
            const z = (Math.random() - 0.5) * 2 * halfWorld;
            const y = this.getHeightAt(x, z);

            const scale = 0.3 + Math.random() * 0.4;
            const greenShade = 0x2d7a2d + Math.floor(Math.random() * 0x002200);
            const material = new THREE.MeshLambertMaterial({ color: greenShade });
            const bush = new THREE.Mesh(bushGeometry, material);

            bush.position.set(x, y + scale * 0.4, z);
            bush.scale.set(scale * 1.3, scale, scale * 1.3);
            bush.castShadow = true;

            this.scene.add(bush);
        }
    }

    createFlowers() {
        const halfWorld = WORLD_SIZE / 2 - 10;
        const flowerColors = [0xff6b6b, 0xffd93d, 0x6bcaff, 0xff9ff3, 0xffffff, 0xff7675];
        const petalGeometry = new THREE.SphereGeometry(0.08, 6, 6);
        const centerGeometry = new THREE.SphereGeometry(0.05, 6, 6);
        const stemGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.25, 4);
        const stemMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });

        for (let i = 0; i < FLOWER_COUNT; i++) {
            const x = (Math.random() - 0.5) * 2 * halfWorld;
            const z = (Math.random() - 0.5) * 2 * halfWorld;
            const y = this.getHeightAt(x, z);
            const flowerGroup = new THREE.Group();
            flowerGroup.position.set(x, y, z);

            const stem = new THREE.Mesh(stemGeometry, stemMaterial);
            stem.position.y = 0.125;
            flowerGroup.add(stem);

            const color = flowerColors[Math.floor(Math.random() * flowerColors.length)];
            const petalMaterial = new THREE.MeshLambertMaterial({ color });

            for (let p = 0; p < 5; p++) {
                const petal = new THREE.Mesh(petalGeometry, petalMaterial);
                const angle = (p / 5) * Math.PI * 2;
                petal.position.set(
                    Math.cos(angle) * 0.06,
                    0.28,
                    Math.sin(angle) * 0.06
                );
                flowerGroup.add(petal);
            }

            const centerMaterial = new THREE.MeshLambertMaterial({ color: 0xffd700 });
            const center = new THREE.Mesh(centerGeometry, centerMaterial);
            center.position.y = 0.28;
            flowerGroup.add(center);

            this.scene.add(flowerGroup);
        }
    }

    createClouds() {
        const cloudGeometry = new THREE.SphereGeometry(1, 8, 8);
        const cloudMaterial = new THREE.MeshLambertMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.85,
        });

        for (let i = 0; i < 20; i++) {
            const cloudGroup = new THREE.Group();
            const numPuffs = 3 + Math.floor(Math.random() * 4);

            for (let j = 0; j < numPuffs; j++) {
                const puff = new THREE.Mesh(cloudGeometry, cloudMaterial);
                const scale = 2 + Math.random() * 3;
                puff.scale.set(scale, scale * 0.5, scale * 0.7);
                puff.position.set(
                    (Math.random() - 0.5) * 6,
                    (Math.random() - 0.5) * 1,
                    (Math.random() - 0.5) * 3
                );
                cloudGroup.add(puff);
            }

            cloudGroup.position.set(
                (Math.random() - 0.5) * WORLD_SIZE,
                40 + Math.random() * 20,
                (Math.random() - 0.5) * WORLD_SIZE
            );

            this.scene.add(cloudGroup);
        }
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
}
