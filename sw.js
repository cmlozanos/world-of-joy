const CACHE_NAME = 'world-of-joy-20260925-performance1';
const PRECACHE_URLS = [
    "./",
    "index.html",
    "learning-gate.js",
    "gate-session.js",
    "manifest.json",
    "icons/icon-192.svg",
    "icons/icon-512.svg",
    "icons/icon-192.png",
    "icons/icon-512.png",
    "src/NumberGame.js",
    "src/RacingGame.js",
    "src/WordGame.js",
    "src/engine/InputManager.js",
    "src/engine/FixedStep.js",
    "src/engine/PickupBatch.js",
    "src/engine/Quality.js",
    "src/engine/MusicManager.js",
    "src/engine/NumberRoundManager.js",
    "src/engine/ParticleSystem.js",
    "src/engine/RacingRoundManager.js",
    "src/engine/RoundManager.js",
    "src/engine/ScenarioTheme.js",
    "src/engine/SoundManager.js",
    "src/engine/ThirdPersonCamera.js",
    "src/engine/TouchControls.js",
    "src/engine/WellbeingManager.js",
    "src/engine/WordRoundManager.js",
    "src/entities/Character.js",
    "src/entities/FruitManager.js",
    "src/entities/FuelCanManager.js",
    "src/entities/GemManager.js",
    "src/entities/LetterManager.js",
    "src/entities/NitroCanManager.js",
    "src/entities/NumberManager.js",
    "src/entities/RaceMarkerManager.js",
    "src/entities/RacingCar.js",
    "src/entities/RoadSignManager.js",
    "src/entities/ShootingStarManager.js",
    "src/entities/SkyRingManager.js",
    "src/entities/TrampolineManager.js",
    "src/entities/WaterBottleManager.js",
    "src/entities/Wildlife.js",
    "src/main.js",
    "src/styles/main.css",
    "src/ui/Compass.js",
    "src/ui/HUD.js",
    "src/ui/Minimap.js",
    "src/ui/NumberHUD.js",
    "src/ui/WordHUD.js",
    "src/world/Room.js",
    "src/world/World.js",
    "vendor/three.module.js",
    "vendor/THREE-LICENSE.txt"
];
self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
    event.waitUntil(caches.keys().then(names => Promise.all(names.filter(name => name.startsWith('world-of-joy-') && name !== CACHE_NAME).map(name => caches.delete(name)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url), scope = new URL(self.registration.scope);
    if (event.request.method !== 'GET' || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
    if (event.request.mode === 'navigate') {
        event.respondWith(fetch(event.request).then(response => { if (!response.ok) throw new Error('offline'); return response; }).catch(() => caches.open(CACHE_NAME).then(cache => cache.match('index.html'))));
        return;
    }
    event.respondWith(caches.open(CACHE_NAME).then(cache => cache.match(event.request, {ignoreSearch:true}).then(cached => cached || fetch(event.request))));
});
