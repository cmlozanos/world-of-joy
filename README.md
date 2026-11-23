# World of Joy 🌳

The tablet profile in Games selects any combination of addition, subtraction,
tracing and reading, with at least one active challenge type. All four modes honour
that selection at entry and every ten minutes. Missing or invalid profiles keep
the default challenges without changing sound preferences or gameplay.

A 3D browser game built with Three.js featuring four modes: open-world exploration, word building, number operations, and road racing.

## Getting Started

### Requirements

- Python 3 (for the development server)
- A modern web browser with WebGL support

### Running the Game

```bash
make serve
```

Then open [http://localhost:9999](http://localhost:9999) in your browser.

To use a custom port:

```bash
make serve PORT=3000
```

### Stopping the Server

```bash
make stop
```

## How to Play

| Control | Action |
|---------|--------|
| **W/A/S/D** | Move character |
| **Arrow Keys** | Move character (alternative) |
| **Shift** | Hold to run |
| **Space** | Jump |
| **Mouse** | Look around |

### Modes

- `Explorador`: complete 8 timed rounds collecting fruits and other objects in the open world.
- `Palabras`: form words by collecting letters in order inside a room.
- `Números`: complete operations such as `2 + 2 = 4` by collecting the correct digits in order.
- `Racing`: drive a car along the road, collect fuel and nitro, reach the finish line, and discover educational roadside signs.

All gameplay modes include a visible button to return to the main menu.

### Objective

Complete missions with different visual themes and gameplay styles.

| Round | Theme | Mission |
|-------|-------|--------|
| 1 | Pradera Matutina | Collect 8 fruits |
| 2 | Bosque Denso | Bounce on 5 trampolines |
| 3 | Valle del Atardecer | Collect 5 water bottles |
| 4 | Tierras Brumosas | Collect 10 fruits at top speed |
| 5 | Cuevas Cristalinas | Find 6 hidden gems |
| 6 | Cielo Estrellado | Catch 6 shooting stars |
| 7 | Alturas Celestiales | Pass through 8 sky rings |
| 8 | Hora Dorada | Collect 15 fruits |

Earn up to 3 stars per round based on how quickly you finish.

## Project Structure

```
world-of-joy/
├── index.html              # Entry point
├── Makefile                 # Server commands
├── README.md               # This file
└── src/
    ├── main.js             # Game initialization and loop
    ├── NumberGame.js       # Indoor numbers mode
    ├── RacingGame.js       # Road racing mode
    ├── engine/
    │   ├── InputManager.js       # Keyboard input handling
    │   ├── MusicManager.js       # Procedural background music
    │   ├── NumberRoundManager.js # Number mode progression and equations
    │   ├── ParticleSystem.js     # Particle effects (dust, sparkles)
    │   ├── RacingRoundManager.js # Racing mode progression and fail states
    │   ├── RoundManager.js       # Round progression and mission logic
    │   ├── ScenarioTheme.js      # Visual themes per round
    │   ├── SoundManager.js       # Sound effects via Web Audio API
    │   ├── ThirdPersonCamera.js  # Third-person camera controller
    │   └── TouchControls.js      # Mobile virtual joystick and buttons
    ├── entities/
    │   ├── Character.js          # Player character model and animations
    │   ├── FuelCanManager.js     # Fuel pickup spawning on the road
    │   ├── FruitManager.js       # Fruit spawning, animation, and collection
    │   ├── GemManager.js         # Hidden gems scattered in the world
    │   ├── NumberManager.js      # Number token spawning for operations
    │   ├── NitroCanManager.js    # Nitro boost pickups for racing mode
    │   ├── RaceMarkerManager.js  # Start and finish gates
    │   ├── RacingCar.js          # Car model and driving logic
    │   ├── RoadSignManager.js    # Educational roadside signs for racing
    │   ├── ShootingStarManager.js # Falling stars with limited time to catch
    │   ├── SkyRingManager.js     # Floating rings to pass through
    │   ├── TrampolineManager.js  # Bounce pad spawning and physics
    │   ├── WaterBottleManager.js # Speed boost bottles
    │   └── Wildlife.js           # Butterflies, rabbits, and birds
    ├── ui/
    │   ├── Compass.js      # Directional compass to nearest fruit
    │   ├── HUD.js          # Score display, messages, and popups
    │   ├── Minimap.js      # Minimap overlay
    │   ├── NumberHUD.js    # Number mode overlays and equation display
    │   └── WordHUD.js      # Word mode overlays and word display
    ├── world/
    │   └── World.js        # Terrain, trees, and environment generation
    └── styles/
        └── main.css        # Game UI styles
```

## Technical Details

- **Rendering**: Three.js (v0.160.0) stored locally in `vendor/` under its MIT license; no CDN is required
- **Character**: Procedurally built low-poly child model with walk/run/idle/jump animations
- **World**: Procedurally generated terrain with height variation, trees, rocks, bushes, flowers, clouds, and a looping road
- **Camera**: Smooth third-person follow camera with mouse-controlled orbit
- **Physics**: Simple gravity, ground collision, and tree collision detection
- **Rounds**: Explorer missions, word rounds, number operations, and road races with unique visual themes
- **Learning Layer**: Racing rounds now include colors, shapes, directions, safety signs, counting, and positive vocabulary cues
- **Mobile**: Touch controls with a fixed virtual joystick, smoother steering, and a shared card-based HUD style across modes
- **Wellbeing**: A gentle reminder appears after several minutes of play, and the app enforces a short break after a longer stretch to reduce compulsive play loops
- **Racing Focus**: Racing uses a cleaner road-first world profile with fewer distracting decorative elements and no explorer wildlife system

## Educational gate and old tablets (25 September 2026)

The existing four modes are preserved. A local educational challenge is required at entry and after every ten minutes, including offline PWA launches. Game physics, round clocks, pending messages, held touch/keyboard inputs and audio pause during the challenge. The existing twelve-minute wellbeing break remains independent and unchanged.

The persistent Home button returns to the same-game menu in every mode; the catalogue is available inside Adult settings. Sound starts OFF and can be enabled with the speaker icon. The service worker precaches all four modes and local Three.js and only removes this game's obsolete caches. No Ubuntu server or online dependency is needed after installation.

`make check` checks syntax, gate integration, complete offline assets and cache isolation. Run `make install-tests` once, then `make check-browser` for real Chromium checks; optionally provide `CHROME95_PATH` to check the legacy executable. Test dependencies and lockfile belong to this project. The compatibility target is Chrome 95 with WebGL available; actual Android GPU performance requires device testing.

`make icons` regenerates the 192/512px PNG installation icons from the original SVG artwork. `WORLD_PHONE=1 make check-browser` exercises the narrow phone layout; `WORLD_SCREENSHOT_DIR=/absolute/output/directory` saves screenshots for visual inspection. The narrow layout separates educational words/equations from navigation buttons and allows the mode menu to scroll on short screens.

## Performance on older tablets

The leaf-icon button switches between normal and light graphics, and remembers the choice locally. Light is the default when no valid preference exists, including storage-disabled browsers; an explicitly saved normal or light choice is preserved without rewriting progress. Light mode disables real-time shadows, decorative point lights and interface blur, and caps rendering at one device pixel per CSS pixel. Both modes retain the same missions, object counts, collisions and controls; sound still starts OFF. The icon is an inline vector, not an emoji requiring a recent Android font.

At device pixel ratio 1, both modes render the same number of pixels; light mode saves shadow/lighting/blur work, not resolution. Enabled audio and speech pause when the document is hidden and resume only if their prior state, the educational gate and the sound preference allow it.

All four modes simulate physics at 60 fixed steps per second, independently of drawing at 10/15/20/30/60 FPS. A frame can catch up at most 250 ms; educational locks, hidden documents and mode restarts discard pending time rather than advancing the game behind a pause. Fruit, bottle and gem parts use instanced batches; invisible pickups submit zero instances, but collection still depends on their real position. HUD/minimap polling runs at 10 Hz and collection feedback remains immediate.

`make check-performance` tests real character/car movement, jumps and fuel at those display rates, time-based friction, pause/catch-up limits, unchanged pickup quantities, batch-count budgets, invisible-instance culling, collection and resource disposal across rounds. `make check-browser` additionally exercises both graphics qualities, shader errors and persisted preferences through an offline reload. These checks do not substitute for a performance measurement on the physical Android tablet.

`make measure-render` samples Three.js draw-call/triangle counters for exploration in normal and light modes with an Android user agent, DPR 1 and a normally randomized world. It supports `CHROME95_PATH` and `WORLD_SCREENSHOT_DIR` too; these counters describe the scene, not the tablet's FPS. With `?test=1`, `__worldRenderRead()` exposes the same read-only counters for diagnostics.

## Touch holds — 20260927-2

Game UI suppresses touch context menus, callouts and selection while editable fields retain text selection and editing. Context suppression applies only to touch events or the following two seconds; global touch gestures are not cancelled.

`make check-browser` includes `tools/touch-check.cjs`, keyboard input and an 800 ms native-emulated joystick hold/release. `CHROME95_PATH` selects an installed legacy browser. Physical-tablet native menu behavior still needs device validation.

## Family 2.0.0

The local `family-v2/` copy contains exactly the CSS, classic JavaScript,
Playwrite ES font and OFL license. Its measured viewport height drives the game
layout. DOM text and game-owned canvas labels use the loaded local font; no
canvas API is patched. The header owns Home, points and Adult settings. Native
sound/quality buttons are moved intact into the adult slot, preserving handlers.
Sound starts OFF on every load without deleting existing preferences/progress.
Light rendering remains the default; explicit graphics preferences survive.
Antialiasing is disabled at context creation and physics remain fixed-step.
The pause adapter freezes actual simulation, pending game timers and audio;
closing Adult settings cannot bypass the independent educational lock.
Home stops the current game and opens its own menu without changing the URL.
The service worker uses a game-scoped 2.0.0 cache including all four kit files.

### Gameplay fixes and evidence

Timed fruit missions now begin with a collision-free nearby trail using existing
fruit objects; bottle and gem missions also place their required targets nearby.
No pickup counts, worlds or modes were removed. Falling stars spawn within 12 m
of the player rather than across the entire 600 m map. A recovery button returns
the explorer to the start or the car to the nearest route segment, without
resetting mission time, fuel or score. Diagonal tree contacts slide along the free
axis instead of trapping both axes. The compass canvas rotation sign is fixed;
racing guidance follows road waypoints instead of pointing through the terrain.
An empty tank can no longer power unlimited reverse movement.

Validation: `make check check-performance` passes syntax, isolated complete
caches, pause/gate overlap, manually suspended audio, fixed-step movement and
fuel at 10/15/20/30/60 FPS, collision escape and pickup/render-batch budgets.
`make check-browser` passes movement, touch hold/release, Adult pause, education
lock, sound, same-URL Home and offline reload for all four modes. Its test-server
instrumentation applies inputs to production simulation (not teleportation or
forced victory): first exploration mission reaches 8/8 and all six Racing rounds reach
ROUND_COMPLETE. Recovery preserves round/time/fuel. Menu bounds and no page scroll
are checked at 360×640, 640×360 and 1024×768. World generation uses normal randomness, not the arithmetic
challenge fixture. `make measure-render` observed 147 calls / 217,568 triangles
at DPR 1 in both qualities; light disables shadows, not scene content.
Phone menu and gameplay screenshots were visually inspected. These desktop
Chromium observations do not certify Chrome 95 or physical Android GPU speed.
