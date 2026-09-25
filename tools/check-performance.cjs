const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const modules = new Map();
async function moduleURL(file) {
    file = path.resolve(file.split('?')[0]);
    if (modules.has(file)) return modules.get(file);
    const promise = (async () => {
        let source = fs.readFileSync(file, 'utf8');
        const imports = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)];
        for (const match of imports) {
            const target = match[1] === 'three' ? path.join(root, 'vendor/three.module.js') : path.resolve(path.dirname(file), match[1]);
            source = source.replace(match[0], 'from ' + JSON.stringify(await moduleURL(target)));
        }
        return 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
    })();
    modules.set(file, promise);
    return promise;
}
const load = async file => import(await moduleURL(path.join(root, file)));

(async () => {
    const THREE = await load('vendor/three.module.js');
    const {FixedStep, uiDue} = await load('src/engine/FixedStep.js');
    const {Character} = await load('src/entities/Character.js');
    const {RacingCar} = await load('src/entities/RacingCar.js');
    const world = {getHeightAt: () => 0, checkCollision: () => false, getWorldBounds: () => 10000};
    const input = {isMoving: true, forward: true, backward: false, run: false, jump: false, getTurnAxis: () => 0};
    const run = (Class, fps) => {
        const entity = new Class(new THREE.Scene());
        const clock = new FixedStep();
        let ticks = 0, time = 0, apex = 0;
        for (let frame = 0; frame < fps * 4; frame++) clock.advance(1 / fps, delta => {
            input.jump = ticks === 30;
            entity.update(delta, input, world);
            apex = Math.max(apex, entity.getPosition().y);
            ticks++; time += delta;
        });
        return {position: entity.getPosition().toArray(), ticks, time, apex, fuel: entity.fuel};
    };
    for (const Class of [Character, RacingCar]) {
        const reference = run(Class, 60);
        for (const fps of [10, 15, 20, 30, 60]) assert.deepEqual(run(Class, fps), reference, Class.name + ' at ' + fps + ' FPS');
        console.log(Class.name + ': identical movement/jump/time/fuel at 10/15/20/30/60 FPS');
    }
    const friction = fps => {
        const entity = new Character(new THREE.Scene()); entity.velocity.x = 20;
        for (let i = 0; i < fps / 2; i++) entity.updateMovement(1 / fps, {...input, forward: false, isMoving: false, jump: false});
        return entity.velocity.x;
    };
    assert.ok(Math.abs(friction(10) - friction(60)) < 1e-9);
    const clock = new FixedStep(); let ticks = 0;
    clock.advance(1 / 120, () => ticks++); clock.reset(); clock.advance(1 / 120, () => ticks++);
    assert.equal(ticks, 0, 'pause discards fractional backlog');
    clock.reset(); clock.advance(50, () => ticks++); assert.equal(ticks, 15, 'stall catch-up bounded');
    clock.reset(); clock.advance(0.2, () => false); assert.equal(clock.remainder, 0, 'stop cancels further steps');
    const hud = {}; let writes = 0;
    for (let i = 0; i < 600; i++) if (uiDue(hud, 1 / 60)) writes++;
    assert.equal(writes, 100, 'HUD/minimap at 10Hz, not physics frequency');

    for (const [name, listName, expected, maxBatches] of [
        ['FruitManager', 'fruits', 600, 25], ['WaterBottleManager', 'bottles', 80, 6], ['GemManager', 'gems', 30, 30]
    ]) {
        const {[name]: Class} = await load('src/entities/' + name + '.js');
        const scene = new THREE.Scene(), manager = new Class(scene);
        const spawn = () => name === 'FruitManager' ? manager.spawnFruits(Array.from({length: 300}, (_, i) => new THREE.Vector3(i * 3, 0, 10)), world) : manager.spawn(world);
        spawn();
        assert.equal(manager[listName].length, expected, 'unchanged pickup count');
        assert.ok(manager.batch.batches.length <= maxBatches, 'bounded batch count: ' + name);
        assert.ok(scene.children.every(child => child.isInstancedMesh), 'no separate pickup meshes in scene');
        const first = manager[listName][0];
        const position = first.group.position.clone();
        manager[listName].forEach(item => { item.group.visible = false; });
        manager.animate(1 / 60);
        assert.deepEqual(first.group.position.toArray(), position.toArray(), 'hidden visuals not animated');
        assert.ok(manager.batch.batches.every(batch => batch.mesh.count === 0 && !batch.mesh.visible), 'hidden instances not submitted');
        // Collision remains independent of display visibility.
        let collected = 0;
        manager.update(1 / 60, {getPosition: () => position}, () => collected++);
        assert.ok(collected > 0, 'hidden pickups remain collectible');
        assert.equal(first.collected, true);
        for (let i = 0; i < 60; i++) manager.animate(1 / 60);
        assert.equal(first.collectionDone, true, 'collection animation uses elapsed time');
        first.group.visible = true;
        manager.batch.sync();
        assert.ok(manager.batch.batches.every(batch => batch.mesh.count === 0), 'collected pieces never reappear');
        let disposed = 0;
        const geometryCount = new Set(manager[listName].flatMap(item => item.group.children.map(child => child.geometry))).size;
        const sourceGeometries = new Set(manager[listName].flatMap(item => item.group.children.map(child => child.geometry)));
        for (const geometry of sourceGeometries) geometry.addEventListener('dispose', () => disposed++);
        manager.reset(); assert.equal(scene.children.length, 0); assert.equal(disposed, geometryCount, 'source resources disposed once');
        spawn(); assert.ok(scene.children.length <= maxBatches, 'repeated rounds remain within the same batch budget');
        console.log(name + ': ' + expected + ' pickups, <= ' + maxBatches + ' batches; culling, collection and resource release passed');
        manager.reset();
    }
    const {quality} = await load('src/engine/Quality.js');
    const scene = new THREE.Scene();
    for (let i = 0; i < 17; i++) scene.add(new THREE.PointLight());
    const renderer = {shadowMap: {}, setPixelRatio(value) { this.pixelRatio = value; }};
    const previousNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    Object.defineProperty(globalThis, 'navigator', {value: {userAgent: 'Android'}, configurable: true});
    globalThis.window = {devicePixelRatio: 2};
    const game = {scene, renderer};
    assert.equal(quality.light, false, 'normal graphics remain default');
    quality.apply(game); assert.equal(renderer.pixelRatio, 1.5); assert.equal(renderer.shadowMap.enabled, true);
    quality.light = true; quality.revision++; quality.apply(game);
    assert.equal(renderer.pixelRatio, 1); assert.equal(renderer.shadowMap.enabled, false);
    assert.ok(scene.children.every(light => !light.visible));
    quality.light = false; quality.revision++; quality.apply(game);
    assert.ok(scene.children.every(light => light.visible), 'normal lighting restored');
    const material = new THREE.MeshBasicMaterial();
    scene.add(new THREE.Mesh(new THREE.BoxGeometry(), material));
    quality.apply(game);
    const version = material.version;
    quality.light = true; quality.revision++; quality.apply(game);
    assert.equal(material.version, version + 1, 'quality toggle refreshes shadow shader once');
    quality.apply(game);
    scene.add(new THREE.PointLight()); quality.apply(game);
    assert.equal(material.version, version + 1, 'no shader churn per frame or unrelated scene additions');
    delete globalThis.window;
    if (previousNavigator) Object.defineProperty(globalThis, 'navigator', previousNavigator); else delete globalThis.navigator;
    console.log('World performance contracts passed without browser/GPU.');
})().catch(error => { console.error(error); process.exitCode = 1; });
