import * as THREE from 'three';

const ROOM_SIZE = 80;
const WALL_HEIGHT = 8;
const WALL_THICKNESS = 0.4;

export class Room {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.roomSize = ROOM_SIZE;
    }

    generate() {
        this._buildFloor();
        this._buildWalls();
        this._buildCeiling();
        this._addDecor();
        this._addExtraLights();
        this.scene.add(this.group);
    }

    _buildFloor() {
        const geometry = new THREE.PlaneGeometry(ROOM_SIZE, ROOM_SIZE);
        // Checkerboard floor via canvas
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        const tileSize = 64;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                ctx.fillStyle = (r + c) % 2 === 0 ? '#cba67c' : '#dfc49e';
                ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);
                ctx.strokeStyle = '#b4926b'; ctx.lineWidth = 1;
                ctx.strokeRect(c*tileSize, r*tileSize, tileSize, tileSize);
                ctx.fillStyle = 'rgba(111,75,48,0.14)';
                for (let grain=0;grain<8;grain++) ctx.fillRect(c*tileSize+4, r*tileSize+grain*8+3, 36+(grain*13)%20, 1);
            }
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        const material = new THREE.MeshLambertMaterial({ map: texture });
        const floor = new THREE.Mesh(geometry, material);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.group.add(floor);
    }

    _buildWalls() {
        const wallColors = [0xffb3ba, 0xbae1ff, 0xbaffc9, 0xffffba]; // pastel colors
        const half = ROOM_SIZE / 2;

        const wallData = [
            { pos: [0, WALL_HEIGHT / 2, -half], rot: [0, 0, 0] },       // back
            { pos: [0, WALL_HEIGHT / 2, half], rot: [0, Math.PI, 0] },   // front
            { pos: [-half, WALL_HEIGHT / 2, 0], rot: [0, Math.PI / 2, 0] },  // left
            { pos: [half, WALL_HEIGHT / 2, 0], rot: [0, -Math.PI / 2, 0] },  // right
        ];

        for (let i = 0; i < wallData.length; i++) {
            const geometry = new THREE.BoxGeometry(ROOM_SIZE, WALL_HEIGHT, WALL_THICKNESS);
            const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 128;
            const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff7e7'; ctx.fillRect(0,0,256,128);
            ctx.fillStyle = '#bdd5ca'; ctx.fillRect(0,86,256,42);
            ctx.fillStyle = '#a2bdb3'; ctx.fillRect(0,85,256,3);
            // Daylit glazed windows with wooden mullions, baked into a single wall.
            for (let x=24;x<256;x+=80) {
                ctx.fillStyle='#e8ce9f'; ctx.fillRect(x-3,19,58,56);
                ctx.fillStyle='#8bb9cb'; ctx.fillRect(x,22,52,50);
                ctx.fillStyle='#c9e4e6';ctx.beginPath();ctx.moveTo(x,22);ctx.lineTo(x+52,22);ctx.lineTo(x,72);ctx.fill();
                ctx.fillStyle='#f6ead0'; ctx.fillRect(x+24,22,3,50);ctx.fillRect(x,45,52,3);
            }
            const texture = new THREE.CanvasTexture(canvas); texture.wrapS = THREE.RepeatWrapping; texture.repeat.x = 4;
            const material = new THREE.MeshLambertMaterial({ map: texture, color: wallColors[i] });
            const wall = new THREE.Mesh(geometry, material);
            wall.position.set(...wallData[i].pos);
            wall.rotation.set(...wallData[i].rot);
            wall.receiveShadow = true;
            this.group.add(wall);
        }
    }

    _buildCeiling() {
        const geometry = new THREE.PlaneGeometry(ROOM_SIZE, ROOM_SIZE);
        const material = new THREE.MeshLambertMaterial({ color: 0xf5f0e8, side: THREE.DoubleSide });
        const ceiling = new THREE.Mesh(geometry, material);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = WALL_HEIGHT;
        this.group.add(ceiling);
    }

    _addDecor() {
        // Colorful baseboards
        const half = ROOM_SIZE / 2;
        const baseboardGeo = new THREE.BoxGeometry(ROOM_SIZE + 0.2, 0.15, 0.05);
        const baseboardMat = new THREE.MeshLambertMaterial({ color: 0xffd700 });

        const positions = [
            { pos: [0, 0.075, -half + 0.15], rot: [0, 0, 0] },
            { pos: [0, 0.075, half - 0.15], rot: [0, 0, 0] },
            { pos: [-half + 0.15, 0.075, 0], rot: [0, Math.PI / 2, 0] },
            { pos: [half - 0.15, 0.075, 0], rot: [0, Math.PI / 2, 0] },
        ];

        for (const p of positions) {
            const baseboard = new THREE.Mesh(baseboardGeo, baseboardMat);
            baseboard.position.set(...p.pos);
            baseboard.rotation.set(...p.rot);
            this.group.add(baseboard);
        }

        // Corner pillars
        const pillarGeo = new THREE.CylinderGeometry(0.2, 0.2, WALL_HEIGHT, 8);
        const pillarMat = new THREE.MeshLambertMaterial({ color: 0xddc89e });
        const corners = [
            [-half + 0.2, WALL_HEIGHT / 2, -half + 0.2],
            [half - 0.2, WALL_HEIGHT / 2, -half + 0.2],
            [-half + 0.2, WALL_HEIGHT / 2, half - 0.2],
            [half - 0.2, WALL_HEIGHT / 2, half - 0.2],
        ];
        for (const c of corners) {
            const pillar = new THREE.Mesh(pillarGeo, pillarMat);
            pillar.position.set(...c);
            pillar.castShadow = true;
            this.group.add(pillar);
        }
    }

    _addExtraLights() {
        // Extra point lights spread across the larger room
        const colors = [0xff8899, 0x88bbff, 0x99ff88, 0xffdd66, 0xff66cc, 0x66ffdd];
        const spacing = ROOM_SIZE / 4;
        for (let x = -1; x <= 1; x++) {
            for (let z = -1; z <= 1; z++) {
                const light = new THREE.PointLight(
                    colors[Math.abs(x * 3 + z) % colors.length], 0.5, ROOM_SIZE * 0.6
                );
                light.position.set(x * spacing, WALL_HEIGHT - 1.5, z * spacing);
                this.group.add(light);
            }
        }
    }

    getHeightAt() {
        return 0;
    }

    getRoomBounds() {
        return ROOM_SIZE;
    }

    getWorldBounds() {
        return ROOM_SIZE / 2;
    }

    checkCollision(position, radius) {
        const half = ROOM_SIZE / 2 - WALL_THICKNESS - radius;
        return (
            position.x < -half || position.x > half ||
            position.z < -half || position.z > half
        );
    }

    dispose() {
        this.scene.remove(this.group);
        this.group.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (child.material.map) child.material.map.dispose();
                child.material.dispose();
            }
        });
    }
}
