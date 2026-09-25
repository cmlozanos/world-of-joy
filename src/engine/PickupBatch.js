import * as THREE from 'three';

// Keep pickup groups as logical transforms, but draw matching pieces in one call.
// The compact instance list never submits hidden/distant pieces to the GPU.
export class PickupBatch {
    constructor(scene) {
        this.scene = scene;
        this.batches = [];
        this.items = [];
    }

    build(items) {
        this.dispose();
        this.items = items;
        const geometries = new Map();
        const batches = new Map();
        for (const item of items) {
            this.scene.remove(item.group);
            item.group.traverse(piece => {
                if (!piece.isMesh) return;
                const geometryKey = JSON.stringify([piece.geometry.type, piece.geometry.parameters]);
                let geometry = geometries.get(geometryKey);
                if (!geometry) { geometry = piece.geometry; geometries.set(geometryKey, geometry); }
                else if (geometry !== piece.geometry) piece.geometry.dispose();
                piece.geometry = geometry;
                const m = piece.material;
                const key = JSON.stringify([geometryKey, m.type, m.color.getHex(), m.emissive && m.emissive.getHex(), m.emissiveIntensity, m.shininess, m.side, m.transparent, m.opacity]);
                let batch = batches.get(key);
                if (!batch) { batch = {geometry, material: m, entries: []}; batches.set(key, batch); }
                batch.entries.push({item, piece});
            });
        }
        for (const batch of batches.values()) {
            // Attributes belong to a batch, not the shared source geometry.
            const geometry = batch.geometry.clone();
            const opacity = new THREE.InstancedBufferAttribute(new Float32Array(batch.entries.length), 1);
            opacity.setUsage(THREE.DynamicDrawUsage);
            geometry.setAttribute('pickupOpacity', opacity);
            const material = batch.material.clone();
            material.opacity = 1;
            material.onBeforeCompile = shader => {
                shader.vertexShader = 'attribute float pickupOpacity;\nvarying float vPickupOpacity;\n' + shader.vertexShader;
                shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvPickupOpacity = pickupOpacity;');
                shader.fragmentShader = 'varying float vPickupOpacity;\n' + shader.fragmentShader;
                shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.a *= vPickupOpacity;');
            };
            material.customProgramCacheKey = () => 'pickup-opacity-v1';
            const mesh = new THREE.InstancedMesh(geometry, material, batch.entries.length);
            mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            mesh.frustumCulled = false; // Entries are distance-culled individually in sync().
            mesh.count = 0;
            this.scene.add(mesh);
            this.batches.push({mesh, opacity, entries: batch.entries, transparent: batch.material.transparent});
        }
        this.sync();
    }

    sync() {
        for (const item of this.items) {
            if (item.group.visible && !item.collectionDone) item.group.updateMatrixWorld(true);
        }
        for (const batch of this.batches) {
            let count = 0, fading = false;
            for (const {item, piece} of batch.entries) {
                if (!item.group.visible || item.collectionDone || !piece.visible) continue;
                batch.mesh.setMatrixAt(count, piece.matrixWorld);
                batch.opacity.setX(count++, piece.material.opacity);
                if (item.collected) fading = true;
            }
            batch.mesh.count = count;
            batch.mesh.visible = count > 0;
            batch.mesh.material.transparent = batch.transparent || fading;
            if (count) {
                batch.mesh.instanceMatrix.needsUpdate = true;
                batch.opacity.needsUpdate = true;
            }
        }
    }

    dispose() {
        for (const {mesh} of this.batches) {
            this.scene.remove(mesh);
            mesh.dispose();
            mesh.geometry.dispose();
            mesh.material.dispose();
        }
        this.batches = [];
        this.items = [];
    }
}

export function disposePickups(items) {
    const geometries = new Set(), materials = new Set();
    for (const item of items) item.group.traverse(piece => {
        if (piece.geometry) geometries.add(piece.geometry);
        if (piece.material) materials.add(piece.material);
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
}

export function animateCollection(item, delta, duration, scale, growth, lift, fade) {
    item.collectionAge = (item.collectionAge || 0) + delta;
    const t = Math.min(item.collectionAge / duration, 1);
    item.group.scale.setScalar(scale * (1 + t * growth));
    item.group.position.y += lift * delta;
    for (const piece of item.group.children) {
        if (!piece.material) continue;
        if (piece.userData.collectionOpacity === undefined) piece.userData.collectionOpacity = piece.material.opacity;
        piece.material.opacity = fade ? piece.userData.collectionOpacity * Math.pow(fade, item.collectionAge * 60) : 1 - t;
    }
    item.collectionDone = t >= 1;
}
