const CACHE_NAME = 'world-of-joy-v1';

const PRECACHE_URLS = [
    './',
    './index.html',
    './manifest.json',
    './icons/icon-192.svg',
    './icons/icon-512.svg',
    './src/styles/main.css',
    './src/main.js',
    './src/WordGame.js',
    './src/engine/InputManager.js',
    './src/engine/MusicManager.js',
    './src/engine/ParticleSystem.js',
    './src/engine/RoundManager.js',
    './src/engine/ScenarioTheme.js',
    './src/engine/SoundManager.js',
    './src/engine/ThirdPersonCamera.js',
    './src/engine/TouchControls.js',
    './src/engine/WordRoundManager.js',
    './src/entities/Character.js',
    './src/entities/FruitManager.js',
    './src/entities/GemManager.js',
    './src/entities/LetterManager.js',
    './src/entities/ShootingStarManager.js',
    './src/entities/SkyRingManager.js',
    './src/entities/TrampolineManager.js',
    './src/entities/WaterBottleManager.js',
    './src/entities/Wildlife.js',
    './src/ui/Compass.js',
    './src/ui/HUD.js',
    './src/ui/Minimap.js',
    './src/ui/WordHUD.js',
    './src/world/Room.js',
    './src/world/World.js',
];

// CDN resources cached on first use
const CDN_ORIGINS = [
    'https://cdn.jsdelivr.net',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((names) =>
            Promise.all(
                names
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Network-first for navigation requests (HTML)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Cache-first for CDN resources (Three.js)
    if (CDN_ORIGINS.some((origin) => url.origin === origin)) {
        event.respondWith(
            caches.match(event.request).then((cached) => {
                if (cached) return cached;
                return fetch(event.request).then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    return response;
                });
            })
        );
        return;
    }

    // Cache-first for local assets
    event.respondWith(
        caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
});
